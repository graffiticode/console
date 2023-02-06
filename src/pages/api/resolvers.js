import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { getFirestore } from '../../utils/db';
import { getBaseUrlForApi } from "../../lib/api.js";

const taskDaoFactory = buildTaskDaoFactory({});
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

export async function saveTask({ authToken, uid, lang, code, mark }) {
  try {
    const task = { lang, code };
    const auth = { uid };
    const { id } = await postTask({ authToken, task, ephemeral: false });

    const taskId = await taskDao.create({ auth, id, task, mark });
    await db.doc(`users/${uid}/taskIds/${taskId}`).set({ lang, mark });

    // if (userData.taskIds === undefined) {
    //   await userRef.update({taskIds: [taskId]});
    // } else {
    //   await userRef.update({taskIds: FieldValue.arrayUnion(taskId)});
    // }
    // const { base64 } = await postSnap({auth, lang, id});
    const data = {
      taskId,
      id,
      lang,
      code,
      mark,
      // image: base64,
      // imageUrl: `https://cdn.acx.ac/${id}.png`,
    };
    return data;
  } catch (x) {
    console.log("saveTask() catch " + x.stack);
  }
}

export async function updateMark({ authToken, uid, lang, code, mark }) {
  const task = { lang, code };
  const auth = { uid };
  const { id } = await postTask({ authToken, task, ephemeral: false });
  // TODO if task id already exists, then update code in case its formatting
  // has changed.
  const taskId = await taskDao.create({ id, auth, task });
  const userRef = await db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  try {
    const taskIdsCol = userRef.collection("taskIds");
    await taskIdsCol.doc(taskId).set({
      lang,
      mark,
    });
  } catch (x) {
    console.log("saveTask() x=" + x);
  }

  const data = {
    id,
    image: base64,
    imageUrl: `https://cdn.acx.ac/${id}.png`,
  };
  return JSON.stringify(data);
}

const postApiJSON = bent(getBaseUrlForApi(), "POST", "json");
export async function postTask({ uid, task, ephemeral }) {
  try {
    const storageType = ephemeral && "ephemeral" || "persistent";
    const headers = { "x-graffiticode-storage-type": storageType };
    const auth = { uid };
    const { data } = await postApiJSON("/task", { auth, task }, headers);
    return data;
  } catch (x) {
    console.log("POST /task catch " + x.stack);
    return x;
  }
}

const postSnap = async ({ authToken, lang, id }) => {
  const baseUrl = getBaseUrlForApi();
  const dataParam = JSON.stringify({ url: `${baseUrl}data?id=${id}` })
  const url = `${baseUrl}form?lang=${lang}&data=${dataParam}`;
  const code = `
    data {
      id: '${id}',
      url: '${url}',
    }..
  `;
  const task = { lang: "146", code };
  const { id: taskId } = await postTask({ authToken, task, ephemeral: true });
  const data = await getData({ auth: authToken, id: taskId });
  return data;
};

export async function getData({ authToken, id }) {
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

export async function getTasks({ uid, lang, mark }) {
  const taskIdsColRef = await db.collection(`users/${uid}/taskIds`);
  const taskIdsDocs = await taskIdsColRef
    .where('lang', '==', lang)
    .where('mark', '==', mark)
    .get();
  const taskIds = [];
  taskIdsDocs.forEach(doc => taskIds.push(doc.id));

  const auth = { uid };
  const tasksForIds = await Promise.all(taskIds.map(id => taskDao.get({ id, auth })));
  const tasks = tasksForIds.reduce((tasks, tasksForId, index) => {
    tasks[taskIds[index]] = [...tasksForId];
    return tasks;
  }, {});

  return JSON.stringify(tasks);
}

export async function getTask(auth, id) {
  const ids = [].concat(id);
  const tasksForIds = await Promise.all(ids.map(async id => taskDao.get({ id, auth })));
  const tasks = tasksForIds.reduce((tasks, tasksForId) => {
    tasks.push(...tasksForId);
    return tasks;
  }, []);
  return JSON.stringify(tasks[0]);
}

