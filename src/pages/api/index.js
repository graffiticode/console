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

const clientAddress = process.env.ARTCOMPILER_CLIENT_ADDRESS
  ? process.env.ARTCOMPILER_CLIENT_ADDRESS
  : "0x0123456789abcdef0123456789abcdef01234567";
let authToken = process.env.ARTCOMPILER_CLIENT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3IiwiYWNjZXNzIjoiY29tcGlsZSIsImlhdCI6MTY2NTYwNTQ2OH0.PCZIYheoF9682UMTHtVMjDZ79f3aiFGoCf-8CQFGVSM";

const typeDefs = `
  type Query {
    data: String
  }

  type Mutation {
    compileTask(lang: String!, code: String!): String!
  }
`;

function parse(lang, code) {
  // Replace with actual parser.
  return {
    "1": { "tag": "STR", "elts": [code] },
    "2": { "tag": "EXPRS", "elts": [1] },
    "3": { "tag": "PROG", "elts": [2] },
    "root": 3,
    "version": "1"
  };
};

function createTask(lang, code) {
  const task = {
    lang,
    code,
  };
  return task;
}

async function postTask(auth, task) {
  console.log("postTask() task=" + JSON.stringify(task, null, 2));
//  const post = bent('https://api.artcompiler.com/', 'POST', 'json', 200);
  const post = bent('http://localhost:3100/', 'POST', 'json', 200);
  const response = await post('task', {
    auth,
    task
  });
  return response.data;
}

async function getData(auth, id) {
  try {
    const get = bent('http://localhost:3100/', 'GET', 'json', 200);
    // const get = bent('https://api.graffiticode.org/', 'GET', 'json', 200);
    const resp = await get(`data?id=${id}&auth=${auth}`);
    console.log("getData() data=" + JSON.stringify(resp.data, null, 2));
    return JSON.stringify(resp.data);
  } catch (x) {
    console.log("catch: " + x);
  }
}

const resolvers = {
  Mutation: {
    compileTask: async (_, {lang, code}) => {
      const auth = authToken;
      const task = createTask(lang, code);
      const { id } = await postTask(auth, task);
      const data = await getData(auth, id);
      return data;
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
  console.log("ARTCOMPILER_CLIENT_SECRET authToken=" + authToken);
  if (token) {
    console.log("JSON Web Token", JSON.stringify(token, null, 2));
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
