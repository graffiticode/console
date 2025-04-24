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
  generateCode,
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
    help: String!
    taskId: String!
    isPublic: Boolean
    created: String
    mark: Int
    name: String
  }

  type GeneratedCode {
    code: String!
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
  }

  type Mutation {
    logCompile(id: String!, status: String!, timestamp: String!, data: String!): String!
    postTask(lang: String!, code: String!, ephemeral: Boolean): String!
    saveTask(id: String, lang: String!, code: String!, help: String!, mark: Int!, isPublic: Boolean): String!
    updateTask(id: String, name: String, help: String, mark: Int, isPublic: Boolean): String!
    generateCode(prompt: String!, language: String, options: CodeGenerationOptions): GeneratedCode!
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
      return await tasks({ auth: { uid, token }, lang, mark });
    },
  },
  Mutation: {
    generateCode: async (_, args, ctx) => {
      const { token } = ctx;
      const { uid } = await client.verifyToken(token);
      const auth = {uid, token};
      const { prompt, language, options } = args;
      console.log(
        "generateCode mutation called",
        "language=" + language,
        "prompt=" + prompt.substring(0, 30) + "...",
      );

      try {
        // No authentication required for code generation
        return await generateCode({ auth, prompt, language, options });
      } catch (error) {
        console.error("Error in generateCode mutation:", error);
        throw error;
      }
    },

    saveTask: async (_, args, ctx) => {
      const { token } = ctx;
      const { id, lang, code, help, mark, isPublic } = args;
      const { uid } = await client.verifyToken(token);
      const data = await saveTask({ auth: { uid, token }, id, lang, code, help, mark, isPublic });
      return JSON.stringify(data);
    },
    updateTask: async (_, args, ctx) => {
      console.log(
        "updateTask()",
        "args=" + JSON.stringify(args, null, 2),
      );
      const { token } = ctx;
      const { id, name, help, mark, isPublic } = args;
      const { uid } = await client.verifyToken(token);
      const data = await updateTask({ auth: { uid, token }, id, name, help, mark, isPublic });
      console.log(
        "updateTask()",
        "data=" + JSON.stringify(data, null, 2),
      );
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
  console.log(
    "handler()",
  );
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
    // console.log(
    //   "handler()",
    //   "query=" + query,
    // );
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
