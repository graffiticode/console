import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from "graphql-helix";
import {
  getCompiles,
  logCompile,
  getTasks,
  saveTask,
  postTask,
} from "./resolvers.js";
import { client } from "../../lib/auth";

const typeDefs = `
  type Query {
    getCompiles(token: String!, type: String!): String!
    getTasks(token: String!, lang: String!, mark: Int!): String!
  }

  type Mutation {
    logCompile(token: String!, id: String!, status: String!, timestamp: String!, data: String!): String!
    postTask(token: String!, lang: String!, code: String!, ephemeral: Boolean): String!
    saveTask(token: String!, lang: String!, code: String!, mark: Int!, isPublic: Boolean): String!
  }
`;

const resolvers = {
  Query: {
    getCompiles: async (_, args) => {
      const { token, type } = args;
      const { uid } = await client.verifyAccessToken(token);
      return await getCompiles({ auth: { uid, token }, type });
    },
    getTasks: async (_, args) => {
      const { token, lang, mark } = args;
      const { uid } = await client.verifyAccessToken(token);
      return await getTasks({ auth: { uid, token }, lang, mark });
    },
  },
  Mutation: {
    saveTask: async (_, args) => {
      const { token, lang, code, mark, isPublic } = args;
      const { uid } = await client.verifyAccessToken(token);
      const data = await saveTask({ auth: { uid, token }, lang, code, mark, isPublic });
      return JSON.stringify(data);
    },
    postTask: async (_, args) => {
      const { token, lang, code, ephemeral } = args;
      const { uid } = await client.verifyAccessToken(token);
      const task = { lang, code };
      const { id } = await postTask({ auth: { uid, token }, task, ephemeral });
      return id;
    },
    logCompile: async (_, args) => {
      const { token, id, timestamp, status, data } = args;
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
