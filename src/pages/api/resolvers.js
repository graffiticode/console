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
  console.log("compileTask() resp=" + JSON.stringify(resp));
  if (resp && resp.id) {
    data = await getData(auth, resp.id);
    console.log("compileTask() data=" + JSON.stringify(data, null, 2));
  }
  return data;
}

export async function saveTask(authToken, uid, task) {
  /*
    TODO
    We already have a task id so just pass it to makeSnap()
    to use to pass to the form url.
    const data = JSON.stringify({id,url,auth});
    const url = `${baseApiUrl}/form?lang=${lang}&data=${data}`;
  */

  const imageUrl = postSnap({ authToken, task });
  //const data = await compileTask(authToken, task);
  //task = {...task, data: JSON.stringify(data)};
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
  return JSON.stringify({id, imageUrl});
}

export async function getTasks(uid) {
  console.log("getTasks() uid=" + uid);
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
    const post = bent('http://localhost:3100/', 'POST', 'json', 200);
    //const post = bent('https://api.graffiticode.org/', 'POST', 'json', 200);
    const { data } = await post('task', {auth, task});
    console.log("postTask() data=" + JSON.stringify(data));
    return data.id;
  } catch (x) {
    console.log("POST /task catch " + x);
    return x;
  }
}

export async function getData(auth, id) {
  try {
    const get = bent('http://localhost:3100/', 'GET', 'json', 200);
    //const get = bent('https://api.graffiticode.org/', 'GET', 'json', 200);
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

const postSnap = async ({ authToken, task }) => {
  const { id } = await postTask(authToken, task);
  const url = `http://localhost:3100/data?id=${id}`;
  const data = { url };
  const { lang } = task;
  makeSnap({ id, lang, data });
  return `https://cdn.acx.ac/${id}.png`;
};

const makeSnap = ({ id, lang, data }) => {
  (async() => {
    try {
      const t0 = new Date;
      const browser = await puppeteer.launch({args: [
        '--no-sandbox',
      ]});
      const page = await browser.newPage();
      // /api/form/1?data=%22hello%22
      // /form?lang=147&data={%22url%22:%22http://localhost:3100/data?id=Oq2F0sg%22}
      const url = `http://localhost:3000/api/form/${lang}?data=${JSON.stringify(data)}`;
      console.log("makeSnap() url=" + url);
      await page.goto(url, {
        waitUntil: "networkidle0",
      }).catch((err) => console.log("error loading url", err));
      const element = await page.$("body");
      const rect = await element.evaluate(() => {
        //get the bounding rect for the `body`
        var rect = document.querySelector('svg').getBoundingClientRect();
        //pull out `top` and `width`
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        }
      });
      console.log("makeSnap() rect=" + JSON.stringify(rect, null, 2));
      const { x, y, width, height } = rect;
      await page.setViewport({
        width,
        height,
        deviceScaleFactor: 2,
      });
      const base64 = await page.screenshot({
        encoding: "base64",
        clip: {x, y, width, height},
        omitBackground: true,
      });
      const filename = id.trim() + '.png';
      uploadFileToS3(filename, base64, () => {});
      await page.close();
      browser.close();
    } catch (x) {
      console.log("[2] ERROR loading lang=" + lang + " " + x.stack);
    }
  })();
};
