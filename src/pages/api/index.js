import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from "graphql-helix";
import {
  getTasks,
  updateMark,
  saveTask,
  postTask,
} from "./resolvers.js";
import { client } from "../../lib/auth";

const typeDefs = `
  type Query {
    getTasks(token: String!, lang: String!, mark: Int!): String!
  }

  type Mutation {
    tasksSettings(token: String!, lang: String!, mark: Int!): String!
    postTask(token: String!, lang: String!, code: String!, ephemeral: Boolean): String!
    saveTask(token: String!, lang: String!, code: String!, mark: Int!, isPublic: Boolean): String!
  }
`;

const resolvers = {
  Query: {
    getTasks: async (_, args) => {
      const { token, lang, mark } = args;
      const { uid } = await client.verifyAccessToken(token);
      return await getTasks({ auth: { uid, token }, lang, mark });
    },
  },
  Mutation: {
    tasksSettings: async (_, args) => {
      // const { auth } = ctx;
      // const { lang, code, mark } = args;
      // const id = await updateMark({ auth, lang, code, mark });
      return JSON.stringify({ status: "ok" });
    },
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
