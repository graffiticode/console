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

export async function getTasks({ auth, lang, mark }) {
  try {
    // Get items from the items collection (primary source)
    const items = await getItems({ auth, lang, mark });

    // Get taskIds from the taskIds collection (for backward compatibility)
    const taskIdsDocs = await db.collection(`users/${auth.uid}/taskIds`)
          .where('lang', '==', lang)
          .where('mark', '==', mark)
          .get();

    // Create a set of IDs from items to avoid duplicates
    const itemIds = new Set(items.map(item => item.taskId || item.id));

    // Process taskIds that aren't already in items and create items for them
    for (const doc of taskIdsDocs.docs) {
      const taskId = doc.id;
      const taskData = doc.data();

      if (!itemIds.has(taskId)) {
        // Create an item for this task
        try {
          const itemRef = db.collection(`users/${auth.uid}/items`).doc();
          const item = {
            id: itemRef.id,
            taskId: taskId,
            name: taskData.name || "unnamed",
            lang: taskData.lang,
            mark: taskData.mark || 1,
            help: taskData.help || "[]",
            code: taskData.src || "",
            isPublic: taskData.isPublic || false,
            created: taskData.created || Date.now(),
            updated: taskData.updated || taskData.created || Date.now()
          };

          await itemRef.set(item);

          // Add the newly created item to our items list
          items.push({
            ...item,
            created: String(item.created),
            updated: String(item.updated)
          });

          console.log(`Created item for task ${taskId}`);
        } catch (error) {
          console.error(`Failed to create item for task ${taskId}:`, error);
        }
      }
    }

    // Mark all tasks in taskIds collection with mark 5 after loading them as items
    const allTaskIds = await db.collection(`users/${auth.uid}/taskIds`)
      .where('lang', '==', lang)
      .where('mark', '==', mark)
      .get();

    const updatePromises = allTaskIds.docs.map(doc =>
      db.doc(`users/${auth.uid}/taskIds/${doc.id}`).update({ mark: 5 })
    );

    await Promise.all(updatePromises);
    console.log(`Marked ${allTaskIds.docs.length} tasks with mark 5`);

    // Convert items to tasks format
    const tasks = await Promise.all(items.map(async (item) => {
      // If item has code, use it; otherwise fetch from API
      let code = item.code;
      if (!code && item.taskId) {
        try {
          const apiTask = await getApiTask({ id: item.taskId, auth });
          code = JSON.stringify((apiTask[0] || apiTask).code);
        } catch (err) {
          console.log("getTasks() failed to get API task for item", item.id, err);
          code = "{}";
        }
      }

      return {
        id: item.taskId || item.id,
        lang: item.lang,
        code: code || "{}",
        src: item.code || "",
        help: item.help || "[]",
        isPublic: item.isPublic || false,
        taskId: item.taskId || item.id,
        created: item.created,
        name: item.name,
        mark: item.mark || 1,
      };
    }));

    return tasks;
  } catch (x) {
    console.log(
      "getTasks()",
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

export async function createItem({ auth, lang, name, taskId, mark, help, code, isPublic }) {
  try {
    // Generate a unique ID for the item
    const itemRef = db.collection(`users/${auth.uid}/items`).doc();
    const id = itemRef.id;
    // If no name provided, use "unnamed"
    if (!name) {
      name = "unnamed";
    }
    // If no taskId provided, create a minimal template task
    let generatedCode = code || "";
    let generatedHelp = help || "[]";
    if (!taskId) {
      const result = await generateCode({
        auth,
        prompt: "Create a minimal starting template",
        language: lang,
        options: {},
        currentCode: null
      });
      taskId = result.taskId;
      generatedCode = result.code;
    }
    const timestamp = Date.now();
    const item = {
      id,
      name,
      taskId,
      lang,
      mark: mark || 1, // Default to mark 1 if not provided
      help: generatedHelp,
      code: generatedCode,
      isPublic: isPublic || false,
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

export async function updateItem({ auth, id, name, taskId, mark, help, code, isPublic }) {
  try {
    const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new Error("Item not found");
    }
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (taskId !== undefined) updates.taskId = taskId;
    if (mark !== undefined) updates.mark = mark;
    if (help !== undefined) updates.help = help;
    if (code !== undefined) updates.code = code;
    if (isPublic !== undefined) updates.isPublic = isPublic;
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

export async function getItems({ auth, lang, mark }) {
  try {
    let query = db.collection(`users/${auth.uid}/items`)
      .where('lang', '==', lang);
    // Only filter by mark if it's provided
    if (mark !== undefined && mark !== null) {
      query = query.where('mark', '==', mark);
    }
    const itemsSnapshot = await query
      .orderBy('created', 'desc')
      .get();
    const items = [];

    // Process items and fetch legacy data if needed
    for (const doc of itemsSnapshot.docs) {
      const data = doc.data();
      let code = data.code;
      let help = data.help;

      // For backward compatibility: if item doesn't have code, fetch from taskIds collection
      if (!code && data.taskId) {
        try {
          const taskDoc = await db.doc(`users/${auth.uid}/taskIds/${data.taskId}`).get();
          if (taskDoc.exists) {
            const taskData = taskDoc.data();
            code = taskData.src || "";
            // Also get help if not present in item
            if (!help) {
              help = taskData.help || "[]";
            }
          }
        } catch (error) {
          console.log("getItems()", "Failed to fetch legacy task data for item", doc.id, error);
        }
      }

      items.push({
        id: doc.id,
        ...data,
        mark: data.mark || 1, // Default to mark 1 if not set
        help: help || "[]",
        code: code || "",
        isPublic: data.isPublic || false,
        created: String(data.created),
        updated: data.updated ? String(data.updated) : String(data.created)
      });
    }
    return items;
  } catch (error) {
    console.error("getItems()", "ERROR", error);
    throw new Error(`Failed to get items: ${error.message}`);
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
