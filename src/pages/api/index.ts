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
  parseCode,
} from "./resolvers";
import { checkCompileAllowed } from "../../lib/usage-service";
import { listLanguages, getLanguageInfo } from "./languages";
import { client } from "../../lib/auth";
import {
  FreePlanError,
  getFreePlanApiKey,
  getFreePlanUid,
  isFreePlanRequest,
} from "../../lib/free-plan-context";

async function authenticate(token) {
  try {
    return await client.verifyToken(token);
  } catch {
    return await client.apiKeys.authenticate({ token });
  }
}

type AuthContext = {
  uid: string;
  token: string;
  freePlan?: boolean;
  sessionNamespace?: string;
};

async function resolveAuth(ctx): Promise<AuthContext> {
  if (ctx.freePlan) {
    const uid = await getFreePlanUid();
    return {
      uid,
      token: getFreePlanApiKey(),
      freePlan: true,
      sessionNamespace: ctx.sessionNamespace,
    };
  }
  const { uid } = await authenticate(ctx.token);
  return { uid, token: ctx.token };
}

const typeDefs = `
  type Compile {
    id: String!
    timestamp: String!
    status: String!
    lang: String
  }

  type Task {
    id: String!
    lang: String!
    code: String!
    src: String!
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
    isPublic: Boolean
    created: String!
    updated: String
    sharedWith: [String]
    app: String
    task: Task
  }

  type GeneratedCode {
    src: String
    taskId: String
    description: String
    changeSummary: String
    language: String
    model: String
    usage: UsageInfo
    errors: [CodeError]
  }

  type CodeError {
    message: String!
    from: Int
    to: Int
  }

  type ParseResult {
    code: String
    errors: [CodeError]
  }

  type UsageInfo {
    input_tokens: Int
    output_tokens: Int
  }

  type Language {
    id: String!
    name: String!
    description: String!
    domains: [String!]!
  }

  type ReactComponent {
    package: String!
    component: String!
    styleImport: String
  }

  type ExamplePrompt {
    prompt: String!
    produces: String
    notes: String
  }

  type LanguageInfo {
    id: String!
    name: String!
    description: String!
    domains: [String!]!
    examples: [String!]
    reactComponent: ReactComponent
    specUrl: String!
    authoringGuide: String
    supportedItemTypes: [String!]
    examplePrompts: [ExamplePrompt!]
    userGuide: String
  }

  type CompileAllowedResponse {
    allowed: Boolean!
    reason: String
    currentUsage: Int
    totalAvailable: Int
  }

  type Query {
    checkCompileAllowed: CompileAllowedResponse!
    parse(lang: String!, src: String!, itemId: String): ParseResult!
    data(id: String!): String!
    compiles(lang: String!, type: String!): [Compile!]
    tasks(lang: String!, mark: Int!): [Task!]
    task(id: String!): Task
    items(lang: String!, mark: Int, app: String): [Item!]
    item(id: String!): Item
    languages(search: String, domain: String): [Language!]!
    language(id: String!): LanguageInfo
    itemData(id: String!): String!
  }

  type ShareItemResult {
    success: Boolean!
    message: String
    newItemId: String
  }

  type Mutation {
    logCompile(units: Int, id: String!, status: String!, timestamp: String!, data: String!): String!
    postTask(lang: String!, code: String!, ephemeral: Boolean, item: String): String!
    generateCode(prompt: String!, language: String!, options: CodeGenerationOptions, currentSrc: String, conversationSummary: ConversationSummaryInput, itemId: String): GeneratedCode!
    createItem(lang: String!, name: String, taskId: String, mark: Int, help: String, isPublic: Boolean, app: String): Item!
    updateItem(id: String!, name: String, taskId: String, mark: Int, help: String, isPublic: Boolean): Item!
    shareItem(itemId: String!, targetUserId: String!): ShareItemResult!
  }

  input CodeGenerationOptions {
    model: String
    temperature: Float
    maxTokens: Int
  }

  input ConversationSummaryInput {
    turnCount: Int!
    previousRequests: [String!]!
    previousOutputs: [String]
  }
`;

const resolvers = {
  Query: {
    checkCompileAllowed: async (_, __, ctx) => {
      if (ctx.freePlan) {
        return { allowed: true };
      }
      const { token } = ctx;
      if (!token) {
        return { allowed: false, reason: 'Not authenticated' };
      }
      try {
        const { uid } = await client.verifyToken(token);
        return await checkCompileAllowed(uid);
      } catch (error) {
        return { allowed: false, reason: 'Authentication failed' };
      }
    },
    parse: async (_, args) => {
      const { lang, src, itemId } = args;
      const systemValues: Record<string, string> = {};
      if (itemId) systemValues.itemId = itemId;
      return await parseCode({ lang, src, systemValues });
    },
    data: async (_, args, ctx) => {
      const { id } = args;
      const auth = await resolveAuth(ctx);
      const data = await getData({ authToken: auth.token, id });
      return JSON.stringify(data);
    },
    compiles: async (_, args, ctx) => {
      if (ctx.freePlan) return [];
      const { token } = ctx;
      const { lang, type } = args;
      const { uid } = await client.verifyToken(token);
      return await compiles({ auth: { uid, token }, lang, type });
    },
    tasks: async (_, args, ctx) => {
      if (ctx.freePlan) return [];
      const { token } = ctx;
      const { lang, mark } = args;
      const { uid } = await client.verifyToken(token);
      return await getTasks({ auth: { uid, token }, lang, mark });
    },
    task: async (_, args, ctx) => {
      const { id } = args;
      const auth = await resolveAuth(ctx);
      return await getTask({ auth, id });
    },
    items: async (_, args, ctx) => {
      const { lang, mark, app } = args;
      const auth = await resolveAuth(ctx);
      return await getItems({ auth, lang, mark, app });
    },
    item: async (_, args, ctx) => {
      const { id } = args;
      const auth = await resolveAuth(ctx);
      return await getItem({ auth, id });
    },
    languages: async (_, args) => {
      const { search, domain } = args;
      return await listLanguages({ search, domain });
    },
    language: async (_, args) => {
      const { id } = args;
      return await getLanguageInfo(id);
    },
    itemData: async (_, args, ctx) => {
      const { id } = args;
      const auth = await resolveAuth(ctx);
      const item = await getItem({ auth, id });
      if (!item || !item.taskId) {
        throw new Error("Item not found or has no associated task");
      }
      const data = await getData({ authToken: auth.token, id: item.taskId });
      return JSON.stringify(data);
    },
  },
  Mutation: {
    generateCode: async (_, args, ctx) => {
      const auth = await resolveAuth(ctx);
      const { prompt, language, options, currentSrc, conversationSummary, itemId } = args;
      try {
        return await generateCode({ auth, prompt, language, options, currentSrc, conversationSummary, itemId });
      } catch (error) {
        if (error instanceof FreePlanError) throw error;
        console.error("Error in generateCode mutation:", error);
        throw error;
      }
    },

    postTask: async (_, args, ctx) => {
      const { lang, code: codeStr, ephemeral, item } = args;
      const auth = await resolveAuth(ctx);
      const code = JSON.parse(codeStr);
      const task: Record<string, unknown> = { lang, code };
      if (item) {
        task.item = item;
      }
      const { id } = await postTask({ auth, task, ephemeral: ephemeral || auth.freePlan, isPublic: false });
      return id;
    },
    logCompile: async (_, args, ctx) => {
      const { units, id, timestamp, status, data } = args;
      console.log(
        "logCompile()",
        "units=" + units,
      );
      if (ctx.freePlan) {
        return JSON.stringify({ success: true });
      }
      const { token } = ctx;
      const { uid } = await client.verifyToken(token);
      const resp = await logCompile({ auth: { uid, token }, units, id, timestamp, status, data });
      return resp;
    },
    createItem: async (_, args, ctx) => {
      const { lang, name, taskId, mark, help, isPublic, app } = args;
      const auth = await resolveAuth(ctx);
      return await createItem({ auth, lang, name, taskId, mark, help, isPublic, app });
    },
    updateItem: async (_, args, ctx) => {
      const { id, name, taskId, mark, help, isPublic } = args;
      const auth = await resolveAuth(ctx);
      return await updateItem({ auth, id, name, taskId, mark, help, isPublic });
    },
    shareItem: async (_, args, ctx) => {
      if (ctx.freePlan) {
        throw new Error("Sharing requires a full account.");
      }
      const { token } = ctx;
      const { itemId, targetUserId } = args;
      const { uid } = await client.verifyToken(token);
      return await shareItem({ auth: { uid, token }, itemId, targetUserId });
    },
  },
  Item: {
    task: async (parent, _, ctx) => {
      if (!parent?.taskId) return null;
      const auth = await resolveAuth(ctx);
      return await getTask({ auth, id: parent.taskId });
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Free-Plan-Session");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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
    const freePlan = isFreePlanRequest(req);
    const { operationName, query, variables } = getGraphQLParameters(request);
    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema,
      contextFactory: () => ({
        token: req.headers.authorization,
        freePlan: freePlan.freePlan,
        sessionUuid: freePlan.freePlan ? freePlan.sessionUuid : undefined,
        sessionNamespace: freePlan.freePlan ? freePlan.sessionNamespace : undefined,
      }),
    });
    sendResult(result, res);
  }
}
