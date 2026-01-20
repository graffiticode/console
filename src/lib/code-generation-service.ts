/**
 * Code generation service for Claude API integration
 *
 * This service implements:
 * 1. Language detection from prompts
 * 2. API calls to Claude for code generation
 * 3. Token usage tracking
 * 4. Code verification via Graffiticode API
 * 5. Error correction via Claude
 * 6. Retrieval of relevant examples to enhance generation accuracy
 */

import axios from "axios";
import { postApiCompile, getLanguageAsset, getLanguageLexicon } from "./api";
import { postTask, getData } from "../pages/api/resolvers";
import admin from "firebase-admin";
import { ragLog, generateRequestId } from "./logger";
import {
  generateEmbedding,
  createEmbeddingText,
  vectorSearch,
  hybridSearch,
} from "./embedding-service";
import { generateCodeWithContinuation } from "./claude-stream-service";
import { safeRAGAnalytics } from "./rag-analytics-safe";
import { getRAGConfig, withRAGFallback } from "./rag-config";
import { parser } from "@graffiticode/parser";
import {
  compilePromptSpec,
  compileRepairPromptSpec,
  buildContextPack,
  classifyCompilerError,
  parseStructuredErrors,
  isDSPyEnabled,
  shouldFallbackToLegacy,
  ConversationSummary,
  RetrievedChunk,
} from "./dspy-service";
import {
  renderPromptSpecToMessages,
  convertLegacyPromptToRendered,
  formatPromptSpecForLog,
  RenderContext,
} from "./prompt-renderer";

// Global cache for language assets to avoid repeated fetches
const languageAssetsCache = {
  instructions: new Map<string, string>(),
  templates: new Map<string, string>(),
};

// Define available Claude models with best practices
export const CLAUDE_MODELS = {
  OPUS: "claude-opus-4-20250514",
  SONNET: "claude-sonnet-4-20250514",
  HAIKU: "claude-3-5-haiku-20241022",
  DEFAULT: "claude-sonnet-4-20250514",  // Sonnet is now the default
};

/**
 * Always returns Graffiticode as the language
 * @param {string} prompt - User's input prompt (ignored)
 * @returns {string} Always returns "graffiticode"
 */
function detectLanguage(prompt) {
  // Always return Graffiticode regardless of prompt content
  return "graffiticode";
}

/**
 * Get Firestore database reference with initialization check
 * @returns {FirebaseFirestore.Firestore} Firestore database instance
 */
function getFirestoreDb() {
  // Get existing Firestore instance or initialize if needed
  try {
    return admin.firestore();
  } catch (error) {
    // If admin isn't initialized, initialize it
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    return admin.firestore();
  }
}

/**
 * Parse markdown training examples file into structured data
 * @param {string} markdownContent - Content of the markdown file
 * @returns {Array} Array of parsed examples
 */
function parseMarkdownExamples(markdownContent) {
  try {
    const examples = [];
    // Split the content by sections
    const sections = markdownContent.split("---");

    for (const section of sections) {
      if (!section.trim()) continue;

      // Extract prompt and code from each section
      const promptMatch = section.match(/###\s*Prompt\s*\n"([^"]+)"/);
      const codeBlockMatch = section.match(
        /###\s*Code\s*\n\s*```\s*\n([\s\S]+?)\n\s*```/,
      );

      // Fall back to older format if needed
      const taskMatch =
        !promptMatch && section.match(/###\s*Task\s*\n"([^"]+)"/);
      const codeMatch =
        !codeBlockMatch &&
        section.match(/###\s*Graffiticode\s*\n([\s\S]+?)(?=\n\n|$)/);

      if (promptMatch && codeBlockMatch) {
        // New format
        examples.push({
          task: promptMatch[1].trim(),
          code: codeBlockMatch[1].trim(),
          // Create a messages array for compatibility with existing code
          messages: [
            { role: "user", content: promptMatch[1].trim() },
            {
              role: "assistant",
              content: `\`\`\`\n${codeBlockMatch[1].trim()}\n\`\`\``,
            },
          ],
        });
      } else if (taskMatch && codeMatch) {
        // Old format
        examples.push({
          task: taskMatch[1].trim(),
          code: codeMatch[1].trim(),
          // Create a messages array for compatibility with existing code
          messages: [
            { role: "user", content: taskMatch[1].trim() },
            {
              role: "assistant",
              content: `\`\`\`\n${codeMatch[1].trim()}\n\`\`\``,
            },
          ],
        });
      }
    }

    return examples;
  } catch (error) {
    console.error("Error parsing markdown examples:", error);
    return [];
  }
}

async function getRelevantExamples({ prompt, lang, limit = 3, rid = null }) {
  try {
    if (rid) {
      ragLog(rid, "retrieval.start", {
        query: prompt.substring(0, 100),
        lang,
        k: limit,
        mode: "hybrid",
      });
    }

    const db = getFirestoreDb();

    // Try vector search first
    try {
      // Use hybrid search for better results
      const results = await hybridSearch({
        collection: "training_examples",
        query: prompt,
        limit: limit,
        lang: lang,
        db: db,
        rid: rid,  // Pass the request ID for analytics tracking
        vectorWeight: 0.7, // Balance between semantic and keyword matching
      });

      if (results && results.length > 0) {
        // Transform the results to match the expected format
        const transformedResults = results.map(doc => {
          // The new format has these fields: lang, prompt, code, messages, tags, etc.
          return {
            task: doc.prompt || doc.task,
            code: doc.code,
            messages: doc.messages || [
              { role: "user", content: doc.prompt },
              { role: "assistant", content: `\`\`\`\n${doc.code}\n\`\`\`` }
            ],
            description: doc.prompt || doc.description,
            tags: doc.tags || [],
            expectedValues: doc.expectedValues || [],
            // Include scoring information
            similarity: doc.similarity,
            keywordScore: doc.keywordScore,
            combinedScore: doc.combinedScore
          };
        });

        if (rid) {
          ragLog(rid, "retrieval.result", {
            mode: "hybrid",
            k: limit,
            lang,
            resultCount: transformedResults.length,
            ids: results.map((r) => r.id || r.prompt?.substring(0, 50)),
            scores: results.map((r) => ({
              similarity: r.similarity,
              keywordScore: r.keywordScore,
              combinedScore: r.combinedScore,
            })),
          });
        }

        return transformedResults;
      }
    } catch (vectorError) {
      console.warn(
        "Vector search failed, falling back to keyword search:",
        vectorError.message,
      );

      if (rid) {
        ragLog(rid, "retrieval.fallback", {
          reason: vectorError.message,
          mode: "keyword",
        });
      }
    }

    // Fallback to keyword-based search if vector search fails or returns no results
    // Import local training data from markdown format only
    const fs = require("fs");
    const path = require("path");

    let examples = [];

    // Load the markdown file from local /training directory
    const mdFilePath = path.join(
      process.cwd(),
      `./training/l${lang}-training-examples.md`,
    );

    if (fs.existsSync(mdFilePath)) {
      // Read and parse the markdown file
      const markdownContent = fs.readFileSync(mdFilePath, "utf8");
      examples = parseMarkdownExamples(markdownContent);
    } else {
      console.warn(`No training examples file found for L${lang}`);
      return [];
    }

    // Simple keyword matching to find relevant examples
    const keywords = prompt
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    // Score examples based on keyword matches
    const scoredExamples = examples.map((example) => {
      // For markdown examples, search through task and code
      let textToSearch = "";

      if (example.task) {
        // For markdown format
        textToSearch = (example.task + " " + example.code).toLowerCase();
      } else if (example.messages) {
        // For dialog-based examples
        textToSearch = example.messages
          .map((m) => m.content)
          .join(" ")
          .toLowerCase();
      } else {
        // Fallback for other formats
        textToSearch = (example.description || "").toLowerCase();
      }

      const score = keywords.reduce((sum, keyword) => {
        return sum + (textToSearch.includes(keyword) ? 1 : 0);
      }, 0);

      return { ...example, score };
    });

    const topExamples = scoredExamples
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (rid) {
      ragLog(rid, "retrieval.result", {
        mode: "keyword",
        k: limit,
        lang,
        resultCount: topExamples.length,
        ids: topExamples.map(
          (e) => e.task?.substring(0, 50) || e.description?.substring(0, 50),
        ),
        scores: topExamples.map((e) => ({ keywordScore: e.score })),
      });
    }

    return topExamples;
  } catch (error) {
    console.error("Error retrieving training examples:", error);

    if (rid) {
      ragLog(rid, "retrieval.error", {
        error: error.message,
      });
    }

    // Fallback to returning empty array if there's an error
    return [];
  }
}


/**
 * Reads dialect-specific instructions from the language server with caching
 * @param {string} lang - The language/dialect ID (e.g., "0002", "0159")
 * @returns {Promise<string>} - The dialect-specific instructions, or empty string if none found
 */
async function readDialectInstructions(lang) {
  // Check cache first
  const cacheKey = `L${lang}`;
  if (languageAssetsCache.instructions.has(cacheKey)) {
    const cached = languageAssetsCache.instructions.get(cacheKey);
    return cached;
  }

  try {
    // Fetch instructions from the language server
    const instructions = await getLanguageAsset(`L${lang}`, 'instructions.md');
    if (instructions) {
      const formatted = `\n${instructions}\n`;
      // Cache the result
      languageAssetsCache.instructions.set(cacheKey, formatted);
      return formatted;
    } else {
      // Cache empty result to avoid repeated failed fetches
      languageAssetsCache.instructions.set(cacheKey, "");
      return "";
    }
  } catch (error) {
    console.error(`Error fetching dialect instructions from language server for L${lang}:`, error);
    // Cache empty result to avoid repeated failed fetches
    languageAssetsCache.instructions.set(cacheKey, "");
    return "";
  }
}

/**
 * Returns the appropriate system prompt for a given dialect
 * @param {string} lang - The language/dialect ID (e.g., "0002", "0159")
 * @returns {Promise<string>} - The customized system prompt
 */
async function getSystemPromptForDialect(lang) {
  // Start with the base prompt
  let prompt = `
You are a programming assistant that translates natural language into code written in a functional DSL called **Graffiticode**, specifically dialect L${lang}.

Graffiticode is designed for end-user programming. Its syntax is simple, functional, and punctuation-light. Use only the language features below.`;

  // Try to fetch dialect-specific instructions from language server
  const fileInstructions = await readDialectInstructions(lang);

  if (fileInstructions) {
    // Use file-based instructions if available
    prompt += fileInstructions;
  }

  prompt += `
## Response Requirements
- **IMPORTANT**: When current code is provided in the context, treat it as the starting point and make only the necessary incremental changes requested by the user. Preserve existing data, formatting, and structure unless specifically asked to modify them.

## Core Syntax Rules
- Use \`let name = value..\` for declarations
- All functions are prefix notation: \`add 1 2\` (no infix allowed)
- Lambdas use angle brackets: \`<x y: expr>\`
- CRITICAL: ONLY use \`..\` (double dots) to terminate \`let\` declarations and the program
- CRITICAL: EVERY program MUST have zero or more let declarations followed by JUST ONE expression ending with \`..\`
- Use parentheses to pass functions or delay application: \`map (double) [1 2 3]\`
- Whitespace separates tokens; commas and parens are optional but allowed
- Static types are inferred; no type annotations
- No mutation; all data is immutable
- Function calls with too few arguments return a partially applied function (currying)

## Built-in Types
- **Numbers**: \`42\`, \`-3.14\`
- **Strings**: \`"hello"\` or multiline with \`'hello,\nworld!'\`;
  - Quotes inside strings should NEVER be escaped
  - For nested quotes, use different quote types: \`"He said 'hello'"\` or \`'She said "goodbye"'\`
  - Supports interpolation: \` \\\`hello, \${name}!\\\` \`
  - IMPORTANT: Backslashes should NOT be escaped in generated code
  - IMPORTANT: Literal "\n" should not appear in the generated code; use proper newline characters instead
- **Booleans**: \`true\`, \`false\`; **Null**: \`null\`
- **Lists**: \`[1 2 3]\`; support pattern matching
- **Records**: \`{name: "Alice" age: 30}\`; access via \`get\`, support destructuring
- **Tags**: Unbound identifiers like \`Running\`, \`Error\` used for symbolic values

## Pattern Matching
Use \`case\` for match expressions:
\`\`\`
case x of
  pattern1: result1
  _: fallback
end
\`\`\`

Supports destructuring for lists \`[x, rest]\` and records \`{name}\`. Wildcard \`_\` matches anything.

## Control Flow
Use \`if condition then expr1 else expr2\`. Always return a value.

## Functions
- All functions have fixed arity
- Functions can be anonymous or assigned to \`let\`
- Recursion is allowed

## Comments
Start with \`|\` and extend to the end of the line.

## Built-In Functions

### Arithmetic
\`add\`, \`sub\`, \`mul\`, \`div\`, \`mod\`

### Comparison
\`eq\`, \`ne\`, \`lt\`, \`le\`, \`gt\`, \`ge\`

### List Ops
\`hd\`, \`tl\`, \`last\`, \`isEmpty\`, \`nth\`, \`take\`, \`drop\`, \`range\`, \`filter\`, \`map\`, \`reduce\`

### Record/List Access
\`get\`, \`set\`

### Output
\`print\`

Only return idiomatic, valid Graffiticode. Use readable names. Output **only the code** unless explanation is requested.

CRITICAL REMINDER: Put generated code between \`\`\` (triple backticks) to distinguish code from commentary.
`;

  return prompt.trim();
}

/**
 * Generate examples section from retrieved training examples
 * @param {Array} examples - Array of training examples
 * @returns {string} - Formatted examples section for the system prompt
 */
function generateExamplesSection(examples) {
  if (!examples || examples.length === 0) return "";

  let examplesText = `\n\n## RELEVANT EXAMPLES:\n\n`;

  examples.forEach((example, i) => {
    if (example.task && example.code) {
      // Handle markdown-based examples (standardized format)
      examplesText += `### Example ${i + 1}: ${example.task}\n`;
      examplesText += "Prompt: " + example.task + "\n\n";
      examplesText += "```\n";
      examplesText += example.code;
      examplesText += "\n```\n\n";
    } else if (
      example.messages &&
      Array.isArray(example.messages) &&
      example.messages.length > 0
    ) {
      // Handle dialog-based examples (legacy format)
      examplesText += `### Example ${i + 1}: Dialog Interaction\n`;
      examplesText += "Here's a relevant example of this type of task:\n\n";

      example.messages.forEach((message) => {
        const roleLabel = message.role === "user" ? "User" : "Assistant";
        examplesText += `**${roleLabel}**: ${message.content}\n\n`;
      });

      // If we have code, also include it separately
      if (
        example.code &&
        !example.messages.some((m) => m.content.includes(example.code))
      ) {
        examplesText += "```\n";
        examplesText += example.code;
        examplesText += "\n```\n";
      }

      // Add explanation if available
      if (example.explanation) {
        examplesText += `${example.explanation}\n\n`;
      }
    } else {
      // Handle traditional examples (legacy format)
      examplesText += `### Example ${i + 1}: ${example.description || "Graffiticode Example"}\n`;
      examplesText += "```\n";
      examplesText += example.code;
      examplesText += "\n```\n";
      examplesText += `${example.explanation || "An example of Graffiticode."}\n\n`;
    }
  });

  return examplesText;
}

/**
 * Create a prompt for Claude that will generate high-quality code
 * @param {string} userPrompt - The user's original prompt
 * @param {Array} examples - Relevant examples to include
 * @param {string} lang - The language/dialect ID (e.g., "0002", "0159")
 * @param {string} currentCode - The current code (if available) to use as a starting point
 * @returns {string} - A well-formatted prompt for Claude
 */
async function createCodeGenerationPrompt(
  userPrompt,
  examples = [],
  lang = "0002",
  currentCode = null,
  rid = null,
) {
  // Generate examples section from retrieved examples
  const examplesSection = generateExamplesSection(examples);

  // Get the dialect-specific system prompt
  const dialectSystemPrompt = await getSystemPromptForDialect(lang);

  // Combine dialect-specific system prompt with examples
  const enhancedSystemPrompt = dialectSystemPrompt + examplesSection;

  if (rid) {
    ragLog(rid, "prompt.build", {
      dialect: `L${lang}`,
      examplesIncluded: examples.length,
      tokenEstimate: Math.ceil(
        (enhancedSystemPrompt.length + userPrompt.length) / 4,
      ),
      charCount: enhancedSystemPrompt.length + userPrompt.length,
      hasCurrentCode: !!currentCode,
      sectionsIncluded: ["system", "examples", "user"],
    });
  }

  const promptData = {
    system: enhancedSystemPrompt,
    messages: [
      {
        role: "user",
        content:
          "Create a data transformation pipeline that filters adult users and extracts their names.",
      },
      {
        role: "assistant",
        content: `
| Transform data through a multi-step pipeline
let users = [{ name: "Alice", age: 28 } { name: "Bob", age: 34 } { name: "Charlie", age: 19 }]..
let isAdult = <user: ge (get "age" user) 21>..
let getNames = <user: get "name" user>..
map (getNames) (filter (isAdult) users)..
`.trim(),
      },
      {
        role: "user",
        content:
          "Create a function that handles different user roles using pattern matching with tags.",
      },
      {
        role: "assistant",
        content: `
| Demonstrate pattern matching with tag values and records
let getStatus = <user:
  case get "role" user of
    admin: "Has full access"
    editor: "Can edit content"
    viewer: "Read-only access"
    _: "Unknown role"
  end
>..
getStatus { name: "Alice", role: admin }..
`.trim(),
      },
      {
        role: "user",
        content:
          "Show how to compose functions to create a data processing pipeline.",
      },
      {
        role: "assistant",
        content: `
| Use higher-order functions to process data
let compose = <f g x: f (g x)>..
let double = <x: mul x 2>..
let increment = <x: add x 1>..
let doubleAndIncrement = compose (increment) (double)..
map (doubleAndIncrement) [1 2 3 4]..
`.trim(),
      },
      {
        role: "user",
        content: currentCode
          ? `I have the following existing code:\n\n\`\`\`\n${currentCode}\n\`\`\`\n\nI need to: ${userPrompt}`
          : userPrompt,
      },
    ],
  };

  return JSON.stringify(promptData, null, 2);
}

/**
 * Make an API call to Claude
 * @param {string} prompt - The formatted prompt for Claude
 * @param {Object} options - Options for the API call
 * @returns {Promise<Object>} - The response from Claude
 */
async function callClaudeAPI(prompt, options, rid = null) {
  // Get the API key from environment variables
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn(
      "ANTHROPIC_API_KEY not found in environment. Falling back to mock response.",
    );
    // Return fallback mock response if API key is not available
    return getFallbackResponse(prompt, options);
  }

  const startTime = Date.now();

  if (rid) {
    ragLog(rid, "llm.call.start", {
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.max_tokens,
    });
  }

  try {
    // Anthropic API endpoint
    const apiUrl = "https://api.anthropic.com/v1/messages";

    // Prepare the request payload
    const payload = {
      model: options.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: options.max_tokens,
      temperature: options.temperature,
    };

    // Make the API call
    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    const latency = Date.now() - startTime;

    // Extract the relevant data from the response
    const result = {
      id: response.data.id,
      model: response.data.model,
      content: response.data.content[0].text,
      usage: {
        prompt_tokens: response.data.usage.input_tokens,
        completion_tokens: response.data.usage.output_tokens,
        total_tokens:
          response.data.usage.input_tokens + response.data.usage.output_tokens,
      },
    };

    if (rid) {
      ragLog(rid, "llm.call.complete", {
        model: options.model,
        latency,
        usage: result.usage,
      });
    }

    return result;
  } catch (error) {
    console.error(
      "Error calling Claude API:",
      error.response?.data || error.message,
    );

    if (rid) {
      ragLog(rid, "llm.call.error", {
        error: error.message,
        latency: Date.now() - startTime,
      });
    }

    // If the API call fails, return a fallback response
    return getFallbackResponse(prompt, options);
  }
}

function getFallbackResponse(prompt, options) {
  console.warn("Using fallback response for Claude API");
  const sampleCode = `let message = "Fallback response - Claude API unavailable"..`;
  return {
    id: "fallback-" + Math.random().toString(36).substring(2, 12),
    model: options.model || CLAUDE_MODELS.DEFAULT,
    content: sampleCode,
    usage: {
      prompt_tokens: Math.ceil(prompt.length / 4),
      completion_tokens: Math.ceil(sampleCode.length / 4),
      total_tokens:
        Math.ceil(prompt.length / 4) + Math.ceil(sampleCode.length / 4),
    },
  };
}

/**
 * Verify the generated code using the Graffiticode API
 * @param {string} code - The generated code to verify
 * @param {string} accessToken - Authentication token for the API
 * @returns {Promise<Object>} - Compilation results including any errors
 */
async function verifyCode(code, authToken, rid = null) {

  const startTime = Date.now();

  if (rid) {
    ragLog(rid, "verification.start", {
      codeLength: code.length,
    });
  }

  try {
    const task = { lang: "0002", code };
    let id;
    try {
      const result = await postTask({
        auth: { token: authToken },
        task,
        ephemeral: true,
        isPublic: false,
      });
      id = result?.id;
    } catch (postError) {
      console.error("postTask() ERROR", postError);
      // Return error response if postTask fails
      return {
        status: "error",
        error: {
          message: `Failed to post task: ${postError.message || 'Internal Server Error'}`,
          statusCode: postError.statusCode || 500
        },
        data: null,
      };
    }

    if (!id) {
      return {
        status: "error",
        error: { message: "No task ID returned from postTask" },
        data: null,
      };
    }

    const compileResponse = await getData({ authToken, id });
    // Check if the response indicates an error but doesn't have a standardized error format
    if (compileResponse.status === "error" && !compileResponse.error) {
      // Provide a standardized error object
      compileResponse.error = {
        message: "Compilation failed",
        details: compileResponse.data?.errors || "Unknown error",
      };
    }

    // Check for specific error patterns in the response data
    if (/*compileResponse.status === "success" &&*/ compileResponse.data) {
      // Sometimes errors are embedded in the data object
      if (
        compileResponse.data.errors &&
        compileResponse.data.errors.length > 0
      ) {
        compileResponse.status = "error";
        compileResponse.errors = {
          message: "Compilation succeeded but found errors in code",
          details: compileResponse.data.errors,
        };
      }
    }
    if (rid) {
      ragLog(rid, "verification.complete", {
        status: compileResponse.status,
        hasErrors:
          !!compileResponse.errors || compileResponse.status === "error",
        errorSummary: compileResponse.errors
          ? JSON.stringify(compileResponse.errors).substring(0, 300)
          : null,
        latency: Date.now() - startTime,
      });
    }

    return compileResponse;
  } catch (error) {
    console.error("Error verifying Graffiticode:", error);

    if (rid) {
      ragLog(rid, "verification.error", {
        error: error.message,
        latency: Date.now() - startTime,
      });
    }

    return {
      status: "error",
      error: { message: error.message },
      data: null,
    };
  }
}

/**
 * Parse error information from Graffiticode compilation results
 * @param {Object} errorInfo - Error information from the API
 * @returns {string} - Formatted error details
 */
function parseGraffiticodeErrors(errorInfo) {
  let formattedErrors = "";

  // Handle different error formats
  if (errorInfo.error && errorInfo.error.message) {
    formattedErrors = errorInfo.error.message;
  } else if (errorInfo.data && errorInfo.data.errors) {
    // Extract and format each error
    const errors = Array.isArray(errorInfo.data.errors)
      ? errorInfo.data.errors
      : [errorInfo.data.errors];

    formattedErrors = errors
      .map((err) => {
        let errMsg = "";

        if (typeof err === "string") {
          return err;
        }

        if (err.message) {
          errMsg += err.message;
        }

        if (err.line) {
          errMsg += ` at line ${err.line}`;
        }

        if (err.col) {
          errMsg += `, column ${err.col}`;
        }

        if (err.expected) {
          errMsg += `\nExpected: ${err.expected}`;
        }

        if (err.found) {
          errMsg += `\nFound: ${err.found}`;
        }

        return errMsg;
      })
      .join("\n\n");
  } else if (typeof errorInfo === "string") {
    formattedErrors = errorInfo;
  } else {
    formattedErrors = JSON.stringify(errorInfo, null, 2);
  }

  return formattedErrors;
}

/**
 * Create a prompt for Claude to fix code based on compilation errors
 * @param {string} code - The original code that had errors
 * @param {Object} errorInfo - Information about the errors from compilation
 * @returns {string} - A prompt for Claude to fix the code
 */
function createErrorFixPrompt(code, errorInfo) {
  // Parse and format the error information
  const formattedErrors = parseGraffiticodeErrors(errorInfo);

  return JSON.stringify(
    {
      system: `You are an expert Graffiticode programmer tasked with fixing code errors.
Graffiticode is a minimal, prefix, expression-oriented language with these key features:
- \`let\` bindings with syntax: \`let name = value..\`
- No infix operators; use prefix calls like \`add 1 2\`
- Function application is prefix: \`fn arg1 arg2\`
- Use parentheses to control application order: \`map (double) [1 2 3]\`
- Anonymous lambdas use angle brackets: \`<x y: expr>\`
- Lists: \`[1 2 3]\`
- Records: \`{ name: "Alice" age: 30 }\`
- Access via \`get\`, \`nth\`, \`hd\`, \`tl\`, etc.
- Conditionals use \`if condition then x else y\`
- Includes built-in functions: \`map\`, \`filter\`, \`reduce\`
- Recursion is common; loops are not used
- Whitespace separates tokens; no commas required
- Line comments start with the pipe character: \`| This is a comment\`
- IMPORTANT: All let statements MUST end with a double dot (..)
- IMPORTANT: Backslashes should NOT be escaped in generated code
- IMPORTANT: Literal "\n" should not appear in the generated code; use proper newline characters instead
- IMPORTANT: Only generate valid Graffiticode. Any commentary should be elided or in line comments

Common Graffiticode errors and solutions:
1. Missing double dot (..) at the end of a let statement
2. Missing parentheses around function references: use (functionName) not functionName
3. Incorrect function application: use prefix notation like "add x y" not "x + y"
4. Improper lambda syntax: use angle brackets like <x: body> not other formats

When fixing code:
1. Carefully analyze the error messages
2. Make minimal changes to fix the issues
3. Return ONLY the corrected code with no additional commentary
4. Ensure all code is syntactically valid
5. Add helpful comments where appropriate with the pipe character |`,
      messages: [
        {
          role: "user",
          content: `The following Graffiticode has compilation errors:\n\n${code}\n\nError details:\n${formattedErrors}\n\nPlease fix the code and return only the corrected version.`,
        },
      ],
    },
    null,
    2,
  );
}


/**
 * Processes generated code to fix common issues and extract only the code portion
 * @param {string} content - The content returned from Claude API
 * @param {string} lang - The language/dialect ID (e.g., "0002", "0159")
 * @returns {Promise<string>} - The processed and reformatted code with fixes applied
 */
async function processGeneratedCode(content, lang = "0002", rid = null) {
  if (!content) return content;

  const originalLength = content.length;

  // Try to extract code from between triple backticks
  const codeBlockRegex = /```(?:[\w]*\n|\n)?([\s\S]*?)```/;
  const match = content.match(codeBlockRegex);

  // If we found a code block, extract it
  let code = match ? match[1].trim() : content;
  let processed = code;
  const codeBlockExtracted = !!match;

  // Try to reformat the code using the parser
  try {
    // Get the lexicon for the language
    const lexicon = await getLanguageLexicon(lang);

    // Use parser.reformat with the lang identifier (without L prefix)
    processed = await parser.reformat(lang, processed, lexicon, {});

    if (rid) {
      ragLog(rid, "reformat.success", {
        lang: `L${lang}`,
        lengthBefore: code.length,
        lengthAfter: processed.length,
      });
    }
  } catch (reformatError) {
    // If reformatting fails, log it but continue with the processed code
    if (rid) {
      ragLog(rid, "reformat.error", {
        error: reformatError.message,
        lang: `L${lang}`,
      });
    }
    console.warn(`Failed to reformat code for L${lang}:`, reformatError.message);
  }

  // Replace all double backslashes with single backslashes
  processed = processed.replace(/\\\\/g, "\\");

  // Replace literal "\n" with actual newlines
  processed = processed.replace(/\\n/g, "\n");

  if (rid) {
    ragLog(rid, "postprocess", {
      codeBlockExtracted,
      lengthBefore: originalLength,
      lengthAfter: processed.length,
    });
  }

  return processed;
}

/**
 * Generate code, verify it, and fix if needed, using relevant examples
 * @param {Object} params - Parameters for code generation
 * @param {string} params.prompt - The user's prompt
 * @param {Object} params.language - The target language object (e.g. {id: 2, name: "L0002"})
 * @param {Object} params.options - Options for the API call
 * @param {Object} params.auth - Authentication object containing token for verification
 * @returns {Promise<Object>} - The final code response
 */
interface GenerateCodeOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxContinuations?: number;  // Max number of continuation chunks (default: 5)
}

export async function generateCode({
  auth,
  prompt,
  lang = "0002",
  options = {},
  currentCode = null,
  rid = null,
  userId = null,
  sessionId = null,
  conversationSummary = null,
}: {
  auth: any;
  prompt: string;
  lang?: string;
  options?: GenerateCodeOptions;
  currentCode?: string | null;
  rid?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  conversationSummary?: ConversationSummary | null;
}) {
  const accessToken = auth?.token;

  // Generate request ID if not provided
  const requestId = rid || generateRequestId();

  // Initial model selection (may be overridden later based on formatted prompt)
  let modelToUse = options.model || CLAUDE_MODELS.DEFAULT;

  // Start analytics tracking (safe - won't break if unavailable)
  safeRAGAnalytics.startRequest(requestId, prompt, userId, sessionId, {
    lang,
    hasCurrentCode: !!currentCode,
    model: modelToUse,
  });

  // Model selection best practices:
  // - Default (Sonnet): Best for code generation, most tasks - faster and more cost-effective
  // - Override with OPUS only for: Very complex logic, multi-step reasoning
  // - Override with HAIKU for: Simple templates, basic transformations

  try {
    const config = getRAGConfig();
    let relevantExamples = [];

    // Only attempt retrieval if enabled
    if (config.enableVectorSearch || config.fallbackToKeywordSearch) {
      // Start retrieval stage
      safeRAGAnalytics.startStage(requestId, "retrieval");

      try {
        // Retrieve relevant examples with timeout protection
        relevantExamples = await withRAGFallback(
          async () => {
            return await getRelevantExamples({
              prompt,
              lang,
              limit: 3,
              rid: requestId,
            });
          },
          () => {
            // Fallback: return empty array if retrieval fails completely
            console.warn(`RAG retrieval failed for request ${requestId}, continuing without examples`);
            return [];
          },
          "example_retrieval"
        );
      } catch (error) {
        // Even if withRAGFallback fails, continue without examples
        console.warn("Failed to retrieve examples, continuing without them:", error.message);
        relevantExamples = [];
      }

      safeRAGAnalytics.endStage(requestId, "retrieval");

      // Mark which documents will be used
      if (relevantExamples && relevantExamples.length > 0) {
        safeRAGAnalytics.markDocumentsUsed(
          requestId,
          relevantExamples.map((ex, idx) => ex.id || `example-${idx}`)
        );
      }
    }

    // Try DSPy service for prompt construction (with fallback to legacy)
    let formattedPrompt: string;
    let usedDSPy = false;
    let promptSpecId: string | null = null;

    // Convert retrieved examples to RetrievedChunk format
    const retrievedChunks: RetrievedChunk[] = (relevantExamples || []).map((ex, idx) => ({
      id: ex.id || `example-${idx}`,
      prompt: ex.task || ex.description || "",
      code: ex.code || "",
      similarity: ex.similarity,
      keywordScore: ex.keywordScore,
      combinedScore: ex.combinedScore,
      tags: ex.tags,
    }));

    // Build context pack for DSPy
    const contextPack = buildContextPack({
      latestAsk: prompt,
      currentCode,
      conversationSummary,
      retrievedChunks,
      constraints: {
        dialect: lang,
        maxOutputTokens: options.maxTokens || 4096,
      },
      taskType: "codegen",
    });

    // Try DSPy service if enabled
    if (isDSPyEnabled()) {
      try {
        const promptSpec = await compilePromptSpec(contextPack, requestId);

        if (promptSpec) {
          // Render PromptSpec to Claude message format
          const renderContext: RenderContext = {
            userRequest: prompt,
            currentCode,
            conversationSummary,
            retrievedChunks,
            dialect: lang,
          };

          const rendered = renderPromptSpecToMessages(promptSpec, renderContext);

          // Convert to legacy format for compatibility with generateCodeWithContinuation
          formattedPrompt = JSON.stringify({
            system: rendered.systemPrompt,
            messages: rendered.messages,
          }, null, 2);

          usedDSPy = true;
          promptSpecId = promptSpec.specId;

          if (requestId) {
            ragLog(requestId, "dspy.prompt.rendered", {
              specId: promptSpec.specId,
              version: promptSpec.version,
              messageCount: rendered.messages.length,
            });
          }
        }
      } catch (error: any) {
        console.warn("DSPy prompt compilation failed, falling back to legacy:", error.message);
        if (requestId) {
          ragLog(requestId, "dspy.prompt.fallback", {
            reason: error.message,
          });
        }
      }
    }

    // Fall back to legacy prompt construction if DSPy didn't produce a result
    if (!usedDSPy) {
      // Create a well-formatted prompt for Claude to generate Graffiticode with dialect-specific instructions
      formattedPrompt = await createCodeGenerationPrompt(
        prompt,
        relevantExamples,
        lang,
        currentCode,
        rid,
      );
    }

    // Check formatted prompt for property update pattern and adjust model if needed
    if (!options.model) {
      try {
        // Parse the JSON formatted prompt to check the actual user content
        const promptData = JSON.parse(formattedPrompt);
        const lastUserMessage = promptData.messages[promptData.messages.length - 1];
        const userContent = lastUserMessage.content;

        // More robust detection of property updates
        // Look for property-related keywords followed by a JSON object in code blocks
        const propertiesPattern = /\b(propert(y|ies)(\s+(value|values|change|changes|update|updates))?)\b.*```json\s*[\n\s]*\{[\s\S]*?\}\s*[\n\s]*```/i;
        const hasPropertiesWithJson = propertiesPattern.test(userContent);

        // Also check for specific property update phrases
        const propertyUpdatePhrases = [
          "using these property",
          "use these property",
          "use these changed property",
          "apply these property",
          "apply property",
          "update.*property",
          "update.*using.*property",
          "property value",
          "property change",
          "property update",
          "properties value",
          "properties change",
          "properties update",
          "style.*property",
          "css.*property",
          "formatting.*property"
        ];

        const hasPropertyPhrase = propertyUpdatePhrases.some(phrase =>
          new RegExp(phrase, 'i').test(userContent)
        );

        // Check if this looks like a property update request
        let isPropertyUpdate = hasPropertiesWithJson || (hasPropertyPhrase && userContent.includes('```json'));

        if (isPropertyUpdate) {
          // Additional check: is this within a conversation context or direct?
          const hasNewRequestPattern = userContent.includes("Now, please address this new request:");

          // For property updates in conversation, check if they're in the current request
          if (hasNewRequestPattern) {
            const newRequestIndex = userContent.lastIndexOf("Now, please address this new request:");
            const afterNewRequest = userContent.substring(newRequestIndex);
            const propertyUpdateInCurrentRequest = propertiesPattern.test(afterNewRequest) ||
                                                  propertyUpdatePhrases.some(phrase =>
                                                    new RegExp(phrase, 'i').test(afterNewRequest)
                                                  );

            if (!propertyUpdateInCurrentRequest) {
              isPropertyUpdate = false;
            }
          }

          if (isPropertyUpdate) {
            // Check if current code is small enough for simple property updates
            // Haiku can handle property updates for code up to 4KB efficiently
            const currentCodeSize = currentCode ? currentCode.length : 0;

            if (currentCodeSize < 4000) {
              // Use Haiku for property update prompts with code under 4KB
              modelToUse = CLAUDE_MODELS.HAIKU;
            }
          }
        }
      } catch (e) {
        // Failed to parse formatted prompt for model selection
      }
    }

    // Start generation stage
    safeRAGAnalytics.startStage(requestId, "generation");
    const generationStartTime = Date.now();

    // Use the streaming service (always, as it handles both short and long responses)
    const streamResult = await generateCodeWithContinuation({
      formattedPrompt,  // Using the formatted prompt with examples
      lang,
      currentCode,
      options: {
        model: modelToUse,
        temperature: options.temperature || 0.2,
        maxTokens: options.maxTokens || 4096,
        maxContinuations: options.maxContinuations || 10  // Conservative default
      },
      onProgress: requestId ? (message) => ragLog(requestId, "streaming.progress", { message }) : undefined
    });

    const generationLatency = Date.now() - generationStartTime;
    safeRAGAnalytics.endStage(requestId, "generation");

    if (streamResult.error) {
      safeRAGAnalytics.trackError(requestId, "generation", streamResult.error);
      safeRAGAnalytics.trackGeneration(requestId, {
        model: modelToUse,
        latencyMs: generationLatency,
        success: false,
        errorMessage: streamResult.error,
      }, "");
      throw new Error(streamResult.error);
    }

    // Track successful generation
    safeRAGAnalytics.trackGeneration(requestId, {
      model: modelToUse,
      totalTokens: (streamResult.usage.inputTokens + streamResult.usage.outputTokens) || 0,
      latencyMs: generationLatency,
      temperature: options.temperature || 0.2,
      maxTokens: options.maxTokens || 4096,
      success: true,
    }, streamResult.code);

    // Process the generated code to fix any issues
    let generatedCode = await processGeneratedCode(streamResult.code, lang, rid);
    let verificationResult = null;
    let fixAttempts = 0;
    const MAX_FIX_ATTEMPTS = 2;
    let usedOpusForFix = false;  // Track if we upgraded to Opus for fixing
    let finalUsage = {
      prompt_tokens: streamResult.usage.inputTokens,
      completion_tokens: streamResult.usage.outputTokens,
      total_tokens: streamResult.usage.inputTokens + streamResult.usage.outputTokens
    };

    // Verify the code if an access token is provided
    if (accessToken) {
      safeRAGAnalytics.startStage(requestId, "compilation");

      // Attempt to verify and fix the code up to MAX_FIX_ATTEMPTS times
      while (fixAttempts < MAX_FIX_ATTEMPTS) {
        verificationResult = await verifyCode(generatedCode, accessToken, requestId);

        // If compilation was successful, break the loop
        if (
          verificationResult.status === "success" &&
          !verificationResult.error
        ) {
          safeRAGAnalytics.endStage(requestId, "compilation");
          safeRAGAnalytics.trackCompilation(requestId, {
            success: true,
            taskId: verificationResult.taskId,
            retryCount: fixAttempts,
            finalCode: generatedCode,
          });
          break;
        }

        // If there were errors, try to fix them
        if (
          verificationResult.errors ||
          verificationResult.status === "error"
        ) {
          // Classify the error type
          const errorType = classifyCompilerError(verificationResult);
          const structuredErrors = parseStructuredErrors(verificationResult);

          if (requestId) {
            ragLog(requestId, "fix.attempt", {
              attemptNumber: fixAttempts + 1,
              maxAttempts: MAX_FIX_ATTEMPTS,
              errorType,
              errorCount: structuredErrors.length,
              errorSummary: JSON.stringify(
                verificationResult.errors || verificationResult.error,
              ).substring(0, 300),
            });
          }

          let fixPrompt: string;
          let usedDSPyRepair = false;

          // For semantic errors, try DSPy repair flow if enabled
          if (errorType === "semantic" && isDSPyEnabled()) {
            try {
              const repairContextPack = {
                ...contextPack,
                taskType: "repair" as const,
                lastModelOutput: generatedCode,
                structuredCompilerErrors: structuredErrors,
              };

              const repairSpec = await compileRepairPromptSpec(repairContextPack, requestId);

              if (repairSpec) {
                const renderContext: RenderContext = {
                  userRequest: prompt,
                  currentCode: generatedCode,
                  conversationSummary,
                  retrievedChunks,
                  dialect: lang,
                };

                const rendered = renderPromptSpecToMessages(repairSpec, renderContext);

                fixPrompt = JSON.stringify({
                  system: rendered.systemPrompt,
                  messages: rendered.messages,
                }, null, 2);

                usedDSPyRepair = true;

                if (requestId) {
                  ragLog(requestId, "dspy.repair.rendered", {
                    specId: repairSpec.specId,
                    errorType,
                    errorCount: structuredErrors.length,
                  });
                }
              }
            } catch (error: any) {
              console.warn("DSPy repair compilation failed, falling back to legacy:", error.message);
              if (requestId) {
                ragLog(requestId, "dspy.repair.fallback", {
                  reason: error.message,
                  errorType,
                });
              }
            }
          }

          // Fall back to legacy fix prompt if DSPy repair didn't produce a result
          if (!usedDSPyRepair) {
            fixPrompt = createErrorFixPrompt(
              generatedCode,
              verificationResult,
            );
          }

          // Determine which model to use for fixes
          // If the initial generation used Sonnet or Haiku and failed, upgrade to Opus for better error fixing
          let fixModel = options.model || CLAUDE_MODELS.DEFAULT;
          if (fixAttempts === 0 && (fixModel === CLAUDE_MODELS.SONNET || fixModel === CLAUDE_MODELS.HAIKU)) {
            fixModel = CLAUDE_MODELS.OPUS;
            usedOpusForFix = true;
            if (requestId) {
              ragLog(requestId, "fix.model.upgrade", {
                originalModel: options.model || CLAUDE_MODELS.DEFAULT,
                upgradedModel: CLAUDE_MODELS.OPUS,
                reason: "First fix attempt after initial generation failure",
                usedDSPyRepair,
              });
            }
          }

          // Use streaming service to fix the code
          const fixResult = await generateCodeWithContinuation({
            formattedPrompt: fixPrompt,
            lang,
            currentCode: generatedCode,
            options: {
              model: fixModel,
              temperature: 0.1, // Lower temperature for more deterministic fixes
              maxTokens: options.maxTokens || 4096,
              maxContinuations: 10
            },
            onProgress: requestId ? (message) => ragLog(requestId, "fix.progress", { message }) : undefined
          });

          if (fixResult.error) {
            console.error("Failed to fix code:", fixResult.error);
            break;
          }

          // Update the generated code with the fixed version and process to fix escaping issues
          generatedCode = await processGeneratedCode(fixResult.code, lang, requestId);

          // Add fix attempt usage to total
          finalUsage.prompt_tokens += fixResult.usage.inputTokens;
          finalUsage.completion_tokens += fixResult.usage.outputTokens;
          finalUsage.total_tokens += fixResult.usage.inputTokens + fixResult.usage.outputTokens;

          fixAttempts++;
        } else {
          // No errors found, break the loop
          break;
        }
      }

      // Track final compilation result if we exited due to max attempts
      if (fixAttempts >= MAX_FIX_ATTEMPTS && verificationResult) {
        safeRAGAnalytics.endStage(requestId, "compilation");
        safeRAGAnalytics.trackCompilation(requestId, {
          success: false,
          errorMessage: verificationResult.error?.message || "Max fix attempts reached",
          retryCount: fixAttempts,
          finalCode: generatedCode,
        });
      }

    }

    // Ensure the code is properly processed one final time before returning
    const finalProcessedCode = await processGeneratedCode(generatedCode, lang, rid);

    // Track usage for token consumption
    if (auth?.uid && finalUsage.total_tokens > 0) {
      try {
        const db = getFirestoreDb();

        // Get user's subscription to determine pricing
        const userDoc = await db.doc(`users/${auth.uid}`).get();
        const userData = userDoc.data();
        const subscription = userData?.subscription || {};
        const plan = subscription.plan || 'demo';

        // Define token pricing per million tokens (in dollars) based on model actually used
        const TOKEN_PRICING = {
          [CLAUDE_MODELS.OPUS]: { input: 15, output: 75 },
          [CLAUDE_MODELS.SONNET]: { input: 3, output: 15 },
          [CLAUDE_MODELS.HAIKU]: { input: 0.25, output: 1.25 },
          [CLAUDE_MODELS.DEFAULT]: { input: 3, output: 15 }, // Default to Sonnet pricing
        };

        // Calculate weighted cost if multiple models were used
        let totalTokenCost = 0;
        let effectiveModelName = modelToUse;

        if (usedOpusForFix && fixAttempts > 0) {
          // If Opus was used for fixes, calculate a weighted average cost
          // Approximate: initial generation used original model, fixes used Opus
          // Since we don't track tokens per attempt, we'll use a conservative estimate:
          // - Initial generation: ~70% of tokens (with original model)
          // - Fix attempts: ~30% of tokens (with Opus)
          const initialRatio = 0.7;
          const fixRatio = 0.3;

          const initialModelPricing = TOKEN_PRICING[modelToUse] || TOKEN_PRICING[CLAUDE_MODELS.DEFAULT];
          const opusPricing = TOKEN_PRICING[CLAUDE_MODELS.OPUS];

          const initialInputCost = (finalUsage.prompt_tokens * initialRatio / 1000000) * initialModelPricing.input;
          const initialOutputCost = (finalUsage.completion_tokens * initialRatio / 1000000) * initialModelPricing.output;

          const fixInputCost = (finalUsage.prompt_tokens * fixRatio / 1000000) * opusPricing.input;
          const fixOutputCost = (finalUsage.completion_tokens * fixRatio / 1000000) * opusPricing.output;

          totalTokenCost = initialInputCost + initialOutputCost + fixInputCost + fixOutputCost;
          effectiveModelName = `${modelToUse}+Opus(fix)`;

        } else {
          // Single model was used throughout
          const modelPricing = TOKEN_PRICING[modelToUse] || TOKEN_PRICING[CLAUDE_MODELS.DEFAULT];
          const inputCost = (finalUsage.prompt_tokens / 1000000) * modelPricing.input;
          const outputCost = (finalUsage.completion_tokens / 1000000) * modelPricing.output;
          totalTokenCost = inputCost + outputCost;
        }

        // Define compile unit pricing (dollars per unit)
        const UNIT_PRICING = {
          demo: 0, // Demo tier doesn't charge but still tracks usage
          starter: 0, // Starter tier doesn't charge but still tracks usage
          pro: 0.001,  // $50/month for 50,000 units = $0.001 per unit
          max: 0.0005, // $500/month for 1,000,000 units = $0.0005 per unit
          teams: 0.0005, // Same as max
        };

        const unitPrice = UNIT_PRICING[plan] || UNIT_PRICING.pro; // Default to pro pricing if unknown

        // Convert to compile units
        // Formula: (price_per_token * token_count) / price_per_compile
        let compileUnits = 0;
        if (unitPrice > 0) {
          // For paid plans, calculate units based on cost
          compileUnits = Math.ceil(totalTokenCost / unitPrice);
        } else {
          // For starter plan, use a simple token-to-unit conversion (1000 tokens = 1 unit)
          compileUnits = Math.ceil(finalUsage.total_tokens / 1000);
        }

        // Ensure at least 1 unit is charged for any generation
        compileUnits = Math.max(1, compileUnits);

        const now = new Date();

        // Check if user is over limit before this operation
        let wasOverLimit = false;
        try {
          const overageUnits = subscription.overageUnits || 0;

          // Get plan allocation
          const planAllocations = {
            demo: 100,
            starter: 2000,
            pro: 100000,
            teams: 2000000
          };
          let allocatedUnits = planAllocations[plan] || 100;

          // Check for preserved allocation (from downgrade)
          const preservedUntil = subscription.preservedUntil;
          const preservedAllocation = subscription.preservedAllocation;
          if (preservedUntil && preservedAllocation && new Date(preservedUntil) > now) {
            allocatedUnits = preservedAllocation;
          }

          // Get current usage
          const usageDoc = await db.collection('usage').doc(auth.uid).get();
          const currentUsage = usageDoc.exists ? (usageDoc.data().currentMonthTotal || 0) : 0;

          // Calculate if over limit (before adding these new units)
          const totalAvailable = allocatedUnits + overageUnits;
          wasOverLimit = currentUsage >= totalAvailable;
        } catch (error) {
          console.error('Error checking usage limit:', error);
        }

        // Add individual usage record for audit trail
        await db.collection('usage').add({
          userId: auth.uid,
          taskId: requestId,
          units: compileUnits,
          createdAt: now,
          timestamp: now.toISOString(),
          lang: lang,
          type: 'ai_generation',
          model: effectiveModelName,
          baseModel: modelToUse,
          tokens: {
            input: finalUsage.prompt_tokens,
            output: finalUsage.completion_tokens,
            total: finalUsage.total_tokens,
          },
          cost: {
            total: totalTokenCost,
            breakdown: usedOpusForFix ? 'mixed_model' : 'single_model',
          },
          plan: plan,
          unitPrice: unitPrice,
          fixAttempts: fixAttempts,
          usedOpusForFix: usedOpusForFix,
          wasOverLimit: wasOverLimit
        });

        // Update monthly usage total
        const usageDocRef = db.collection('usage').doc(auth.uid);
        const usageDoc = await usageDocRef.get();

        if (usageDoc.exists) {
          const currentData = usageDoc.data();
          // Check if we need to reset monthly usage (new month)
          const lastReset = currentData.lastReset ? new Date(currentData.lastReset) : null;
          const isNewMonth = !lastReset ||
            lastReset.getMonth() !== now.getMonth() ||
            lastReset.getFullYear() !== now.getFullYear();

          if (isNewMonth) {
            // Reset for new month
            await usageDocRef.set({
              currentMonthTotal: compileUnits,
              lastReset: now.toISOString(),
              lastUpdated: now.toISOString()
            });
          } else {
            // Increment existing month total
            await usageDocRef.update({
              currentMonthTotal: (currentData.currentMonthTotal || 0) + compileUnits,
              lastUpdated: now.toISOString()
            });
          }
        } else {
          // Create new usage document
          await usageDocRef.set({
            currentMonthTotal: compileUnits,
            lastReset: now.toISOString(),
            lastUpdated: now.toISOString()
          });
        }
      } catch (error) {
        console.error("[generateCode] Failed to track usage:", error);
        // Don't throw - we still want to return the result even if usage tracking fails
      }
    }

    // Complete analytics tracking
    await safeRAGAnalytics.completeRequest(requestId, true);

    // Return formatted response with the language name
    const result = {
      code: finalProcessedCode,
      lang: lang,
      model: modelToUse,  // Use the actual model that was used
      usage: {
        input_tokens: finalUsage.prompt_tokens,
        output_tokens: finalUsage.completion_tokens,
      },
      verification: verificationResult,
      fixAttempts,
      usedOpusForFix,  // Indicate if we had to upgrade to Opus for fixing
      streaming: true,
      chunks: streamResult.chunks,
      requestId: requestId,  // Include for feedback tracking
      // DSPy telemetry
      usedDSPy,
      promptSpecId,
    };

    return result;
  } catch (error) {
    console.error(`Error generating code for ${lang}:`, error);

    // Track the error in analytics
    if (requestId) {
      safeRAGAnalytics.trackError(requestId, "request", error);
      await safeRAGAnalytics.completeRequest(requestId, false);
    }

    throw new Error(`Failed to generate code for ${lang}: ${error.message}`);
  }
}
