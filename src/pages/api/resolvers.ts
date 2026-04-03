import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index";
import { buildGetTaskDaoForStorageType } from "./utils";
import { getFirestore } from "../../utils/db";
import { getApiTask, getBaseUrlForApi, getLanguageAsset, getLanguageLexicon } from "../../lib/api";
import { parser, unparse } from "@graffiticode/parser";
import { generateCode as codeGenerationService } from "../../lib/code-generation-service";
import { ragLog, generateRequestId } from "../../lib/logger";
import fs from "fs";
import path from "path";
import crypto from "crypto";
// import { buildDynamicSchema } from "./schemas";

function encrypt(plaintext: string): string {
  const key = process.env.GRAFFITICODE_SECRET_KEY;
  if (!key) return plaintext;
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.createHmac('sha256', key).update(plaintext).digest().subarray(0, 16);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function buildParseCallbacks(systemValues: Record<string, string> = {}) {
  console.log("buildParseCallbacks()", "systemValues:", JSON.stringify(systemValues));
  return {
    GET_VAL_PRIVATE: (name: string) => {
      const result = systemValues[name] || "";
      console.log("GET_VAL_PRIVATE()", "name:", name, "result:", encrypt(result));
      return encrypt(result);
    },
    GET_VAL_PUBLIC: (name: string) => {
      const result = systemValues[name] || "";
      console.log("GET_VAL_PUBLIC()", "name:", name, "result:", result);
      return result;
    },
  };
}

// Global cache for templates to avoid repeated fetches
const templateCache = new Map<string, string>();

const taskDaoFactory = buildTaskDaoFactory();
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

export async function parseCode({ lang, src, systemValues = {} }: { lang: string; src: string; systemValues?: Record<string, string> }) {
  console.log("parseCode()", "lang:", lang);
  try {
    const lexicon = await getLanguageLexicon(lang);
    if (!lexicon) {
      return { code: null, errors: [{ message: `No lexicon found for language ${lang}`, from: -1, to: -1 }] };
    }
    const nodePool = await parser.parse(lang, src, lexicon, buildParseCallbacks(systemValues));

    // Scan the AST pool for ERROR nodes
    const errors: Array<{ message: string; from: number; to: number }> = [];
    for (const key of Object.keys(nodePool)) {
      if (key === "root") continue;
      const node = nodePool[key];
      if (node && node.tag === "ERROR") {
        // ERROR node elts: [STR_nid, NUM_nid(from), NUM_nid(to)]
        const msgNode = nodePool[node.elts[0]];
        const fromNode = nodePool[node.elts[1]];
        const toNode = nodePool[node.elts[2]];
        const message = typeof msgNode === "string" ? msgNode
          : (msgNode?.tag === "STR" ? msgNode.elts[0] : String(msgNode));
        const from = typeof fromNode === "number" ? fromNode
          : (fromNode?.tag === "NUM" ? Number(fromNode.elts[0]) : -1);
        const to = typeof toNode === "number" ? toNode
          : (toNode?.tag === "NUM" ? Number(toNode.elts[0]) : -1);
        errors.push({ message, from, to });
      }
    }

    if (errors.length > 0) {
      return { code: null, errors };
    }
    console.log(
      "parseCode()",
      "nodePool=" + JSON.stringify(nodePool, null, 2),
    );
    return { code: JSON.stringify(nodePool), errors: null };
  } catch (err) {
    return { code: null, errors: [{ message: err.message || "Parse error", from: -1, to: -1 }] };
  }
}

export async function logCompile({ auth, units, id, timestamp, status, data }) {
  try {
    const [{ lang }] = await getApiTask({ id, auth });
    const path = `users/${auth.uid}/compiles/${id}`;
    data = JSON.parse(data);
    await db.doc(path).set({ id, timestamp, status, lang, data });

    // Track usage units if provided
    if (units && units > 0) {
      const now = new Date();

      // Check if user is over limit
      let wasOverLimit = false;
      try {
        const userDoc = await db.collection('users').doc(auth.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const plan = userData?.subscription?.plan || 'demo';
          const overageUnits = userData?.subscription?.overageUnits || 0;

          // Get plan allocation
          const planAllocations = {
            demo: 250,
            starter: 5000,
            pro: 100000,
            teams: 2000000
          };
          let allocatedUnits = planAllocations[plan] || 100;

          // Check for preserved allocation (from downgrade)
          const preservedUntil = userData?.subscription?.preservedUntil;
          const preservedAllocation = userData?.subscription?.preservedAllocation;
          if (preservedUntil && preservedAllocation && new Date(preservedUntil) > now) {
            allocatedUnits = preservedAllocation;
          }

          // Get current usage
          const usageDoc = await db.collection('usage').doc(auth.uid).get();
          const currentUsage = usageDoc.exists ? (usageDoc.data().currentMonthTotal || 0) : 0;

          // Calculate if over limit (before adding these new units)
          const totalAvailable = allocatedUnits + overageUnits;
          wasOverLimit = currentUsage >= totalAvailable;
        }
      } catch (error) {
        console.error('Error checking usage limit:', error);
      }

      // Add individual usage record for audit trail
      await db.collection('usage').add({
        userId: auth.uid,
        taskId: id,
        units: units,
        createdAt: now,
        timestamp: timestamp,
        lang: lang,
        type: 'compile',
        status: status,
        wasOverLimit: wasOverLimit
      });

      // Update monthly usage total
      const usageDocRef = db.collection('usage').doc(auth.uid);
      const usageDoc = await usageDocRef.get();

      let newTotal = units;
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
          newTotal = units;
        } else {
          // Increment existing month total
          newTotal = (currentData.currentMonthTotal || 0) + units;
          await usageDocRef.update({
            currentMonthTotal: newTotal,
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
        newTotal = units;
      }

      // Calculate if now over limit (after adding these new units)
      const userDoc = await db.collection('users').doc(auth.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const subscription = userData?.subscription || {};
      const plan = subscription.plan || 'demo';
      const overageUnits = subscription.overageUnits || 0;

      const planAllocations = {
        demo: 250,
        starter: 5000,
        pro: 100000,
        teams: 2000000
      };
      let allocatedUnits = planAllocations[plan] || 100;

      // Check for preserved allocation (from downgrade)
      const preservedUntil = subscription.preservedUntil;
      const preservedAllocation = subscription.preservedAllocation;
      if (preservedUntil && preservedAllocation && new Date(preservedUntil) > now) {
        allocatedUnits = preservedAllocation;
      }

      const totalAvailable = allocatedUnits + overageUnits;
      const usageLimitReached = newTotal > totalAvailable;

      return JSON.stringify({ success: true, usageLimitReached });
    }

    return JSON.stringify({ success: true });
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
    console.log(
      "getData()",
      "resp.data=" + JSON.stringify(resp.data, null, 2),
    );
    return resp.data;
  } catch (x) {
    console.log("getData()", "ERROR", x);
  }
}

export async function getTasks({ auth, lang, mark }) {
  try {
    // Get items from the items collection (primary source)
    const items = await getItems({ auth, lang, mark, app: 'console' });

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
        return {
          id: item.taskId || item.id,
          lang: item.lang,
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
  currentSrc,
  conversationSummary = null,
  itemId = undefined,
}) {
  const rid = generateRequestId();

  try {
    if (!language) {
      return { src: null, taskId: null, language, description: null, model: null, usage: null, errors: [{ message: "language is required" }] };
    }

    prompt = prompt.trim();
    let description = null;
    let model = null;
    let usage = { input_tokens: 0, output_tokens: 0 };

    ragLog(rid, "request.start", {
      promptLength: prompt.length,
      language,
      hasCurrentSrc: !!currentSrc,
    });

    let src = null;

    // Template generation
    if (prompt === "Create a minimal starting template") {
      const cacheKey = `L${language}`;
      src = templateCache.get(cacheKey);
      if (!src) {
        src = await getLanguageAsset(`L${language}`, 'template.gc');
        if (src) {
          templateCache.set(cacheKey, src);
        }
      }
      if (src) {
        description = "Template";
        model = "template-file";
      }
    }

    // Code generation — if no template source
    if (!src) {
      const result = await codeGenerationService({
        auth,
        prompt,
        lang: language,
        options: {
          model: options?.model,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        },
        currentCode: currentSrc,
        rid,
        conversationSummary,
      });

      if ('errors' in result && result.errors) {
        const errors = result.errors.map(err => ({
          ...err,
          message: err.message === 'Usage limit reached'
            ? 'Usage limit reached. Please upgrade your account or add overage units in Settings to continue. Your usage will reset to zero on the next billing cycle.'
            : err.message
        }));
        return { src: null, taskId: null, language, description: null, model: null, usage: null, errors };
      }

      const successResult = result as { code: any; taskId: string; model: string; usage: any };
      src = successResult.code;
      model = successResult.model;
      usage = successResult.usage;
    }

    // Parse with system values, post, and unparse
    const systemValues: Record<string, string> = {};
    if (itemId) systemValues.itemId = itemId;
    const parseResult = await parseCode({ lang: language, src, systemValues });
    if (parseResult.errors) {
      return { src: null, taskId: null, language, description: null, model: null, usage: null, errors: parseResult.errors };
    }
    const code = JSON.parse(parseResult.code);
    const taskData = await postTask({
      auth,
      task: { lang: language, code },
      ephemeral: true,
      isPublic: false,
    });
    const taskId = taskData.id;
    if (!taskId) {
      throw new Error("Failed to get taskId");
    }
    const lexicon = await getLanguageLexicon(language);
    const resolvedSrc = unparse(code, lexicon || {});

    ragLog(rid, "request.end", {
      taskId,
      model,
      usage,
      success: true,
    });

    return { src: resolvedSrc, taskId, language, description, model, usage, errors: null };
  } catch (error) {
    console.error("generateCode()", "ERROR", error);
    ragLog(rid, "request.error", { error: error.message });
    return { src: null, taskId: null, language, description: null, model: null, usage: null, errors: [{ message: error.message }] };
  }
}

export async function createItem({
  auth,
  lang,
  name,
  taskId,
  mark,
  help,
  isPublic,
  app,
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
    let generatedHelp = help || "[]";
    if (!taskId) {
      const result = await generateCode({
        auth,
        prompt: "Create a minimal starting template",
        language: lang,
        options: {},
        currentSrc: null,
        itemId: id,
      });
      taskId = result.taskId;
      if (!taskId) {
        throw new Error("Failed to generate template task");
      }
    }
    const timestamp = Date.now();
    const item = {
      id,
      name,
      taskId,
      lang,
      mark: mark || 1, // Default to mark 1 if not provided
      help: generatedHelp,
      isPublic: isPublic || false,
      app: app || 'console', // Default to 'console' if not provided
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
    if (isPublic !== undefined) {
      updates.isPublic = isPublic;
      if (isPublic) {
        // Fetch source from API task for making public
        const itemTaskId = taskId || itemData.taskId;
        if (itemTaskId) {
          try {
            const apiTask = await getApiTask({ id: itemTaskId, auth });
            const taskData = apiTask[0] || apiTask;
            const code = taskData.code;
            await makeApiTaskPublic({ auth, lang: itemData.lang, code });
          } catch (err) {
            console.error("updateItem: failed to fetch source for makeApiTaskPublic", err);
          }
        }
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

export async function getItems({ auth, lang, mark, app }) {
  try {
    let query = db
      .collection(`users/${auth.uid}/items`)
      .where("lang", "==", lang);
    // Only filter by mark if it's provided
    if (mark !== undefined && mark !== null) {
      query = query.where("mark", "==", mark);
    }
    // Filter by app - default to 'console' if not specified
    const appFilter = app || 'console';
    query = query.where("app", "==", appFilter);
    const itemsSnapshot = await query.get();
    const items = [];

    // Get the user's sharedItems data to add to items
    const userDoc = await db.doc(`users/${auth.uid}`).get();
    const sharedItemsData = userDoc.data()?.sharedItems || {};

    // Process items and fetch legacy data if needed
    for (const doc of itemsSnapshot.docs) {
      const data = doc.data();
      let help = data.help;
      let taskId = data.taskId;

      // If item doesn't have a taskId (e.g., shared item), post the task to create one
      if (!taskId && data.code) {
        try {
          const taskData = await postTask({
            auth,
            task: {
              lang: data.lang,
              code: data.code,
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

      // For backward compatibility: fetch help from legacy taskIds collection
      if (!help && taskId) {
        try {
          const taskDoc = await db
            .doc(`users/${auth.uid}/taskIds/${taskId}`)
            .get();
          if (taskDoc.exists) {
            const taskData = taskDoc.data();
            help = taskData.help || "[]";
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

      // Skip items without a valid taskId
      if (!taskId) {
        console.log("getItems()", "Skipping item with null taskId", doc.id);
        continue;
      }

      const item = {
        id: doc.id,
        name: data.name,
        taskId,
        lang: data.lang,
        mark: data.mark || 1, // Default to mark 1 if not set
        help: help || "[]",
        isPublic: data.isPublic || false,
        created: String(data.created),
        updated: data.updated ? String(data.updated) : String(data.created),
        sharedWith: sharedWith,
        sharedFrom: data.sharedFrom || null, // Include sharedFrom field if present
        app: data.app || null,
      };

      const timestamp = data.updated || data.created || 0;
      items.push({ ...item, _sortKey: timestamp });
    }
    items.sort((a, b) => b._sortKey - a._sortKey);
    return items.map(({ _sortKey, ...item }) => item);
  } catch (error) {
    console.error("getItems()", "ERROR", error);
    throw new Error(`Failed to get items: ${error.message}`);
  }
}

export async function getTask({ auth, id }) {
  try {
    const apiTask = await getApiTask({ id, auth });
    const taskData = apiTask[0] || apiTask;
    const code = taskData.code;
    const codeStr = JSON.stringify(code, null, 2);
    let src = "";
    try {
      const lexicon = await getLanguageLexicon(taskData.lang);
      src = unparse(code, lexicon || {});
    } catch (err) {
      console.error("getTask: failed to unparse", err);
    }
    return { id, lang: taskData.lang, code: codeStr, src };
  } catch (error) {
    console.error("getTask()", "ERROR", error);
    throw new Error(`Failed to get task: ${error.message}`);
  }
}

export async function getItem({ auth, id }) {
  try {
    const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return null;
    }

    const data = itemDoc.data();
    let help = data.help;
    let taskId = data.taskId;

    // For backward compatibility: fetch help from legacy taskIds collection
    if (!help && taskId) {
      try {
        const taskDoc = await db.doc(`users/${auth.uid}/taskIds/${taskId}`).get();
        if (taskDoc.exists) {
          const taskData = taskDoc.data();
          help = taskData.help || "[]";
        }
      } catch (error) {
        console.log("getItem()", "Failed to fetch legacy task data", error);
      }
    }

    return {
      id: id,
      name: data.name,
      taskId: taskId,
      lang: data.lang,
      mark: data.mark || 1,
      help: help || "[]",
      isPublic: data.isPublic || false,
      created: String(data.created),
      updated: data.updated ? String(data.updated) : String(data.created),
    };
  } catch (error) {
    console.error("getItem()", "ERROR", error);
    throw new Error(`Failed to get item: ${error.message}`);
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
