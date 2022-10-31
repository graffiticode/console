import https from 'https';
import bent from 'bent';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from 'graphql-helix';
import { getToken } from "next-auth/jwt";
import { buildTaskDaoFactory } from "../../utils/storage/index.js";
import { buildGetTaskDaoForStorageType } from "./utils.js";
import { FieldValue } from 'firebase-admin/firestore';

const taskDaoFactory = buildTaskDaoFactory({});

const clientAddress = process.env.ARTCOMPILER_CLIENT_ADDRESS
  ? process.env.ARTCOMPILER_CLIENT_ADDRESS
  : "0x0123456789abcdef0123456789abcdef01234567";
let authToken = process.env.ARTCOMPILER_CLIENT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3IiwiYWNjZXNzIjoiY29tcGlsZSIsImlhdCI6MTY2NTYwNTQ2OH0.PCZIYheoF9682UMTHtVMjDZ79f3aiFGoCf-8CQFGVSM";

const typeDefs = `
  type Query {
    getTasks(uid: String!): String!
  }

  type Mutation {
    compileTask(user: String!, lang: String!, code: String!): String!
    saveTask(user: String!, lang: String!, code: String!): String!
    getTask(user: String!, id: String!): String!
  }
`;

function createTask(lang, code) {
  const task = {
    lang,
    code,
  };
  return task;
}

const normalizeTasksParameter = async tasks => {
  tasks = !Array.isArray(tasks) && [tasks] || tasks;
  return tasks;
};

const getIdFromIds = ids => {
  if (ids.length === 1) {
    return ids[0];
  } else {
    return ids;
  }
};

import db from '../../utils/db';

async function compileTask(auth, task) {
  const resp = await postTask(auth, task);
  let data;
  if (resp && resp.id) {
    data = await getData(auth, resp.id);
  }
  return data;
}

async function saveTask(uid, task) {
  const data = await compileTask(authToken, task);
  task = {...task, data: JSON.stringify(data)};
  const auth = { uid };
  const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
  const tasks = await normalizeTasksParameter(task);
  const taskDao = getTaskDaoForStore("firestore");
  const ids = await Promise.all(tasks.map(task => taskDao.create({ auth, task })));
  const id = getIdFromIds(ids);
  const userRef = await db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  if (userData.taskIds === undefined) {
    await userRef.update({taskIds: [id]});
  } else {
    await userRef.update({taskIds: FieldValue.arrayUnion(id)});
  }
  return JSON.stringify(id);
}

async function getTasks(uid) {
  const userRef = await db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const auth = {uid};
  const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
  const taskDao = getTaskDaoForStore("firestore");
  const taskIds = userData.taskIds || [];
  const tasksForIds = await Promise.all(taskIds.map(
    async id => taskDao.get({ id, auth })
  ));
  const tasks = tasksForIds.reduce((tasks, tasksForId, index) => {
    tasks[taskIds[index]] = [...tasksForId];
    return tasks;
  }, {});
  return JSON.stringify(tasks);  
}

async function getTask(auth, id) {
  const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
  const taskDao = getTaskDaoForStore("firestore");
  const ids = [].concat(id);
  const tasksForIds = await Promise.all(ids.map(async id => taskDao.get({ id, auth })));
  const tasks = tasksForIds.reduce((tasks, tasksForId) => {
    tasks.push(...tasksForId);
    return tasks;
  }, []);
  return JSON.stringify(tasks[0]);
}

async function postTask(auth, task) {
  try {
    //const post = bent('http://localhost:3100/', 'POST', 'json', 200);
    const post = bent('https://api.graffiticode.org/', 'POST', 'json', 200);
    const { data } = await post('task', {auth, task});
    return data;
  } catch (x) {
    console.log("POST /task catch " + x);
    return x;
  }
}

async function getData(auth, id) {
  try {
    //const get = bent('http://localhost:3100/', 'GET', 'json', 200);
    const get = bent('https://api.graffiticode.org/', 'GET', 'json', 200);
    const { data } = await get(`data?id=${id}&auth=${auth}`);
    return data;
  } catch (x) {
    console.log("GET /data catch " + x);
  }
}

const resolvers = {
  Query: {
    getTasks: async (_, { uid }) => {
      return getTasks(uid);
    },
  },
  Mutation: {
    compileTask: async (_, {user, lang, code}) => {
      const task = createTask(lang, code);
      return JSON.stringify(await compileTask(authToken, task));
    },
    saveTask: async (_, {user, lang, code}) => {
      const auth = authToken;
      const task = createTask(lang, code);
      const id = await saveTask(user, task);
      return id;
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

function postAuth(path, data, resume) {
  const encodedData = JSON.stringify(data);
  const options = {
    host: "auth.artcompiler.com",
    port: "443",
    path: path,
    method: "POST",
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(encodedData),
    },
  };
  const req = https.request(options);
  req.on("response", (res) => {
    let data = "";
    res.on('data', function (chunk) {
      data += chunk;
    }).on('end', function () {
      if (res.statusCode === 401) {
        resume(res.statusCode, data);
      } else {
        try {
          data = JSON.parse(data);
          resume(data.error, data);
        } catch (e) {
          console.log("[11] ERROR " + data + " statusCode=" + res.statusCode);
          console.log(e.stack);
        }
      }
    }).on("error", function () {
      console.log("error() status=" + res.statusCode + " data=" + data);
    });
  });
  req.end(encodedData);
  req.on('error', function(err) {
    console.log("[12] ERROR " + err);
    resume(err);
  });
}

export default async function handler(req, res) {
  // If you don't have NEXTAUTH_SECRET set, you will have to pass your secret as `secret` to `getToken`
  const token = await getToken({ req });
  // console.log("ARTCOMPILER_CLIENT_SECRET authToken=" + authToken);
  if (token) {
    // console.log("JSON Web Token", JSON.stringify(token, null, 2));
    // Signed in
    const request = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query,
    };
    if (shouldRenderGraphiQL(request)) {
      res.send(
        renderGraphiQL({
          endpoint: "/api",
        })
      );
    } else {
      const { operationName, query, variables } = getGraphQLParameters(request);
      const result = await processRequest({
        operationName,
        query,
        variables,
        request,
        schema,
      });
      sendResult(result, res);
    }

    // Init GC token, if not already inited.
    if (!authToken) {
      // Secret not stored in env so get one.
      console.log("ARTCOMPILER_CLIENT_SECRET not set. Generating a temporary secret.");
      postAuth("/login", {
        "address": clientAddress,
      }, (err, data) => {
        postAuth("/finishLogin", {
          "jwt": data.jwt,
        }, (err, data) => {
          // Default auth token.
          authToken = data.jwt;
        });
      });
    }
  } else {
    // Not Signed in
    res.status(401);
    res.end();
  }
}
