// Spec generation: the inverse of code generation. Given an authored item, produce a
// precise, platform-neutral English specification of its content that any other language's
// code generator can consume as a create_item description. The canonical artifact is the AST;
// `src` is decompiled from it via @graffiticode/parser's `unparse`, which we annotate with
// per-language hints (/* ... */ comments) to orient the translator. There is deliberately no
// RAG/demonstration layer: spec-gen is a determinacy-dominated, faithfulness-critical
// read-and-verbalize, and few-shot exemplars bias toward an "average spec," risking elision of
// artifact-specific detail. Knowledge lives in two rule layers only: instructions.md (canonical
// language semantics, reused from the gen direction) and unparse-hints (node-local deltas).

import axios from "axios";
import { unparse } from "@graffiticode/parser";
import { getApiTask, getLanguageLexicon, getLanguageHints } from "./api";
import { readDialectInstructions, modelRejectsTemperature } from "./code-generation-service";

// Translation is faithfulness-critical and constrained (annotated src + instructions + the
// completeness contract fully determine the output), and get_spec sits in the hot path — so a
// small, fast model is the right fit. assertCoverage is the elision guard. Override via SPEC_MODEL.
const SPEC_MODEL = process.env.SPEC_MODEL || "claude-haiku-4-5-20251001";
const SPEC_MAX_TOKENS = 8192;

// A completeness contract, NOT a style example. A checklist enforces structure without biasing
// the model toward an average level of detail (which would induce elision).
const SPEC_DIRECTIVE = `
You are given the source of a Graffiticode item in its authoring dialect, annotated with
/* ... */ hints. Using the dialect's semantics described above, describe this item's content as
a precise, PLATFORM-NEUTRAL English specification.

Rules:
- Enumerate EVERY authored element. For an assessment: every question, and for each its stem,
  every option, the answer key, and any rationale. For a sheet: every populated cell and its
  formula. Apply the analogous completeness bar to whatever this dialect authors.
- Preserve exact authored text (passages, prompts, option text, labels) verbatim.
- Omit ONLY language-specific encoding, plumbing, internal field names, and IDs.
- Do not mention Graffiticode, the dialect, node tags, or that you are reading source.
- Output only the specification prose. No preamble, no code fences.
`.trim();

export interface SpecResult {
  spec: string;
  lang: string;
  itemId: string;
  coverage: CoverageReport;
}

export interface CoverageReport {
  checked: number;
  missing: string[];
}

interface ClaudeCallArgs {
  system: string;
  user: string;
  apiKey: string;
}

async function callClaudeForSpec({ system, user, apiKey }: ClaudeCallArgs): Promise<string> {
  const resp = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: SPEC_MODEL,
      system,
      messages: [{ role: "user", content: user }],
      max_tokens: SPEC_MAX_TOKENS,
      // Opus deprecated `temperature` — omit it there or the API 400s.
      ...(modelRejectsTemperature(SPEC_MODEL) ? {} : { temperature: 0 }),
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    },
  );
  return resp.data?.content?.[0]?.text ?? "";
}

// Collect substantial string literals from the AST pool. Short strings (keys, hex/encoding
// tokens, enum values) are skipped because the spec deliberately omits encoding; longer strings
// are very likely authored content (passages, stems, options) the spec must preserve.
const MIN_SALIENT_LEN = 16;

function collectSalientStrings(ast: any): string[] {
  const out: string[] = [];
  if (!ast || typeof ast !== "object") return out;
  for (const key of Object.keys(ast)) {
    if (key === "root") continue;
    const node = ast[key];
    if (node && typeof node === "object" && node.tag === "STR" && Array.isArray(node.elts)) {
      const v = node.elts[0];
      if (typeof v === "string" && v.trim().length >= MIN_SALIENT_LEN) {
        out.push(v);
      }
    }
  }
  return out;
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// Deterministic fidelity guard. Verifies the spec text references each salient authored string.
// Non-gating: returns a structured report so elisions are trackable ("loss is a bug"), and is
// immune to the demonstration-induced elision RAG would risk.
export function assertCoverage(spec: string, ast: any): CoverageReport {
  const salient = collectSalientStrings(ast);
  const haystack = normalize(spec);
  const missing = salient.filter((s) => !haystack.includes(normalize(s)));
  if (missing.length > 0) {
    console.warn(
      `[spec-gen] coverage: ${missing.length}/${salient.length} salient strings not found in spec`,
      missing.slice(0, 10),
    );
  }
  return { checked: salient.length, missing };
}

/**
 * Generate an English spec for a task. `taskId` may be a composition chain (`head+up1+...`);
 * we describe the head (the authored item).
 */
export async function generateSpec({ auth, taskId }: { auth: any; taskId: string }): Promise<SpecResult> {
  const apiTask = await getApiTask({ id: taskId, auth });
  const taskList = Array.isArray(apiTask) ? apiTask : [apiTask];
  const task = taskList[0] || apiTask;
  const lang = task.lang;

  const [lexicon, hints, instructions] = await Promise.all([
    getLanguageLexicon(lang),
    getLanguageHints(lang),
    readDialectInstructions(lang),
  ]);

  const annSrc = unparse(task.code, lexicon || {}, { hints });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured; cannot generate spec");
  }

  const system = `${instructions}\n\n${SPEC_DIRECTIVE}`;
  const spec = (await callClaudeForSpec({ system, user: annSrc, apiKey })).trim();
  const coverage = assertCoverage(spec, task.code);

  return { spec, lang, itemId: taskId, coverage };
}
