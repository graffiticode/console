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

interface StreamOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxContinuations?: number;
}

interface StreamChunk {
  type: "content" | "error" | "usage" | "complete";
  content?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
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

          // Handle different event types
          if (parsed.type === 'content_block_delta') {
            chunks.push({
              type: "content",
              content: parsed.delta?.text || ""
            });
          } else if (parsed.type === 'message_delta') {
            // Usage information in message_delta
            if (parsed.usage) {
              chunks.push({
                type: "usage",
                usage: {
                  inputTokens: parsed.usage.input_tokens || 0,
                  outputTokens: parsed.usage.output_tokens || 0
                }
              });
            }
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
 * Check if the generated content appears to be complete
 */
function isContentComplete(content: string): boolean {
  const trimmed = content.trim();

  // Check for common code completion indicators
  const completionIndicators = [
    // Code block endings
    '```',
    // Common Graffiticode terminators
    '..',
    // End of function/block in various languages
    '}',
    ')',
    'end',
    // End of sentence for natural language
    '.',
    '!',
    '?'
  ];

  // Check if content ends with any completion indicator
  for (const indicator of completionIndicators) {
    if (trimmed.endsWith(indicator)) {
      return true;
    }
  }

  // Check if we're in the middle of a word (incomplete)
  const lastChar = trimmed[trimmed.length - 1];
  if (lastChar && /[a-zA-Z0-9]/.test(lastChar)) {
    // Ends with alphanumeric - might be incomplete
    const lastLine = trimmed.split('\n').pop() || '';

    // If the last line is very long, we're probably mid-sentence
    if (lastLine.length > 80) {
      return false;
    }
  }

  return false;
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
  systemPrompt?: string;
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

  const maxContinuations = options.maxContinuations || 5;
  let continuationCount = 0;
  let conversationHistory = [...messages];
  let fullContent = "";
  let totalUsage = { inputTokens: 0, outputTokens: 0 };
  let consecutiveShortResponses = 0;  // Track short responses that might indicate completion

  // Add initial user message if prompt provided
  if (prompt) {
    conversationHistory.push({ role: "user", content: prompt });
  }

  while (continuationCount < maxContinuations) {
    const parser = new ClaudeStreamParser();
    let chunkContent = "";
    let isComplete = false;

    try {
      // Make streaming API call
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: options.model || "claude-3-5-sonnet-20241022",
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
            "anthropic-beta": "messages-2023-12-15"
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

          } else if (item.type === "complete") {
            isComplete = true;

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

    // Check if the response appears complete
    if (isContentComplete(chunkContent)) {
      console.log(`Response appears complete after ${continuationCount + 1} chunk(s)`);
      break;
    }

    // If response is very short, it might be naturally complete
    if (chunkContent.length < 500) {
      consecutiveShortResponses++;
      if (consecutiveShortResponses >= 2) {
        console.log(`Response appears complete (consecutive short responses)`);
        break;
      }
    } else {
      consecutiveShortResponses = 0;
    }

    // Check if we hit the token limit (response stopped mid-content)
    // Only continue if response is substantial and appears truncated
    const appearsTruncated = chunkContent.length >= (options.maxTokens || 4096) * 2.5;
    const needsContinuation = !isComplete || (appearsTruncated && !isContentComplete(chunkContent));

    if (needsContinuation) {
      console.log(`Continuing generation (chunk ${continuationCount + 2}/${maxContinuations})`);

      // Add the assistant's response to conversation history
      conversationHistory.push({ role: "assistant", content: chunkContent });

      // Add continuation prompt
      conversationHistory.push({
        role: "user",
        content: "Continue exactly where you left off. Do not repeat any content."
      });

      continuationCount++;
    } else {
      // Response completed naturally or is too short to warrant continuation
      break;
    }
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
  systemPrompt?: string;
  messages?: Array<{ role: string; content: string }>;
  options?: StreamOptions;
}): Promise<{
  content: string;
  usage: { inputTokens: number; outputTokens: number };
  chunks: number;
  error?: string;
}> {
  let fullContent = "";
  let totalUsage = { inputTokens: 0, outputTokens: 0 };
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
  lang = "0002",
  currentCode = null,
  options = {},
  onProgress
}: {
  prompt: string;
  lang?: string;
  currentCode?: string | null;
  options?: StreamOptions;
  onProgress?: (message: string) => void;
}): Promise<{
  code: string;
  usage: { inputTokens: number; outputTokens: number };
  chunks: number;
  error?: string;
}> {
  // Build the system prompt (reuse logic from code-generation-service.ts)
  const systemPrompt = `You are a programming assistant that translates natural language into code written in Graffiticode dialect L${lang}.
  
Generate ONLY valid Graffiticode code. Put the code between triple backticks (\`\`\`).
Do not include any explanatory text outside the code blocks unless specifically requested.`;

  // Build messages array
  const messages: Array<{ role: string; content: string }> = [];

  if (currentCode) {
    messages.push({
      role: "user",
      content: `Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nModify it to: ${prompt}`
    });
  } else {
    messages.push({
      role: "user",
      content: prompt
    });
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

  // Extract code blocks from the generated content
  const codeBlocks = extractCodeBlocks(result.content);
  const finalCode = codeBlocks.join('\n\n');

  if (onProgress) {
    onProgress(`Generation complete. Processed ${result.chunks} chunk(s).`);
  }

  return {
    code: finalCode,
    usage: result.usage,
    chunks: result.chunks
  };
}