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
  getSpec,
  setItemGenerationStatus,
  getItemClientTags,
  shareItem,
  parseCode,
  getSecretsForUser,
  getPublicValuesForUser,
  listCredentials,
  setCredential,
  deleteCredential,
  claimFreePlanSession,
  logClaimEvent,
} from "./resolvers";
import { verifyClaimToken } from "../../lib/claim-token";
import { checkCompileAllowed } from "../../lib/usage-service";
import { listLanguages, getLanguageInfo } from "./languages";
import { client } from "../../lib/auth";
import { getCredentialsForApiKey } from "../../lib/api-credentials";
import { enqueueGenerationJob } from "../../lib/generation-queue";
import {
  FreePlanError,
  getFreePlanCredentials,
  isFreePlanRequest,
} from "../../lib/free-plan-context";

// Normalizes any inbound credential into { uid, idToken }, where idToken is
// always a Firebase ID token (or signed JWT) suitable for forwarding to
// api.graffiticode.org. Inbound can be either a Firebase ID token or a raw
// Graffiticode api key — the api-key path exchanges via the auth service.
async function authenticate(token: string): Promise<{ uid: string; idToken: string }> {
  try {
    const { uid } = await client.verifyToken(token);
    return { uid, idToken: token };
  } catch {
    const { uid, idToken } = await getCredentialsForApiKey(token);
    return { uid, idToken };
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
    const { uid, idToken } = await getFreePlanCredentials();
    return {
      uid,
      token: idToken,
      freePlan: true,
      sessionNamespace: ctx.sessionNamespace,
    };
  }
  const { uid, idToken } = await authenticate(ctx.token);
  return { uid, token: idToken };
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
    langs: [String!]
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
    taskId: String
    lang: String!
    mark: Int
    help: String
    isPublic: Boolean
    created: String!
    updated: String
    sharedWith: [String]
    client: String
    upstreamLangs: [String!]
    task: Task
    generationStatus: String
    generationError: String
    generationStartedAt: String
  }

  type GenerationJob {
    itemId: String!
    status: String!
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
    upstreamLangs: [String!]
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

  type LanguageScope {
    summary: String!
    inScope: [String!]!
    outOfScope: [String!]!
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
    usageGuide: String
    scope: LanguageScope
  }

  type CompileAllowedResponse {
    allowed: Boolean!
    reason: String
    currentUsage: Int
    totalAvailable: Int
  }

  type CredentialInfo {
    name: String!
    backend: String
    isPublic: Boolean!
    value: String
    masked: String!
    updatedAt: String!
  }

  type Query {
    checkCompileAllowed: CompileAllowedResponse!
    credentials: [CredentialInfo!]!
    parse(lang: String!, src: String!, itemId: String): ParseResult!
    data(id: String!): String!
    compiles(lang: String!, type: String!): [Compile!]
    tasks(lang: String!, mark: Int!): [Task!]
    task(id: String!): Task
    items(lang: String!, mark: Int, client: String): [Item!]
    item(id: String!): Item
    spec(id: String!): ItemSpec!
    itemClientTags(lang: String!): [String!]!
    languages(search: String, domain: String): [Language!]!
    language(id: String!): LanguageInfo
    itemData(id: String!): String!
  }

  type ShareItemResult {
    success: Boolean!
    message: String
    newItemId: String
  }

  type SpecCoverage {
    checked: Int!
    missing: [String!]!
  }

  type ItemSpec {
    spec: String!
    lang: String!
    itemId: String!
    coverage: SpecCoverage!
  }

  type ClaimedItem {
    id: String!
    lang: String!
  }

  type ClaimResult {
    transferred: Int!
    sessionNamespace: String!
    items: [ClaimedItem!]!
  }

  type Mutation {
    logCompile(units: Int, id: String!, status: String!, timestamp: String!, data: String!): String!
    postTask(lang: String!, code: String!, ephemeral: Boolean, item: String): String!
    generateCode(prompt: String!, language: String!, options: CodeGenerationOptions, currentSrc: String, conversationSummary: ConversationSummaryInput, itemId: String): GeneratedCode!
    startCodeGeneration(itemId: String, lang: String!, name: String, client: String, prompt: String!, modification: String!, currentSrc: String): GenerationJob!
    createItem(lang: String!, name: String, taskId: String, mark: Int, help: String, isPublic: Boolean, client: String, upstreamLangs: [String!]): Item!
    updateItem(id: String!, name: String, taskId: String, mark: Int, help: String, isPublic: Boolean, client: String, upstreamLangs: [String!]): Item!
    shareItem(itemId: String!, targetUserId: String!): ShareItemResult!
    claimFreePlanSession(token: String!): ClaimResult!
    setCredential(name: String!, value: String!, backend: String, isPublic: Boolean): CredentialInfo!
    deleteCredential(name: String!): Boolean!
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
        const { uid } = await authenticate(token);
        return await checkCompileAllowed(uid);
      } catch (error) {
        return { allowed: false, reason: 'Authentication failed' };
      }
    },
    parse: async (_, args, ctx) => {
      const { lang, src, itemId } = args;
      // Private secrets and public credential ids come from separate stores;
      // itemId is a system-injected public value. Auth is best-effort:
      // anonymous/free-plan parse still works, just without credentials.
      let privateValues: Record<string, string> = {};
      let publicValues: Record<string, string> = {};
      try {
        const auth = await resolveAuth(ctx);
        [privateValues, publicValues] = await Promise.all([
          getSecretsForUser(auth.uid),
          getPublicValuesForUser(auth.uid),
        ]);
      } catch {
        // not authenticated — proceed without credentials
      }
      if (itemId) publicValues.itemId = itemId;
      return await parseCode({ lang, src, privateValues, publicValues });
    },
    credentials: async (_, __, ctx) => {
      const auth = await resolveAuth(ctx);
      return await listCredentials({ auth });
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
      const { uid, idToken } = await authenticate(token);
      return await compiles({ auth: { uid, token: idToken }, lang, type });
    },
    tasks: async (_, args, ctx) => {
      if (ctx.freePlan) return [];
      const { token } = ctx;
      const { lang, mark } = args;
      const { uid, idToken } = await authenticate(token);
      return await getTasks({ auth: { uid, token: idToken }, lang, mark });
    },
    task: async (_, args, ctx) => {
      const { id } = args;
      const auth = await resolveAuth(ctx);
      return await getTask({ auth, id });
    },
    items: async (_, args, ctx) => {
      const { lang, mark, client } = args;
      const auth = await resolveAuth(ctx);
      return await getItems({ auth, lang, mark, client });
    },
    item: async (_, args, ctx) => {
      const { id } = args;
      const auth = await resolveAuth(ctx);
      return await getItem({ auth, id });
    },
    spec: async (_, args, ctx) => {
      const { id } = args;
      const auth = await resolveAuth(ctx);
      return await getSpec({ auth, id });
    },
    itemClientTags: async (_, args, ctx) => {
      const { lang } = args;
      const auth = await resolveAuth(ctx);
      return await getItemClientTags({ auth, lang });
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

    // Async generation: mark the item "generating" and enqueue a Cloud Task that
    // runs the (60-110s) generation in /api/generate-job, then return immediately.
    // Lets MCP clients with short tool-call timeouts poll get_item for completion
    // instead of holding one long call. See src/lib/generation-queue.ts.
    startCodeGeneration: async (_, args, ctx) => {
      const auth = await resolveAuth(ctx);
      const { itemId, lang, name, client, prompt, modification, currentSrc } = args;
      // Credential the worker replays to act as this caller. For free-plan we
      // re-derive fresh credentials in the worker (idTokens are short-lived and
      // dispatch can lag), so carry the session, not a baked idToken.
      const authReplay = ctx.freePlan
        ? { kind: "freePlan" as const, sessionNamespace: ctx.sessionNamespace, sessionUuid: ctx.sessionUuid }
        : { kind: "bearer" as const, token: ctx.token };

      let id = itemId;
      if (!id) {
        const shell = await createItem({ auth, lang, name, client, deferGeneration: true }) as unknown as { id: string };
        id = shell.id;
      } else {
        await setItemGenerationStatus({ auth, id, status: "generating" });
      }

      await enqueueGenerationJob({
        itemId: id,
        lang,
        prompt,
        modification,
        currentSrc,
        authReplay,
      });

      return { itemId: id, status: "generating" };
    },

    postTask: async (_, args, ctx) => {
      const { lang, code: codeStr, ephemeral, item } = args;
      const auth = await resolveAuth(ctx);
      const code = JSON.parse(codeStr);
      const task: Record<string, unknown> = { lang, code };
      if (item) {
        task.item = item;
      }
      // A task backing a public item must itself be public, else anonymous
      // viewers can't load edits. Visibility follows the item; free-plan items
      // are never public. (isPublic posts anonymously, so the task is created
      // public — no owner uid needed: public reads bypass the acl uid check.)
      let isPublic = false;
      if (item && !auth.freePlan) {
        const existing = await getItem({ auth, id: item });
        isPublic = !!existing?.isPublic;
      }
      const { id } = await postTask({ auth, task, ephemeral: ephemeral || auth.freePlan, isPublic });
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
      const { uid, idToken } = await authenticate(token);
      const resp = await logCompile({ auth: { uid, token: idToken }, units, id, timestamp, status, data });
      return resp;
    },
    createItem: async (_, args, ctx) => {
      const { lang, name, taskId, mark, help, isPublic, client, upstreamLangs } = args;
      const auth = await resolveAuth(ctx);
      return await createItem({ auth, lang, name, taskId, mark, help, isPublic, client, upstreamLangs });
    },
    updateItem: async (_, args, ctx) => {
      const { id, name, taskId, mark, help, isPublic, client, upstreamLangs } = args;
      const auth = await resolveAuth(ctx);
      return await updateItem({ auth, id, name, taskId, mark, help, isPublic, client, upstreamLangs });
    },
    shareItem: async (_, args, ctx) => {
      if (ctx.freePlan) {
        throw new Error("Sharing requires a full account.");
      }
      const { token } = ctx;
      const { itemId, targetUserId } = args;
      const { uid, idToken } = await authenticate(token);
      return await shareItem({ auth: { uid, token: idToken }, itemId, targetUserId });
    },
    claimFreePlanSession: async (_, args, ctx) => {
      // Instrument failures that happen BEFORE the transfer runs (auth, token
      // verification, credentials) — claimFreePlanSession logs its own ok/error,
      // so `enteredInner` prevents double-logging transfer-phase failures.
      let sessionNamespace: string | undefined;
      let enteredInner = false;
      try {
        if (ctx.freePlan) {
          throw new Error("Claim requires a real account, not a free-plan session.");
        }
        const { token } = ctx;
        if (!token) {
          throw new Error("Authentication required.");
        }
        const { uid, idToken } = await authenticate(token);

        let payload;
        try {
          payload = await verifyClaimToken(args.token);
        } catch (err: any) {
          throw new Error(`Invalid or expired claim link: ${err?.message || "verification failed"}`);
        }
        sessionNamespace = payload.sessionNamespace;

        const { uid: trialUid, idToken: trialIdToken } = await getFreePlanCredentials();
        enteredInner = true;
        return await claimFreePlanSession({
          auth: { uid, token: idToken },
          trialAuth: { uid: trialUid, token: trialIdToken },
          sessionNamespace: payload.sessionNamespace,
          sessionUuid: payload.sessionUuid,
        });
      } catch (err: any) {
        if (!enteredInner) {
          logClaimEvent({
            outcome: "error",
            session: sessionNamespace ?? "unverified",
            err: String(err?.message ?? err),
          });
        }
        throw err;
      }
    },
    setCredential: async (_, args, ctx) => {
      if (ctx.freePlan) {
        throw new Error("Credentials require a full account.");
      }
      const auth = await resolveAuth(ctx);
      return await setCredential({ auth, name: args.name, value: args.value, backend: args.backend, isPublic: args.isPublic });
    },
    deleteCredential: async (_, args, ctx) => {
      if (ctx.freePlan) {
        throw new Error("Credentials require a full account.");
      }
      const auth = await resolveAuth(ctx);
      return await deleteCredential({ auth, name: args.name });
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
