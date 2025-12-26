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
  getTasks,
  getTask,
  postTask,
  getData,
  generateCode,
  createItem,
  updateItem,
  getItems,
  getItem,
  shareItem,
} from "./resolvers";
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
    help: String!
    taskId: String!
    isPublic: Boolean
    created: String
    mark: Int
    name: String
  }

  type Item {
    id: String!
    name: String!
    taskId: String!
    lang: String!
    mark: Int
    help: String
    code: String
    isPublic: Boolean
    created: String!
    updated: String
    sharedWith: [String]
    app: String
  }

  type GeneratedCode {
    code: String!
    taskId: String
    description: String
    language: String
    model: String
    usage: UsageInfo
  }

  type UsageInfo {
    input_tokens: Int
    output_tokens: Int
  }

  type Query {
    data(id: String!): String!
    compiles(lang: String!, type: String!): [Compile!]
    tasks(lang: String!, mark: Int!): [Task!]
    task(id: String!): Task
    items(lang: String!, mark: Int, app: String): [Item!]
    item(id: String!): Item
  }

  type ShareItemResult {
    success: Boolean!
    message: String
    newItemId: String
  }

  type Mutation {
    logCompile(units: Int, id: String!, status: String!, timestamp: String!, data: String!): String!
    postTask(lang: String!, code: String!, ephemeral: Boolean): String!
    generateCode(prompt: String!, language: String, options: CodeGenerationOptions, currentCode: String): GeneratedCode!
    createItem(lang: String!, name: String, taskId: String, mark: Int, help: String, code: String, isPublic: Boolean, app: String): Item!
    updateItem(id: String!, name: String, taskId: String, mark: Int, help: String, code: String, isPublic: Boolean): Item!
    shareItem(itemId: String!, targetUserId: String!): ShareItemResult!
  }

  input CodeGenerationOptions {
    model: String
    temperature: Float
    maxTokens: Int
  }
`;

const resolvers = {
  Query: {
    data: async (_, args, ctx) => {
      const { token } = ctx;
      const { id } = args;
      const { uid } = await client.verifyToken(token);
      const data = await getData({ authToken: token, id });
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
      return await getTasks({ auth: { uid, token }, lang, mark });
    },
    task: async (_, args, ctx) => {
      const { token } = ctx;
      const { id } = args;
      const { uid } = await client.verifyToken(token);
      return await getTask({ auth: { uid, token }, id });
    },
    items: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, mark, app } = args;
      const { uid } = await client.verifyToken(token);
      return await getItems({ auth: { uid, token }, lang, mark, app });
    },
    item: async (_, args, ctx) => {
      const { token } = ctx;
      const { id } = args;
      const { uid } = await client.verifyToken(token);
      return await getItem({ auth: { uid, token }, id });
    },
  },
  Mutation: {
    generateCode: async (_, args, ctx) => {
      const { token } = ctx;
      const { uid } = await client.verifyToken(token);
      const auth = {uid, token};
      const { prompt, language, options, currentCode } = args;
      try {
        // No authentication required for code generation
        return await generateCode({ auth, prompt, language, options, currentCode });
      } catch (error) {
        console.error("Error in generateCode mutation:", error);
        throw error;
      }
    },

    postTask: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, code, ephemeral } = args;
      const { uid } = await client.verifyToken(token);
      const task = { lang, code };
      const { id } = await postTask({ auth: { uid, token }, task, ephemeral, isPublic: false });
      return id;
    },
    logCompile: async (_, args, ctx) => {
      const { token } = ctx;
      const { units, id, timestamp, status, data } = args;
      console.log(
        "logCompile()",
        "units=" + units,
      );
      const { uid } = await client.verifyToken(token);
      const resp = await logCompile({ auth: { uid, token }, units, id, timestamp, status, data });
      return resp;
    },
    createItem: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, name, taskId, mark, help, code, isPublic, app } = args;
      const { uid } = await client.verifyToken(token);
      return await createItem({ auth: { uid, token }, lang, name, taskId, mark, help, code, isPublic, app });
    },
    updateItem: async (_, args, ctx) => {
      const { token } = ctx;
      const { id, name, taskId, mark, help, code, isPublic } = args;
      const { uid } = await client.verifyToken(token);
      return await updateItem({ auth: { uid, token }, id, name, taskId, mark, help, code, isPublic });
    },
    shareItem: async (_, args, ctx) => {
      const { token } = ctx;
      const { itemId, targetUserId } = args;
      const { uid } = await client.verifyToken(token);
      return await shareItem({ auth: { uid, token }, itemId, targetUserId });
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
