/**
 * Claude Streaming Service for handling long-form code generation
 *
 * This service implements:
 * 1. Streaming responses from Claude API
 * 2. Automatic continuation for responses that exceed token limits
 * 3. Intelligent completion detection
 * 4. Token usage tracking across multiple chunks
 */

import axios from "axios";
import { CLAUDE_MODELS } from "./code-generation-service";

interface StreamOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxContinuations?: number;
}

export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export type SystemPrompt = string | SystemBlock[];

interface StreamChunk {
  type: "content" | "error" | "usage" | "complete";
  content?: string;
  error?: string;
  // Anthropic stop_reason on a "complete" chunk: "end_turn" | "max_tokens"
  // | "stop_sequence" | "tool_use" | null. Drives continuation decisions.
  stopReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
}

/**
 * Stream handler that processes Server-Sent Events from Claude API
 */
class ClaudeStreamParser {
  private buffer = "";

  parseChunk(chunk: string): StreamChunk[] {
    this.buffer += chunk;
    const chunks: StreamChunk[] = [];

    // Split by newlines to process individual SSE messages
    const lines = this.buffer.split('\n');

    // Keep the incomplete line in buffer
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);

        // Skip ping messages
        if (data === '[DONE]') {
          chunks.push({ type: "complete" });
          continue;
        }

        try {
          const parsed = JSON.parse(data);

          // Debug logging for event types (can be removed later)
          if (parsed.type && !['content_block_delta', 'message_delta'].includes(parsed.type)) {
            console.debug('SSE event type:', parsed.type);
          }

          // Handle different event types
          if (parsed.type === 'content_block_delta') {
            chunks.push({
              type: "content",
              content: parsed.delta?.text || ""
            });
          } else if (parsed.type === 'message_start') {
            // message_start carries the initial usage block, including
            // cache_creation_input_tokens / cache_read_input_tokens which only
            // appear here (message_delta only has the per-stream input/output).
            const u = parsed.message?.usage;
            if (u) {
              chunks.push({
                type: "usage",
                usage: {
                  inputTokens: u.input_tokens || 0,
                  outputTokens: u.output_tokens || 0,
                  cacheCreationInputTokens: u.cache_creation_input_tokens || 0,
                  cacheReadInputTokens: u.cache_read_input_tokens || 0,
                }
              });
            }
          } else if (parsed.type === 'message_delta') {
            // Usage information in message_delta
            if (parsed.usage) {
              chunks.push({
                type: "usage",
                usage: {
                  inputTokens: parsed.usage.input_tokens || 0,
                  outputTokens: parsed.usage.output_tokens || 0,
                  cacheCreationInputTokens: parsed.usage.cache_creation_input_tokens || 0,
                  cacheReadInputTokens: parsed.usage.cache_read_input_tokens || 0,
                }
              });
            }
            // message_delta carries the stop_reason. Surface it so the
            // continuation loop can tell "cut off at max_tokens" (must
            // continue) from "model finished on its own" (must stop).
            if (parsed.delta?.stop_reason) {
              chunks.push({ type: "complete", stopReason: parsed.delta.stop_reason });
            }
          } else if (parsed.type === 'message_stop' || parsed.type === 'content_block_stop') {
            // Claude API sends these events when content is complete
            chunks.push({ type: "complete" });
          } else if (parsed.type === 'error') {
            chunks.push({
              type: "error",
              error: parsed.error?.message || "Unknown error"
            });
          }
        } catch (e) {
          // Ignore parsing errors for malformed JSON
          console.warn("Failed to parse SSE data:", data);
        }
      }
    }

    return chunks;
  }
}


/**
 * Stream code generation from Claude with automatic continuation
 */
export async function* streamClaudeCode({
  prompt,
  systemPrompt,
  messages = [],
  options = {},
  onChunk
}: {
  prompt?: string;
  systemPrompt?: SystemPrompt;
  messages?: Array<{ role: string; content: string }>;
  options?: StreamOptions;
  onChunk?: (chunk: string) => void;
}): AsyncGenerator<StreamChunk, void, unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    yield {
      type: "error",
      error: "ANTHROPIC_API_KEY not found in environment"
    };
    return;
  }

  const maxContinuations = options.maxContinuations || 10;
  let continuationCount = 0;
  let conversationHistory = [...messages];
  let fullContent = "";
  let totalUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
  };

  // Add initial user message if prompt provided
  if (prompt) {
    conversationHistory.push({ role: "user", content: prompt });
  }

  while (continuationCount < maxContinuations) {
    const parser = new ClaudeStreamParser();
    let chunkContent = "";
    let stopReason: string | undefined;

    try {
      // Make streaming API call
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: options.model || CLAUDE_MODELS.DEFAULT,
          system: systemPrompt,
          messages: conversationHistory,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.2,
          stream: true
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          responseType: "stream"
        }
      );

      // Process the stream
      for await (const chunk of response.data) {
        const text = chunk.toString();
        const parsed = parser.parseChunk(text);

        for (const item of parsed) {
          if (item.type === "content" && item.content) {
            chunkContent += item.content;
            fullContent += item.content;

            // Call the onChunk callback if provided
            if (onChunk) {
              onChunk(item.content);
            }

            // Yield the content chunk
            yield item;

          } else if (item.type === "usage" && item.usage) {
            totalUsage.inputTokens += item.usage.inputTokens;
            totalUsage.outputTokens += item.usage.outputTokens;
            totalUsage.cacheCreationInputTokens += item.usage.cacheCreationInputTokens || 0;
            totalUsage.cacheReadInputTokens += item.usage.cacheReadInputTokens || 0;

          } else if (item.type === "complete") {
            // Remember the stop_reason if this complete chunk carried one
            // (message_delta does; the bare message_stop/[DONE] does not).
            if (item.stopReason) {
              stopReason = item.stopReason;
            }

          } else if (item.type === "error") {
            yield item;
            return;
          }
        }
      }

    } catch (error: any) {
      yield {
        type: "error",
        error: `API call failed: ${error.message}`
      };
      return;
    }

    // Decide whether to continue. Drive this off the API stop_reason rather
    // than counting backticks: a `max_tokens` stop means the model was cut off
    // and must continue; any other stop (`end_turn`, `stop_sequence`, …) means
    // the model finished on its own — trust it and stop, so the loop can't
    // over-run a turn that already completed (which previously re-emitted and
    // corrupted the program).
    const hitTokenLimit = stopReason === "max_tokens";

    // A complete Graffiticode program ends with `..`. Check the *trailing*
    // code block specifically, so a stray `..` mid-stream or a re-opened fence
    // can't masquerade as completion.
    const blocks = extractCodeBlocks(fullContent);
    const lastBlock = blocks.length ? blocks[blocks.length - 1] : fullContent;
    const programTerminated = lastBlock.trimEnd().endsWith("..");

    let needsContinuation: boolean;
    if (stopReason) {
      // Continue only when cut off by the token limit before terminating.
      needsContinuation = hitTokenLimit && !programTerminated;
    } else {
      // Defensive fallback when stop_reason is unavailable: continue on an
      // unclosed fence or an unterminated program that contains code.
      const codeBlockCount = (fullContent.match(/```/g) || []).length;
      const fenceOpen = codeBlockCount % 2 !== 0;
      needsContinuation = fenceOpen || (codeBlockCount > 0 && !programTerminated);
    }

    if (!needsContinuation) {
      break;
    }

    console.log(`Continuing generation (chunk ${continuationCount + 2}/${maxContinuations})`);

    // Add the assistant's response to conversation history
    conversationHistory.push({ role: "assistant", content: chunkContent });

    // Add continuation prompt
    conversationHistory.push({
      role: "user",
      content: "Continue exactly where you left off. Do not repeat any content."
    });

    continuationCount++;
  }

  // Yield final usage information
  yield {
    type: "usage",
    usage: totalUsage
  };

  yield { type: "complete" };
}

/**
 * Generate long-form code with automatic continuation (non-streaming)
 */
export async function generateLongCode({
  prompt,
  systemPrompt,
  messages = [],
  options = {}
}: {
  prompt?: string;
  systemPrompt?: SystemPrompt;
  messages?: Array<{ role: string; content: string }>;
  options?: StreamOptions;
}): Promise<{
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  chunks: number;
  error?: string;
}> {
  let fullContent = "";
  let totalUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
  };
  let chunkCount = 0;
  let error: string | undefined;

  // Use the streaming generator to collect all content
  const generator = streamClaudeCode({
    prompt,
    systemPrompt,
    messages,
    options,
    onChunk: (chunk) => {
      // Could add progress logging here if needed
      process.stdout.write(chunk);
    }
  });

  for await (const chunk of generator) {
    if (chunk.type === "content" && chunk.content) {
      fullContent += chunk.content;

    } else if (chunk.type === "usage" && chunk.usage) {
      totalUsage.inputTokens = chunk.usage.inputTokens;
      totalUsage.outputTokens = chunk.usage.outputTokens;
      totalUsage.cacheCreationInputTokens = chunk.usage.cacheCreationInputTokens || 0;
      totalUsage.cacheReadInputTokens = chunk.usage.cacheReadInputTokens || 0;
      chunkCount++;

    } else if (chunk.type === "error" && chunk.error) {
      error = chunk.error;
      break;
    }
  }

  return {
    content: fullContent,
    usage: totalUsage,
    chunks: Math.max(chunkCount, 1),
    error
  };
}

/**
 * Extract code blocks from mixed content
 */
export function extractCodeBlocks(content: string): string[] {
  const codeBlockRegex = /```(?:[\w]*\n|\n)?([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push(match[1].trim());
  }

  // If no code blocks found, assume entire content is code
  if (blocks.length === 0 && content.trim()) {
    blocks.push(content.trim());
  }

  return blocks;
}

/**
 * Hybrid approach: Stream with continuation for very long code generation
 * This is the recommended method for production use
 */
export async function generateCodeWithContinuation({
  prompt,
  formattedPrompt,  // Accept pre-formatted prompt with examples
  lang = "0000",
  currentCode = null,
  options = {},
  onProgress
}: {
  prompt?: string;  // Original prompt (optional if formattedPrompt provided)
  formattedPrompt?: string;  // Pre-formatted prompt with examples and system instructions
  lang?: string;
  currentCode?: string | null;
  options?: StreamOptions;
  onProgress?: (message: string) => void;
}): Promise<{
  code: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  chunks: number;
  error?: string;
}> {
  // Parse formatted prompt if provided, otherwise build from scratch.
  // `system` may arrive as a plain string (legacy) or as a content-block array
  // carrying cache_control markers (Anthropic prompt caching). Both shapes are
  // forwarded to /v1/messages unchanged.
  let systemPrompt: SystemPrompt;
  let messages: Array<{ role: string; content: string }> = [];

  if (formattedPrompt) {
    // Parse the JSON formatted prompt that includes system and messages
    try {
      const parsed = JSON.parse(formattedPrompt);
      systemPrompt = parsed.system;
      messages = parsed.messages;
    } catch (e) {
      console.error("Failed to parse formatted prompt, falling back to simple format");
      // Treat it as a simple prompt if parsing fails
      systemPrompt = `You are a programming assistant that translates natural language into code written in Graffiticode dialect L${lang}.
  
Generate ONLY valid Graffiticode code. Put the code between triple backticks (\`\`\`).
Do not include any explanatory text outside the code blocks unless specifically requested.`;
      messages.push({
        role: "user",
        content: formattedPrompt
      });
    }
  } else {
    // Fallback to original logic if no formatted prompt provided
    systemPrompt = `You are a programming assistant that translates natural language into code written in Graffiticode dialect L${lang}.
    
Generate ONLY valid Graffiticode code. Put the code between triple backticks (\`\`\`).
Do not include any explanatory text outside the code blocks unless specifically requested.`;

    if (currentCode && prompt) {
      messages.push({
        role: "user",
        content: `Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nModify it to: ${prompt}`
      });
    } else if (prompt) {
      messages.push({
        role: "user",
        content: prompt
      });
    }
  }

  // Track progress
  if (onProgress) {
    onProgress("Starting code generation...");
  }

  let chunkNumber = 0;

  // Generate code with streaming and continuation
  const result = await generateLongCode({
    systemPrompt,
    messages,
    options: {
      ...options,
      maxTokens: options.maxTokens || 4096,
      maxContinuations: options.maxContinuations || 10
    }
  });

  if (result.error) {
    return {
      code: "",
      usage: result.usage,
      chunks: result.chunks,
      error: result.error
    };
  }

  // Assemble the program from the streamed code block(s).
  //
  // Continuation can split one program across several fenced blocks (when a
  // chunk hits max_tokens mid-code). Concatenate blocks with NO separator —
  // joining with "\n\n" used to insert a blank line exactly where a token was
  // cut across the max_tokens boundary, corrupting the code (e.g. a half-string
  // producing parse errors). Stop as soon as the program terminates with `..`,
  // so spurious re-emitted trailing blocks are dropped.
  //
  // A continuation can also *restart* the program instead of continuing it
  // (the model re-emits from the top). When a block restarts — its opening
  // matches the opening of the program we're already accumulating — discard the
  // abandoned fragment and begin again from the restart, so we never splice an
  // orphaned prefix onto the front of the finished program.
  const codeBlocks = extractCodeBlocks(result.content);
  // First non-empty line, whitespace-normalized — the program's opening
  // statement (e.g. `passage "<heading>"`). On a restart the model regenerates
  // from scratch, so the body diverges almost immediately but this opening line
  // is reproduced; it's the only reliable restart signal.
  const firstLine = (s: string) =>
    (s.split("\n").find(l => l.trim()) || "").replace(/\s+/g, " ").trim();
  // A later block restarts the program when its opening line matches the
  // opening line of the block we started from. Match in both directions so it
  // holds whether the abandoned fragment was cut mid-line (shorter) or ran past
  // it (longer). A genuine continuation begins mid-content, never re-emitting
  // the opening, so it won't match.
  const isRestart = (a: string, b: string) =>
    a.length >= 8 && b.length >= 8 && (a.startsWith(b) || b.startsWith(a));
  let finalCode = "";
  let firstBlockLine = "";
  for (const block of codeBlocks) {
    if (!block.trim()) continue;
    if (firstBlockLine && isRestart(firstBlockLine, firstLine(block))) {
      // Restart detected: drop the abandoned fragment and begin from here.
      finalCode = "";
    }
    if (!finalCode) firstBlockLine = firstLine(block);
    finalCode += block;
    if (finalCode.trimEnd().endsWith("..")) break;
  }
  finalCode = finalCode.trim();

  if (onProgress) {
    onProgress(`Generation complete. Processed ${result.chunks} chunk(s).`);
  }

  return {
    code: finalCode,
    usage: result.usage,
    chunks: result.chunks
  };
}
