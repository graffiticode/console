import puppeteer from 'puppeteer';
import AWS from 'aws-sdk';
import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../utils/db';
import L0Form from '../../components/forms/L0/src/form.js';
//import L114Form from '../../components/forms/L114/src/form.js';

const taskDaoFactory = buildTaskDaoFactory({});

const normalizeTasksParameter = async tasks => {
  tasks = !Array.isArray(tasks) && [tasks] || tasks;
  return tasks;
};

const getIdFromIds = ids => {
  if (ids.length === 1) {
    return ids[0];
  } else {
    return ids;
  }
};

export function createTask(lang, code) {
  const task = {
    lang,
    code,
  };
  return task;
}

export async function compileTask(auth, task) {
  const resp = await postTask(auth, task);
  let data;
  if (resp && resp.id) {
    data = await getData(auth, resp.id);
  }
  return data;
}

export async function saveTask(authToken, uid, task) {
  const data = await compileTask(authToken, task);
  task = {...task, data: JSON.stringify(data)};
  const auth = { uid };
  const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
  const tasks = await normalizeTasksParameter(task);
  const taskDao = getTaskDaoForStore("firestore");
  const ids = await Promise.all(tasks.map(task => taskDao.create({ auth, task })));
  const id = getIdFromIds(ids);
  const userRef = await db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  if (userData.taskIds === undefined) {
    await userRef.update({taskIds: [id]});
  } else {
    await userRef.update({taskIds: FieldValue.arrayUnion(id)});
  }
  const imageUrl = `https://cdn.acx.ac/${id}.jpg`;
  return JSON.stringify({id, imageUrl});
}

export async function getTasks(uid) {
  const userRef = await db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const auth = {uid};
  const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
  const taskDao = getTaskDaoForStore("firestore");
  const taskIds = userData.taskIds || [];
  const tasksForIds = await Promise.all(taskIds.map(
    async id => taskDao.get({ id, auth })
  ));
  const tasks = tasksForIds.reduce((tasks, tasksForId, index) => {
    tasks[taskIds[index]] = [...tasksForId];
    return tasks;
  }, {});
  return JSON.stringify(tasks);
}

export async function getTask(auth, id) {
  const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
  const taskDao = getTaskDaoForStore("firestore");
  const ids = [].concat(id);
  const tasksForIds = await Promise.all(ids.map(async id => taskDao.get({ id, auth })));
  const tasks = tasksForIds.reduce((tasks, tasksForId) => {
    tasks.push(...tasksForId);
    return tasks;
  }, []);
  return JSON.stringify(tasks[0]);
}

export async function postTask(auth, task) {
  try {
    //const post = bent('http://localhost:3100/', 'POST', 'json', 200);
    const post = bent('https://api.graffiticode.org/', 'POST', 'json', 200);
    const { data } = await post('task', {auth, task});
    return data;
  } catch (x) {
    console.log("POST /task catch " + x);
    return x;
  }
}

export async function getData(auth, id) {
  try {
    //const get = bent('http://localhost:3100/', 'GET', 'json', 200);
    const get = bent('https://api.graffiticode.org/', 'GET', 'json', 200);
    const { data } = await get(`data?id=${id}&auth=${auth}`);
    return data;
  } catch (x) {
    console.log("GET /data catch " + x);
  }
}

const getAsset = async (lang, path) => {
  const baseUrl = 'http://localhost:3100/L' + lang;
  const getLanguageAsset = bent(baseUrl, "string");
  let asset = await getLanguageAsset(path);
  asset = asset.slice('export default '.length, asset.lastIndexOf(';'));
  return asset;
};

const uploadFileToS3 = (name, base64data) => {
  var s3 = new AWS.S3();
  let buffer = Buffer.from(base64data, "base64");
  s3.putObject({
    Bucket: 'acx.ac',
    Key: name,
    Body: buffer,
    ContentEncoding: 'base64',
  }, (err, data) => {
    console.log("UPLOAD " + name);
  });
};

// https://cdn.acx.ac/world.png

function composeHtmlForForm({ lang, data }) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Add React in One Minute</title>
  </head>
  <body>

    <!-- We will put our React component inside this div. -->
    <div id="form"></div>

    <!-- Load React. -->
    <!-- Note: when deploying, replace "development.js" with "production.min.js". -->
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>

    <!-- Load our React component. -->
    <script>
      (async () => {
        try {
          const Form = await import('/L${lang}/form.js');
          const e = React.createElement;
          const domContainer = document.querySelector('#form');
          const root = ReactDOM.createRoot(domContainer);
          root.render(e(Form, {data: ${JSON.stringify(data)}}));
        } catch (x) {
          console.log("catch x=" + x);
        }
      })();
    </script>
  </body>
</html>
`;
};


const postSnap = async ({name, lang, data}) => {
  const html = await composeHtmlForForm({lang, data});
  const val = await makeSnap({name, html}, (err, val) => {
    if (err) {
      console.log("SNAP() err=" + err);
      resume(err);
    } else {
      resume(err, val);
    }
  });
};

const makeSnap = ({name, html}, resume) => {
  (async() => {
    try {
      const t0 = new Date;
      const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
      const page = await browser.newPage();
      await page.setContent(html);
      const checkLoaded = async (t0) => {
        try {
          let td = new Date - t0;
          if (td > 10000) {
            resume("Aborting. Page taking too long to load.");
            return;
          }
          let isLoaded = !!(await page.$("#form"));
          if (isLoaded) {
            // Viewer save snap, so our job is done here.
            setTimeout(async () => {
              try {
                const clip = await page.$("#form");
                const boxModel = await clip.boxModel();
                const box = boxModel.content[2];
                const x = 0;
                const y = 0;
                const width = box.x;
                const height = box.y;
                // await page.setViewport({
                //   width: width,
                //   height: height,
                //   deviceScaleFactor: 2,
                // });
                const base64 = await page.screenshot({
                  encoding: "base64",
                  clip: {
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                  },
                  omitBackground: true,
                });
                const filename = name.trim() + '.png';
                uploadFileToS3(filename, base64, () => {});
                await page.close();
                resume(null, filename);
              } catch (x) {
                console.log("ERROR loading " + name + " " + x.stack);
                resume("ERROR loading " + name, null);
              }
            }, 500);  // Wait a second to let viewer do its thing before exiting.
          } else {
            setTimeout(() => {
              checkLoaded(t0);
            }, 100);
          }
        } catch (x) {
          console.log("[1] ERROR " + x.stack);
          resume("ERROR name=" + name);
        }
      };
      checkLoaded(new Date);
    } catch (x) {
      console.log("[2] ERROR loading id=" + name + " " + x.stack);
      resume("ERROR id=" + name);
    }
  })();
};
