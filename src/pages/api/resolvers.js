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

const getTask = async ({ auth, id }) => await getApiTask({ id, auth });

export async function logCompile({ auth, id, timestamp, status, data }) {
  const [{ lang }] = await getTask({ auth, id });
  console.log("logCompile() lang=" + lang + " id=" + id);
  const path = `users/${auth.uid}/compiles/${id}`;
  data = JSON.parse(data);
  await db.doc(path).set({ id, timestamp, status, lang, data });
  return "ok";
}

// TODO reuse id from previous postTask
// TODO store code in doc with atomic task id
export async function saveTask({ auth, id, lang, code, mark, isPublic }) {
  const task = { lang, code };
  //const { id: taskId } = await postTask({ auth, task, ephemeral: false, isPublic });
  await db.doc(`users/${auth.uid}/taskIds/${id}`).set({
    lang,
    mark,
    src: code,
    isPublic,
    created: Date.now(),
  });
  const data = { id };
  return data;
}

export async function updateTask({ auth, id, name, mark, isPublic }) {
  const task = { name, mark, isPublic };
  Object.keys(task).forEach(key => task[key] === undefined && delete task[key]);
  try {
    const taskRef = await db.doc(`users/${auth.uid}/taskIds/${id}`);
    taskRef.update(task);
    if (isPublic) {
      // TODO get lang and code from stored task to send to the api with isPublic
      const taskDoc = await taskRef.get();
      const task = {
        lang: taskDoc.get("lang"),
        code: taskDoc.get("src"),
      };
      console.log("updateTask() id=" + id + " task=" + JSON.stringify(task, null, 2));
      // Let the api know this item is now public. This can't be undone!
      const headers = {
        // "x-graffiticode-storage-type": "persistent",
      };
      const { data } = await postApiJSON("/task", { task }, headers);
    }
    const data = { id };
    return data;
  } catch (x) {
    console.error(x.stack);
  }
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
    const resp = await get(`/data?id=${id}&access_token=${authToken}`);
    return resp.data;
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
      created: "" + userTask.created,
      name: userTask.name,
      mark: userTask.mark,
    });
    return tasks;
  }, []);
  return tasks;
}

export async function compiles({ auth, lang, type }) {
  const compilesDocs = await db.collection(`users/${auth.uid}/compiles`)
    .where('lang', '==', lang)
    .get();
  const data = [];
  compilesDocs.forEach(doc => {
    data.push(doc.data());
  });
  return data;
}
