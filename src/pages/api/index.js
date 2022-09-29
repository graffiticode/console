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

const typeDefs = `
  type Query {
    data: String
  }

  type Mutation {
    compileHello(name: String!): String!
    compileTask(lang: String!, code: String!): String!
  }
`;

function createTaskHello(name) {
  const task = {
    lang: "0",
    code: {
      "1": { "tag": "STR", "elts": [`hello, ${name}!`] },
      "2": { "tag": "EXPRS", "elts": [1] },
      "3": { "tag": "PROG", "elts": [2] },
      "root": 3,
      "version": "1"
    }
  };
  return task;
}

async function postTask(task) {
  const post = bent('https://api.artcompiler.com/', 'POST', 'json', 200);
  const response = await post('task', { task });
  return response.data;
}

async function getData(id) {
  try {
    const get = bent('https://api.artcompiler.com/', 'GET', 'json', 200);
    const resp = await get(`data?id=${id}`);
    return resp.data;
  } catch (x) {
    console.log("catch: " + x);
  }
}

const resolvers = {
  Mutation: {
    compileHello: async (_, args) => {
      const task = createTaskHello(args.name);
      const { id } = await postTask(task);
      const data = await getData(id);
      return data;
    },
    compileTask: async (_, args) => {
      const lang = args.lang;
      const code = JSON.parse(args.code);
      const task = { lang, code };
      const { id } = await postTask(task);
      const data = await getData(id);
      return data;
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default async function handler(req, res) {
  // If you don't have NEXTAUTH_SECRET set, you will have to pass your secret as `secret` to `getToken`
  const token = await getToken({ req });
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
  } else {
    // Not Signed in
    res.status(401);
    res.end();
  }
}
