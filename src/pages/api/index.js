import https from 'https';
import bent from 'bent';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { getToken } from "next-auth/jwt";
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from 'graphql-helix';
import {
  getTasks,
  updateMark,
  saveTask,
  postTask,
} from './resolvers.js';

const clientAddress = process.env.ARTCOMPILER_CLIENT_ADDRESS
  ? process.env.ARTCOMPILER_CLIENT_ADDRESS
  : "0x0123456789abcdef0123456789abcdef01234567";
let authToken = process.env.ARTCOMPILER_CLIENT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3IiwiYWNjZXNzIjoiY29tcGlsZSIsImlhdCI6MTY2NTYwNTQ2OH0.PCZIYheoF9682UMTHtVMjDZ79f3aiFGoCf-8CQFGVSM";

global.config = import("./config.json");
global.config.useLocalCompiles = process.env.LOCAL_COMPILES === "true";

const typeDefs = `
  type Query {
    getTasks(uid: String!, lang: String!, mark: Int!): String!
  }

  type Mutation {
    tasksSettings(uid: String!, lang: String!, mark: Int!): String!
    postTask(uid: String!, lang: String!, code: String!, ephemeral: Boolean): String!
    saveTask(uid: String!, lang: String!, code: String!, mark: Int!): String!
  }
`;

const resolvers = {
  Query: {
    getTasks: async (_, { uid, lang, mark }) => {
      return getTasks({uid, lang, mark});
    },
  },
  Mutation: {
    tasksSettings: async (_, {uid, lang, mark}) => {
      //const id = await updateMark({authToken, uid, lang, code, mark});
      return JSON.stringify({status: "ok"});
    },
    saveTask: async (_, {uid, lang, code, mark}) => {
      const data = await saveTask({authToken, uid, lang, code, mark});
      return JSON.stringify(data);
    },
    postTask: async (_, {uid, lang, code, ephemeral}) => {
      const task = {lang, code};
      const { id } = await postTask({uid, task, ephemeral});
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
        console.log("postAuth() statusCode=401");
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
  if (token) {
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
    console.log("graphql statusCode=401");
    res.status(401);
    res.end();
  }
}
