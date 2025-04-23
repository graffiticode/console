/**
 * Script to generate training_examples.json from help field in taskIds collection
 * 
 * This script fetches examples from Firestore, looking specifically in the
 * /users/{userId}/taskIds collection. Each task document has a "help" field
 * containing dialog interactions between users and the help assistant.
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
 *   --task-collection <name>         Name of the taskIds collection (default: taskIds)
 * 
 * Examples:
 *   # Basic usage with defaults (uses predefined user ID)
 *   node scripts/generate-training-examples.js
 * 
 *   # Specify a different user ID
 *   node scripts/generate-training-examples.js --user 1a2b3c4d5e6f
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Parse command line arguments
const args = process.argv.slice(2);
// Set a very high default limit or use the provided limit
const limit = args.includes('--limit') 
  ? parseInt(args[args.indexOf('--limit') + 1]) 
  : 100000; // Very high limit to effectively get all documents

const outputPath = args.includes('--output') 
  ? args[args.indexOf('--output') + 1] 
  : path.join(process.cwd(), 'training_examples.json');

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
  --task-collection <name>         Name of the taskIds collection (default: taskIds)

Examples:
  # Basic usage with defaults
  node scripts/generate-training-examples.js
  
  # Specify a different user ID
  node scripts/generate-training-examples.js --user 1a2b3c4d5e6f
  `);
  process.exit(0);
}

// Build the path to the user's taskIds collection
const userTasksPath = `${usersPath}/${userId}/${taskCollection}`;
console.log(`Starting with user tasks path: ${userTasksPath}`);

// Initialize Firebase Admin SDK
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

async function main() {
  try {
    console.log(`\nGenerating training examples from help field in task documents at: ${userTasksPath}`);
    const db = admin.firestore();
    
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
    
    // DEBUG: List available collections (top-level only)
    console.log('Available top-level collections:');
    const collections = await db.listCollections();
    for (const collection of collections) {
      console.log(`- ${collection.id}`);
    }

    // Attempt to access a direct path to tasks
    let tryPaths = [
      userTasksPath,         // User's tasks path (e.g., /users/userId/taskIds)
      `/taskIds`,            // Root level collection
      `/users/taskIds`,      // Common alternatives
      `/Tasks`
    ];
    
    let tasksCollectionRef;
    let tasksSnapshot;
    let foundPath = null;
    
    for (const tryPath of tryPaths) {
      console.log(`\nAttempting to access tasks at: ${tryPath}`);
      try {
        const tempRef = db.collection(tryPath);
        const tempSnapshot = await tempRef.limit(1).get();
        
        if (!tempSnapshot.empty) {
          tasksCollectionRef = tempRef;
          tasksSnapshot = tempSnapshot;
          foundPath = tryPath;
          console.log(`SUCCESS! Found tasks collection at: ${tryPath}`);
          
          // Check the first document to see if it looks like a task
          const sampleDoc = tempSnapshot.docs[0].data();
          console.log(`Sample document fields: ${Object.keys(sampleDoc).join(', ')}`);
          
          // Look for help field on the document
          if (sampleDoc.help) {
            console.log(`Found help field with type: ${typeof sampleDoc.help}`);
            if (Array.isArray(sampleDoc.help)) {
              console.log(`✓ Help field is an array with ${sampleDoc.help.length} items`);
              break;
            } else {
              console.log(`Help field is not an array, it's a: ${typeof sampleDoc.help}`);
            }
          } else {
            console.log(`No help field found on document. Available fields: ${Object.keys(sampleDoc).join(', ')}`);
          }
        } else {
          console.log(`No documents found at path: ${tryPath}`);
        }
      } catch (error) {
        console.log(`Error accessing ${tryPath}: ${error.message}`);
      }
    }
    
    if (!foundPath) {
      console.error("\nERROR: Could not find tasks in any of the attempted paths.");
      console.error("Please specify the correct path using:");
      console.error("--user-path <userPath> --user <userId> --task-collection <collectionName>");
      process.exit(1);
    }
    
    console.log(`\nUsing tasks collection at: ${foundPath}`);
    
    // Show a sample of the first task document
    console.log("\nSample of first task document:");
    const sampleTask = tasksSnapshot.docs[0];
    console.log(`- Task ID: ${sampleTask.id}`);
    const sampleData = sampleTask.data();
    console.log(`- Fields: ${Object.keys(sampleData).join(', ')}`);
    
    if (sampleData.help && Array.isArray(sampleData.help)) {
      console.log(`- Help array has ${sampleData.help.length} items`);
      if (sampleData.help.length > 0) {
        const helpItem = sampleData.help[0];
        console.log(`- First help item has type: ${helpItem.type}`);
        console.log(`- Fields in first help item: ${Object.keys(helpItem).join(', ')}`);
      }
    }
    
    // Now process all task documents in batches
    console.log(`\nBeginning to process tasks (limit: ${limit})...`);
    
    const trainingExamples = [];
    let lastDoc = null;
    let batchSize = 100; // Reasonable batch size
    let batchNumber = 1;
    let totalFetched = 0;
    let hasMore = true;
    
    // Process tasks in batches
    while (hasMore && totalFetched < limit) {
      // Build the query
      let query = tasksCollectionRef;
      
      // Apply limit
      const remainingLimit = limit - totalFetched;
      const currentBatchSize = Math.min(batchSize, remainingLimit);
      query = query.limit(currentBatchSize);
      
      // Apply pagination
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      // Execute the query to get task documents
      const batchSnapshot = await query.get();
      
      if (batchSnapshot.empty) {
        hasMore = false;
        console.log('No more task documents to fetch.');
      } else {
        const batchDocs = batchSnapshot.docs;
        statistics.totalTasks += batchDocs.length;
        console.log(`\nBatch ${batchNumber}: Retrieved ${batchDocs.length} task documents`);
        
        // For each task document, process the help array
        for (const taskDoc of batchDocs) {
          const taskId = taskDoc.id;
          const taskData = taskDoc.data();

          console.log(
            "taskData=" + JSON.stringify(taskData, null, 2),
          );

          const help = JSON.parse(taskData.help);
          
          // Check if this document has a help array
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
          if (taskData.code && typeof taskData.code === 'string' && taskData.code.trim().length >= 10) {
            code = taskData.code.trim();
            codeSource = "task_code_field";
          } else if (taskData.src && typeof taskData.src === 'string' && taskData.src.trim().length >= 10) {
            code = taskData.src.trim();
            codeSource = "task_src_field";
          } else if (taskData.source && typeof taskData.source === 'string' && taskData.source.trim().length >= 10) {
            code = taskData.source.trim();
            codeSource = "task_source_field";
          } else if (taskData.content && typeof taskData.content === 'string' && taskData.content.trim().length >= 10) {
            code = taskData.content.trim();
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
          
          // Get language code from task
          const lang = taskData.lang || "0002"; // Default to L0002 if not specified
          
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
            usage_count: taskData.count || 1,
            pair_count: dialogPairs
          });
          
          statistics.totalProcessed++;
          
          if (statistics.totalProcessed % 50 === 0) {
            console.log(`Processed ${statistics.totalProcessed} tasks with dialog so far...`);
          }
        }
        
        // Update pagination for next batch
        lastDoc = batchDocs[batchDocs.length - 1];
        totalFetched += batchDocs.length;
        batchNumber++;
        
        // Check if we might have more documents
        hasMore = batchDocs.length === currentBatchSize;
        
        // Print interim statistics
        console.log(`\nInterim Statistics:`);
        console.log(`Tasks processed: ${statistics.totalTasks}`);
        console.log(`Tasks with help array: ${statistics.tasksWithHelpArray}`);
        console.log(`Tasks processed with dialog: ${statistics.totalProcessed}`);
        console.log(`Total dialog pairs: ${statistics.totalDialogPairs}`);
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
    
    console.log(`Successfully generated ${trainingExamples.length} training examples.`);
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
