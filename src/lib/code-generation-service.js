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
import admin from 'firebase-admin';

// Define available Claude models
const CLAUDE_MODELS = {
  OPUS: 'claude-3-opus-20240229',
  SONNET: 'claude-3-sonnet-20240229',
  HAIKU: 'claude-3-haiku-20240307',
  DEFAULT: 'claude-3-sonnet-20240229' // Default to Sonnet as a good balance
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
    // If admin isn't initialized, initialize it with our project
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'graffiticode'
      });
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
    const sections = markdownContent.split('---');
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      // Extract task and code from each section
      const taskMatch = section.match(/###\s*Task\s*\n"([^"]+)"/);
      const codeMatch = section.match(/###\s*Graffiticode\s*\n([\s\S]+?)(?=\n\n|$)/);
      
      if (taskMatch && codeMatch) {
        examples.push({
          task: taskMatch[1].trim(),
          code: codeMatch[1].trim(),
          // Create a messages array for compatibility with existing code
          messages: [
            { role: 'user', content: taskMatch[1].trim() },
            { role: 'assistant', content: `\`\`\`\n${codeMatch[1].trim()}\n\`\`\`` }
          ]
        });
      }
    }
    
    return examples;
  } catch (error) {
    console.error('Error parsing markdown examples:', error);
    return [];
  }
}

async function getRelevantExamples({ prompt, lang, limit = 3 }) {
  console.log(
    "getRelevantExamples()",
    "lang=" + JSON.stringify(lang, null, 2),
  );

  try {
    console.log(`Getting relevant examples for language: ${lang}`);

    // Import local training data from markdown format
    const fs = require('fs');
    const path = require('path');
    
    let examples = [];
    
    // Try to load the markdown file first
    const mdFilePath = path.join(process.cwd(), `./training/l${lang}-training-examples.md`);
    
    if (fs.existsSync(mdFilePath)) {
      // Read and parse the markdown file
      const markdownContent = fs.readFileSync(mdFilePath, 'utf8');
      examples = parseMarkdownExamples(markdownContent);
      console.log(`Loaded ${examples.length} examples from markdown file for L${lang}`);
    } else {
      // Fall back to JSON if markdown file doesn't exist
      const jsonFilePath = path.join(process.cwd(), `./training/l${lang}-training-examples.json`);
      if (fs.existsSync(jsonFilePath)) {
        examples = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        console.log(`Loaded ${examples.length} examples from JSON file for L${lang}`);
      } else {
        console.warn(`No training examples file found for L${lang}`);
        return [];
      }
    }

    // Simple keyword matching to find relevant examples
    const keywords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Score examples based on keyword matches
    const scoredExamples = examples.map(example => {
      // For markdown examples, search through task and code
      let textToSearch = '';
      
      if (example.task) {
        // For markdown format
        textToSearch = (example.task + ' ' + example.code).toLowerCase();
      } else if (example.messages) {
        // For dialog-based examples in JSON format
        textToSearch = example.messages.map(m => m.content).join(' ').toLowerCase();
      } else {
        // Fallback for other formats
        textToSearch = (example.description || '').toLowerCase();
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
    console.log(
      "getRelevantExamples()",
      "topExamples=" + JSON.stringify(topExamples, null, 2),
    );
    return topExamples;
  } catch (error) {
    console.error('Error retrieving training examples:', error);
    // Fallback to returning empty array if there's an error
    return [];
  }
}

/**
 * Initialize the training_examples collection in Firestore
 * This should be run once to populate the database with examples
 * @param {string} targetLanguage - Optional language code to initialize (e.g., "0002" for L0002)
 */
export async function initializeTrainingExamples(lang = null) {
  try {
    const db = getFirestoreDb();
    const trainingCollRef = db.collection('training_examples');

    // Check if collection already has data
    let snapshot;
    if (lang) {
      // If filtering by language, check if examples for this language exist
      snapshot = await trainingCollRef
        .where('lang', '==', lang)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        console.log(`Training examples for language ${lang} already initialized`);
        return {
          success: true,
          message: `Examples for language ${lang} already initialized`
        };
      }
    } else {
      // Otherwise check for any examples
      snapshot = await trainingCollRef.limit(1).get();
      if (!snapshot.empty) {
        console.log('Training examples collection already initialized');
        return { success: true, message: 'Collection already initialized' };
      }
    }

    // Import local training data
    const fs = require('fs');
    const path = require('path');
    const localExamples = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'training_examples.json'),
        'utf8'
      )
    );

    // Filter examples by language if specified
    const exampleToImport = lang
      ? localExamples.filter(ex => {
          // If example has a lang field use it, otherwise assume it's for L0002
          const exampleLang = ex.lang || "0002";
          return exampleLang === lang;
        })
      : localExamples;

    if (exampleToImport.length === 0) {
      return {
        success: false,
        message: `No examples found for language ${lang}`
      };
    }

    // Prepare batch writes (Firestore has a limit of 500 writes per batch)
    const batch = db.batch();
    let batchCount = 0;
    let totalAdded = 0;

    for (const example of exampleToImport) {
      // Generate keywords from all available text
      let textToIndexForKeywords = '';

      // For dialog-based examples, extract text from all messages
      if (example.messages && Array.isArray(example.messages)) {
        textToIndexForKeywords = example.messages
          .map(m => m.content || '')
          .join(' ');
      }
      // Fall back to description or code if no messages
      else if (example.description) {
        textToIndexForKeywords = example.description;
      } else if (example.code) {
        textToIndexForKeywords = example.code;
      }

      // Extract keywords for better searchability
      const keywords = textToIndexForKeywords.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !['function', 'const', 'return', 'this', 'that'].includes(word));

      const docRef = trainingCollRef.doc();

      // Ensure each example has the language code
      const lang = example.lang || "0002"; // Default to L0002 if not specified

      // For examples with no description but with messages, generate a description
      let description = example.description;
      if (!description && example.messages && example.messages.length > 0) {
        // Find the first user message to use as description
        const userMessage = example.messages.find(m => m.role === 'user');
        if (userMessage) {
          description = userMessage.content.substring(0, 100) +
            (userMessage.content.length > 100 ? '...' : '');
        }
      }

      batch.set(docRef, {
        ...example,
        lang,               // Explicitly set language
        description,        // Add generated description if needed
        keywords,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      batchCount++;
      totalAdded++;

      // Commit when batch size reaches 499
      if (batchCount >= 499) {
        await batch.commit();
        console.log(`Committed batch of ${batchCount} examples`);
        batchCount = 0;
      }
    }

    // Commit any remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} examples`);
    }

    return {
      success: true,
      message: lang
        ? `Added ${totalAdded} training examples for language ${lang} to Firestore`
        : `Added ${totalAdded} training examples to Firestore`
    };

  } catch (error) {
    console.error('Error initializing training examples:', error);
    return {
      success: false,
      message: `Failed to initialize: ${error.message}`
    };
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
    const hasDialogFormat = example.messages && Array.isArray(example.messages) &&
                           example.messages.length > 0 && example.code;

    if (!hasTraditionalFormat && !hasDialogFormat) {
      return {
        success: false,
        message: 'Example must include either (description and code) or (messages array and code)'
      };
    }

    const db = getFirestoreDb();
    const trainingCollRef = db.collection('training_examples');

    // Generate keywords from all available text
    let textToIndexForKeywords = '';

    // For dialog-based examples, extract text from all messages
    if (example.messages && Array.isArray(example.messages)) {
      textToIndexForKeywords = example.messages
        .map(m => m.content || '')
        .join(' ');

      // Generate a description from the first user message if none provided
      if (!example.description) {
        const userMessage = example.messages.find(m => m.role === 'user');
        if (userMessage) {
          example.description = userMessage.content.substring(0, 100) +
            (userMessage.content.length > 100 ? '...' : '');
        }
      }
    }
    // Fall back to description or code
    else if (example.description) {
      textToIndexForKeywords = example.description;
    }

    // Extract keywords for better searchability
    const keywords = textToIndexForKeywords.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !['function', 'const', 'return', 'this', 'that'].includes(word));

    // Ensure the example has a language code (default to "0002" if not provided)
    const lang = example.lang || "0002";

    // Add the example to Firestore
    const docRef = await trainingCollRef.add({
      ...example,
      lang,     // Make sure language is explicitly included
      keywords,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: `Training example added successfully for language ${lang}`,
      id: docRef.id
    };

  } catch (error) {
    console.error('Error adding training example:', error);
    return {
      success: false,
      message: `Failed to add example: ${error.message}`
    };
  }
}

const baseSystemPrompt = `
You are a programming assistant that translates natural language into code written in a functional DSL called **Graffiticode**, specifically dialect L0002.

Graffiticode is designed for end-user programming. Its syntax is simple, functional, and punctuation-light. Use only the language features below.

## Core Syntax Rules
- Use \`let name = value..\` for declarations
- All functions are prefix notation: \`add 1 2\` (no infix allowed)
- Lambdas use angle brackets: \`<x y: expr>\`
- All top-level expressions must end with \`..\`
- Use parentheses to pass functions or delay application: \`map (double) [1 2 3]\`
- Whitespace separates tokens; commas and parens are optional but allowed
- Static types are inferred; no type annotations
- No mutation; all data is immutable
- Function calls with too few arguments return a partially applied function (currying)

## Built-in Types
- **Numbers**: \`42\`, \`-3.14\`
- **Strings**: \`"hello"\` or multiline with \`'hello,\\nworld!'\`; supports interpolation: \` \\\`hello, \${name}!\\\` \`
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

### String
\`concat\`, string interpolation

### Output
\`print\`

### Dialect L0002 Built-ins
- \`hello string..\` — display text
- \`theme dark..\` — set theme; arg is tag: \`dark\` or \`light\`

Only return idiomatic, valid Graffiticode. Use readable names. Output **only the code** unless explanation is requested.
`.trim();

/**
 * Generate examples section from retrieved training examples
 * @param {Array} examples - Array of training examples
 * @returns {string} - Formatted examples section for the system prompt
 */
function generateExamplesSection(examples) {
  if (!examples || examples.length === 0) return '';

  let examplesText = `\n\n## RELEVANT EXAMPLES:\n\n`;

  examples.forEach((example, i) => {
    if (example.task && example.code) {
      // Handle markdown-based examples (new format)
      examplesText += `### Example ${i+1}: ${example.task}\n`;
      examplesText += "Task: " + example.task + "\n\n";
      examplesText += "```\n";
      examplesText += example.code;
      examplesText += "\n```\n\n";
    } else if (example.messages && Array.isArray(example.messages) && example.messages.length > 0) {
      // Handle dialog-based examples (legacy format)
      examplesText += `### Example ${i+1}: Dialog Interaction\n`;
      examplesText += "Here's a relevant example of this type of task:\n\n";

      example.messages.forEach(message => {
        const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
        examplesText += `**${roleLabel}**: ${message.content}\n\n`;
      });

      // If we have code, also include it separately
      if (example.code && !example.messages.some(m => m.content.includes(example.code))) {
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
      examplesText += `### Example ${i+1}: ${example.description || 'Graffiticode Example'}\n`;
      examplesText += "```\n";
      examplesText += example.code;
      examplesText += "\n```\n";
      examplesText += `${example.explanation || 'An example of Graffiticode.'}\n\n`;
    }
  });

  return examplesText;
}

/**
 * Create a prompt for Claude that will generate high-quality code
 * @param {string} userPrompt - The user's original prompt
 * @param {Array} examples - Relevant examples to include
 * @returns {string} - A well-formatted prompt for Claude
 */
async function createCodeGenerationPrompt(userPrompt, examples = []) {
  // Generate examples section from retrieved examples
  const examplesSection = generateExamplesSection(examples);

  // Combine base system prompt with examples
  const enhancedSystemPrompt = baseSystemPrompt + examplesSection;

  const promptData = {
    system: enhancedSystemPrompt,
    messages: [
      {
        role: "user",
        content: "Generate code that doubles every number in the list [1, 2, 3]."
      },
      {
        role: "assistant",
        content: `
| Define a function to double a number
let double = <x: add x x>..
| Apply the double function to each number in the list
let result = map (double) [1 2 3]..
        `.trim()
      },
      {
        role: "user",
        content: "Get the total price of all in-stock items in a product list with a 10% discount."
      },
      {
        role: "assistant",
        content: `
| Function to check if an item is in stock
let inStock = <item: gt get item "stock" 0>..

| Function to apply a discount to an item's price
let applyDiscount = <item discount: {
  id: get "id" item
  name: get "name" item
  | Multiply price by (1 - discount)
  price: mul get "price" item sub 1 discount
  stock: get "stock" item
}>..

| Function to calculate the total price of all items
let calculateTotal = <items: reduce (<item total: add total get "price" item>) 0 items>..

| Filter for only in-stock items
let availableItems = filter (inStock) products..

| Apply a 10% discount to all available items
let discountedItems = map (<item: applyDiscount item 0.1>) availableItems..

| Calculate the final total price
let total = calculateTotal discountedItems..

| Print the text 'hello, world!'
print "hello, world!"..

`.trim()
      },
      {
        role: "user",
        content: userPrompt,
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
async function callClaudeAPI(prompt, options) {
  // Get the API key from environment variables
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not found in environment. Falling back to mock response.");
    // Return fallback mock response if API key is not available
    return getFallbackResponse(prompt, options);
  }

  try {
    console.log(`Calling Claude API (${options.model}) with prompt:`, prompt.substring(0, 50) + "...");

    // Anthropic API endpoint
    const apiUrl = "https://api.anthropic.com/v1/messages";

    // Prepare the request payload
    const payload = {
      model: options.model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: options.max_tokens,
      temperature: options.temperature
    };

    // Make the API call
    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    });

    // Extract the relevant data from the response
    const result = {
      id: response.data.id,
      model: response.data.model,
      content: response.data.content[0].text,
      usage: {
        prompt_tokens: response.data.usage.input_tokens,
        completion_tokens: response.data.usage.output_tokens,
        total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens
      }
    };

    return result;
  } catch (error) {
    console.error("Error calling Claude API:", error.response?.data || error.message);

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
      total_tokens: Math.ceil(prompt.length / 4) + Math.ceil(sampleCode.length / 4)
    }
  };
}

/**
 * Verify the generated code using the Graffiticode API
 * @param {string} code - The generated code to verify
 * @param {string} accessToken - Authentication token for the API
 * @returns {Promise<Object>} - Compilation results including any errors
 */
async function verifyCode(code, authToken) {
  try {
    const task = {lang: "0002", code};
    console.log(
      "verifyCode()",
      "auth=" + JSON.stringify(authToken),
      "task=" + JSON.stringify(task, null, 2),
    );
    const { id } = await postTask({auth: {token: authToken}, task, ephemeral: true});
    console.log(
      "verifyCode()",
      "id=" + id,
    );
    const  compileResponse = await getData({authToken, id});
    console.log(
      "verifyCode()",
      "data=" + JSON.stringify(compileResponse, null, 2),
    );

    // Check if the response indicates an error but doesn't have a standardized error format
    if (compileResponse.status === "error" && !compileResponse.error) {
      // Provide a standardized error object
      compileResponse.error = {
        message: "Compilation failed",
        details: compileResponse.data?.errors || "Unknown error"
      };
    }

    // Check for specific error patterns in the response data
    if (/*compileResponse.status === "success" &&*/ compileResponse.data) {
      // Sometimes errors are embedded in the data object
      if (compileResponse.data.errors && compileResponse.data.errors.length > 0) {
        compileResponse.status = "error";
        compileResponse.errors = {
          message: "Compilation succeeded but found errors in code",
          details: compileResponse.data.errors
        };
      }
    }
    return compileResponse;
  } catch (error) {
    console.error("Error verifying Graffiticode:", error);
    return {
      status: "error",
      error: { message: error.message },
      data: null
    };
  }
}

/**
 * Parse error information from Graffiticode compilation results
 * @param {Object} errorInfo - Error information from the API
 * @returns {string} - Formatted error details
 */
function parseGraffiticodeErrors(errorInfo) {
  let formattedErrors = '';

  // Handle different error formats
  if (errorInfo.error && errorInfo.error.message) {
    formattedErrors = errorInfo.error.message;
  } else if (errorInfo.data && errorInfo.data.errors) {
    // Extract and format each error
    const errors = Array.isArray(errorInfo.data.errors)
      ? errorInfo.data.errors
      : [errorInfo.data.errors];

    formattedErrors = errors.map(err => {
      let errMsg = '';

      if (typeof err === 'string') {
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
    }).join('\n\n');
  } else if (typeof errorInfo === 'string') {
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

  return JSON.stringify({
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
        content: `The following Graffiticode has compilation errors:\n\n${code}\n\nError details:\n${formattedErrors}\n\nPlease fix the code and return only the corrected version.`
      }
    ]
  }, null, 2);
}

/**
 * Store successful code generation in Firebase for future reference
 * @param {string} prompt - User's original prompt
 * @param {string} code - Successfully generated code
 * @param {string} lang - Language code (e.g., "0002")
 * @param {boolean} verified - Whether the code passed verification
 */
async function storeSuccessfulGeneration(prompt, code, lang = "0002", verified = true) {
  try {
    const db = getFirestoreDb();

    // Store in a separate collection for successful generations
    await db.collection('successful_generations').add({
      prompt,
      code,
      lang: lang,  // Store the language code
      verified,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Extract keywords for better searchability
      keywords: prompt.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
    });

    console.log(`Stored successful generation for language ${lang} for future reference`);
  } catch (error) {
    // Just log error but don't interrupt the main flow
    console.error('Failed to store successful generation:', error);
  }
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
export async function generateCode({ auth, prompt, lang = "0002", options = {} }) {
  console.log(
    "generateCode()",
    "auth=" + JSON.stringify(auth, null, 2),
    "lang=" + lang,
  );

  const accessToken = auth?.token;

  try {
    // Retrieve relevant examples for this prompt, filtered by language
    const relevantExamples = await getRelevantExamples({prompt, lang, limit: 3});
    console.log(`Found ${relevantExamples.length} relevant examples for the prompt in language ${lang}`);
    console.log(
      "generateCode()",
      "relevantExamples=" + JSON.stringify(relevantExamples, null, 2),
    );


    // Create a well-formatted prompt for Claude to generate Graffiticode
    const formattedPrompt = await createCodeGenerationPrompt(prompt, relevantExamples);

    console.log(
      "generateCode()",
      "lang=" + JSON.stringify(lang),
      "formattedPrompt=" + formattedPrompt,
    );

    // Use the most capable model for Graffiticode generation
    const model = options.model || CLAUDE_MODELS.OPUS;

    // Set up API call options
    const apiOptions = {
      model,
      temperature: options.temperature || 0.2, // Lower temperature for more deterministic code generation
      max_tokens: options.maxTokens || 4000
    };

    // Call the Claude API
    const response = await callClaudeAPI(formattedPrompt, apiOptions);
    let generatedCode = response.content;
    let verificationResult = null;
    let fixAttempts = 0;
    const MAX_FIX_ATTEMPTS = 2;
    let finalUsage = { ...response.usage };

    // Verify the code if an access token is provided
    if (accessToken) {
      // Attempt to verify and fix the code up to MAX_FIX_ATTEMPTS times
      while (fixAttempts < MAX_FIX_ATTEMPTS) {
        console.log(
          "generateCode()",
          "generatedCode=" + generatedCode,
        );
        verificationResult = await verifyCode(generatedCode, accessToken);

        // If compilation was successful, break the loop
        if (verificationResult.status === "success" && !verificationResult.error) {
          // Store this successful generation for future training
          await storeSuccessfulGeneration(prompt, generatedCode, lang, true);
          break;
        }

        // If there were errors, try to fix them
        if (verificationResult.errors || verificationResult.status === "error") {
          console.log(`Code has errors, attempting fix (${fixAttempts + 1}/${MAX_FIX_ATTEMPTS})...`);

          // Create a prompt to fix the errors
          const fixPrompt = createErrorFixPrompt(generatedCode, verificationResult);

          // Call the Claude API again to fix the code
          const fixResponse = await callClaudeAPI(fixPrompt, {
            ...apiOptions,
            temperature: 0.1 // Lower temperature for more deterministic fixes
          });

          // Update the generated code with the fixed version
          generatedCode = fixResponse.content;

          // Add fix attempt usage to total
          finalUsage.prompt_tokens += fixResponse.usage.prompt_tokens;
          finalUsage.completion_tokens += fixResponse.usage.completion_tokens;
          finalUsage.total_tokens += fixResponse.usage.total_tokens;

          fixAttempts++;
          console.log(
            "generateCode()",
            "generatedCode=" + generatedCode,
          );
        } else {
          // No errors found, break the loop
          break;
        }
      }

      // If we've reached max fix attempts but code still works, store it anyway
      if (fixAttempts >= MAX_FIX_ATTEMPTS && verificationResult.status !== "error") {
        await storeSuccessfulGeneration(prompt, generatedCode, lang, false);
      }
    }

    // Return formatted response with the language name
    return {
      code: generatedCode,
      lang: lang,
      model: response.model,
      usage: {
        input_tokens: finalUsage.prompt_tokens,
        output_tokens: finalUsage.completion_tokens
      },
      verification: verificationResult,
      fixAttempts
    };
  } catch (error) {
    console.error(`Error generating code for ${lang}:`, error);
    throw new Error(`Failed to generate code for ${lang}: ${error.message}`);
  }
}
