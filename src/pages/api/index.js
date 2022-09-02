import bent from 'bent';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from 'graphql-helix';

const typeDefs = `
  type Query {
    data: String
  }

  type Mutation {
    compileHello(name: String!): String!
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
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default async function handler(req, res) {
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
}
