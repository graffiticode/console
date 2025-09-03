# Claude Streaming API Documentation

## Overview

The Claude Streaming Service is now the **default method** for code generation. It automatically handles responses of any length through intelligent continuation, eliminating the need to predict response size. The service efficiently handles both short and long responses, only using continuation when necessary.

## Features

- **Streaming Responses**: Real-time code generation with progress updates
- **Automatic Continuation**: Automatically detects incomplete responses and continues generation
- **Token Management**: Tracks token usage across multiple API calls
- **Intelligent Completion Detection**: Recognizes when code is complete vs truncated
- **Error Handling**: Graceful fallback for API failures

## Installation

The streaming service is already integrated into the codebase. No additional installation required.

## Usage

### Basic Streaming

```typescript
import { generateCodeWithContinuation } from "./lib/claude-stream-service";

const result = await generateCodeWithContinuation({
  prompt: "Generate a complex REST API",
  lang: "0002",
  currentCode: null,  // Optional: existing code to modify
  options: {
    model: "claude-3-5-sonnet-20241022",  // Optional: model selection
    temperature: 0.2,  // Optional: generation temperature
    maxTokens: 4096,  // Optional: tokens per chunk (default: 4096)
    maxContinuations: 10  // Optional: max continuation attempts (default: 10)
  },
  onProgress: (message) => {
    console.log(`Progress: ${message}`);
  }
});

console.log(`Generated ${result.code.length} characters in ${result.chunks} chunks`);
console.log(`Total tokens used: ${result.usage.inputTokens + result.usage.outputTokens}`);
```

### Default Usage (Streaming Enabled)

```typescript
import { generateCode } from "./lib/code-generation-service";

// Streaming is enabled by default
const result = await generateCode({
  auth: { token: "your-auth-token" },
  prompt: "Create any size application",
  lang: "0002"
  // Streaming handles both short and long responses automatically
});
```

### Disabling Streaming (Legacy Mode)

```typescript
// Only disable streaming if you have a specific reason
const result = await generateCode({
  auth: { token: "your-auth-token" },
  prompt: "Simple task",
  lang: "0002",
  options: {
    useStreaming: false  // Explicitly disable streaming
  }
});
```

### Fine-tuning Streaming Parameters

```typescript
const result = await generateCode({
  auth: { token: "your-auth-token" },
  prompt: "Create a large application",
  lang: "0002",
  options: {
    // useStreaming: true is the default, no need to specify
    maxTokens: 2000,  // Smaller chunks for more granular progress
    maxContinuations: 10  // Allow more continuations for very long code
  }
});
```

### Streaming Generator (Advanced)

For more control over the streaming process:

```typescript
import { streamClaudeCode } from "./lib/claude-stream-service";

const generator = streamClaudeCode({
  prompt: "Generate code",
  systemPrompt: "You are a code generator",
  messages: [],
  options: {
    maxTokens: 4096,
    temperature: 0.2
  },
  onChunk: (chunk) => {
    process.stdout.write(chunk);  // Real-time output
  }
});

for await (const chunk of generator) {
  switch (chunk.type) {
    case "content":
      // Handle content chunk
      break;
    case "usage":
      // Handle usage information
      console.log(`Tokens: ${chunk.usage.inputTokens} in, ${chunk.usage.outputTokens} out`);
      break;
    case "error":
      console.error(`Error: ${chunk.error}`);
      break;
    case "complete":
      console.log("Generation complete");
      break;
  }
}
```

## Configuration

### Environment Variables

```bash
ANTHROPIC_API_KEY=your-api-key-here  # Required for Claude API access
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | string | `claude-3-5-sonnet-20241022` | Claude model to use |
| `temperature` | number | `0.2` | Generation randomness (0-1) |
| `maxTokens` | number | `4096` | Maximum tokens per chunk |
| `maxContinuations` | number | `5` | Maximum continuation attempts |
| `useStreaming` | boolean | `true` | **Enabled by default**. Set to `false` to use legacy mode |

## How It Works

1. **Initial Request**: Sends the prompt to Claude with specified token limit
2. **Completion Detection**: Analyzes response to determine if it's complete
3. **Smart Continuation**: Only continues if:
   - Response appears truncated (ends mid-word/syntax)
   - Response is substantial (>500 chars) and hit token limit
   - Not getting consecutive short responses (which indicate natural completion)
4. **Aggregation**: Combines all chunks into final output
5. **Token Tracking**: Accumulates token usage across all API calls

The service is optimized to minimize API calls - short responses complete in a single call, just like the legacy mode.

### Completion Detection Logic

The service considers a response complete when it ends with:
- Code block terminators (```)
- Graffiticode terminators (..)
- Common code endings (}, ), end)
- Sentence endings (., !, ?)

### Continuation Prompt

When a response is incomplete, the service appends:
```
Continue exactly where you left off. Do not repeat any content.
```

## Performance Considerations

### Token Limits

- **Default chunk size**: 4096 tokens (~3000 words)
- **Maximum recommended**: 8192 tokens per chunk
- **Total generation**: Limited by `maxContinuations * maxTokens`

### Pricing

Each continuation counts as a separate API call. Consider:
- Fewer, larger chunks = Lower API costs
- More, smaller chunks = Better progress tracking

### Recommended Settings

For different use cases:

**Small to Medium Code (< 500 lines)**
```javascript
{
  useStreaming: false,
  maxTokens: 4000
}
```

**Large Code (500-2000 lines)**
```javascript
{
  useStreaming: true,
  maxTokens: 4096,
  maxContinuations: 3
}
```

**Very Large Code (> 2000 lines)**
```javascript
{
  useStreaming: true,
  maxTokens: 8192,
  maxContinuations: 10
}
```

## Error Handling

The service handles various error scenarios:

```typescript
const result = await generateCodeWithContinuation({ ... });

if (result.error) {
  switch (result.error) {
    case "ANTHROPIC_API_KEY not found":
      // Handle missing API key
      break;
    case /API call failed/:
      // Handle API errors
      break;
    default:
      // Handle other errors
  }
}
```

## Testing

Run the test script to verify streaming functionality:

```bash
npm run test:streaming
# or
ts-node scripts/test-streaming.ts
```

## Limitations

1. **Context Window**: Total conversation (including continuations) must fit within model's context window
2. **Rate Limits**: Subject to Anthropic API rate limits
3. **Cost**: Each continuation is a separate API call
4. **Quality**: Very long generations may lose coherence over many continuations

## Best Practices

1. **Set Appropriate Limits**: Don't set `maxContinuations` too high to avoid runaway costs
2. **Monitor Progress**: Use `onProgress` callback for user feedback
3. **Handle Errors**: Always check for `error` in results
4. **Choose Right Model**: Use Sonnet for most tasks, Opus for complex reasoning
5. **Optimize Prompts**: Clear, specific prompts reduce need for continuations

## Troubleshooting

### Response Cuts Off Mid-Word

Increase `maxTokens` to allow more complete chunks:
```javascript
options: {
  maxTokens: 6000  // Larger chunks
}
```

### Too Many Continuations

The prompt may be too ambitious. Try:
1. Breaking into smaller subtasks
2. Being more specific about requirements
3. Increasing `maxTokens` per chunk

### Slow Generation

Balance between chunk size and progress updates:
```javascript
options: {
  maxTokens: 2000,  // Smaller chunks = more frequent updates
  maxContinuations: 8  // But may need more continuations
}
```

## Examples

See `scripts/test-streaming.ts` for complete working examples.