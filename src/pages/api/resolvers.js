import puppeteer from 'puppeteer';
import AWS from 'aws-sdk';
import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../utils/db';
import { getBaseUrlForApi } from '../../utils';

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

/*
  TODO
  [ ] Use api taskId as app taskId. Let api do the hashing.
  [ ] Add a pipe field to task.
*/

export async function saveTask({ authToken, uid, lang, code }) {
  const task = {lang, code};
  const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
  const taskDao = getTaskDaoForStore("firestore");
  const auth = { uid };
  const { id } = await postTask({authToken, task, persist: false});
  const taskId = await taskDao.create({ id, auth, task });
  const userRef = await db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  if (userData.taskIds === undefined) {
    await userRef.update({taskIds: [taskId]});
  } else {
    await userRef.update({taskIds: FieldValue.arrayUnion(taskId)});
  }
  const imageUrl = await postSnap({ auth, task, id });
  return JSON.stringify({taskId, imageUrl});
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

export async function postTask({ authToken, task, persist }) {
  try {
    const baseUrl = getBaseUrlForApi();
    const storageType = persist && "firestore" || "memory";
    const headers = { "x-graffiticode-storage-type": storageType };
    const post = bent(baseUrl, 'POST', 'json', 200, headers);
    const auth = authToken;
    const { data } = await post('task', {auth, task});
    return data;
  } catch (x) {
    console.trace("POST /task catch " + x);
    return x;
  }
}

export async function getData(auth, id) {
  try {
    const baseUrl = getBaseUrlForApi();
    const get = bent(baseUrl, 'GET', 'json', 200);
    const { data } = await get(`data?id=${id}&auth=${auth}`);
    return data;
  } catch (x) {
    console.log("GET /data catch " + x);
  }
}

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

const postSnap = async ({ authToken, task, id }) => {
  const baseUrl = getBaseUrlForApi();
  const url = `${baseUrl}data?id=${id}`;
  const data = { url };
  const { lang } = task;
  makeSnap({ id, lang, data });
  return `https://cdn.acx.ac/${id}.png`;
};

const makeSnap = ({ id, lang, data }) => {
  const baseUrl = getBaseUrlForApi();
  (async() => {
    try {
      const t0 = new Date;
      const browser = await puppeteer.launch({args: [
        '--no-sandbox',
      ]});
      const page = await browser.newPage();
      // /api/form/1?data=%22hello%22
      // http://localhost:3100/form?lang=1&data={"url":"http://localhost:3100/data?id=WmHjCp"}
      const url = `${baseUrl}form?lang=${lang}&data=${JSON.stringify(data)}`;
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
