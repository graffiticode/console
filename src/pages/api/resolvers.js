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

/*
  TODO
  [x] Use api taskId as app taskId. Let api do the hashing.
  [ ] Add a pipe field to task.
*/

export async function saveTask({ authToken, uid, lang, code }) {
  const task = {lang, code};
  const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
  const taskDao = getTaskDaoForStore("firestore");
  const auth = { uid };
  const { id } = await postTask({authToken, task, ephemeral: false});
  console.log("saveTask() id=" + id);
  const taskId = await taskDao.create({ id, auth, task });
  console.log("saveTask() taskId=" + taskId);
  const userRef = await db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  if (userData.taskIds === undefined) {
    await userRef.update({taskIds: [taskId]});
  } else {
    await userRef.update({taskIds: FieldValue.arrayUnion(taskId)});
  }
  const { base64 } = await postSnap({auth, lang, id});
  const data = {
    id,
    image: base64,
    imageUrl: `https://cdn.acx.ac/${id}.png`,
  };
  return JSON.stringify(data);
}

export async function postTask({ authToken, task, ephemeral }) {
  try {
    const baseUrl = getBaseUrlForApi();
    const storageType = ephemeral && "ephemeral" || "persistent";
    const headers = { "x-graffiticode-storage-type": storageType };
    const post = bent(baseUrl, 'POST', 'json', 200, headers);
    const auth = authToken;
    console.log("postTask() baseUrl=" + baseUrl);
    const { data } = await post('task', {auth, task});
    return data;
  } catch (x) {
    console.log("POST /task catch " + x.stack);
    return x;
  }
}

const postSnap = async ({ authToken, lang, id }) => {
  const baseUrl = getBaseUrlForApi();
  const dataParam = JSON.stringify({url: `${baseUrl}data?id=${id}`})
  const url = `${baseUrl}form?lang=${lang}&data=${dataParam}`;
  console.log("postSnap() url=" + url);
  const code = `
    data {
      id: '${id}',
      url: '${url}',
    }..
  `;
  const task = { lang: "146", code };
  console.log("postSnap() task=" + JSON.stringify(task, null, 2));
  const { id: taskId } = await postTask({authToken, task, ephemeral: true});
  console.log("postSnap() taskId=" + taskId);
  const data = await getData({auth: authToken, id: taskId});
  console.log("postSnap() data=" + JSON.stringify(data, null, 2));
  return data;
};

export async function getData({authToken, id}) {
  try {
    const baseUrl = getBaseUrlForApi();
    const get = bent(baseUrl, 'GET', 'json', 200);
    const resp = await get(`data?id=${id}&auth=${authToken}`);
    const { data } = resp;
    return data;
  } catch (x) {
    console.log("GET /data catch " + x);
  }
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

