import puppeteer from 'puppeteer';
import AWS from 'aws-sdk';
import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../utils/db';

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
  const lang = '0';
  postSnap({id, lang, data}, (err, val) => {
    console.log("snap!!");
  });
  const imageUrl = `https://cdn.acx.ac/${id}.png`;
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

function composeHtmlForForm({ id, lang, data }) {
  id = '0';
  return `
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <div id="form">xx</div>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script>
      (async () => {
        const {id, data} = {id:'0', data:{}};
        try {
          const { Form } = await import('http://localhost:3000/api/form/0');
          const e = React.createElement;
          const domContainer = document.querySelector('#form');
          const root = ReactDOM.createRoot(domContainer);
          return root.render(e(Form, { data: 'world' }, []));
        } catch (x) {
          alert(x);
        }
      })();
    </script>

  </body>
</html>
`;
};

// function composeHtmlForForm({ id, lang, data }) {
//   id = '0';
//   return `
// <html>
//   <head>
//     <meta charset="UTF-8" />
//   </head>
//   <body>
//     <div id="form">xx</div>
//     <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
//     <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>

//     <script>
//       (async () => {
//         const {id, data} = {id:'0', data:{}};
//         try {
//           const { Form } = await import('/api/form/0');
//           const e = React.createElement;
//           const domContainer = document.querySelector('#form');
//           const root = ReactDOM.createRoot(domContainer);
//           return root.render(e(Form, { data: 'world' }, []));
//         } catch (x) {
//           alert(x);
//         }
//       })();
//     </script>
//   </body>
// </html>
// `;
// };

const postSnap = async ({id, lang, data}, resume) => {
  const html = await composeHtmlForForm({id, lang, data});
  console.log("postSnap() id=" + id + " html=" + html);
  const val = makeSnap({id, html}, (err, val) => {
    if (err) {
      console.log("SNAP() err=" + err);
      resume(err);
    } else {
      resume(err, val);
    }
  });
};

const makeSnap = ({id, html}, resume) => {
  (async() => {
    try {
      console.log("makeSnap() id=" + id + " html=" + html);
      const t0 = new Date;
      const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
      const page = await browser.newPage();
      console.log("makeSnap() setting content...");
      await page.setContent(html);
      console.log("makeSnap() loading...");
      //await page.goto('http://localhost:3000/form.html?id=123');
      const checkLoaded = async (t0) => {
        let td = new Date - t0;
        console.log("checkLoaded() td=" + td);
        if (td > 10000) {
          resume("Aborting. Page taking too long to load.");
          return;
        }
        let isLoaded = !!(await page.$("#form"));
        console.log("makeSnap() isLoaded=" + isLoaded);
        if (isLoaded) {
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
            const filename = id.trim() + '.png';
            uploadFileToS3(filename, base64, () => {});
            await page.close();
            console.log("makeSnap() filename=" + filename);
            resume(null, filename);
            browser.close();
          } catch (x) {
            console.log("ERROR loading " + id + " " + x.stack);
            resume("ERROR loading " + id, null);
          }
        } else {
          setTimeout(() => {
            checkLoaded(t0);
          }, 100);
        }
      };
      checkLoaded(new Date);
    } catch (x) {
      console.log("[2] ERROR loading id=" + id + " " + x.stack);
      resume("ERROR id=" + id);
    }
  })();
};
