/**
 * Script to generate training_examples.json from help field in taskIds collection
 *
 * This script fetches examples using the GraphQL tasks query, filtering by lang and mark values.
 * Each task document has a "help" field containing dialog interactions between users and the help assistant.
 *
 * Usage:
 * node scripts/generate-training-examples.js [options]
 *
 * Options:
 *   --limit <number>                 Maximum number of tasks to process (default: 100000)
 *   --output <path>                  Output file path (default: ./training_examples.json)
 *   --service-account <path>         Path to Firebase service account JSON file
 *   --user <userId>                  User ID to use (defaults to a predefined user ID)
 *   --user-path <path>               Path to users collection (default: /users)
 *   --task-collection <name>            Name of the taskIds collection (default: taskIds)
 *   --lang <language>                Filter tasks by language code (e.g., "0002")
 *   --mark <mark>                    Filter tasks by mark value (default: 1)
 *   --all-langs                      Process all languages (default behavior)
 *   --token <token>                  Authentication token for GraphQL API
 *   --graphql-endpoint <url>         GraphQL API endpoint (default: http://localhost:3000/api)
 *
 * Examples:
 *   # Basic usage with defaults (uses predefined user ID)
 *   node scripts/generate-training-examples.js
 *
 *   # Specify a different user ID
 *   node scripts/generate-training-examples.js --user 1a2b3c4d5e6f
 *
 *   # Generate examples only for a specific language
 *   node scripts/generate-training-examples.js --lang 0002
 *
 *   # Generate examples with specific mark value
 *   node scripts/generate-training-examples.js --lang 0002 --mark 2
 */

//const fs = require('fs');
import fs from "fs";
//const path = require('path');
import path from "path";
//const admin = require('firebase-admin');
import admin from "firebase-admin";
//const fetch = require('node-fetch');
import fetch from "node-fetch";
//const bent = require('bent');
import bent from "bent";

const {
  GC_API_KEY_ID,
  GC_API_KEY_SECRET,
  GC_AUTH_URL = "https://auth.graffiticode.org",
  GC_API_URL = "https://api.graffiticode.org",
} = process.env;

const postAuthJSON = bent(GC_AUTH_URL, "POST", "json", 200, 401);
const getApiJSON = bent(GC_API_URL, "GET", "json", 200, 400);

let currentTokenPromise = null;
const getAccessToken = () => {
  if (!currentTokenPromise) {
    console.log("Retrieving access token");
    currentTokenPromise = Promise.resolve()
      .then(() => postAuthJSON(
        `/v1/api-keys/${GC_API_KEY_ID}/authenticate`,
        { token: GC_API_KEY_SECRET }
      ))
      .then(({ data }) => {
        console.log(
          "getAccessToken()",
          "GC_AUTH_URL=" + GC_AUTH_URL,
          "data=" + JSON.stringify(data, null, 2),
        );
        if (data) {
          const { accessToken } = data;
          const { exp } = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"));
          setTimeout(() => {
            currentTokenPromise = null;
            console.log("Cleared access token that is about to expire.");
          }, exp * 1000 - Date.now() - 1000);
          return accessToken;
        } else {
          return null;
        }
      });
  }
  return currentTokenPromise;
};

// Parse command line arguments
const args = process.argv.slice(2);
// Set a very high default limit or use the provided limit
const limit = args.includes('--limit')
  ? parseInt(args[args.indexOf('--limit') + 1])
  : 100000; // Very high limit to effectively get all documents

// Language filter settings
const filterByLanguage = args.includes('--lang');
const languageFilter = filterByLanguage
  ? args[args.indexOf('--lang') + 1]
  : null;

// Mark filter settings
const markValue = args.includes('--mark')
  ? parseInt(args[args.indexOf('--mark') + 1])
  : 1; // Default mark value

// Determine output file path, adding language code to filename if filtering
let outputDir = "./";

// Support both --outdir and --output-dir for the directory parameter
if (args.includes('--outdir')) {
  outputDir = args[args.indexOf('--outdir') + 1];
} else if (args.includes('--output-dir')) {
  outputDir = args[args.indexOf('--output-dir') + 1];
}

// Make sure output directory ends with a slash
if (!outputDir.endsWith('/')) {
  outputDir += '/';
}

// We'll create the markdown file path at write time

console.log(`Using output directory: ${outputDir}`);

const serviceAccountPath = args.includes('--service-account')
  ? args[args.indexOf('--service-account') + 1]
  : null;

// Default user ID
const defaultUserId = '24493e1c7a7f1ad57e3c478087c74c2dacb0cba1';

// Check if user parameter is provided
const userId = args.includes('--user')
  ? args[args.indexOf('--user') + 1]
  : defaultUserId;

// Allow customization of collection paths
const usersPath = args.includes('--user-path')
  ? args[args.indexOf('--user-path') + 1]
  : '/users';

const taskCollection = args.includes('--task-collection')
  ? args[args.indexOf('--task-collection') + 1]
  : 'taskIds';

// GraphQL API settings
const authToken = args.includes('--token')
  ? args[args.indexOf('--token') + 1]
  : await getAccessToken();

const graphqlEndpoint = args.includes('--graphql-endpoint')
  ? args[args.indexOf('--graphql-endpoint') + 1]
  : 'http://localhost:3000/api';

// Show help if requested
if (args.includes('--help')) {
  console.log(`
Usage: node scripts/generate-training-examples.js [options]

Options:
  --limit <number>                 Maximum number of tasks to process (default: 100000)
  --output <path>                  Output file path (default: ./training_examples.json)
  --service-account <path>         Path to Firebase service account JSON file
  --user <userId>                  User ID to use (defaults to a predefined user ID)
  --user-path <path>               Path to users collection (default: /users)
  --task-collection <name>            Name of the taskIds collection (default: taskIds)
  --lang <language>                Filter tasks by language code (e.g., "0002")
  --mark <mark>                    Filter tasks by mark value (default: 1)
  --all-langs                      Process all languages (default behavior)
  --token <token>                  Authentication token for GraphQL API
  --graphql-endpoint <url>         GraphQL API endpoint (default: http://localhost:3000/api)

Examples:
  # Basic usage with defaults
  node scripts/generate-training-examples.js

  # Specify a different user ID
  node scripts/generate-training-examples.js --user 1a2b3c4d5e6f

  # Generate examples only for a specific language and mark value
  node scripts/generate-training-examples.js --lang 0002 --mark 1
  `);
  process.exit(0);
}

// Build the path to the user's taskIds collection (for backward compatibility)
const userTasksPath = `${usersPath}/${userId}/${taskCollection}`;
console.log(`Starting with user tasks path: ${userTasksPath}`);

// Check if we have a token for the GraphQL API
if (!authToken) {
  console.log('No auth token provided for GraphQL API, falling back to Firebase Admin SDK');
}

// Initialize Firebase Admin SDK (as fallback if GraphQL is not available)
try {
  // Only initialize with service account if explicitly provided
  if (serviceAccountPath) {
    try {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log(`Using service account from: ${serviceAccountPath}`);
    } catch (saError) {
      console.error(`Error loading service account file: ${saError.message}`);
      console.log('Falling back to default initialization');
      admin.initializeApp();
    }
  } else {
    // Simple initialization with no parameters works best in most environments
    admin.initializeApp();
  }
  console.log('Firebase initialized successfully');
} catch (err) {
  // Ignore duplicate app error
  if (err.code !== 'app/duplicate-app') {
    console.error('Firebase initialization error:', err);
    process.exit(1);
  } else {
    console.log('Firebase already initialized');
  }
}

// Function to extract a useful description from code
function extractDescription(code) {
  // Try to find comments in the code
  const commentMatch = code.match(/\|(.*?)(\.\.|$)/g);
  if (commentMatch && commentMatch.length > 0) {
    // Extract text from comments, remove the pipe, and join with spaces
    return commentMatch
      .map(comment => comment.replace(/\|/, '').trim())
      .filter(comment => comment.length > 5) // Filter out very short comments
      .join(' ')
      .replace(/\.\.$/g, '') // Remove trailing dots
      .trim();
  }

  // Try to extract purpose from variable and function names
  const mainVariables = code.match(/let\s+([a-zA-Z0-9_]+)\s*=/g);
  if (mainVariables && mainVariables.length > 0) {
    const varNames = mainVariables
      .map(v => v.replace(/let\s+/, '').replace(/\s*=/, ''))
      .filter(v => v.length > 3 && !['result', 'output', 'value', 'temp', 'data'].includes(v));

    if (varNames.length > 0) {
      return `Code working with ${varNames.join(', ')}`;
    }
  }

  // Fallback if no good description found
  return "Graffiticode example";
}

// Function to determine expected output from code
function determineExpectedOutput(code) {
  // Check if we have a result or output variable
  const resultMatch = code.match(/let\s+(result|output|total|sum|average|final\w*)\s*=\s*([^\.]+)/i);
  if (resultMatch) {
    const varName = resultMatch[1];
    // Try to simplify the expression a bit
    return `${varName} = [computed value]`;
  }

  // Check if there are function definitions that might be the main operation
  const functionMatch = code.match(/let\s+([a-zA-Z0-9_]+)\s*=\s*<[^>]+>/);
  if (functionMatch) {
    return `${functionMatch[1]} = <function>`;
  }

  return "Output depends on execution"; // Default fallback
}

// Function to generate an explanation from code
function generateExplanation(code, lang) {
  // Split code into statements
  const statements = code
    .split('..')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let explanation = '';

  if (statements.length === 1) {
    // Single statement code
    explanation = `Simple ${lang} code that ${statements[0].includes('=') ? 'assigns a value' : 'executes an operation'}.`;
  } else if (statements.length <= 3) {
    // Few statements - give brief description
    explanation = `Short ${lang} program with ${statements.length} operations that manipulates data.`;
  } else {
    // Multi-statement program - try to classify it
    const hasMap = code.includes('map (');
    const hasFilter = code.includes('filter (');
    const hasReduce = code.includes('reduce (');
    const hasConditional = code.includes('if ') || code.includes(' ? ');
    const hasLambdas = (code.match(/<[^>]+>/g) || []).length;

    if (hasMap && hasFilter && hasReduce) {
      explanation = `Comprehensive ${lang} program that performs data transformation using map, filter, and reduce operations.`;
    } else if (hasMap && hasFilter) {
      explanation = `${lang} program that filters and transforms data collections.`;
    } else if (hasMap) {
      explanation = `${lang} program that transforms each element in a collection.`;
    } else if (hasFilter) {
      explanation = `${lang} program that filters elements from a collection.`;
    } else if (hasReduce) {
      explanation = `${lang} program that aggregates values from a collection.`;
    } else if (hasConditional && hasLambdas > 1) {
      explanation = `${lang} program with conditional logic and multiple function definitions.`;
    } else if (hasLambdas > 0) {
      explanation = `${lang} program that defines and uses custom functions.`;
    } else if (hasConditional) {
      explanation = `${lang} program with conditional logic to make decisions.`;
    } else {
      explanation = `Multi-step ${lang} program that processes data through several operations.`;
    }
  }

  return explanation;
}

// Function to extract a task description from dialog messages
function extractTaskFromMessages(messages) {
  // Concatenate all user messages to create a more comprehensive task description
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.trim())
    .filter(content => content.length > 0);
  
  if (userMessages.length > 0) {
    // If there are multiple messages, join them to create a complete conversation context
    if (userMessages.length > 1) {
      return userMessages.join("\n\n");
    }
    // Otherwise just return the single message
    return userMessages[0];
  }
  
  // Fallback
  return "Implement the following functionality";
}

// Function to convert training examples to the standardized markdown format
function convertToMarkdownFormat(trainingExamples) {
  let markdown = `# Graffiticode Training Examples\n\n`;
  
  // Group examples by language
  const examplesByLang = {};
  trainingExamples.forEach(example => {
    const lang = example.lang;
    if (!examplesByLang[lang]) {
      examplesByLang[lang] = [];
    }
    examplesByLang[lang].push(example);
  });
  
  // Process each language group
  for (const [lang, examples] of Object.entries(examplesByLang)) {
    markdown += `## Language L${lang}\n\n`;
    
    // Add each example in the standardized format
    examples.forEach((example, index) => {
      // Extract a meaningful task description from the messages
      const prompt = extractTaskFromMessages(example.messages);
      
      // Clean up the code - remove trailing whitespace from each line
      const code = example.code.trim()
        .split('\n')
        .map(line => line.trimRight())
        .join('\n');
      
      // Use the standard format with "Prompt", "Chat Transcript", and "Code" sections
      // Code is always wrapped in triple backticks
      markdown += `### Prompt\n"${prompt}"\n\n`;
      
      // Add the full chat transcript in chronological order
      markdown += `### Chat Transcript\n\n`;
      // Messages are already in chronological order, as we preserved their order when parsing
      example.messages.forEach((message, msgIndex) => {
        const role = message.role === 'user' ? 'User' : 'Assistant';
        // Format the content with proper markdown for code blocks
        let content = message.content.trim();
        
        markdown += `**${role}**: ${content}\n\n`;
      });
      
      markdown += `### Code\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
      
      // Add separator between examples except after the last one
      if (index < examples.length - 1) {
        markdown += `---\n\n`;
      }
    });
    
    // Add separator between language sections except after the last one
    if (Object.keys(examplesByLang).indexOf(lang) < Object.keys(examplesByLang).length - 1) {
      markdown += `\n\n`;
    }
  }
  
  // Remove any trailing whitespace from the entire markdown content
  markdown = markdown.split('\n')
    .map(line => line.trimRight())
    .join('\n');
  
  return markdown;
}

/**
 * Function to fetch tasks using GraphQL
 * @param {string} lang - Language filter
 * @param {number} mark - Mark filter
 * @returns {Promise<Array>} - Array of task objects
 */
async function fetchTasksWithGraphQL(lang, mark) {
  try {
    console.log(`Fetching tasks with GraphQL for lang=${lang}, mark=${mark}`);

    // First try to introspect the schema to verify the query structure
    try {
      const introspectionQuery = `
        {
          __schema {
            queryType {
              fields {
                name
                args {
                  name
                  type {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      `;

      console.log('Attempting schema introspection to verify query structure...');
      const introspectionResponse = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ query: introspectionQuery })
      });

      const introspectionResult = await introspectionResponse.json();
      console.log('Schema introspection result:', JSON.stringify(introspectionResult, null, 2));
    } catch (e) {
      console.log('Schema introspection failed, continuing with original query');
    }

    // GraphQL query for tasks
    const query = `
      query GetTasks($lang: String!, $mark: Int!) {
        tasks(lang: $lang, mark: $mark) {
          id
          lang
          src
          code
          help
          taskId
          isPublic
          created
          name
          mark
        }
      }
    `;

    // Variables for the query
    const variables = { lang, mark };

    // Log request details for debugging
    console.log(`Making GraphQL request to: ${graphqlEndpoint}`);
    console.log(`Auth token present: ${authToken ? 'Yes' : 'No'}`);
    console.log('Request body:', JSON.stringify({query, variables}, null, 2));

    // Make the GraphQL request
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    // Log response status
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Parse the response
    const result = await response.json();

    // Log full response for debugging
    console.log('Full response:', JSON.stringify(result, null, 2));

    // Check for errors
    if (result.errors) {
      console.error('GraphQL query errors:', result.errors);
      throw new Error('Failed to fetch tasks with GraphQL');
    }

    // Return the tasks
    return result.data.tasks || [];
  } catch (error) {
    console.error('Error fetching tasks with GraphQL:', error);
    throw error;
  }
}

async function main() {
  try {
    // Initialize statistics tracking
    const statistics = {
      codeSources: {},        // Track source of code fields
      languageCounts: {},     // Track count by language
      totalProcessed: 0,      // Total tasks processed
      totalTasks: 0,          // Total task documents found
      tasksWithHelpArray: 0,  // Tasks that have a help array
      tasksWithEmptyHelp: 0,  // Tasks with empty help array
      tasksWithSrcCode: 0,    // Tasks with code in the src field
      skippedNoCode: 0,       // Tasks without code
      totalDialogPairs: 0,    // Total number of dialog pairs extracted
      totalMessages: 0        // Total individual messages processed
    };

    // Array to store training examples
    const trainingExamples = [];

    // Determine languages to process
    const languagesToProcess = filterByLanguage
      ? [languageFilter]
      : ['0002', '0011', '0012', '0165']; // Add other languages as needed

    // Process each language
    for (const lang of languagesToProcess) {
      try {
        console.log(`\nProcessing tasks for language: L${lang} with mark: ${markValue}`);

        // Try to fetch tasks using GraphQL if token is available
        let tasks = [];

        if (authToken) {
          try {
            tasks = await fetchTasksWithGraphQL(lang, markValue);
            console.log(`Successfully fetched ${tasks.length} tasks using GraphQL for L${lang}`);
          } catch (error) {
            console.error(`Error fetching tasks with GraphQL for L${lang}:`, error.message);
            tasks = [];
          }
        }

        // Process the tasks
        statistics.totalTasks += tasks.length;
        console.log(`Processing ${tasks.length} tasks for L${lang}`);

        for (const task of tasks) {
          const taskId = task.id;

          // Parse help field
          let help = [];
          try {
            help = JSON.parse(task.help);
          } catch (e) {
            console.log(`Task ${taskId} has invalid help JSON: ${e.message}`);
            continue;
          }

          // Check if this document has a valid help array
          if (!help || !Array.isArray(help)) {
            console.log(`Task ${taskId} has no help array`);
            continue;
          }

          if (help.length === 0) {
            console.log(`Task ${taskId} has an empty help array`);
            statistics.tasksWithEmptyHelp++;
            continue;
          }

          statistics.tasksWithHelpArray++;
          console.log(
            `Processing task ${taskId} with ${help.length} help messages`,
            console.log("help=" + JSON.stringify(help, null, 2)),
          );

          // Get the code directly from the src field of the task
          let code = task.src || "";
          let codeSource = "task_src_field";
          
          // Skip if there's no code in the src field
          if (!code || code.trim().length < 10) {
            console.log(`No valid code in src field for task ${taskId}`);
            statistics.skippedNoCode++;
            continue;
          }
          
          // Track tasks with valid source code
          statistics.tasksWithSrcCode++;
          
          // Trim the code
          code = code.trim();

          // Track code sources and languages
          statistics.codeSources[codeSource] = (statistics.codeSources[codeSource] || 0) + 1;
          statistics.languageCounts[lang] = (statistics.languageCounts[lang] || 0) + 1;

          // Process the help array to construct dialog messages
          const dialogMessages = [];
          let dialogPairs = 0;

          // Help array is in chronological order. We need to preserve this order
          // for the chat transcript while ensuring user/bot messages are correctly paired
          for (let i = 0; i < help.length; i++) {
            const message = help[i];
            
            // Skip invalid messages
            if (!message || typeof message !== 'object') continue;

            // Add user messages
            if (message.type === 'user' && message.user) {
              dialogMessages.push({
                role: 'user',
                content: message.user
              });
              
              // Look for a corresponding bot message that follows
              if (i+1 < help.length && help[i+1].type === 'bot' && help[i+1].help) {
                dialogPairs++;
              }
            }
            // Add bot messages
            else if (message.type === 'bot' && message.help) {
              const helpObj = message.help;
              let content = '';

              if (helpObj.type === 'text' && helpObj.text) {
                content = helpObj.text;
              } else if (helpObj.type === 'code' && helpObj.text) {
                // Format code with markdown
                content = `\`\`\`${helpObj.language || 'ocaml'}\n${helpObj.text}\n\`\`\``;
              }

              if (content) {
                dialogMessages.push({
                  role: 'assistant',
                  content: content
                });
              }
            }
          }

          // We've already counted the dialog pairs while parsing the messages

          statistics.totalDialogPairs += dialogPairs;
          statistics.totalMessages += dialogMessages.length;

          // Skip if there are no complete dialog pairs
          if (dialogPairs === 0) {
            console.log(`Task ${taskId} has no complete dialog pairs`);
            continue;
          }

          // Generate explanation and expected output
          const explanation = generateExplanation(code, `L${lang}`);
          const expected_output = determineExpectedOutput(code);

          // Add to training examples
          trainingExamples.push({
            messages: dialogMessages,
            code,
            explanation,
            expected_output,
            lang,
            task_id: taskId,
            code_source: codeSource,
            usage_count: task.count || 1,
            pair_count: dialogPairs
          });

          statistics.totalProcessed++;

          if (statistics.totalProcessed % 50 === 0) {
            console.log(`Processed ${statistics.totalProcessed} tasks with dialog so far...`);
          }
        }
      } catch (error) {
        console.error(`Error processing language L${lang}:`, error);
        // Continue with next language
        continue;
      }
    }

    console.log(
      "main",
      "trainingExamples=" + JSON.stringify(trainingExamples, null, 2),
    );

    // Print detailed statistics report
    console.log('\n===== FINAL STATISTICS =====');
    console.log(`Total tasks found: ${statistics.totalTasks}`);
    console.log(`Tasks with help array: ${statistics.tasksWithHelpArray}`);
    console.log(`Tasks with empty help array: ${statistics.tasksWithEmptyHelp}`);
    console.log(`Tasks with valid source code: ${statistics.tasksWithSrcCode}`);
    console.log(`Tasks processed with dialog: ${statistics.totalProcessed}`);
    console.log(`Total dialog pairs: ${statistics.totalDialogPairs}`);
    console.log(`Total messages: ${statistics.totalMessages}`);
    console.log(`Skipped (no code): ${statistics.skippedNoCode}`);

    console.log('\nCode sources:');
    for (const [source, count] of Object.entries(statistics.codeSources || {}).sort((a, b) => b[1] - a[1])) {
      const percentage = (count / statistics.totalProcessed * 100).toFixed(2);
      console.log(`  - ${source}: ${count} (${percentage}%)`);
    }

    console.log('\nLanguage distribution:');
    for (const [lang, count] of Object.entries(statistics.languageCounts).sort((a, b) => b[1] - a[1])) {
      const percentage = (count / statistics.totalProcessed * 100).toFixed(2);
      console.log(`  - L${lang}: ${count} (${percentage}%)`);
    }
    console.log('======================\n');

    // Sort by usage count (most used first)
    trainingExamples.sort((a, b) => b.usage_count - a.usage_count);

    // Make sure the output directory exists
    const fullOutputDir = path.resolve(process.cwd(), outputDir);
    if (!fs.existsSync(fullOutputDir)) {
      fs.mkdirSync(fullOutputDir, { recursive: true });
    }

    // Convert to the new markdown-like format
    const markdownExamples = convertToMarkdownFormat(trainingExamples);
    
    // Output path always uses .md extension
    const outputPathMd = path.join(fullOutputDir, `l${languageFilter || 'all'}-training-examples.md`);
    
    // Write to markdown file
    fs.writeFileSync(
      outputPathMd,
      markdownExamples,
      'utf8'
    );

    if (filterByLanguage) {
      console.log(`Successfully generated ${trainingExamples.length} training examples for language ${languageFilter}.`);
    } else {
      console.log(`Successfully generated ${trainingExamples.length} training examples across all languages.`);
    }
    console.log(`Generated file: ${outputPathMd}`);

  } catch (error) {
    console.error('Error generating training examples:', error);
    process.exit(1);
  }

  // Clean exit
  process.exit(0);
}

// Run the script
main();
