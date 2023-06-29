import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { getFirestore } from '../../utils/db';
import { getApiTask, getBaseUrlForApi } from "../../lib/api.js";
// import { buildDynamicSchema } from "./schemas.js";

const taskDaoFactory = buildTaskDaoFactory({});
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

export async function logCompile({ auth, id, timestamp, status, data }) {
  console.log("logCompile() id=" + id);
  const path = `users/${auth.uid}/compiles/${id}`;
  data = JSON.parse(data);
  await db.doc(path).set({ id, timestamp, status, data });
  return "ok";
}

export async function saveTask({ auth, lang, code, mark, isPublic }) {
  const task = { lang, code };
  const { id: taskId } = await postTask({ auth, task, ephemeral: false, isPublic });
  await db.doc(`users/${auth.uid}/taskIds/${taskId}`).set({
    lang,
    mark,
    src: code,
    isPublic,
    created: Date.now(),
  });
  const data = { id: taskId };
  return data;
}

const postApiJSON = bent(getBaseUrlForApi(), "POST", "json");

export async function postTask({ auth, task, ephemeral, isPublic }) {
  const storageType = ephemeral && "ephemeral" || "persistent";
  const headers = {
    "Authorization": auth.token,
    "x-graffiticode-storage-type": storageType,
  };
  if (isPublic) {
    delete headers.Authorization;
  }
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

export async function tasks({ auth, lang, mark }) {
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
    const userTask = userTasks[index];
    apiTask = apiTask[0] || apiTask;
    tasks.push({
      id: userTask.id,
      lang: userTask.lang,
      code: JSON.stringify(apiTask.code),
      src: userTask.src,
      isPublic: userTask.isPublic,
      taskId: taskIds[index],
      created: userTask.created,
    });
    return tasks;
  }, []);
  return tasks;
}

export async function compiles({ auth, type }) {
  const compilesDocs = await db.collection(`users/${auth.uid}/compiles`)
//    .where('lang', '==', lang)
//    .where('mark', '==', mark)
    .get();
  const data = [];
  compilesDocs.forEach(doc => {
    data.push(doc.data());
  });
  console.log("compiles() data=" + JSON.stringify(data, null, 2));
  return data;
}

export async function getTask(auth, id) {
  const apiTask = await getApiTask({ id, auth });
  return { [id]: apiTask };
}

