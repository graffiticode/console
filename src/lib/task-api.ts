// Task API primitives: parse source to an AST pool, post a task, read compiled
// data. Extracted from pages/api/resolvers.ts so the code-generation layer can
// reach them without importing a Next.js API module — resolvers.ts imports the
// generation service, so the reverse edge would be a cycle.
//
// resolvers.ts re-exports all three, so its own call sites and any external
// importer keep working unchanged.
import bent from "bent";
import { parser } from "@graffiticode/parser";
import {
  getBaseUrlForApi,
  getLanguageLexicon,
  languageOfflineMessage,
  isLanguageOfflineError,
} from "./api";
import { encrypt } from "./secret-crypto";

function buildParseCallbacks(
  { privateValues = {}, publicValues = {} }:
  { privateValues?: Record<string, string>; publicValues?: Record<string, string> } = {},
) {
  return {
    GET_VAL_PRIVATE: (name: string) => {
      return encrypt(privateValues[name] || "");
    },
    GET_VAL_PUBLIC: (name: string) => {
      const result = publicValues[name] || "";
      console.log("GET_VAL_PUBLIC()", "name:", name, "result:", result);
      return result;
    },
  };
}

export async function parseCode(
  { lang, src, privateValues = {}, publicValues = {}, accessToken }:
  { lang: string; src: string; privateValues?: Record<string, string>; publicValues?: Record<string, string>; accessToken?: string },
) {
  try {
    const lexicon = await getLanguageLexicon(lang, accessToken);
    if (!lexicon) {
      // lexicon.json couldn't be fetched — treat the language service as offline.
      return { code: null, errors: [{ message: languageOfflineMessage(lang), from: -1, to: -1 }] };
    }
    const nodePool = await parser.parse(lang, src, lexicon, buildParseCallbacks({ privateValues, publicValues }));

    // Scan the AST pool for ERROR nodes
    const errors: Array<{ message: string; from: number; to: number }> = [];
    for (const key of Object.keys(nodePool)) {
      if (key === "root") continue;
      const node = nodePool[key];
      if (node && node.tag === "ERROR") {
        // ERROR node elts: [STR_nid, NUM_nid(from), NUM_nid(to)]
        const msgNode = nodePool[node.elts[0]];
        const fromNode = nodePool[node.elts[1]];
        const toNode = nodePool[node.elts[2]];
        const message = typeof msgNode === "string" ? msgNode
          : (msgNode?.tag === "STR" ? msgNode.elts[0] : String(msgNode));
        const from = typeof fromNode === "number" ? fromNode
          : (fromNode?.tag === "NUM" ? Number(fromNode.elts[0]) : -1);
        const to = typeof toNode === "number" ? toNode
          : (toNode?.tag === "NUM" ? Number(toNode.elts[0]) : -1);
        errors.push({ message, from, to });
      }
    }

    if (errors.length > 0) {
      return { code: null, errors };
    }
    return { code: JSON.stringify(nodePool), errors: null };
  } catch (err) {
    if (isLanguageOfflineError(err)) {
      return { code: null, errors: [{ message: languageOfflineMessage(lang), from: -1, to: -1 }] };
    }
    return { code: null, errors: [{ message: err.message || "Parse error", from: -1, to: -1 }] };
  }
}

const postApiJSON = bent(getBaseUrlForApi(), "POST", "json");

export async function postTask({ auth, task, ephemeral, isPublic }) {
  try {
    const storageType = (ephemeral && "ephemeral") || "persistent";
    const headers = {
      Authorization: auth.token,
      "x-graffiticode-storage-type": storageType,
    };
    if (isPublic) {
      delete headers.Authorization;
    }
    const { data } = await postApiJSON("/task", { task }, headers);
    return data;
  } catch (x) {
    console.error("postTask()", "ERROR", x);
    const message = x && typeof x === "object" && "message" in x
      ? String((x as { message: unknown }).message)
      : "task post failed";
    throw new Error(`postTask: ${message}`);
  }
}

export async function getData({ authToken, id }) {
  try {
    const baseUrl = getBaseUrlForApi();
    const get = bent(baseUrl, "GET", "json", 200);
    const resp = await get(`/data?id=${id}&access_token=${authToken}`);
    console.log(
      "getData()",
      "resp.data=" + JSON.stringify(resp.data, null, 2),
    );
    return resp.data;
  } catch (x) {
    console.log("getData()", "ERROR", x);
  }
}
