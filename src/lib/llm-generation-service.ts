/**
 * Provider-neutral long-form generation with continuation and one-shot
 * cross-provider failover. A fallback always restarts the full generation so
 * output from different providers is never spliced together.
 */

import axios from "axios";
import OpenAI from "openai";
import {
  GenerationRoute,
  GenerationTier,
  LlmProvider,
  modelForProvider,
  modelRejectsTemperature,
  modelSupportsEffort,
  resolveGenerationRoute,
} from "./llm-models";

export interface StreamOptions {
  /** Language id — selects the family ordering. Not caller-selectable beyond this. */
  lang?: string | number | null;
  tier?: GenerationTier;
  /** Internal/eval model pin. No GraphQL field maps here — see GenerationRouteInput. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxContinuations?: number;
  thinking?: unknown;
  effort?: string;
  /**
   * Per-call timeout. Generation wants the long default (a program can take
   * 60-110s); an observer like the judge wants a much shorter leash, since a
   * hung judge would stall the run it is only scoring. Falls back to
   * CODEGEN_PROVIDER_TIMEOUT_MS.
   */
  timeoutMs?: number;
  /**
   * Wall-clock deadline (epoch ms) for the WHOLE generation, continuation loop
   * included. Created once per request and threaded down, so the repair loop and
   * provider failover can't each start a fresh budget.
   */
  deadlineAt?: number;
  /** Cumulative output-token ceiling across every continuation chunk. */
  maxOutputTokensTotal?: number;
}

export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export type SystemPrompt = string | SystemBlock[];

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  /**
   * Reasoning tokens, where the provider reports them separately (OpenAI's
   * output_tokens_details.reasoning_tokens; 0 on Anthropic, which does not break
   * thinking out of output_tokens).
   *
   * This is a SUBSET of outputTokens, not an addition to it — OpenAI bills
   * reasoning at the output rate and includes it in output_tokens, so adding it
   * again would double-count. It is tracked only so cost-per-success can be
   * attributed across effort levels; do not fold it into a total.
   */
  reasoningTokens: number;
}

export interface GenerationAttempt {
  provider: LlmProvider;
  model: string;
  success: boolean;
  latencyMs: number;
  status?: number;
  code?: string;
  reason?: string;
  error?: string;
}

interface ProviderRequestResult {
  content: string;
  usage: TokenUsage;
  stopReason?: string;
  failure?: ProviderFailure;
}

interface LongGenerationResult {
  content: string;
  usage: TokenUsage;
  chunks: number;
  failure?: ProviderFailure;
  /**
   * Why the continuation loop stopped short, if it did. Absent means the model
   * finished on its own terms.
   *
   * Load-bearing for measurement: without it "we cut a runaway" and "we cut a
   * good run" are the same event, and the caps below can't be tuned.
   */
  stopEarly?: "deadline" | "output_budget" | "restart" | "no_growth";
}

interface ClaudeStreamEvent {
  type: "content" | "usage" | "complete" | "error";
  content?: string;
  stopReason?: string;
  error?: string;
  code?: string;
  usage?: TokenUsage;
}

class ProviderFailure extends Error {
  readonly provider: LlmProvider;
  readonly failoverable: boolean;
  readonly status?: number;
  readonly code?: string;
  readonly reason?: string;

  constructor(
    message: string,
    provider: LlmProvider,
    failoverable: boolean,
    status?: number,
    code?: string,
    reason?: string,
  ) {
    super(message);
    this.name = "ProviderFailure";
    this.provider = provider;
    this.failoverable = failoverable;
    this.status = status;
    this.code = code;
    this.reason = reason;
  }
}

const EMPTY_USAGE = (): TokenUsage => ({
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationInputTokens: 0,
  cacheReadInputTokens: 0,
  reasoningTokens: 0,
});

const providerCircuit = new Map<
  LlmProvider,
  { failures: number; openUntil: number }
>();

function configuredNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function providerTimeoutMs(): number {
  return configuredNumber("CODEGEN_PROVIDER_TIMEOUT_MS", 180_000);
}

/**
 * How long a live stream may go without delivering a byte before we abort it.
 *
 * This is NOT redundant with `providerTimeoutMs`. Both providers are called with
 * streaming responses, and a stream timeout covers time-to-RESPONSE-HEADERS
 * only: once the first SSE byte arrives, `for await (const chunk of ...)` has no
 * deadline of any kind. A stream that opens and then goes silent hangs until
 * something upstream gives up.
 *
 * That is not hypothetical — three production runs on 2026-08-23/28 ran ~1800s
 * and returned ZERO output tokens, which no token-budget or chunk-count cap can
 * explain or stop. Only aborting the read does.
 *
 * 30s: the widest observed healthy inter-chunk gap is far below this (streams
 * deliver continuously at 60-140 tok/s once started), so this can only fire on a
 * genuinely dead stream.
 *
 * "ONCE STARTED" is doing all the work in that sentence, and applying the same
 * number BEFORE the first byte was a bug. Extended thinking emits no stream data
 * while it thinks, and claude-sonnet-5 thinks by default — so on a long prescriptive
 * prompt the first token can be well over 30s away and the watchdog aborted a
 * perfectly healthy generation. Measured 2026-09-01 on a 2751-char case: 0/2 runs at
 * 30s (both `outputTokens: 0`), 2/2 first-pass at 120s, nothing else changed.
 */
function streamStallMs(): number {
  return configuredNumber("CODEGEN_STREAM_STALL_MS", 30_000);
}

/**
 * How long to wait for the FIRST byte, which is a different question.
 *
 * This window covers queueing, prompt ingestion and the whole thinking phase, none
 * of which produce stream data. It has to be generous enough for the slowest
 * legitimate request — the ones an agent actually sends, where a short user ask has
 * been expanded into a 2-3KB layout spec — while still bounding the ~1800s
 * zero-token hangs that motivated the watchdog in the first place.
 *
 * Separate from the inter-chunk threshold on purpose: keeping the tight 30s for a
 * stream that has already started is what still catches a genuinely dead stream
 * mid-answer, which a single blunt timeout large enough for thinking would not.
 */
function firstTokenMs(): number {
  return configuredNumber("CODEGEN_FIRST_TOKEN_MS", 180_000);
}

function circuitIsOpen(provider: LlmProvider): boolean {
  const state = providerCircuit.get(provider);
  return !!state && state.openUntil > Date.now();
}

function noteProviderSuccess(provider: LlmProvider): void {
  providerCircuit.delete(provider);
}

function noteProviderFailure(failure: ProviderFailure): void {
  if (!failure.failoverable) return;
  const threshold = configuredNumber("CODEGEN_CIRCUIT_FAILURE_THRESHOLD", 2);
  const cooldownMs = configuredNumber("CODEGEN_CIRCUIT_COOLDOWN_MS", 30_000);
  const current = providerCircuit.get(failure.provider) || {
    failures: 0,
    openUntil: 0,
  };
  const failures = current.failures + 1;
  providerCircuit.set(failure.provider, {
    failures,
    openUntil: failures >= threshold ? Date.now() + cooldownMs : 0,
  });
}

function failoverableProviderError({
  status,
  code,
  message,
}: {
  status?: number;
  code?: string;
  message?: string;
}): boolean {
  const normalized = `${code || ""} ${message || ""}`.toLowerCase();
  // BEFORE the deny list, and deliberately so — this is the one invalid_request that
  // must fail over.
  //
  // A model rejecting a PARAMETER says nothing about the request being wrong; it says
  // this model's surface does not carry that knob. The other family is a different
  // model with a different surface, so the fallback is not a retry of a doomed call —
  // it is the one case where we know the second attempt is materially different.
  //
  // The case that motivated this: `output_config.effort` sent to Haiku 4.5 returned
  // `invalid_request_error: "This model does not support the effort parameter."`, the
  // clause below matched `invalid[_ -]?request` first, and L0176 hard-failed with
  // `openai+balanced` sitting unused in its priority list. modelSupportsEffort now stops
  // that request being built at all; this stops the NEXT one costing a language.
  //
  // Narrow on purpose. Blanket-failing-over every 400 would send over-length prompts and
  // safety refusals to the second provider to fail identically, doubling latency and
  // spend on requests that cannot succeed anywhere.
  if (
    /(does not support|not supported|unsupported|unrecognized)[^.]{0,40}(parameter|field|argument|property|for this model|on this model|with this model)/i.test(
      normalized,
    ) ||
    /(unsupported|unknown|invalid)_(parameter|value)/i.test(normalized)
  ) {
    return true;
  }
  if (
    /(content[_ -]?filter|safety|refusal|context[_ -]?length|too many tokens|invalid[_ -]?request)/i.test(
      normalized,
    )
  ) {
    return false;
  }
  if (
    /(missing_credentials|timeout|timed out|econnreset|econnrefused|enotfound|network|socket hang up|overloaded|server_error|rate_limit|temporarily_unavailable|model_not_found|invalid_api_key|authentication|permission|insufficient_quota)/i.test(
      normalized,
    )
  ) {
    return true;
  }
  return (
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 408 ||
    status === 409 ||
    status === 429 ||
    (typeof status === "number" && status >= 500)
  );
}

function flattenSystemPrompt(systemPrompt?: SystemPrompt): string | undefined {
  if (typeof systemPrompt === "string") return systemPrompt;
  if (Array.isArray(systemPrompt)) {
    return systemPrompt.map((block) => block.text).join("\n\n");
  }
  return undefined;
}

/**
 * First non-empty line of a block, normalized. Shared by the continuation loop
 * and assembleProgram so "did this chunk restart" has exactly one definition.
 */
function firstCodeLine(value: string): string {
  return (value.split("\n").find((line) => line.trim()) || "")
    .replace(/\s+/g, " ")
    .trim();
}

/** One chunk re-opening the program the previous one began. */
function isRestartLine(first: string, next: string): boolean {
  return (
    first.length >= 8 &&
    next.length >= 8 &&
    (first.startsWith(next) || next.startsWith(first))
  );
}

/**
 * Whether the accumulated content ends in Graffiticode's `..` terminator.
 *
 * Checks the LAST FENCED BLOCK, and falls back to the raw tail when fence
 * parsing yields nothing usable. The subtlety: this runs over the CONCATENATION
 * of every continuation chunk, and a model asked to "continue" routinely re-opens
 * its own ``` fence. That opener then parses as the previous block's CLOSER,
 * every later block mis-segments, and the final block is a fragment that cannot
 * end in `..` no matter what the model wrote. `needsContinuation` would then loop
 * to the cap on a program that finished — consistent with 89,486 output tokens
 * for a program worth a few thousand.
 *
 * Checking the trimmed tail of the whole content as a fallback is immune to fence
 * mis-segmentation: if the last thing the model emitted is `..`, it terminated.
 */
function programIsTerminated(content: string): boolean {
  // Strip trailing whitespace and any closing fence, then ask whether the last
  // thing the model actually wrote was the terminator. Immune to fence
  // mis-segmentation, because it never needs to know where blocks begin.
  const tail = content
    .replace(/\s*```[\w]*\s*$/, "")
    .trimEnd();
  if (tail.endsWith("..")) return true;
  // Original behavior, kept as the fallback for content that ends in prose after
  // the program. Deliberately the LAST block only, not any block: `..` can occur
  // inside a program's data, so an early match is not proof of termination.
  const blocks = extractCodeBlocks(content);
  const lastBlock = blocks.length ? blocks[blocks.length - 1] : content;
  return lastBlock.trimEnd().endsWith("..");
}

function needsContinuation(content: string, stopReason?: string): boolean {
  if (stopReason) {
    return stopReason === "max_tokens" && !programIsTerminated(content);
  }
  const fenceCount = (content.match(/```/g) || []).length;
  return (
    fenceCount % 2 !== 0 ||
    (fenceCount > 0 && !programIsTerminated(content))
  );
}

class ClaudeStreamParser {
  private buffer = "";

  parseChunk(chunk: string): ClaudeStreamEvent[] {
    this.buffer += chunk;
    const events: ClaudeStreamEvent[] = [];
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") {
        events.push({ type: "complete" });
        continue;
      }
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta") {
          events.push({
            type: "content",
            content: parsed.delta?.text || "",
          });
        } else if (parsed.type === "message_start" && parsed.message?.usage) {
          const usage = parsed.message.usage;
          events.push({
            type: "usage",
            usage: {
              inputTokens: usage.input_tokens || 0,
              outputTokens: 0,
              cacheCreationInputTokens:
                usage.cache_creation_input_tokens || 0,
              cacheReadInputTokens: usage.cache_read_input_tokens || 0,
              // Anthropic bills thinking inside output_tokens and does not break
              // it out, so there is nothing to attribute here.
              reasoningTokens: 0,
            },
          });
        } else if (parsed.type === "message_delta") {
          if (parsed.usage) {
            events.push({
              type: "usage",
              usage: {
                inputTokens: 0,
                outputTokens: parsed.usage.output_tokens || 0,
                cacheCreationInputTokens: 0,
                cacheReadInputTokens: 0,
                reasoningTokens: 0,
              },
            });
          }
          if (parsed.delta?.stop_reason) {
            events.push({
              type: "complete",
              stopReason: parsed.delta.stop_reason,
            });
          }
        } else if (parsed.type === "error") {
          events.push({
            type: "error",
            error: parsed.error?.message || "Unknown Anthropic stream error",
            code: parsed.error?.type,
          });
        }
      } catch {
        console.warn("[llm-generation] Ignoring malformed Anthropic SSE event");
      }
    }
    return events;
  }
}

async function readAxiosErrorBody(data: unknown): Promise<string> {
  try {
    if (
      data &&
      typeof (data as { [Symbol.asyncIterator]?: unknown })[
        Symbol.asyncIterator
      ] === "function"
    ) {
      let body = "";
      for await (const chunk of data as AsyncIterable<Buffer | string>) {
        body += chunk.toString();
      }
      return body;
    }
    if (typeof data === "string") return data;
    return data ? JSON.stringify(data) : "";
  } catch {
    return "";
  }
}

async function requestAnthropic({
  model,
  systemPrompt,
  messages,
  options,
  onChunk,
}: {
  model: string;
  systemPrompt?: SystemPrompt;
  messages: Array<{ role: string; content: string }>;
  options: StreamOptions;
  onChunk?: (chunk: string) => void;
}): Promise<ProviderRequestResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      content: "",
      usage: EMPTY_USAGE(),
      failure: new ProviderFailure(
        "ANTHROPIC_API_KEY is not configured",
        "anthropic",
        true,
        undefined,
        "missing_credentials",
        "missing_credentials",
      ),
    };
  }

  const usage = EMPTY_USAGE();
  let content = "";
  let stopReason: string | undefined;
  // Aborts the stream read itself. `timeout` below cannot: with
  // responseType:"stream" it bounds only the wait for headers. See streamStallMs().
  const controller = new AbortController();
  let stalled = false;
  let watchdog: NodeJS.Timeout | undefined;
  // Two thresholds, not one: the generous window applies until the first CONTENT
  // token, the tight one between content chunks thereafter. Keyed on content and
  // not on raw stream activity — the SSE stream sends message_start and
  // thinking-block events immediately, so "some bytes arrived" goes true long
  // before the model has written anything and put the tight threshold back in
  // front of the thinking phase. Measured: keying on raw chunks still failed 0/2
  // with "between chunks". See firstTokenMs().
  let sawData = false;
  const armWatchdog = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      stalled = true;
      controller.abort();
    }, sawData ? streamStallMs() : firstTokenMs());
  };
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model,
        system: systemPrompt,
        messages,
        max_tokens: options.maxTokens || 4096,
        ...(modelRejectsTemperature(model)
          ? {}
          : { temperature: options.temperature ?? 0.2 }),
        ...(options.thinking !== undefined
          ? { thinking: options.thinking }
          : {}),
        // Gated on the MODEL, exactly like temperature three lines up: Haiku 4.5
        // (ANTHROPIC_MODELS.FAST) 400s on `output_config.effort`, so a global
        // CODEGEN_EFFORT would otherwise take down every language routed to the
        // fast tier. See modelSupportsEffort.
        ...(options.effort !== undefined && modelSupportsEffort(model)
          ? { output_config: { effort: options.effort } }
          : {}),
        stream: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        responseType: "stream",
        timeout: options.timeoutMs || providerTimeoutMs(),
        signal: controller.signal,
      },
    );

    const parser = new ClaudeStreamParser();
    armWatchdog();
    for await (const chunk of response.data) {
      armWatchdog();
      for (const event of parser.parseChunk(chunk.toString())) {
        if (event.type === "content" && event.content) {
          sawData = true;
          content += event.content;
          onChunk?.(event.content);
        } else if (event.type === "usage" && event.usage) {
          usage.inputTokens += event.usage.inputTokens;
          usage.outputTokens += event.usage.outputTokens;
          usage.cacheCreationInputTokens +=
            event.usage.cacheCreationInputTokens;
          usage.cacheReadInputTokens += event.usage.cacheReadInputTokens;
          usage.reasoningTokens += event.usage.reasoningTokens;
        } else if (event.type === "complete" && event.stopReason) {
          stopReason = event.stopReason;
        } else if (event.type === "error") {
          const message = event.error || "Anthropic stream failed";
          return {
            content,
            usage,
            failure: new ProviderFailure(
              message,
              "anthropic",
              failoverableProviderError({
                code: event.code,
                message,
              }),
              undefined,
              event.code,
              "stream_error",
            ),
          };
        }
      }
    }
    return { content, usage, stopReason };
  } catch (error: any) {
    if (stalled) {
      // Failoverable: the stream died, the request itself was well-formed, and
      // the other provider deserves a turn. Content generated before the stall
      // is returned rather than discarded.
      return {
        content,
        usage,
        failure: new ProviderFailure(
          `Anthropic stream stalled: no data for ${sawData ? streamStallMs() : firstTokenMs()}ms ${sawData ? "between chunks" : "before the first byte"}`,
          "anthropic",
          true,
          undefined,
          "stream_stalled",
          "stream_stalled",
        ),
      };
    }
    const status = error.response?.status as number | undefined;
    const body = await readAxiosErrorBody(error.response?.data);
    const code =
      error.code ||
      (() => {
        try {
          return JSON.parse(body)?.error?.type;
        } catch {
          return undefined;
        }
      })();
    const message = body || error.message || "Anthropic request failed";
    return {
      content,
      usage,
      failure: new ProviderFailure(
        `Anthropic request failed${status ? ` (${status})` : ""}: ${message}`,
        "anthropic",
        failoverableProviderError({ status, code, message }),
        status,
        code,
        "request_error",
      ),
    };
  } finally {
    // Every exit path, or a pending timer keeps the process awake and can abort
    // a controller nobody is reading any more.
    clearTimeout(watchdog);
  }
}

let openAIClient: OpenAI | undefined;

function getOpenAIClient(): OpenAI | undefined {
  if (!process.env.OPENAI_API_KEY) return undefined;
  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 0,
      timeout: providerTimeoutMs(),
    });
  }
  return openAIClient;
}

async function requestOpenAI({
  model,
  systemPrompt,
  messages,
  options,
  onChunk,
}: {
  model: string;
  systemPrompt?: SystemPrompt;
  messages: Array<{ role: string; content: string }>;
  options: StreamOptions;
  onChunk?: (chunk: string) => void;
}): Promise<ProviderRequestResult> {
  const client = getOpenAIClient();
  if (!client) {
    return {
      content: "",
      usage: EMPTY_USAGE(),
      failure: new ProviderFailure(
        "OPENAI_API_KEY is not configured",
        "openai",
        true,
        undefined,
        "missing_credentials",
        "missing_credentials",
      ),
    };
  }

  let content = "";
  let response: any;
  let refusal = "";
  let streamError: { message: string; code?: string } | undefined;
  // Same reasoning as the Anthropic path: the SDK timeout does not bound the
  // async iteration over a stream that has already started. See streamStallMs().
  const controller = new AbortController();
  let stalled = false;
  let watchdog: NodeJS.Timeout | undefined;
  // Two thresholds, not one: the generous window applies until the first CONTENT
  // token, the tight one between content chunks thereafter. Keyed on content and
  // not on raw stream activity — the SSE stream sends message_start and
  // thinking-block events immediately, so "some bytes arrived" goes true long
  // before the model has written anything and put the tight threshold back in
  // front of the thinking phase. Measured: keying on raw chunks still failed 0/2
  // with "between chunks". See firstTokenMs().
  let sawData = false;
  const armWatchdog = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      stalled = true;
      controller.abort();
    }, sawData ? streamStallMs() : firstTokenMs());
  };
  try {
    // The installed SDK predates GPT-5.6 model ids and its expanded reasoning
    // effort union. The request shape is current Responses API, so keep this
    // narrow cast at the version boundary rather than weakening application
    // types.
    const request: any = {
      model,
      instructions: flattenSystemPrompt(systemPrompt),
      input: messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
      max_output_tokens: options.maxTokens || 4096,
      stream: true,
      store: false,
      ...(modelRejectsTemperature(model) ||
      options.temperature === undefined
        ? {}
        : { temperature: options.temperature }),
      ...(options.effort && modelSupportsEffort(model)
        ? { reasoning: { effort: options.effort } }
        : {}),
    };
    // Per-request timeout override: the client is cached and carries the long
    // generation default, so a short-leash caller (the judge) passes its own here
    // rather than getting the 180s one.
    const stream = await client.responses.create(request, {
      signal: controller.signal,
      ...(options.timeoutMs ? { timeout: options.timeoutMs } : {}),
    });

    armWatchdog();
    for await (const event of stream as any) {
      armWatchdog();
      if (event.type === "response.output_text.delta") {
        const delta = event.delta || "";
        sawData = true;
        content += delta;
        onChunk?.(delta);
      } else if (event.type === "response.refusal.delta") {
        refusal += event.delta || "";
      } else if (
        event.type === "response.completed" ||
        event.type === "response.incomplete" ||
        event.type === "response.failed"
      ) {
        response = event.response;
      } else if (event.type === "error") {
        streamError = {
          message: event.message || "OpenAI stream failed",
          code: event.code || undefined,
        };
      }
    }

    if (streamError) {
      throw Object.assign(new Error(streamError.message), {
        code: streamError.code,
      });
    }
    if (response?.error) {
      throw Object.assign(
        new Error(response.error.message || "OpenAI response failed"),
        { code: response.error.code },
      );
    }
    if (refusal) {
      return {
        content,
        usage: EMPTY_USAGE(),
        failure: new ProviderFailure(
          `OpenAI refused the request: ${refusal}`,
          "openai",
          false,
          undefined,
          "refusal",
          "refusal",
        ),
      };
    }

    const reported = response?.usage;
    const cachedTokens =
      reported?.input_tokens_details?.cached_tokens || 0;
    const cacheWriteTokens =
      reported?.input_tokens_details?.cache_write_tokens ||
      reported?.cache_write_tokens ||
      0;
    const usage: TokenUsage = {
      // OpenAI reports cached input inside input_tokens; normalize to the
      // disjoint convention used by the rest of the application.
      inputTokens: Math.max(
        0,
        (reported?.input_tokens || 0) - cachedTokens - cacheWriteTokens,
      ),
      // Includes reasoning tokens, which OpenAI bills at the output rate. Kept
      // whole so the cost is right; the reasoning share is reported separately
      // below for attribution only.
      outputTokens: reported?.output_tokens || 0,
      cacheCreationInputTokens: cacheWriteTokens,
      cacheReadInputTokens: cachedTokens,
      reasoningTokens:
        reported?.output_tokens_details?.reasoning_tokens || 0,
    };
    const incompleteReason = response?.incomplete_details?.reason;
    if (response?.status === "failed") {
      return {
        content,
        usage,
        failure: new ProviderFailure(
          "OpenAI response failed",
          "openai",
          false,
          undefined,
          response?.error?.code,
          "response_failed",
        ),
      };
    }
    if (
      incompleteReason &&
      incompleteReason !== "max_output_tokens"
    ) {
      const message = `OpenAI response incomplete: ${incompleteReason}`;
      return {
        content,
        usage,
        failure: new ProviderFailure(
          message,
          "openai",
          false,
          undefined,
          incompleteReason,
          "response_incomplete",
        ),
      };
    }
    return {
      content,
      usage,
      stopReason:
        incompleteReason === "max_output_tokens"
          ? "max_tokens"
          : "end_turn",
    };
  } catch (error: any) {
    if (stalled) {
      return {
        content,
        usage: EMPTY_USAGE(),
        failure: new ProviderFailure(
          `OpenAI stream stalled: no data for ${sawData ? streamStallMs() : firstTokenMs()}ms ${sawData ? "between chunks" : "before the first byte"}`,
          "openai",
          true,
          undefined,
          "stream_stalled",
          "stream_stalled",
        ),
      };
    }
    const status = error.status as number | undefined;
    const code = error.code || error.error?.code;
    const message = error.message || "OpenAI request failed";
    return {
      content,
      usage: EMPTY_USAGE(),
      failure: new ProviderFailure(
        `OpenAI request failed${status ? ` (${status})` : ""}: ${message}`,
        "openai",
        failoverableProviderError({ status, code, message }),
        status,
        code,
        "request_error",
      ),
    };
  } finally {
    clearTimeout(watchdog);
  }
}

async function requestProvider(
  provider: LlmProvider,
  args: Parameters<typeof requestAnthropic>[0],
): Promise<ProviderRequestResult> {
  return provider === "openai"
    ? requestOpenAI(args)
    : requestAnthropic(args);
}

/**
 * One provider call, raw text back — no continuation loop, no code-block
 * extraction, no program assembly.
 *
 * This is the seam for provider-neutral callers that are NOT generating a
 * program: the LLM judge, and anything else that wants a single scored/parsed
 * response. Generation should keep using generateCodeWithContinuation, which
 * adds the continuation and assembly this deliberately omits.
 *
 * Returns `{ content, usage, failure }` rather than throwing, matching the
 * adapters — a judge that throws would take down the request it was observing.
 */
export async function completeOnce({
  provider,
  model,
  systemPrompt,
  messages,
  options = {},
}: {
  provider: LlmProvider;
  model: string;
  systemPrompt?: SystemPrompt;
  messages: Array<{ role: string; content: string }>;
  options?: StreamOptions;
}): Promise<{ content: string; usage: TokenUsage; failure?: ProviderFailure }> {
  const result = await requestProvider(provider, {
    model,
    systemPrompt,
    messages,
    options,
  });
  return {
    content: result.content,
    usage: result.usage,
    failure: result.failure,
  };
}

async function generateLongCode({
  provider,
  model,
  prompt,
  systemPrompt,
  messages = [],
  options = {},
  onChunk,
}: {
  provider: LlmProvider;
  model: string;
  prompt?: string;
  systemPrompt?: SystemPrompt;
  messages?: Array<{ role: string; content: string }>;
  options?: StreamOptions;
  onChunk?: (chunk: string) => void;
}): Promise<LongGenerationResult> {
  const maxContinuations = options.maxContinuations || 10;
  const conversationHistory = [...messages];
  const usage = EMPTY_USAGE();
  let fullContent = "";
  let chunks = 0;
  let stopEarly: LongGenerationResult["stopEarly"];
  // Budgets for the WHOLE loop. Each chunk was already bounded (16k tokens,
  // 180s); nothing bounded their product, which is how a run reached 60,828
  // tokens over 9.5 minutes with every individual chunk behaving normally.
  // The EARLIER of this generation's own budget and the request-wide deadline.
  // Not `??`: the request deadline (420s) is longer than the per-generation one
  // (240s), so preferring it would quietly widen the bound this loop exists to
  // enforce. One generation never gets the whole request's budget, and no
  // generation outlives the request either.
  const generationDeadline =
    Date.now() + configuredNumber("CODEGEN_GENERATION_BUDGET_MS", 240_000);
  const deadlineAt = options.deadlineAt
    ? Math.min(options.deadlineAt, generationDeadline)
    : generationDeadline;
  const maxOutputTokensTotal =
    options.maxOutputTokensTotal ??
    configuredNumber("CODEGEN_MAX_OUTPUT_TOKENS_TOTAL", 40_000);
  let firstChunkLine = "";
  let lowGrowthStreak = 0;

  if (prompt) {
    conversationHistory.push({ role: "user", content: prompt });
  }

  while (chunks < maxContinuations) {
    if (Date.now() >= deadlineAt) {
      stopEarly = "deadline";
      break;
    }
    const result = await requestProvider(provider, {
      model,
      systemPrompt,
      messages: conversationHistory,
      options: {
        ...options,
        // Never let the last chunk overrun the budget it is being measured against.
        timeoutMs: Math.max(
          1_000,
          Math.min(
            options.timeoutMs || providerTimeoutMs(),
            deadlineAt - Date.now(),
          ),
        ),
      },
      onChunk,
    });
    chunks += 1;
    usage.inputTokens += result.usage.inputTokens;
    usage.outputTokens += result.usage.outputTokens;
    usage.cacheCreationInputTokens +=
      result.usage.cacheCreationInputTokens;
    usage.cacheReadInputTokens += result.usage.cacheReadInputTokens;
    usage.reasoningTokens += result.usage.reasoningTokens;

    if (result.failure) {
      return {
        content: fullContent + result.content,
        usage,
        chunks,
        failure: result.failure,
      };
    }

    const grew = result.content.trim().length;
    fullContent += result.content;
    if (!needsContinuation(fullContent, result.stopReason)) break;

    // --- Non-convergence guards -------------------------------------------
    // A chunk that hits max_tokens AND makes no progress will not make progress
    // on the next turn either; continuing just buys another 16k tokens of the
    // same. These are the cheapest signals that distinguish "writing a big
    // program" from "going in circles".
    const line = firstCodeLine(result.content.replace(/^\s*```[\w]*\n?/, ""));
    if (!firstChunkLine) {
      firstChunkLine = line;
    } else if (line && isRestartLine(firstChunkLine, line)) {
      // The model started the program over instead of continuing it. Whatever it
      // produces now replaces what came before, so the earlier chunks were pure
      // cost. Every L0179 program opens with `sheets [`, so this is the common
      // shape for the spreadsheet runaways.
      stopEarly = "restart";
      break;
    }
    if (grew < 200) {
      if (++lowGrowthStreak >= 2) {
        stopEarly = "no_growth";
        break;
      }
    } else {
      lowGrowthStreak = 0;
    }
    if (usage.outputTokens >= maxOutputTokensTotal) {
      stopEarly = "output_budget";
      break;
    }
    if (Date.now() >= deadlineAt) {
      stopEarly = "deadline";
      break;
    }

    console.log(
      `[llm-generation] provider=${provider} continuing chunk ${chunks + 1}/${maxContinuations}`,
    );
    conversationHistory.push({
      role: "assistant",
      content: result.content,
    });
    conversationHistory.push({
      role: "user",
      content: "Continue exactly where you left off. Do not repeat any content.",
    });
  }

  if (stopEarly) {
    console.log(
      `[llm-generation] provider=${provider} stopped early reason=${stopEarly} chunks=${chunks} outputTokens=${usage.outputTokens}`,
    );
  }
  return { content: fullContent, usage, chunks, stopEarly };
}

export function extractCodeBlocks(content: string): string[] {
  const codeBlockRegex = /```(?:[\w]*\n|\n)?([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push(match[1].trim());
  }
  if (blocks.length === 0 && content.trim()) {
    blocks.push(content.trim());
  }
  return blocks;
}

function assembleProgram(content: string): string {
  const codeBlocks = extractCodeBlocks(content);
  // Shared with the continuation loop's restart guard — one definition, so the
  // loop cannot decide a chunk restarted while the assembler decides it didn't.
  const firstLine = firstCodeLine;
  const isRestart = isRestartLine;
  let finalCode = "";
  let firstBlockLine = "";

  for (const block of codeBlocks) {
    if (!block.trim()) continue;
    if (
      firstBlockLine &&
      isRestart(firstBlockLine, firstLine(block))
    ) {
      finalCode = "";
    }
    if (!finalCode) firstBlockLine = firstLine(block);
    finalCode += block;
    if (finalCode.trimEnd().endsWith("..")) break;
  }
  return finalCode.trim();
}

export async function generateCodeWithContinuation({
  prompt,
  formattedPrompt,
  lang = "0000",
  currentCode = null,
  options = {},
  onProgress,
}: {
  prompt?: string;
  formattedPrompt?: string;
  lang?: string;
  currentCode?: string | null;
  options?: StreamOptions;
  onProgress?: (message: string) => void;
}): Promise<{
  code: string;
  usage: TokenUsage;
  chunks: number;
  provider: LlmProvider;
  model: string;
  tier: GenerationTier;
  /** Where the family ordering came from — see GenerationRoute.source. */
  routeSource: GenerationRoute["source"];
  /** The family ordering this call resolved to, post circuit filtering. */
  priority: LlmProvider[];
  attempts: GenerationAttempt[];
  fallbackReason?: string;
  /** Characters the model emitted in total, before assembly. */
  rawChars?: number;
  /** Set when the continuation loop cut the run short — see LongGenerationResult. */
  stopEarly?: LongGenerationResult["stopEarly"];
  error?: string;
}> {
  let systemPrompt: SystemPrompt;
  let messages: Array<{ role: string; content: string }> = [];

  if (formattedPrompt) {
    try {
      const parsed = JSON.parse(formattedPrompt);
      systemPrompt = parsed.system;
      messages = parsed.messages;
    } catch {
      console.error(
        "[llm-generation] Failed to parse formatted prompt; using it as user content",
      );
      systemPrompt = `You are a programming assistant that translates natural language into code written in Graffiticode dialect L${lang}.

Generate ONLY valid Graffiticode code. Put the code between triple backticks (\`\`\`).
Do not include any explanatory text outside the code blocks unless specifically requested.`;
      messages.push({ role: "user", content: formattedPrompt });
    }
  } else {
    systemPrompt = `You are a programming assistant that translates natural language into code written in Graffiticode dialect L${lang}.

Generate ONLY valid Graffiticode code. Put the code between triple backticks (\`\`\`).
Do not include any explanatory text outside the code blocks unless specifically requested.`;
    if (currentCode && prompt) {
      messages.push({
        role: "user",
        content: `Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nModify it to: ${prompt}`,
      });
    } else if (prompt) {
      messages.push({ role: "user", content: prompt });
    }
  }

  const route = resolveGenerationRoute(options);
  let providers = [...route.providers];
  let circuitFallbackReason: string | undefined;
  // Drop families whose circuit is open so an outage doesn't make every request
  // wait for the failing provider first. Never drop the last one — an all-open
  // list must still attempt something and report a real failure rather than
  // returning "no provider available", which tells an operator nothing.
  if (providers.length > 1) {
    const closed = providers.filter(provider => !circuitIsOpen(provider));
    if (closed.length && closed.length < providers.length) {
      circuitFallbackReason = `circuit_open_${providers
        .filter(provider => circuitIsOpen(provider))
        .join("_")}`;
      onProgress?.(
        `Skipping unavailable ${providers
          .filter(provider => circuitIsOpen(provider))
          .join(", ")} provider(s); using ${closed[0]}.`,
      );
      providers = closed;
    }
  }

  onProgress?.("Starting code generation...");
  const attempts: GenerationAttempt[] = [];
  let fallbackReason: string | undefined = circuitFallbackReason;
  let lastFailure: ProviderFailure | undefined;
  let lastProvider = providers[0];
  let lastModel =
    route.model || modelForProvider(lastProvider, route.tierByProvider?.[lastProvider] ?? route.tier);

  // At most one cross-family restart per logical call, however long the priority
  // list is: a request that has already burned a full generation on a dead
  // provider should surface that, not walk the whole list while the caller waits.
  const attemptOrder = providers.slice(0, 2);

  for (const provider of attemptOrder) {
    const model =
      route.model && providers[0] === provider
        ? route.model
        // Per-family tier from the priority table, else the route-wide default. A language
        // can run fast on its primary and balanced on its fallback.
        : modelForProvider(provider, route.tierByProvider?.[provider] ?? route.tier);
    lastProvider = provider;
    lastModel = model;
    const startedAt = Date.now();
    const result = await generateLongCode({
      provider,
      model,
      systemPrompt,
      messages,
      options: {
        ...options,
        maxTokens: options.maxTokens || 4096,
        maxContinuations: options.maxContinuations || 10,
        // Per-language effort beats the global CODEGEN_EFFORT that `options` carries.
        // Resolved here, beside the model, because the two are one decision: effort is
        // meaningless without knowing which model is about to receive it, and a model
        // with no effort dial drops it again at the send site.
        ...(route.effort ? { effort: route.effort } : {}),
      },
    });

    if (!result.failure) {
      noteProviderSuccess(provider);
      attempts.push({
        provider,
        model,
        success: true,
        latencyMs: Date.now() - startedAt,
      });
      onProgress?.(
        `Generation complete with ${provider}. Processed ${result.chunks} chunk(s).`,
      );
      return {
        code: assembleProgram(result.content),
        // Length of everything the model emitted, before assembleProgram picks
        // the surviving program out of it. Paired with the assembled code's
        // length this is the only measurement that separates "the model wrote
        // prose around the code" from "we discarded restarted chunks" — the two
        // are indistinguishable in outputTokens alone.
        rawChars: result.content.length,
        usage: result.usage,
        chunks: result.chunks,
        // Why the loop stopped short, if it did. Carried up so the [code-gen]
        // line can distinguish a bounded runaway from a clean finish.
        stopEarly: result.stopEarly,
        provider,
        model,
        // The tier that actually ran, not the route-wide default: with per-family
        // overrides those differ, and reporting the default would log `tier=balanced`
        // while serving haiku — making the log unusable for confirming a deploy.
        tier: route.tierByProvider?.[provider] ?? route.tier,
        routeSource: route.source,
        priority: providers,
        attempts,
        fallbackReason,
      };
    }

    lastFailure = result.failure;
    noteProviderFailure(result.failure);
    attempts.push({
      provider,
      model,
      success: false,
      latencyMs: Date.now() - startedAt,
      status: result.failure.status,
      code: result.failure.code,
      reason: result.failure.reason,
      error: result.failure.message,
    });

    if (!result.failure.failoverable || provider === attemptOrder.at(-1)) {
      break;
    }
    fallbackReason =
      result.failure.code ||
      result.failure.reason ||
      `status_${result.failure.status || "unknown"}`;
    onProgress?.(
      `${provider} is unavailable; restarting generation with the fallback provider.`,
    );
  }

  return {
    code: "",
    usage: EMPTY_USAGE(),
    chunks: 0,
    provider: lastProvider,
    model: lastModel,
    tier: route.tierByProvider?.[lastProvider] ?? route.tier,
    routeSource: route.source,
    priority: providers,
    attempts,
    fallbackReason,
    error: lastFailure?.message || "Code generation failed",
  };
}
