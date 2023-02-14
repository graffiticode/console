import { makeExecutableSchema } from "@graphql-tools/schema";
import { unstable_getServerSession as getServerSession, } from "next-auth/next";
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from "graphql-helix";
import { authOptions } from "./auth/[...nextauth]";
import {
  getTasks,
  updateMark,
  saveTask,
  postTask,
} from "./resolvers.js";

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
    getTasks: async (_, args, ctx) => {
      const { auth } = ctx;
      const { lang, mark } = args;
      return await getTasks({ auth, lang, mark });
    },
  },
  Mutation: {
    tasksSettings: async (_, args, ctx) => {
      // const { auth } = ctx;
      // const { lang, code, mark } = args;
      // const id = await updateMark({ auth, lang, code, mark });
      return JSON.stringify({ status: "ok" });
    },
    saveTask: async (_, args, ctx) => {
      const { auth } = ctx;
      const { lang, code, mark } = args;
      const data = await saveTask({ auth, lang, code, mark });
      return JSON.stringify(data);
    },
    postTask: async (_, args, ctx) => {
      const { auth } = ctx;
      const { lang, code, ephemeral } = args;
      const task = { lang, code };
      const { id } = await postTask({ auth, task, ephemeral });
      return id;
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).end();
    return;
  }

  // Create auth context from verified session
  let { address: uid, accessToken: token } = session;
  const auth = { uid, token };

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
      contextFactory: () => ({ auth })
    });
    sendResult(result, res);
  }
}
