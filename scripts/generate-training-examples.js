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

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

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
let outputPath;
if (args.includes('--output')) {
  outputPath = args[args.indexOf('--output') + 1];
} else {
  const baseOutputName = filterByLanguage
    ? `training_examples_L${languageFilter}.json`
    : 'training_examples.json';
  outputPath = path.join(process.cwd(), baseOutputName);
}

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
  : null;

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
            console.log('Falling back to Firebase Admin SDK');
            tasks = [];
          }
        }
        
        // If GraphQL failed or no token, fallback to Firebase Admin SDK
        if (tasks.length === 0 && !authToken) {
          console.log(`Using Firebase Admin SDK to fetch tasks for L${lang}`);
          const db = admin.firestore();
          
          // Build query for the specific language and mark
          const taskQuery = db.collection(userTasksPath)
            .where('lang', '==', lang)
            .where('mark', '==', markValue)
            .limit(limit);
          
          const taskSnapshot = await taskQuery.get();
          
          // Convert Firebase documents to similar format as GraphQL results
          if (!taskSnapshot.empty) {
            tasks = taskSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                lang: data.lang,
                src: data.src || '',
                code: data.code || '',
                help: data.help || '[]',
                isPublic: data.isPublic,
                created: data.created ? data.created.toString() : '',
                name: data.name,
                mark: data.mark
              };
            });
            console.log(`Successfully fetched ${tasks.length} tasks using Firebase for L${lang}`);
          } else {
            console.log(`No tasks found for L${lang} with mark ${markValue} in Firebase`);
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
          console.log(`Processing task ${taskId} with ${help.length} help messages`);
          
          // Get the code from the task
          let code = "";
          let codeSource = "";
          
          // Try multiple fields for code
          if (task.code && typeof task.code === 'string' && task.code.trim().length >= 10) {
            try {
              // If code is JSON string, parse it
              const parsedCode = JSON.parse(task.code);
              code = typeof parsedCode === 'string' ? parsedCode.trim() : JSON.stringify(parsedCode);
              codeSource = "task_code_field";
            } catch (e) {
              // If not valid JSON, use as is
              code = task.code.trim();
              codeSource = "task_code_field";
            }
          } else if (task.src && typeof task.src === 'string' && task.src.trim().length >= 10) {
            code = task.src.trim();
            codeSource = "task_src_field";
          } else if (task.source && typeof task.source === 'string' && task.source.trim().length >= 10) {
            code = task.source.trim();
            codeSource = "task_source_field";
          } else if (task.content && typeof task.content === 'string' && task.content.trim().length >= 10) {
            code = task.content.trim();
            codeSource = "task_content_field";
          }
          
          // If code not found in task fields, look for it in the help messages
          if (!code) {
            for (const message of help) {
              if (message.type === 'bot' && message.help && message.help.type === 'code' &&
                  message.help.text && message.help.text.trim().length >= 10) {
                code = message.help.text.trim();
                codeSource = "help_message_code";
                break;
              }
            }
          }
          
          // Skip if we still couldn't find any code
          if (!code) {
            console.log(`No code found for task ${taskId}`);
            statistics.skippedNoCode++;
            continue;
          }
          
          // Track code sources and languages
          statistics.codeSources[codeSource] = (statistics.codeSources[codeSource] || 0) + 1;
          statistics.languageCounts[lang] = (statistics.languageCounts[lang] || 0) + 1;
          
          // Process the help array to construct dialog messages
          const dialogMessages = [];
          let dialogPairs = 0;
          
          for (const message of help) {
            // Skip invalid messages
            if (!message || typeof message !== 'object') continue;
            
            // Add user messages
            if (message.type === 'user' && message.user) {
              dialogMessages.unshift({
                role: 'user',
                content: message.user
              });
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
                dialogMessages.unshift({
                  role: 'assistant',
                  content: content
                });
              }
            }
          }
          
          // Count dialog pairs (user message followed by assistant message)
          for (let i = 0; i < dialogMessages.length - 1; i++) {
            if (dialogMessages[i].role === 'user' && dialogMessages[i+1].role === 'assistant') {
              dialogPairs++;
            }
          }
          
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
    
    // Print detailed statistics report
    console.log('\n===== FINAL STATISTICS =====');
    console.log(`Total tasks found: ${statistics.totalTasks}`);
    console.log(`Tasks with help array: ${statistics.tasksWithHelpArray}`);
    console.log(`Tasks with empty help array: ${statistics.tasksWithEmptyHelp}`);
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
    
    // Create the output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to output file
    fs.writeFileSync(
      outputPath,
      JSON.stringify(trainingExamples, null, 2),
      'utf8'
    );
    
    if (filterByLanguage) {
      console.log(`Successfully generated ${trainingExamples.length} training examples for language ${languageFilter}.`);
    } else {
      console.log(`Successfully generated ${trainingExamples.length} training examples across all languages.`);
    }
    console.log(`Output written to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error generating training examples:', error);
    process.exit(1);
  }
  
  // Clean exit
  process.exit(0);
}

// Run the script
main();
