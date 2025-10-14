import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index";
import { buildGetTaskDaoForStorageType } from "./utils";
import { getFirestore } from "../../utils/db";
import { getApiTask, getBaseUrlForApi, getLanguageAsset, getLanguageLexicon } from "../../lib/api";
import { generateCode as codeGenerationService } from "../../lib/code-generation-service";
import { ragLog, generateRequestId } from "../../lib/logger";
import { parser } from "@graffiticode/parser";
import fs from "fs";
import path from "path";
// import { buildDynamicSchema } from "./schemas";

// Global cache for templates to avoid repeated fetches
const templateCache = new Map<string, string>();

const taskDaoFactory = buildTaskDaoFactory();
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

export async function logCompile({ auth, units, id, timestamp, status, data }) {
  try {
    const [{ lang }] = await getApiTask({ id, auth });
    const path = `users/${auth.uid}/compiles/${id}`;
    data = JSON.parse(data);
    await db.doc(path).set({ id, timestamp, status, lang, data });

    // Track usage units if provided
    if (units && units > 0) {
      const now = new Date();

      // Add individual usage record for audit trail
      await db.collection('usage').add({
        userId: auth.uid,
        taskId: id,
        units: units,
        createdAt: now,
        timestamp: timestamp,
        lang: lang,
        type: 'compile',
        status: status
      });

      // Update monthly usage total
      const usageDocRef = db.collection('usage').doc(auth.uid);
      const usageDoc = await usageDocRef.get();

      if (usageDoc.exists) {
        const currentData = usageDoc.data();
        // Check if we need to reset monthly usage (new month)
        const lastReset = currentData.lastReset ? new Date(currentData.lastReset) : null;
        const isNewMonth = !lastReset ||
          lastReset.getMonth() !== now.getMonth() ||
          lastReset.getFullYear() !== now.getFullYear();

        if (isNewMonth) {
          // Reset for new month
          await usageDocRef.set({
            currentMonthTotal: units,
            lastReset: now.toISOString(),
            lastUpdated: now.toISOString()
          });
        } else {
          // Increment existing month total
          await usageDocRef.update({
            currentMonthTotal: (currentData.currentMonthTotal || 0) + units,
            lastUpdated: now.toISOString()
          });
        }
      } else {
        // Create new usage document
        await usageDocRef.set({
          currentMonthTotal: units,
          lastReset: now.toISOString(),
          lastUpdated: now.toISOString()
        });
      }

    }

    return "ok";
  } catch (x) {
    console.log("logCompile()", "ERROR", x);
  }
}

const postApiJSON = bent(getBaseUrlForApi(), "POST", "json");

export async function postTask({ auth, task, ephemeral, isPublic }) {
  try {
    const storageType = (ephemeral && "ephemeral") || "persistent";
    const headers = {
      Authorization: auth.token,
      "x-graffiticode-storage-type": storageType,
    };
    if (isPublic) {
      delete headers.Authorization;
    }
    const { data } = await postApiJSON("/task", { task }, headers);
    return data;
  } catch (x) {
    console.log("postTask()", "ERROR", x);
  }
}

export async function getData({ authToken, id }) {
  try {
    const baseUrl = getBaseUrlForApi();
    const get = bent(baseUrl, "GET", "json", 200);
    const resp = await get(`/data?id=${id}&access_token=${authToken}`);
    return resp.data;
  } catch (x) {
    console.log("getData()", "ERROR", x);
  }
}

export async function getTasks({ auth, lang, mark }) {
  try {
    // Get items from the items collection (primary source)
    const items = await getItems({ auth, lang, mark });

    // Get taskIds from the taskIds collection (for backward compatibility)
    const taskIdsDocs = await db
      .collection(`users/${auth.uid}/taskIds`)
      .where("lang", "==", lang)
      .where("mark", "==", mark)
      .get();

    // Create a set of IDs from items to avoid duplicates
    const itemIds = new Set(items.map((item) => item.taskId || item.id));

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
            updated: taskData.updated || taskData.created || Date.now(),
          };

          await itemRef.set(item);

          // Add the newly created item to our items list
          items.push({
            ...item,
            created: String(item.created),
            updated: String(item.updated),
          });

        } catch (error) {
          console.error(`Failed to create item for task ${taskId}:`, error);
        }
      }
    }

    // Mark all tasks in taskIds collection with mark 5 after loading them as items
    const allTaskIds = await db
      .collection(`users/${auth.uid}/taskIds`)
      .where("lang", "==", lang)
      .where("mark", "==", mark)
      .get();

    const updatePromises = allTaskIds.docs.map((doc) =>
      db.doc(`users/${auth.uid}/taskIds/${doc.id}`).update({ mark: 5 }),
    );

    await Promise.all(updatePromises);

    // Convert items to tasks format
    const tasks = await Promise.all(
      items.map(async (item) => {
        // If item has code, use it; otherwise fetch from API
        let code = item.code;
        if (!code && item.taskId) {
          try {
            const apiTask = await getApiTask({ id: item.taskId, auth });
            // apiTask.code is already a string, don't stringify it
            code = (apiTask[0] || apiTask).code;
          } catch (err) {
            console.log(
              "getTasks() failed to get API task for item",
              item.id,
              err,
            );
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
      }),
    );

    return tasks;
  } catch (x) {
    console.log("getTasks()", "ERROR", x);
  }
}

export async function compiles({ auth, lang, type }) {
  try {
    const compilesDocs = await db
      .collection(`users/${auth.uid}/compiles`)
      .where("lang", "==", lang)
      .get();
    const data = [];
    compilesDocs.forEach((doc) => {
      data.push(doc.data());
    });
    return data;
  } catch (x) {
    console.log("compiles()", "ERROR", x);
  }
}

export async function generateCode({
  auth,
  prompt,
  language,
  options,
  currentCode,
}) {
  // TODO add support for calling the compiler to check generated code.
  const rid = generateRequestId();

  try {
    prompt = prompt.trim();
    let code = null;
    let taskId = null;
    let description = null;
    let model = null;
    let usage = {
      input_tokens: 0,
      output_tokens: 0,
    };

    // Log request start
    ragLog(rid, "request.start", {
      promptLength: prompt.length,
      promptHash: Buffer.from(prompt).toString("base64").substring(0, 16),
      language,
      hasCurrentCode: !!currentCode,
      options: {
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      },
    });

    // Check if this is the specific prompt for template generation
    if (prompt === "Create a minimal starting template") {
      const cacheKey = `L${language}`;

      // Check cache first
      if (templateCache.has(cacheKey)) {
        code = templateCache.get(cacheKey);
        description = "Template loaded from cache";
        model = "template-file";
        ragLog(rid, "template.loaded", {
          source: "cache",
          lang: cacheKey,
          codeLength: code.length,
        });
      } else {
        try {
          // Fetch template from language server
          const templateCode = await getLanguageAsset(`L${language}`, 'template.gc');
          if (templateCode) {
            code = templateCode;
            // Cache the template
            templateCache.set(cacheKey, templateCode);
            description = "Template loaded from language server";
            model = "template-file";
            ragLog(rid, "template.loaded", {
              source: "language-server",
              lang: cacheKey,
              codeLength: code.length,
            });
          }
        } catch (error) {
          console.log(
            "generateCode()",
            "Template not found on language server, falling back to service",
            error.message,
          );
          ragLog(rid, "template.error", {
            error: error.message,
            source: "language-server",
          });
          // Cache empty result to avoid repeated failed fetches
          templateCache.set(cacheKey, "");
        }
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
          maxTokens: options?.maxTokens,
        },
        currentCode,
        rid,
      });
      code = result.code;
      model = result.model;
      usage = result.usage;
    }

    // Post the task to get a task ID
    try {
      const taskData = await postTask({
        auth,
        task: {
          lang: language,
          code: code,
        },
        ephemeral: true, // Make it ephemeral since it's just a template
        isPublic: false,
      });
      taskId = taskData.id;
    } catch (error) {
      console.error("generateCode()", "Failed to post task", error);
      // Return without task ID if posting fails
    }

    // Log request end
    ragLog(rid, "request.end", {
      codeLength: code?.length || 0,
      taskId,
      model,
      usage,
      success: true,
    });

    return {
      code: code,
      taskId: taskId,
      language: language,
      description: description,
      model: model,
      usage: usage,
    };
  } catch (error) {
    console.error("generateCode()", "ERROR", error);

    // Log request error
    ragLog(rid, "request.error", {
      error: error.message,
      success: false,
    });

    throw new Error(`Failed to generate code: ${error.message}`);
  }
}

export async function createItem({
  auth,
  lang,
  name,
  taskId,
  mark,
  help,
  code,
  isPublic,
}) {
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
        currentCode: null,
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
      updated: timestamp,
    };
    await itemRef.set(item);
    return {
      ...item,
      created: String(timestamp),
      updated: String(timestamp),
    };
  } catch (error) {
    console.error("createItem()", "ERROR", error);
    throw new Error(`Failed to create item: ${error.message}`);
  }
}

async function makeApiTaskPublic({ auth, lang, code }) {
  try {
    const task = { lang, code };
    // Let the api know this item is now public by sending with empty
    // Authorization header. This can't be undone!
    const headers = {};
    const { data } = await postApiJSON("/task", { task }, headers);
    return data;
  } catch (x) {
    console.error("updateTask()", "ERROR", x.stack);
  }
}

export async function updateItem({
  auth,
  id,
  name,
  taskId,
  mark,
  help,
  code,
  isPublic,
}) {
  try {
    const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new Error("Item not found");
    }
    const itemData = itemDoc.data();
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (taskId !== undefined) updates.taskId = taskId;
    if (mark !== undefined) updates.mark = mark;
    if (help !== undefined) updates.help = help;
    if (code !== undefined) updates.code = code;
    if (isPublic !== undefined) {
      updates.isPublic = isPublic;
      if (isPublic) {
        const lang = itemData.lang;
        const itemCode = code !== undefined ? code : itemData.code;
        await makeApiTaskPublic({ auth, lang, code: itemCode });
      }
    }
    updates.updated = Date.now();
    await itemRef.update(updates);
    const updatedDoc = await itemRef.get();
    const data = updatedDoc.data();
    return {
      id,
      ...data,
      created: String(data.created),
      updated: String(data.updated),
    };
  } catch (error) {
    console.error("updateItem()", "ERROR", error);
    throw new Error(`Failed to update item: ${error.message}`);
  }
}

export async function getItems({ auth, lang, mark }) {
  try {
    let query = db
      .collection(`users/${auth.uid}/items`)
      .where("lang", "==", lang);
    // Only filter by mark if it's provided
    if (mark !== undefined && mark !== null) {
      query = query.where("mark", "==", mark);
    }
    const itemsSnapshot = await query.orderBy("created", "desc").get();
    const items = [];

    // Get the user's sharedItems data to add to items
    const userDoc = await db.doc(`users/${auth.uid}`).get();
    const sharedItemsData = userDoc.data()?.sharedItems || {};

    // Process items and fetch legacy data if needed
    for (const doc of itemsSnapshot.docs) {
      const data = doc.data();
      let code = data.code;
      let help = data.help;
      let taskId = data.taskId;

      // If item doesn't have a taskId (e.g., shared item), post the task to create one
      if (!taskId && code) {
        try {
          const taskData = await postTask({
            auth,
            task: {
              lang: data.lang,
              code: code,
            },
            ephemeral: false,
            isPublic: false,
          });

          if (taskData && taskData.id) {
            taskId = taskData.id;
            // Update the item with the new taskId
            await doc.ref.update({ taskId });
          }
        } catch (error) {
          console.error(
            "getItems()",
            "Failed to create task for item",
            doc.id,
            error,
          );
        }
      }

      // For backward compatibility: if item doesn't have code, fetch from taskIds collection
      if (!code && taskId) {
        try {
          const taskDoc = await db
            .doc(`users/${auth.uid}/taskIds/${taskId}`)
            .get();
          if (taskDoc.exists) {
            const taskData = taskDoc.data();
            code = taskData.src || "";
            // Also get help if not present in item
            if (!help) {
              help = taskData.help || "[]";
            }
          }
        } catch (error) {
          console.log(
            "getItems()",
            "Failed to fetch legacy task data for item",
            doc.id,
            error,
          );
        }
      }

      // Get the sharedWith list for this item
      const sharedWith = sharedItemsData[doc.id]?.sharedWith || [];

      const item = {
        id: doc.id,
        name: data.name,
        taskId, // Include the potentially new taskId
        lang: data.lang,
        mark: data.mark || 1, // Default to mark 1 if not set
        help: help || "[]",
        code: code || "",
        isPublic: data.isPublic || false,
        created: String(data.created),
        updated: data.updated ? String(data.updated) : String(data.created),
        sharedWith: sharedWith,
        sharedFrom: data.sharedFrom || null, // Include sharedFrom field if present
      };

      items.push(item);
    }
    return items;
  } catch (error) {
    console.error("getItems()", "ERROR", error);
    throw new Error(`Failed to get items: ${error.message}`);
  }
}

export async function getTask({ auth, id }) {
  try {
    // Get the task code from the API
    const apiTask = await getApiTask({ id, auth });
    const taskData = apiTask[0] || apiTask;

    // Get the language from the task (remove L prefix if present)
    const lang = taskData.lang.startsWith('L') ? taskData.lang.substring(1) : taskData.lang;

    // Get the lexicon for the language
    const lexicon = await getLanguageLexicon(lang);

    // Unparse the AST to get source code
    let sourceCode;
    try {
      sourceCode = parser.unparse(taskData.code, lexicon);
    } catch (error) {
      console.error("getTask()", "Failed to unparse AST", error);
      // Fallback to stringifying if unparsing fails
      sourceCode = JSON.stringify(taskData.code);
    }

    return {
      id: id,
      lang: taskData.lang,
      code: sourceCode,
    };
  } catch (error) {
    console.error("getTask()", "ERROR", error);
    throw new Error(`Failed to get task: ${error.message}`);
  }
}

export async function shareItem({ auth, itemId, targetUserId }) {
  try {
    // Validate that the source item exists and belongs to the current user
    const itemRef = db.doc(`users/${auth.uid}/items/${itemId}`);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return {
        success: false,
        message: "Item not found",
        newItemId: null,
      };
    }

    // Validate that the target user exists
    const targetUserRef = db.doc(`users/${targetUserId}`);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists) {
      return {
        success: false,
        message: "Target user not found",
        newItemId: null,
      };
    }

    const itemData = itemDoc.data();

    // Create a new item in the target user's collection with "(from <uid>)" suffix
    const targetItemRef = db.collection(`users/${targetUserId}/items`).doc();
    const newItemId = targetItemRef.id;
    const timestamp = Date.now();

    // Add a note to the help transcript about where the item was shared from
    let updatedHelp = itemData.help || "[]";
    try {
      const helpArray = JSON.parse(updatedHelp);
      // Add a note at the end of the help transcript (since display is reversed)
      helpArray.push({
        role: "system",
        content: `Shared by ${auth.uid}`,
        timestamp: timestamp,
        taskId: itemData.taskId // Include the original task ID for clickability
      });
      updatedHelp = JSON.stringify(helpArray);
    } catch (error) {
      // If help is not valid JSON, create a new array with the note
      updatedHelp = JSON.stringify([{
        role: "system",
        content: `Shared by ${auth.uid}`,
        timestamp: timestamp,
        taskId: itemData.taskId // Include the original task ID for clickability
      }]);
    }

    const sharedItem = {
      ...itemData,
      id: newItemId,
      taskId: null, // Clear the task ID - it will be created when the user loads the item
      name: itemData.name,
      help: updatedHelp,
      sharedFrom: auth.uid, // Track who shared this item
      created: timestamp,
      updated: timestamp,
      // Don't copy the isPublic flag - let the recipient decide
      isPublic: false,
    };

    await targetItemRef.set(sharedItem);

    // Update the sender's user document to track shared items
    const senderUserRef = db.doc(`users/${auth.uid}`);
    const senderUserDoc = await senderUserRef.get();

    const sharedItems = senderUserDoc.data()?.sharedItems || {};

    // Initialize the item's share record if it doesn't exist
    if (!sharedItems[itemId]) {
      sharedItems[itemId] = {
        sharedWith: [],
        sharedAt: {},
      };
    }

    // Add the target user if not already shared with
    if (!sharedItems[itemId].sharedWith.includes(targetUserId)) {
      sharedItems[itemId].sharedWith.push(targetUserId);
    }

    // Record when it was shared
    sharedItems[itemId].sharedAt[targetUserId] = timestamp;

    // Update the sender's user document
    await senderUserRef.update({
      sharedItems: sharedItems,
    });

    return {
      success: true,
      message: `Item shared successfully with ${targetUserId}`,
      newItemId: newItemId,
    };
  } catch (error) {
    console.error("shareItem()", "ERROR", error);
    return {
      success: false,
      message: `Failed to share item: ${error.message}`,
      newItemId: null,
    };
  }
}
