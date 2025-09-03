#!/usr/bin/env npx tsx

/**
 * Simple test script for Claude streaming service
 * This version doesn't require local services to be running
 */

import { generateCodeWithContinuation, streamClaudeCode, extractCodeBlocks } from "../src/lib/claude-stream-service.js";

async function testBasicFunctionality() {
  console.log("\n=== Testing Basic Streaming Functionality ===\n");
  
  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("⚠️  ANTHROPIC_API_KEY not set. Skipping API tests.");
    console.log("Set your API key to test actual streaming:");
    console.log("export ANTHROPIC_API_KEY=your-key-here");
    return;
  }
  
  try {
    console.log("Testing code generation with continuation...");
    
    const result = await generateCodeWithContinuation({
      prompt: "Write a simple function that calculates fibonacci numbers",
      lang: "0002",
      options: {
        maxTokens: 500,  // Small limit to test continuation
        maxContinuations: 2
      },
      onProgress: (msg) => console.log(`  [Progress] ${msg}`)
    });
    
    console.log("\nResult:");
    console.log(`- Generated ${result.code.length} characters`);
    console.log(`- Used ${result.chunks} chunk(s)`);
    console.log(`- Total tokens: ${result.usage.inputTokens + result.usage.outputTokens}`);
    
    if (result.error) {
      console.error(`- Error: ${result.error}`);
    } else {
      console.log("\nGenerated code preview:");
      console.log("---");
      console.log(result.code.substring(0, 300) + (result.code.length > 300 ? "..." : ""));
      console.log("---");
    }
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

async function testStreamingGenerator() {
  console.log("\n=== Testing Streaming Generator ===\n");
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("Skipping - API key not set");
    return;
  }
  
  try {
    console.log("Starting streaming generation...");
    let totalContent = "";
    let chunkCount = 0;
    
    const generator = streamClaudeCode({
      prompt: "Write a hello world function",
      systemPrompt: "Generate simple Graffiticode code",
      options: {
        maxTokens: 200,
        temperature: 0.2
      },
      onChunk: (chunk) => {
        process.stdout.write(".");  // Progress indicator
        totalContent += chunk;
      }
    });
    
    for await (const chunk of generator) {
      if (chunk.type === "content") {
        chunkCount++;
      } else if (chunk.type === "usage") {
        console.log(`\nTokens: ${chunk.usage.inputTokens} in, ${chunk.usage.outputTokens} out`);
      } else if (chunk.type === "error") {
        console.error(`\nError: ${chunk.error}`);
      } else if (chunk.type === "complete") {
        console.log("\nGeneration complete");
      }
    }
    
    console.log(`Received ${chunkCount} content chunks`);
    console.log(`Total content length: ${totalContent.length} characters`);
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

async function testCodeExtraction() {
  console.log("\n=== Testing Code Block Extraction ===\n");
  
  const testCases = [
    {
      input: "Here's the code:\n```\nlet x = 42..\n```\nThat's it!",
      expected: ["let x = 42.."]
    },
    {
      input: "Multiple blocks:\n```js\ncode1\n```\nand\n```\ncode2\n```",
      expected: ["code1", "code2"]
    },
    {
      input: "No blocks, just plain code",
      expected: ["No blocks, just plain code"]
    }
  ];
  
  for (const testCase of testCases) {
    const result = extractCodeBlocks(testCase.input);
    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
    
    console.log(`Test: ${testCase.input.substring(0, 30)}...`);
    console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`  Got: ${JSON.stringify(result)}`);
    console.log(`  Result: ${passed ? "✅ PASS" : "❌ FAIL"}\n`);
  }
}

async function testCompletionDetection() {
  console.log("\n=== Testing Completion Detection ===\n");
  
  // This would normally be an internal function, but we can test the concept
  const testResponses = [
    { text: "let x = 42..", complete: true, reason: "Ends with .." },
    { text: "```\ncode here\n```", complete: true, reason: "Ends with ```" },
    { text: "function incomplete(", complete: false, reason: "Ends mid-syntax" },
    { text: "This is a complete sentence.", complete: true, reason: "Ends with period" },
    { text: "This is incompl", complete: false, reason: "Ends mid-word" }
  ];
  
  console.log("Simulating completion detection logic:");
  for (const test of testResponses) {
    console.log(`  "${test.text.substring(0, 30)}${test.text.length > 30 ? '...' : ''}"`);
    console.log(`    Expected: ${test.complete ? 'Complete' : 'Incomplete'} (${test.reason})`);
  }
}

// Main execution
async function main() {
  console.log("Claude Streaming Service - Simple Tests");
  console.log("=======================================");
  
  await testCodeExtraction();
  await testCompletionDetection();
  await testBasicFunctionality();
  await testStreamingGenerator();
  
  console.log("\n=======================================");
  console.log("Tests completed!");
}

main().catch(console.error);