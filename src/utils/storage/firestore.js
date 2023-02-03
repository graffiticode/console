import { createHash } from "crypto";
import { NotFoundError, DecodeIdError } from "../errors/http.js";
import admin from "firebase-admin";

const createCodeHash = code =>
  createHash("sha256")
    .update(JSON.stringify(code))
    .digest("hex");

export const encodeId = ({ taskIds }) => {
  const idObj = { taskIds };
  return Buffer.from(JSON.stringify(idObj), "utf8").toString("base64url");
};

const decodeIdPart = id => {
  let taskIds;
  try {
    const idObj = JSON.parse(Buffer.from(id, "base64url").toString("utf8"));
    taskIds = idObj.taskIds;
  } catch (err) {
    throw new DecodeIdError(`failed to decode firestore id ${id}: ${err.message}`);
  }
  if (!Array.isArray(taskIds) || taskIds.length < 1) {
    throw new DecodeIdError(`firestore id ${id} contains no taskIds`);
  }
  return taskIds;
};

const decodeId = id => {
  const idParts = id.split("+");
  const taskIds = idParts.reduce(
    (taskIds, idPart) => {
      const idPartTaskIds = decodeIdPart(idPart);
      taskIds.push(...idPartTaskIds);
      return taskIds;
    },
    []
  );
  return taskIds;
};

const appendIds = (id, ...otherIds) => {
  const taskIds = decodeId(id);
  otherIds.forEach(otherId => {
    const otherTaskIds = decodeId(otherId);
    taskIds.push(...otherTaskIds);
  });
  return encodeId({ taskIds });
};

const buildTaskCreate = ({ db }) => async ({ auth, id, task, mark }) => {
  const { lang, code } = task;
  const codeHash = createCodeHash({lang, code});
  const codeHashRef = db.doc(`code-hashes/${codeHash}`);
  const codeHashDoc = await codeHashRef.get();

  let taskId;
  let taskRef;
  if (codeHashDoc.exists) {
    taskId = codeHashDoc.get("taskId");
    taskRef = db.doc(`tasks/${taskId}`);
    const taskUpdate = {
      mark,
      count: admin.firestore.FieldValue.increment(1)
    };
    if (auth) {
      taskUpdate[`acls.uids.${auth.uid}`] = true;
    } else {
      taskUpdate["acls.public"] = true;
    }
    await taskRef.update(taskUpdate);
  } else {
    let acls;
    if (auth) {
      acls = { public: false, uids: { [auth.uid]: true } };
    } else {
      acls = { public: true, uids: {} };
    }
    const tasksCol = db.collection("tasks");
    const task = { id, lang, code, mark, codeHash, count: 1, acls };
    const taskRef = await tasksCol.add(task);
    taskId = taskRef.id;
    await codeHashRef.set({ taskId });
  }
  return taskId;
};

const buildCheckAuth = () => ({ taskDoc, auth }) => {
  const acls = taskDoc.get("acls");
  if (!acls) {
    return;
  }
  if (acls.public) {
    return;
  }
  if (!auth) {
    throw new NotFoundError();
  }
  if (acls.uids[auth.uid]) {
    return;
  }
  throw new NotFoundError();
};

const buildTaskGet = ({ db }) => {
  const checkAuth = buildCheckAuth();
  return async ({ id, auth }) => {
    const taskIds = [id];
    const tasks = await Promise.all(
      taskIds.map(async taskId => {
        const taskRef = db.doc(`tasks/${taskId}`);
        const taskDoc = await taskRef.get();
        if (!taskDoc.exists) {
          throw new NotFoundError("taskId does not exist");
        }
        checkAuth({ taskDoc, auth });
        const lang = taskDoc.get("lang");
        const code = taskDoc.get("code");
        const id = taskDoc.get("id");
        return { lang, code, id };
      })
    );
    return tasks;
  };
};

export const buildFirestoreTaskDao = ({ db }) => {
  const create = buildTaskCreate({ db });
  const get = buildTaskGet({ db });
  return { create, get, appendIds };
};

export const buildCreateFirestoreDb = () => {
  let db;
  return () => {
    if (!db) {
      admin.initializeApp();
      db = admin.firestore();
    }
    return db;
  };
};
export const createFirestoreDb = buildCreateFirestoreDb();
