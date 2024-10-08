import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from "graphql-helix";
import {
  compile,
  compiles,
  logCompile,
  tasks,
  saveTask,
  updateTask,
  postTask,
  getData,
} from "./resolvers.js";
import { client } from "../../lib/auth";

const typeDefs = `
  type Compile {
    id: String!
    timestamp: String!
    status: String!
    lang: String
  }

  type Task {
    id: String!
    src: String!
    lang: String!
    code: String!
    taskId: String!
    isPublic: Boolean
    created: String
    mark: Int
    name: String
  }

  type Query {
    data(id: String!): String!
    compiles(lang: String!, type: String!): [Compile!]
    tasks(lang: String!, mark: Int!): [Task!]
  }

  type Mutation {
    logCompile(id: String!, status: String!, timestamp: String!, data: String!): String!
    postTask(lang: String!, code: String!, ephemeral: Boolean): String!
    saveTask(id: String, lang: String!, code: String!, mark: Int!, isPublic: Boolean): String!
    updateTask(id: String, name: String, mark: Int, isPublic: Boolean): String!
  }
`;

const resolvers = {
  Query: {
    data: async (_, args, ctx) => {
      const { token } = ctx;
      const { id } = args;
      const { uid } = await client.verifyToken(token);
      console.log("data() id=" + id + " uid=" + uid);
      const data = await getData({ authToken: token, id });
      console.log("data() data=" + JSON.stringify(data, null, 2));
      return JSON.stringify(data);
    },
    compiles: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, type } = args;
      const { uid } = await client.verifyToken(token);
      return await compiles({ auth: { uid, token }, lang, type });
    },
    tasks: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, mark } = args;
      const { uid } = await client.verifyToken(token);
      return await tasks({ auth: { uid, token }, lang, mark });
    },
  },
  Mutation: {
    saveTask: async (_, args, ctx) => {
      const { token } = ctx;
      const { id, lang, code, mark, isPublic } = args;
      const { uid } = await client.verifyToken(token);
      const data = await saveTask({ auth: { uid, token }, id, lang, code, mark, isPublic });
      return JSON.stringify(data);
    },
    updateTask: async (_, args, ctx) => {
      console.log("updateTask() args=" + JSON.stringify(args, null, 2));
      const { token } = ctx;
      const { id, name, mark, isPublic } = args;
      const { uid } = await client.verifyToken(token);
      const data = await updateTask({ auth: { uid, token }, id, name, mark, isPublic });
      return JSON.stringify(data);
    },
    postTask: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, code, ephemeral } = args;
      const { uid } = await client.verifyToken(token);
      const task = { lang, code };
      const { id } = await postTask({ auth: { uid, token }, task, ephemeral });
      return id;
    },
    logCompile: async (_, args, ctx) => {
      const { token } = ctx;
      const { id, timestamp, status, data } = args;
      const { uid } = await client.verifyToken(token);
      const resp = await logCompile({ auth: { uid, token }, id, timestamp, status, data });
      return resp;
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default async function handler(req, res) {
  const request = {
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
  };
  if (shouldRenderGraphiQL(request)) {
    const { auth_token } = req.query;
    const html = renderGraphiQL({
      endpoint: "/api",
      headers: `{ "authorization": "${auth_token}" }`,
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    const { operationName, query, variables } = getGraphQLParameters(request);
    console.log("handler() query=" + query);
    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema,
      contextFactory: () => ({
        token: req.headers.authorization,
      }),
    });
    sendResult(result, res);
  }
}
