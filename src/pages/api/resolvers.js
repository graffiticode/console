import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { getFirestore } from '../../utils/db';
import { getApiTask, getBaseUrlForApi } from "../../lib/api.js";
import { generateCode as codeGenerationService } from "../../lib/code-generation-service.js";
import fs from 'fs';
import path from 'path';
// import { buildDynamicSchema } from "./schemas.js";

const taskDaoFactory = buildTaskDaoFactory({});
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

const getTask = async ({ auth, id }) => await getApiTask({ id, auth });

export async function logCompile({ auth, id, timestamp, status, data }) {
  try {
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
      // Let the api know this item is now public. This can't be undone!
      const headers = {
        // "x-graffiticode-storage-type": "persistent",
      };
      const { data } = await postApiJSON("/task", { task }, headers);
    }
    const data = { id };
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

export async function generateCode({ auth, prompt, language, options }) {
  // TODO add support for calling the compiler to check generated code.
  try {
    prompt = prompt.trim();
    let code = null;
    let taskId = null;
    let description = null;
    let model = null;
    let usage = {
      input_tokens: 0,
      output_tokens: 0
    };

    // Check if this is the specific prompt for template generation
    if (prompt === "Create a minimal starting template") {
      try {
        // Read template from file system
        const templatePath = path.join(process.cwd(), 'training', `template.l${language.toLowerCase()}.gc`);
        if (fs.existsSync(templatePath)) {
          code = fs.readFileSync(templatePath, 'utf8');
          description = "Template loaded from file";
          model = "template-file";
        }
      } catch (error) {
        console.log("generateCode()", "Template file not found or error reading, falling back to service", error.message);
      }
    }

    // If no template was loaded, fall back to code generation service
    if (!code) {
      const result = await codeGenerationService({
        auth,
        prompt,
        lang: language,
        options: {
          model: options?.model,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens
        }
      });
      code = result.code;
      description = result.description;
      model = result.model;
      usage = result.usage;
    }

    // Post the task to get a task ID
    try {
      const taskData = await postTask({
        auth,
        task: {
          lang: language,
          code: code
        },
        ephemeral: true, // Make it ephemeral since it's just a template
        isPublic: false
      });
      taskId = taskData.id;
    } catch (error) {
      console.error("generateCode()", "Failed to post task", error);
      // Return without task ID if posting fails
    }

    return {
      code: code,
      taskId: taskId,
      language: language,
      description: description,
      model: model,
      usage: usage
    };
  } catch (error) {
    console.error("generateCode()", "ERROR", error);

    throw new Error(`Failed to generate code: ${error.message}`);
  }
}
