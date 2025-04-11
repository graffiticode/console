/**
 * Code generation service for Claude API integration
 *
 * This service implements:
 * 1. Language detection from prompts
 * 2. API calls to Claude for code generation
 * 3. Token usage tracking
 * 4. Code verification via Graffiticode API
 * 5. Error correction via Claude
 */

import axios from "axios";
import { postApiCompile } from "./api";
import { postTask, getData } from "../pages/api/resolvers";

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

const claudePrompt = {
  system: `
You are a programming assistant that translates natural language requests into code written in a functional DSL called Graffiticode.

Graffiticode is a minimal, prefix, expression-oriented language. Key features:
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
- The build-in function \`range\` takes three arguments
- Recursion is common; loops are not used
- Whitespace separates tokens; no commas required
- Line comments start with the pipe character: \`| This is a comment\`
- All non-code commentary should be written as line comments
- \`print\` is a builtin function for printing a value


Your job is to:
- Output only valid, idiomatic Graffiticode
- Use readable names and structure
- Return only code unless asked for explanation
- Add line comments starting with | to explain your code where appropriate
  `.trim(),

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
  id: get item "id"
  name: get item "name"
  | Multiply price by (1 - discount)
  price: mul get item "price" sub 1 discount
  stock: get item "stock"
}>..

| Function to calculate the total price of all items
let calculateTotal = <items: reduce (<item total: add total get item "price">) 0 items>..

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
  ]
};

/**
 * Create a prompt for Claude that will generate high-quality code
 * @param {string} userPrompt - The user's original prompt
 * @param {string} language - The detected or specified programming language
 * @returns {string} - A well-formatted prompt for Claude
 */
function createCodeGenerationPrompt(userPrompt, language) {
  return JSON.stringify({
    ...claudePrompt,
    messages: [
      ...claudePrompt.messages,
      {role: "user",
       content: userPrompt,
      },
    ],
  }, null, 2)
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
 * Generate code, verify it, and fix if needed
 * @param {Object} params - Parameters for code generation
 * @param {string} params.prompt - The user's prompt
 * @param {string} params.language - The target language (ignored, always uses Graffiticode)
 * @param {Object} params.options - Options for the API call
 * @param {Object} params.auth - Authentication object containing token for verification
 * @returns {Promise<Object>} - The final code response
 */
export async function generateCode({ auth, prompt, language = null, options = {} }) {
  console.log(
    "generateCode()",
    "auth=" + JSON.stringify(auth, null, 2),
  );
  const accessToken = auth?.token;
  try {
    const targetLanguage = "graffiticode";

    // Create a well-formatted prompt for Claude to generate Graffiticode
    const formattedPrompt = createCodeGenerationPrompt(prompt, targetLanguage);

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
    }

    // Return formatted response with Graffiticode language
    return {
      code: generatedCode,
      language: targetLanguage, // Always Graffiticode
      model: response.model,
      usage: {
        input_tokens: finalUsage.prompt_tokens,
        output_tokens: finalUsage.completion_tokens
      },
      verification: verificationResult,
      fixAttempts
    };
  } catch (error) {
    console.error("Error generating Graffiticode:", error);
    throw new Error(`Failed to generate Graffiticode: ${error.message}`);
  }
}
