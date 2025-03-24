/**
 * Code generation service for Claude API integration
 * 
 * This service implements:
 * 1. Language detection from prompts
 * 2. API calls to Claude for code generation
 * 3. Token usage tracking
 */

import axios from 'axios';

// Define available Claude models
const CLAUDE_MODELS = {
  OPUS: 'claude-3-opus-20240229',
  SONNET: 'claude-3-sonnet-20240229',
  HAIKU: 'claude-3-haiku-20240307',
  DEFAULT: 'claude-3-sonnet-20240229' // Default to Sonnet as a good balance
};

/**
 * Always returns OCaml as the language
 * @param {string} prompt - User's input prompt (ignored)
 * @returns {string} Always returns "ocaml"
 */
function detectLanguage(prompt) {
  // Always return OCaml regardless of prompt content
  return "ocaml";
}

/**
 * Create a prompt for Claude that will generate high-quality code
 * @param {string} userPrompt - The user's original prompt
 * @param {string} language - The detected or specified programming language
 * @returns {string} - A well-formatted prompt for Claude
 */
function createCodeGenerationPrompt(userPrompt, language) {
  return `You are a senior ${language} developer tasked with writing high-quality, production-ready code. Write only the code without any explanations or markdown formatting.

User request: ${userPrompt}

Guidelines:
- Write clean, well-organized, and properly documented code
- Follow best practices and conventions for ${language}
- Include appropriate error handling
- Use descriptive variable and function names
- Only output executable code with no additional text before or after
- Do not include markdown code block syntax like \`\`\`${language} or \`\`\`

Code:`;
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

/**
 * Get a fallback response when the API call fails
 * @param {string} prompt - The formatted prompt
 * @param {Object} options - The API options
 * @returns {Object} - A fallback response
 */
function getFallbackResponse(prompt, options) {
  console.warn("Using fallback response for Claude API");
  
  // Create a simple OCaml fallback response
  const sampleCode = `(* Fallback response - Claude API unavailable *)
let example () =
  print_endline "This is a fallback response because the Claude API could not be reached.";
  print_endline "Please check your ANTHROPIC_API_KEY environment variable.";
  "Fallback response"

let () = 
  let result = example () in
  print_endline result`;
  
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
 * Generate OCaml code based on a prompt using Claude
 * @param {Object} params - Parameters for code generation
 * @param {string} params.prompt - The user's prompt describing the code to generate
 * @param {string} [params.language] - Ignored - always generates OCaml
 * @param {Object} [params.options] - Additional generation options
 * @returns {Promise<Object>} Generated OCaml code and metadata
 */
export async function generateCode({ prompt, language = null, options = {} }) {
  try {
    // Always use OCaml
    const targetLanguage = "ocaml";
    
    // Create a well-formatted prompt for Claude to generate OCaml code
    const formattedPrompt = createCodeGenerationPrompt(prompt, targetLanguage);
    
    // Use the most capable model for OCaml code generation
    const model = options.model || CLAUDE_MODELS.OPUS;
    
    // Set up API call options
    const apiOptions = {
      model,
      temperature: options.temperature || 0.2, // Lower temperature for more deterministic code generation
      max_tokens: options.maxTokens || 4000
    };
    
    // Call the Claude API
    const response = await callClaudeAPI(formattedPrompt, apiOptions);
    
    // Return formatted response with OCaml language
    return {
      code: response.content,
      language: targetLanguage, // Always OCaml
      model: response.model,
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens
      }
    };
  } catch (error) {
    console.error("Error generating OCaml code:", error);
    throw new Error(`Failed to generate OCaml code: ${error.message}`);
  }
}