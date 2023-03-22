import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from "graphql-helix";
import {
  compiles,
  logCompile,
  tasks,
  saveTask,
  postTask,
} from "./resolvers.js";
import { client } from "../../lib/auth";

const typeDefs = `
  type Query {
    compiles(type: String!): String!
    tasks(lang: String!, mark: Int!): String!
  }

  type Mutation {
    logCompile(id: String!, status: String!, timestamp: String!, data: String!): String!
    postTask(lang: String!, code: String!, ephemeral: Boolean): String!
    saveTask(lang: String!, code: String!, mark: Int!, isPublic: Boolean): String!
  }
`;

const resolvers = {
  Query: {
    compiles: async (_, args, ctx) => {
      const { token } = ctx;
      const { type } = args;
      const { uid } = await client.verifyAccessToken(token);
      return await compiles({ auth: { uid, token }, type });
    },
    tasks: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, mark } = args;
      const { uid } = await client.verifyAccessToken(token);
      return await tasks({ auth: { uid, token }, lang, mark });
    },
  },
  Mutation: {
    saveTask: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, code, mark, isPublic } = args;
      const { uid } = await client.verifyAccessToken(token);
      const data = await saveTask({ auth: { uid, token }, lang, code, mark, isPublic });
      return JSON.stringify(data);
    },
    postTask: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, code, ephemeral } = args;
      const { uid } = await client.verifyAccessToken(token);
      const task = { lang, code };
      const { id } = await postTask({ auth: { uid, token }, task, ephemeral });
      return id;
    },
    logCompile: async (_, args, ctx) => {
      const { token } = ctx;
      const { id, timestamp, status, data } = args;
      const { uid } = await client.verifyAccessToken(token);
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
  console.log("req.headers=" + JSON.stringify(req.headers, null, 2));
  if (shouldRenderGraphiQL(request)) {
    console.log("handler() req.query=" + JSON.stringify(req.query, null, 2));
    const { auth_token } = req.query;
    const html = renderGraphiQL({
      endpoint: "/api",
      headers: `{ "authorization": "${auth_token}" }`,
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    const { operationName, query, variables } = getGraphQLParameters(request);
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
