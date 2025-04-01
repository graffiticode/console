import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { getFirestore } from '../../utils/db';
import { getApiTask, getBaseUrlForApi } from "../../lib/api.js";
import { generateCode as codeGenerationService } from "../../lib/code-generation-service.js";
// import { buildDynamicSchema } from "./schemas.js";

const taskDaoFactory = buildTaskDaoFactory({});
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

const getTask = async ({ auth, id }) => await getApiTask({ id, auth });

export async function logCompile({ auth, id, timestamp, status, data }) {
  try {
    console.log(
      "logCompile()",
    );
    const [{ lang }] = await getTask({ auth, id });
    const path = `users/${auth.uid}/compiles/${id}`;
    data = JSON.parse(data);
    await db.doc(path).set({ id, timestamp, status, lang, data });
    return "ok";
  } catch (x) {
    console.log(
      "logCompile()",
      "ERROR",
      x,
    );
  }
}

// TODO reuse id from previous postTask
// TODO store code in doc with atomic task id
export async function saveTask({ auth, id, lang, help, code, mark, isPublic }) {
  try {
    console.log(
      "saveTask()",
    );
    const task = { lang, code };
    //const { id: taskId } = await postTask({ auth, task, ephemeral: false, isPublic });
    await db.doc(`users/${auth.uid}/taskIds/${id}`).set({
      lang,
      mark,
      src: code,
      help,
      isPublic,
      created: Date.now(),
    });
    const data = { id };
    return data;
  } catch (x) {
    console.log(
      "saveTask()",
      "ERROR",
      x,
    );
  }
}

export async function updateTask({ auth, id, name, help, mark, isPublic }) {
  const task = {name, mark, help, isPublic};
  Object.keys(task).forEach(key => task[key] === undefined && delete task[key]);
  console.log(
    "updateTask()",
    "id=" + id,
    "task=" + JSON.stringify(task, null, 2),
  );
  try {
    const taskRef = await db.doc(`users/${auth.uid}/taskIds/${id}`);
    console.log(
      "updateTask()",
      "taskRef=" + taskRef,
    );
    taskRef.update(task);
    if (isPublic) {
      // TODO get lang and code from stored task to send to the api with isPublic
      const taskDoc = await taskRef.get();
      const task = {
        lang: taskDoc.get("lang"),
        code: taskDoc.get("src"),
      };
      // Let the api know this item is now public. This can't be undone!
      const headers = {
        // "x-graffiticode-storage-type": "persistent",
      };
      const { data } = await postApiJSON("/task", { task }, headers);
    }
    const data = { id };
    console.log(
      "updateTask()",
      "id=" + id,
    );
    return data;
  } catch (x) {
    console.error(
      "updateTask()",
      "ERROR",
      x.stack
    );
  }
}

const postApiJSON = bent(getBaseUrlForApi(), "POST", "json");

export async function postTask({ auth, task, ephemeral, isPublic }) {
  try {
    console.log(
      "postTask()",
    );
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
  } catch (x) {
    console.log(
      "postTask()",
      "ERROR",
      x,
    );
  }
}

export async function getData({ authToken, id }) {
  try {
    console.log(
      "getData()",
    );
    const baseUrl = getBaseUrlForApi();
    const get = bent(baseUrl, 'GET', 'json', 200);
    const resp = await get(`/data?id=${id}&access_token=${authToken}`);
    return resp.data;
  } catch (x) {
    console.log(
      "getData()",
      "ERROR",
      x,
    );
  }
}

export async function tasks({ auth, lang, mark }) {
  try {
    console.log(
      "tasks()",
    );
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
        help: userTask.help || "[]",
        isPublic: userTask.isPublic,
        taskId: taskIds[index],
        created: "" + userTask.created,
        name: userTask.name,
        mark: userTask.mark,
      });
      return tasks;
    }, []);
    // console.log(
    //   "tasks()",
    //   "tasks=" + JSON.stringify(tasks, null, 2),
    // );
    return tasks;
  } catch (x) {
    console.log(
      "tasks()",
      "ERROR",
      x,
    );
  }
}

export async function compiles({ auth, lang, type }) {
  try {
    console.log(
      "compiles()",
    );
    const compilesDocs = await db.collection(`users/${auth.uid}/compiles`)
          .where('lang', '==', lang)
          .get();
    const data = [];
    compilesDocs.forEach(doc => {
      data.push(doc.data());
    });
    return data;
  } catch (x) {
    console.log(
      "compiles()",
      "ERROR",
      x,
    );
  }
}

/**
 * Generate code using the Claude LLM
 *
 * @param {Object} params - Parameters for code generation
 * @param {string} params.prompt - The code description or requirements
 * @param {string} [params.language] - Optional target programming language
 * @param {Object} [params.options] - Additional generation options
 * @returns {Promise<Object>} - Generated code and metadata
 */
export async function generateCode({ prompt, language, options }) {
  try {
    console.log(
      "generateCode()",
      "prompt=", prompt.substring(0, 50) + (prompt.length > 50 ? "..." : ""),
      "language=", language || "graffiticode"
    );

    // Call the code generation service to generate Graffiticode
    const result = await codeGenerationService({
      prompt,
      language,
      options: {
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens
      }
    });

    console.log(
      "generateCode()",
      "model=", result.model,
      "language=", result.language
    );

    return result;
  } catch (error) {
    console.error("generateCode()", "ERROR", error);

    throw new Error(`Failed to generate code: ${error.message}`);
  }
}
