import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { getFirestore } from '../../utils/db';
import { getApiTask, getBaseUrlForApi } from "../../lib/api.js";

const taskDaoFactory = buildTaskDaoFactory({});
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

export async function saveTask({ auth, lang, code, mark }) {
  const task = { lang, code };
  const { id: taskId } = await postTask({ auth, task, ephemeral: false });
  await db.doc(`users/${auth.uid}/taskIds/${taskId}`).set({ lang, mark, src: code });
  const data = { taskId };
  return data;
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

export async function postTask({ auth, task, ephemeral }) {
  const storageType = ephemeral && "ephemeral" || "persistent";
  const headers = {
    "Authorization": auth.token,
    "x-graffiticode-storage-type": storageType,
  };
  const { data } = await postApiJSON("/task", { task }, headers);
  return data;
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

export async function getTasks({ auth, lang, mark }) {
  const taskIdsDocs = await db.collection(`users/${auth.uid}/taskIds`)
    .where('lang', '==', lang)
    .where('mark', '==', mark)
    .get();
  const taskIds = [];
  const userTasks = [];
  taskIdsDocs.forEach(doc => {
    taskIds.push(doc.id);
    userTasks.push({ id: doc.id, ...doc.data() });
  });

  const apiTasks = await Promise.all(taskIds.map(id => getApiTask({ id, auth })));
  const tasks = apiTasks.reduce((tasks, apiTask, index) => {
    tasks[taskIds[index]] = {
      userTask: userTasks[index],
      apiTasks: [...apiTask],
    };
    return tasks;
  }, {});

  return JSON.stringify(tasks);
}

export async function getTask(auth, id) {
  const apiTask = await getApiTask({ id, auth });
  return { [id]: apiTask };
}

