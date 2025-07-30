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

export async function logCompile({ auth, id, timestamp, status, data }) {
  try {
    const [{ lang }] = await getApiTask({ id, auth });
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
        // "x-artcompiler-storage-type": "persistent",
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
    console.log(
      "postTask()",
      "task=" + JSON.stringify(task, null, 2),
    );
    const storageType = ephemeral && "ephemeral" || "persistent";
    const headers = {
      "Authorization": auth.token,
      "x-artcompiler-storage-type": storageType,
    };
    if (isPublic) {
      delete headers.Authorization;
    }
    const { data } = await postApiJSON("/task", { task }, headers);
    console.log(
      "postTask()",
      "data=" + JSON.stringify(data, null, 2),
    );
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

export async function generateCode({ auth, prompt, language, options, currentCode }) {
  // TODO add support for calling the compiler to check generated code.
  try {
    console.log(
      "resolvers/generateCode()",
      "prompt=" + prompt.substring(0, 30) + "...",
      "language=" + language,
      "currentCode length=" + (currentCode ? currentCode.length : 0)
    );

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

    console.log(
      "generateCode()",
      "code=" + code,
    );

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
        },
        currentCode
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

export async function createItem({ auth, lang, name, taskId }) {
  try {
    console.log(
      "[1] createItem()",
      "lang=" + lang,
      "name=" + name,
      "taskId=" + taskId,
    );

    // Generate a unique ID for the item
    const itemRef = db.collection(`users/${auth.uid}/items`).doc();
    const id = itemRef.id;
    
    // If no name provided, use "unnamed"
    if (!name) {
      name = "unnamed";
    }
    // If no taskId provided, create a minimal template task
    if (!taskId) {
      const result = await generateCode({
        auth,
        prompt: "Create a minimal starting template",
        language: lang,
        options: {},
        currentCode: null
      });
      taskId = result.taskId;
    }
    
    console.log(
      "[2] createItem()",
      "taskId=" + taskId,
    );

    const timestamp = Date.now();
    const item = {
      id,
      name,
      taskId,
      lang,
      created: timestamp,
      updated: timestamp
    };
    
    await itemRef.set(item);
    
    return {
      ...item,
      created: String(timestamp),
      updated: String(timestamp)
    };
  } catch (error) {
    console.error("createItem()", "ERROR", error);
    throw new Error(`Failed to create item: ${error.message}`);
  }
}

export async function updateItem({ auth, id, name, taskId }) {
  try {
    console.log(
      "updateItem()",
      "id=" + id,
      "name=" + name,
      "taskId=" + taskId,
    );
    
    const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
    const itemDoc = await itemRef.get();
    
    if (!itemDoc.exists) {
      throw new Error("Item not found");
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (taskId !== undefined) updates.taskId = taskId;
    updates.updated = Date.now();
    
    await itemRef.update(updates);
    
    const updatedDoc = await itemRef.get();
    const data = updatedDoc.data();
    
    return {
      id,
      ...data,
      created: String(data.created),
      updated: String(data.updated)
    };
  } catch (error) {
    console.error("updateItem()", "ERROR", error);
    throw new Error(`Failed to update item: ${error.message}`);
  }
}

export async function getItems({ auth, lang }) {
  try {
    console.log("getItems()", "lang=" + lang);
    
    const itemsSnapshot = await db.collection(`users/${auth.uid}/items`)
      .where('lang', '==', lang)
      .orderBy('created', 'desc')
      .get();
    
    const items = [];
    itemsSnapshot.forEach(doc => {
      const data = doc.data();
      items.push({
        id: doc.id,
        ...data,
        created: String(data.created),
        updated: data.updated ? String(data.updated) : String(data.created)
      });
    });
    
    return items;
  } catch (error) {
    console.error("getItems()", "ERROR", error);
    throw new Error(`Failed to get items: ${error.message}`);
  }
}

export async function getItem({ auth, id }) {
  try {
    console.log("getItem()", "id=" + id);
    
    const itemDoc = await db.doc(`users/${auth.uid}/items/${id}`).get();
    
    if (!itemDoc.exists) {
      return null;
    }
    
    const data = itemDoc.data();
    return {
      id: itemDoc.id,
      ...data,
      created: String(data.created),
      updated: data.updated ? String(data.updated) : String(data.created)
    };
  } catch (error) {
    console.error("getItem()", "ERROR", error);
    throw new Error(`Failed to get item: ${error.message}`);
  }
}

export async function getTask({ auth, id }) {
  try {
    // First try to get from user's tasks
    const taskDoc = await db.doc(`users/${auth.uid}/taskIds/${id}`).get();
    
    if (!taskDoc.exists) {
      return null;
    }
    
    const taskData = taskDoc.data();
    
    // Get the actual task code from the API
    const apiTask = await getApiTask({ id, auth });
    const apiTaskData = apiTask[0] || apiTask;
    
    return {
      id: id,
      lang: taskData.lang,
      code: JSON.stringify(apiTaskData.code),
      src: taskData.src,
      help: taskData.help || "[]",
      isPublic: taskData.isPublic,
      taskId: id,
      created: taskData.created ? String(taskData.created) : "",
      name: taskData.name,
      mark: taskData.mark,
    };
  } catch (error) {
    console.error("getTask()", "ERROR", error);
    throw new Error(`Failed to get task: ${error.message}`);
  }
}
