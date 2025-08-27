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
import { postApiCompile } from "./api";
import { postTask, getData } from "../pages/api/resolvers";
import admin from "firebase-admin";
import { ragLog } from "./logger";
import {
  generateEmbedding,
  createEmbeddingText,
  vectorSearch,
  hybridSearch,
  addDocumentWithEmbedding,
} from "./embedding-service";

// Define available Claude models with best practices
const CLAUDE_MODELS = {
  OPUS: "claude-opus-4-20250514",
  SONNET: "claude-sonnet-4-20250514",
  HAIKU: "claude-3-5-haiku-20241022",
  DEFAULT: "claude-opus-4-20250514",
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
    console.log(`Getting relevant examples for language: ${lang}`);

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
        vectorWeight: 0.7, // Balance between semantic and keyword matching
      });

      if (results && results.length > 0) {
        console.log(
          `Found ${results.length} relevant examples using vector search for L${lang}`,
        );

        if (rid) {
          ragLog(rid, "retrieval.result", {
            mode: "hybrid",
            k: limit,
            lang,
            resultCount: results.length,
            ids: results.map((r) => r.id || r.description?.substring(0, 50)),
            scores: results.map((r) => ({
              similarity: r.similarity,
              keywordScore: r.keywordScore,
              combinedScore: r.combinedScore,
            })),
          });
        }

        return results;
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
    console.log("Falling back to keyword-based search...");

    // Import local training data from markdown format only
    const fs = require("fs");
    const path = require("path");

    let examples = [];

    // Load the markdown file
    const mdFilePath = path.join(
      process.cwd(),
      `./training/l${lang}-training-examples.md`,
    );

    if (fs.existsSync(mdFilePath)) {
      // Read and parse the markdown file
      const markdownContent = fs.readFileSync(mdFilePath, "utf8");
      examples = parseMarkdownExamples(markdownContent);
      console.log(
        `Loaded ${examples.length} examples from markdown file for L${lang}`,
      );
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

    console.log(`Found ${topExamples.length} relevant examples for the prompt`);

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
 * Add a new training example to the database
 * @param {Object} example - The example to add
 * @param {string} example.description - Description of the example (optional if messages provided)
 * @param {string} example.code - The code for the example
 * @param {string} example.explanation - Explanation of how the code works (optional if messages provided)
 * @param {string} example.lang - Language code (e.g., "0002" for L0002)
 * @param {Array} example.messages - Optional array of message objects with {role, content} format
 * @returns {Promise<Object>} - Result of the operation
 */
export async function addTrainingExample(example) {
  try {
    // Validate example structure - either traditional format or dialog-based format
    const hasTraditionalFormat = example.description && example.code;
    const hasDialogFormat =
      example.messages &&
      Array.isArray(example.messages) &&
      example.messages.length > 0 &&
      example.code;

    if (!hasTraditionalFormat && !hasDialogFormat) {
      return {
        success: false,
        message:
          "Example must include either (description and code) or (messages array and code)",
      };
    }

    const db = getFirestoreDb();
    const trainingCollRef = db.collection("training_examples");

    // Generate keywords from all available text
    let textToIndexForKeywords = "";

    // For dialog-based examples, extract text from all messages
    if (example.messages && Array.isArray(example.messages)) {
      textToIndexForKeywords = example.messages
        .map((m) => m.content || "")
        .join(" ");

      // Generate a description from the first user message if none provided
      if (!example.description) {
        const userMessage = example.messages.find((m) => m.role === "user");
        if (userMessage) {
          example.description =
            userMessage.content.substring(0, 100) +
            (userMessage.content.length > 100 ? "..." : "");
        }
      }
    }
    // Fall back to description or code
    else if (example.description) {
      textToIndexForKeywords = example.description;
    }

    // Extract keywords for better searchability
    const keywords = textToIndexForKeywords
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !["function", "const", "return", "this", "that"].includes(word),
      );

    // Ensure the example has a language code (default to "0002" if not provided)
    const lang = example.lang || "0002";

    // Add the example to Firestore with embedding
    const docId = await addDocumentWithEmbedding({
      db: db,
      collection: "training_examples",
      data: {
        ...example,
        lang, // Make sure language is explicitly included
        keywords,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    return {
      success: true,
      message: `Training example added successfully for language ${lang} with embedding`,
      id: docId,
    };
  } catch (error) {
    console.error("Error adding training example:", error);
    return {
      success: false,
      message: `Failed to add example: ${error.message}`,
    };
  }
}

/**
 * Reads dialect-specific instructions from markdown files in the training directory
 * @param {string} lang - The language/dialect ID (e.g., "0002", "0159")
 * @returns {string} - The dialect-specific instructions, or empty string if none found
 */
function readDialectInstructions(lang) {
  try {
    const fs = require("fs");
    const path = require("path");

    // Form the path to the dialect instructions file
    const instructionsPath = path.join(
      process.cwd(),
      `./training/l${lang}-instructions.md`,
    );

    // Check if file exists
    if (fs.existsSync(instructionsPath)) {
      console.log(`Found dialect instructions for L${lang}`);
      // Read the file content
      const instructions = fs.readFileSync(instructionsPath, "utf8");
      return `\n${instructions}\n`;
    } else {
      console.log(`No dialect instructions file found for L${lang}`);
      return "";
    }
  } catch (error) {
    console.error(`Error reading dialect instructions for L${lang}:`, error);
    return "";
  }
}

/**
 * Returns the appropriate system prompt for a given dialect
 * @param {string} lang - The language/dialect ID (e.g., "0002", "0159")
 * @returns {string} - The customized system prompt
 */
function getSystemPromptForDialect(lang) {
  // Start with the base prompt
  let prompt = `
You are a programming assistant that translates natural language into code written in a functional DSL called **Graffiticode**, specifically dialect L${lang}.

Graffiticode is designed for end-user programming. Its syntax is simple, functional, and punctuation-light. Use only the language features below.`;

  // Try to read dialect-specific instructions from file first
  const fileInstructions = readDialectInstructions(lang);

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
  const dialectSystemPrompt = getSystemPromptForDialect(lang);

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
  console.log("verifyCode()", "code=" + code);

  const startTime = Date.now();

  if (rid) {
    ragLog(rid, "verification.start", {
      codeLength: code.length,
    });
  }

  try {
    const task = { lang: "0002", code };
    const { id } = await postTask({
      auth: { token: authToken },
      task,
      ephemeral: true,
      isPublic: false,
    });
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
 * Store successful code generation in Firebase for future reference
 * @param {string} prompt - User's original prompt
 * @param {string} code - Successfully generated code
 * @param {string} lang - Language code (e.g., "0002")
 * @param {boolean} verified - Whether the code passed verification
 */
async function storeSuccessfulGeneration(
  prompt,
  code,
  lang = "0002",
  verified = true,
  rid = null,
) {
  try {
    const db = getFirestoreDb();

    // Store in a separate collection for successful generations with embedding
    const docRef = await addDocumentWithEmbedding({
      db: db,
      collection: "successful_generations",
      data: {
        prompt,
        code,
        lang: lang, // Store the language code
        verified,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // Extract keywords for better searchability
        keywords: prompt
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 3),
      },
    });

    console.log(
      `Stored successful generation with embedding for language ${lang}`,
    );

    if (rid) {
      ragLog(rid, "persistence.success", {
        docId: docRef?.id,
        lang,
        verified,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Just log error but don't interrupt the main flow
    console.error("Failed to store successful generation:", error);

    if (rid) {
      ragLog(rid, "persistence.error", {
        error: error.message,
      });
    }
  }
}

/**
 * Processes generated code to fix common issues and extract only the code portion
 * @param {string} content - The content returned from Claude API
 * @returns {string} - The processed code with fixes applied
 */
function processGeneratedCode(content, rid = null) {
  if (!content) return content;

  const originalLength = content.length;

  // Try to extract code from between triple backticks
  const codeBlockRegex = /```(?:[\w]*\n|\n)?([\s\S]*?)```/;
  const match = content.match(codeBlockRegex);

  // If we found a code block, extract it
  let code = match ? match[1].trim() : content;
  const codeBlockExtracted = !!match;

  // Replace all double backslashes with single backslashes
  let processed = code.replace(/\\\\/g, "\\");

  // Replace literal "\n" with actual newlines
  processed = processed.replace(/\\n/g, "\n");

  // Replace escaped quotes with bare quotes
  processed = processed.replace(/\\"/g, '"'); // Replace \" with "
  processed = processed.replace(/\\'/g, "'"); // Replace \' with '
  processed = processed.replace(/\\`/g, "`"); // Replace \` with `

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
}

export async function generateCode({
  auth,
  prompt,
  lang = "0002",
  options = {},
  currentCode = null,
  rid = null,
}: {
  auth: any;
  prompt: string;
  lang?: string;
  options?: GenerateCodeOptions;
  currentCode?: string | null;
  rid?: string | null;
}) {
  const accessToken = auth?.token;
  console.log("generateCode()", "prompt=" + prompt);

  // Model selection best practices:
  // - Default (Sonnet 3.5): Best for code generation, most tasks
  // - Override with OPUS only for: Very complex logic, multi-step reasoning
  // - Override with HAIKU for: Simple templates, basic transformations

  try {
    // Retrieve relevant examples for this prompt, filtered by language
    const relevantExamples = await getRelevantExamples({
      prompt,
      lang,
      limit: 3,
      rid,
    });
    console.log(
      `Found ${relevantExamples.length} relevant examples for the prompt in language ${lang}`,
    );
    // Create a well-formatted prompt for Claude to generate Graffiticode with dialect-specific instructions
    const formattedPrompt = await createCodeGenerationPrompt(
      prompt,
      relevantExamples,
      lang,
      currentCode,
      rid,
    );

    // Use Claude 3.5 Sonnet for code generation - best balance of performance and cost
    const model = options.model || CLAUDE_MODELS.DEFAULT;

    // Set up API call options
    const apiOptions = {
      model,
      temperature: options.temperature || 0.2, // Lower temperature for more deterministic code generation
      max_tokens: options.maxTokens || 4000,
    };

    console.log("generateCode()", "formattedPrompt=" + formattedPrompt);

    // Call the Claude API
    const response = await callClaudeAPI(formattedPrompt, apiOptions, rid);
    // Process the generated code to fix double backslashes and other issues
    let generatedCode = processGeneratedCode(response.content, rid);
    console.log("[1] generateCode()", "generatedCode=" + generatedCode);
    let verificationResult = null;
    let fixAttempts = 0;
    const MAX_FIX_ATTEMPTS = 2;
    let finalUsage = { ...response.usage };

    // Verify the code if an access token is provided
    if (accessToken) {
      // Attempt to verify and fix the code up to MAX_FIX_ATTEMPTS times
      while (fixAttempts < MAX_FIX_ATTEMPTS) {
        verificationResult = await verifyCode(generatedCode, accessToken, rid);

        // If compilation was successful, break the loop
        if (
          verificationResult.status === "success" &&
          !verificationResult.error
        ) {
          // Store this successful generation for future training
          await storeSuccessfulGeneration(
            prompt,
            generatedCode,
            lang,
            true,
            rid,
          );
          break;
        }

        // If there were errors, try to fix them
        if (
          verificationResult.errors ||
          verificationResult.status === "error"
        ) {
          console.log(
            `Code has errors, attempting fix (${fixAttempts + 1}/${MAX_FIX_ATTEMPTS})...`,
          );

          if (rid) {
            ragLog(rid, "fix.attempt", {
              attemptNumber: fixAttempts + 1,
              maxAttempts: MAX_FIX_ATTEMPTS,
              errorSummary: JSON.stringify(
                verificationResult.errors || verificationResult.error,
              ).substring(0, 300),
            });
          }

          // Create a prompt to fix the errors
          const fixPrompt = createErrorFixPrompt(
            generatedCode,
            verificationResult,
          );

          // Call the Claude API again to fix the code
          const fixResponse = await callClaudeAPI(
            fixPrompt,
            {
              ...apiOptions,
              temperature: 0.1, // Lower temperature for more deterministic fixes
            },
            rid,
          );

          // Update the generated code with the fixed version and process to fix escaping issues
          generatedCode = processGeneratedCode(fixResponse.content, rid);
          console.log("[2] generateCode()", "generatedCode=" + generatedCode);

          // Add fix attempt usage to total
          finalUsage.prompt_tokens += fixResponse.usage.prompt_tokens;
          finalUsage.completion_tokens += fixResponse.usage.completion_tokens;
          finalUsage.total_tokens += fixResponse.usage.total_tokens;

          fixAttempts++;
        } else {
          // No errors found, break the loop
          break;
        }
      }

      // If we've reached max fix attempts but code still works, store it anyway
      if (
        fixAttempts >= MAX_FIX_ATTEMPTS &&
        verificationResult.status !== "error"
      ) {
        await storeSuccessfulGeneration(
          prompt,
          generatedCode,
          lang,
          false,
          rid,
        );
      }
    }

    // Generate a description of the code
    // Create a prompt for Claude to describe the code
    const descriptionPrompt = JSON.stringify(
      {
        system: `
You are an expert Graffiticode programmer tasked with describing in simple terms
the solution that the generated code creates. Analyze the provided Graffiticode
and explain what it does in a single sentence of plain English. Focus on
explaining the purpose and functionality without technical jargon. Keep your
description concise and user-friendly, so people unfamiliar with programming can
understand.
IMPORTANT: Always phrase your description to describe the effect of the code, not
the code itself.
`,
        messages: [
          {
            role: "user",
            content: `
Please provide a brief, clear description of what application that this
generated Graffiticode does in a single sentence:

${generatedCode}

Explain it in one sentence of simple language that anyone can understand.
`,
          },
        ],
      },
      null,
      2,
    );

    console.log(
      "\n============= DESCRIPTION GENERATION PROMPT =============\n",
    );
    console.log(descriptionPrompt);
    console.log("\n============= END DESCRIPTION PROMPT =============\n");

    // Call Claude API to get the description
    const descriptionResponse = await callClaudeAPI(descriptionPrompt, {
      model: CLAUDE_MODELS.HAIKU, // Use Haiku for simple description generation (fast and cheap)
      temperature: 0.2,
      max_tokens: 200, // Short description only
    });

    console.log(
      "generateCode()",
      "descriptionResponse=" + JSON.stringify(descriptionResponse, null, 2),
    );

    // Add the description tokens to the usage metrics
    finalUsage.prompt_tokens += descriptionResponse.usage.prompt_tokens;
    finalUsage.completion_tokens += descriptionResponse.usage.completion_tokens;
    finalUsage.total_tokens += descriptionResponse.usage.total_tokens;

    // Ensure the code is properly processed one final time before returning
    const finalProcessedCode = processGeneratedCode(generatedCode);

    // Return formatted response with the language name and description
    return {
      code: finalProcessedCode,
      description: descriptionResponse.content,
      lang: lang,
      model: response.model,
      usage: {
        input_tokens: finalUsage.prompt_tokens,
        output_tokens: finalUsage.completion_tokens,
      },
      verification: verificationResult,
      fixAttempts,
    };
  } catch (error) {
    console.error(`Error generating code for ${lang}:`, error);
    throw new Error(`Failed to generate code for ${lang}: ${error.message}`);
  }
}
