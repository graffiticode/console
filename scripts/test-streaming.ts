#!/usr/bin/env npx tsx

/**
 * Test script for Claude streaming service
 * Demonstrates how to use streaming for long code generation
 */

import { generateCode } from "../src/lib/code-generation-service.js";
import { generateCodeWithContinuation } from "../src/lib/claude-stream-service.js";

async function testBasicStreaming() {
  console.log("\n=== Testing Basic Streaming ===\n");
  
  const result = await generateCodeWithContinuation({
    prompt: "Create a comprehensive REST API with 10 different endpoints for a todo application including CRUD operations, search, filtering, and statistics",
    lang: "0002",
    options: {
      maxTokens: 1000,  // Small token limit to force continuation
      maxContinuations: 5
    },
    onProgress: (msg) => console.log(`[Progress] ${msg}`)
  });
  
  console.log("\n--- Result ---");
  console.log(`Generated ${result.code.length} characters of code`);
  console.log(`Used ${result.chunks} chunk(s)`);
  console.log(`Tokens: ${result.usage.inputTokens} in, ${result.usage.outputTokens} out`);
  
  if (result.error) {
    console.error(`Error: ${result.error}`);
  } else {
    console.log("\nFirst 500 chars of generated code:");
    console.log(result.code.substring(0, 500));
  }
}

async function testIntegratedStreaming() {
  console.log("\n=== Testing Integrated Streaming ===\n");
  
  const result = await generateCode({
    auth: { token: "test-token" },  // Add real token if needed
    prompt: "Generate a complete data processing pipeline with 20 different transformation steps",
    lang: "0002",
    options: {
      useStreaming: true,  // Enable streaming mode
      maxTokens: 800,
      maxContinuations: 3
    }
  });
  
  console.log("\n--- Result ---");
  console.log(`Generated code: ${result.code.length} characters`);
  console.log(`Description: ${result.description}`);
  console.log(`Model: ${result.model}`);
  console.log(`Streaming mode: ${result.streaming ? 'Yes' : 'No'}`);
  if (result.chunks) {
    console.log(`Chunks used: ${result.chunks}`);
  }
}

async function compareStreamingVsNonStreaming() {
  console.log("\n=== Comparing Streaming vs Non-Streaming ===\n");
  
  const longPrompt = `Create a complete e-commerce application with the following features:
  1. User authentication and authorization
  2. Product catalog with categories
  3. Shopping cart functionality
  4. Order processing
  5. Payment integration
  6. Inventory management
  7. Customer reviews and ratings
  8. Search and filtering
  9. Admin dashboard
  10. Email notifications`;
  
  // Non-streaming test
  console.log("Testing non-streaming mode...");
  const startNonStream = Date.now();
  
  try {
    const nonStreamResult = await generateCode({
      auth: { token: "test-token" },
      prompt: longPrompt,
      lang: "0002",
      options: {
        useStreaming: false,
        maxTokens: 4000
      }
    });
    
    const nonStreamTime = Date.now() - startNonStream;
    console.log(`Non-streaming completed in ${nonStreamTime}ms`);
    console.log(`Generated ${nonStreamResult.code.length} characters`);
    
  } catch (error) {
    console.error("Non-streaming error:", error.message);
  }
  
  // Streaming test
  console.log("\nTesting streaming mode...");
  const startStream = Date.now();
  
  try {
    const streamResult = await generateCode({
      auth: { token: "test-token" },
      prompt: longPrompt,
      lang: "0002",
      options: {
        useStreaming: true,
        maxTokens: 1000,  // Smaller chunks
        maxContinuations: 4
      }
    });
    
    const streamTime = Date.now() - startStream;
    console.log(`Streaming completed in ${streamTime}ms`);
    console.log(`Generated ${streamResult.code.length} characters in ${streamResult.chunks} chunks`);
    
  } catch (error) {
    console.error("Streaming error:", error.message);
  }
}

// Main execution
async function main() {
  console.log("Starting Claude Streaming Service Tests");
  console.log("========================================");
  
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("⚠️  Warning: ANTHROPIC_API_KEY not set. Tests will use mock responses.");
    }
    
    // Run tests
    await testBasicStreaming();
    await testIntegratedStreaming();
    await compareStreamingVsNonStreaming();
    
    console.log("\n========================================");
    console.log("All tests completed!");
    
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);