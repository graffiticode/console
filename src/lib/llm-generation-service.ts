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

function programIsTerminated(content: string): boolean {
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
        ...(options.effort !== undefined
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
      },
    );

    const parser = new ClaudeStreamParser();
    for await (const chunk of response.data) {
      for (const event of parser.parseChunk(chunk.toString())) {
        if (event.type === "content" && event.content) {
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
      ...(options.effort
        ? { reasoning: { effort: options.effort } }
        : {}),
    };
    // Per-request timeout override: the client is cached and carries the long
    // generation default, so a short-leash caller (the judge) passes its own here
    // rather than getting the 180s one.
    const stream = await client.responses.create(
      request,
      options.timeoutMs ? { timeout: options.timeoutMs } : undefined,
    );

    for await (const event of stream as any) {
      if (event.type === "response.output_text.delta") {
        const delta = event.delta || "";
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

  if (prompt) {
    conversationHistory.push({ role: "user", content: prompt });
  }

  while (chunks < maxContinuations) {
    const result = await requestProvider(provider, {
      model,
      systemPrompt,
      messages: conversationHistory,
      options,
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

    fullContent += result.content;
    if (!needsContinuation(fullContent, result.stopReason)) break;

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

  return { content: fullContent, usage, chunks };
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
  const firstLine = (value: string) =>
    (value.split("\n").find((line) => line.trim()) || "")
      .replace(/\s+/g, " ")
      .trim();
  const isRestart = (first: string, next: string) =>
    first.length >= 8 &&
    next.length >= 8 &&
    (first.startsWith(next) || next.startsWith(first));
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
    route.model || modelForProvider(lastProvider, route.tier);

  // At most one cross-family restart per logical call, however long the priority
  // list is: a request that has already burned a full generation on a dead
  // provider should surface that, not walk the whole list while the caller waits.
  const attemptOrder = providers.slice(0, 2);

  for (const provider of attemptOrder) {
    const model =
      route.model && providers[0] === provider
        ? route.model
        : modelForProvider(provider, route.tier);
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
        usage: result.usage,
        chunks: result.chunks,
        provider,
        model,
        tier: route.tier,
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
    tier: route.tier,
    routeSource: route.source,
    priority: providers,
    attempts,
    fallbackReason,
    error: lastFailure?.message || "Code generation failed",
  };
}
