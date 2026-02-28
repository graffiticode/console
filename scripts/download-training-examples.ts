#!/usr/bin/env node

/**
 * Script to download training examples from Firebase to a markdown file
 * 
 * Usage:
 *   npm run download-training-examples
 *   npm run download-training-examples -- --lang 0159
 *   npm run download-training-examples -- --limit 100
 */

import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Force connection to production Firestore (bypass emulator)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Parse command line arguments
const args = process.argv.slice(2);

// Parameters
const limit = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1])
  : 10000;

const languageFilter = args.includes("--lang")
  ? args[args.indexOf("--lang") + 1]
  : null;

const markValues: number[] = args.includes("--mark")
  ? args[args.indexOf("--mark") + 1].split(",").map(v => parseInt(v.trim()))
  : [4]; // Default to mark 4 for high quality examples

// Default user ID
const defaultUserId = "24493e1c7a7f1ad57e3c478087c74c2dacb0cba1";
const userId = args.includes("--user")
  ? args[args.indexOf("--user") + 1]
  : defaultUserId;

// Output directory
const outputDir = path.join(process.cwd(), "training");

// Append mode - by default we overwrite (append=false)
const appendMode = args.includes("--append");

// Show help if requested
if (args.includes("--help")) {
  console.log(`
Usage: npm run download-training-examples -- [options]

Options:
  --limit <number>       Maximum number of items to download (default: 10000)
  --lang <language>      Filter by language code (e.g., "0159")
  --mark <marks>         Filter by mark value(s), comma-separated (default: 4)
  --user <userId>        User ID to fetch items from (default: predefined ID)
  --append               Append to existing file instead of overwriting (default: overwrite)
  --help                 Show this help message

Examples:
  npm run download-training-examples                    # Download L0002 mark=4 examples (default)
  npm run download-training-examples -- --lang 0159     # Download L0159 mark=4 examples
  npm run download-training-examples -- --mark 5        # Download L0002 mark=5 examples
  npm run download-training-examples -- --mark 3,4      # Download L0002 mark=3 and mark=4 examples
  npm run download-training-examples -- --append        # Append to existing L0002 file
`);
  process.exit(0);
}

// Initialize Firebase Admin SDK
function initializeFirebase() {
  // Use GRAFFITICODE_APP_CREDENTIALS for the graffiticode-app project
  if (process.env.GRAFFITICODE_APP_CREDENTIALS) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;
  } else {
    console.error('Error: GRAFFITICODE_APP_CREDENTIALS environment variable not set');
    console.error('Set it to the path of your graffiticode-app service account key');
    process.exit(1);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: "graffiticode-app"
    });
    console.log("Firebase initialized successfully");
  } catch (err: any) {
    if (err.code !== "app/duplicate-app") {
      console.error("Firebase initialization error:", err);
      process.exit(1);
    }
  }
}

// Extract task from messages
function extractTaskFromMessages(messages: any[]): string {
  const userMessages = messages
    .filter(m => m.role === "user")
    .map(m => m.content.trim())
    .filter(content => content.length > 0);
  
  if (userMessages.length > 0) {
    return userMessages.length > 1 
      ? userMessages.join("\n\n")
      : userMessages[0];
  }
  
  return "Implement the following functionality";
}

// Convert to markdown format
function convertToMarkdownFormat(trainingExamples: any[]): string {
  let markdown = `# Graffiticode Training Examples\n\n`;
  markdown += `*Downloaded on ${new Date().toISOString()}*\n\n`;
  
  // Group by language
  const examplesByLang: { [key: string]: any[] } = {};
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
    
    examples.forEach((example, index) => {
      const prompt = extractTaskFromMessages(example.messages);
      const code = example.code.trim()
        .split("\n")
        .map((line: string) => line.trimRight())
        .join("\n");
      
      markdown += `### Example ${index + 1}\n\n`;
      markdown += `#### Prompt\n"${prompt}"\n\n`;
      
      // Add chat transcript
      markdown += `#### Chat Transcript\n\n`;
      example.messages.forEach((message: any) => {
        const role = message.role === "user" ? "User" : "Assistant";
        markdown += `**${role}**: ${message.content.trim()}\n\n`;
      });
      
      markdown += `#### Code\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
      
      if (index < examples.length - 1) {
        markdown += `---\n\n`;
      }
    });
    
    markdown += `\n\n`;
  }
  
  return markdown.split("\n")
    .map(line => line.trimRight())
    .join("\n");
}

// Fetch items from Firestore
async function fetchItemsFromFirestore(lang: string | null, marks: number[], limit: number) {
  const db = admin.firestore();
  const collectionPath = `users/${userId}/items`;

  console.log(`Fetching from: ${collectionPath}`);
  console.log(`Filters: lang=${lang || "all"}, mark=${marks.join(",")}, limit=${limit}`);

  let query: any = db.collection("users").doc(userId).collection("items");

  if (lang) {
    query = query.where("lang", "==", lang);
  }
  if (marks.length === 1) {
    query = query.where("mark", "==", marks[0]);
  } else if (marks.length > 1) {
    query = query.where("mark", "in", marks);
  }
  if (limit) {
    query = query.limit(limit);
  }
  
  const snapshot = await query.get();
  console.log(`Found ${snapshot.size} documents`);
  
  const items: any[] = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.help && (data.src || data.code)) {
      items.push({
        id: doc.id,
        lang: data.lang,
        mark: data.mark,
        ...data
      });
    }
  });
  
  console.log(`Found ${items.length} items with help and code`);
  return items;
}

// Process items into training examples
function processItems(items: any[]): any[] {
  const trainingExamples: any[] = [];
  let skippedCount = 0;
  const skipReasons: { [key: string]: number } = {
    "invalid_json": 0,
    "invalid_help": 0,
    "code_too_short": 0,
    "no_dialog": 0
  };

  for (const item of items) {
    // Parse help field
    let help = [];
    try {
      help = JSON.parse(item.help);
    } catch (e) {
      skippedCount++;
      skipReasons.invalid_json++;
      console.log(`  ⚠️ Skipped item ${item.id}: Invalid JSON in help field`);
      console.log(`     Item details:`, JSON.stringify(item, null, 2));
      continue;
    }

    if (!help || !Array.isArray(help) || help.length === 0) {
      skippedCount++;
      skipReasons.invalid_help++;
      console.log(`  ⚠️ Skipped item ${item.id}: Help is not a valid array or is empty`);
      console.log(`     Item details:`, JSON.stringify(item, null, 2));
      continue;
    }

    // Get code
    const code = item.src || item.code || "";
    if (!code || code.trim().length < 10) {
      skippedCount++;
      skipReasons.code_too_short++;
      console.log(`  ⚠️ Skipped item ${item.id}: Code too short (${code.trim().length} chars)`);
      console.log(`     Code content: "${code.trim()}"`);
      console.log(`     Item details:`, JSON.stringify(item, null, 2));
      continue;
    }
    
    // Process dialog messages
    const dialogMessages: any[] = [];
    
    for (let i = 0; i < help.length; i++) {
      const message = help[i];
      if (!message || typeof message !== "object") continue;
      
      if (message.type === "user" && message.user) {
        dialogMessages.push({
          role: "user",
          content: message.user
        });
      } else if (message.type === "bot" && message.help) {
        const helpObj = message.help;
        let content = "";
        
        if (helpObj.type === "text" && helpObj.text) {
          content = helpObj.text;
        } else if (helpObj.type === "code" && helpObj.text) {
          content = `\`\`\`${helpObj.language || "graffiticode"}\n${helpObj.text}\n\`\`\``;
        }
        
        if (content) {
          dialogMessages.push({
            role: "assistant",
            content: content
          });
        }
      }
    }
    
    if (dialogMessages.length > 0) {
      trainingExamples.push({
        messages: dialogMessages,
        code: code.trim(),
        lang: item.lang,
        item_id: item.id,
        usage_count: item.count || 1
      });
    } else {
      skippedCount++;
      skipReasons.no_dialog++;
      console.log(`  ⚠️ Skipped item ${item.id}: No valid dialog messages extracted`);
      console.log(`     Help content:`, JSON.stringify(help, null, 2));
      console.log(`     Item details:`, JSON.stringify(item, null, 2));
    }
  }

  // Print summary if any items were skipped
  if (skippedCount > 0) {
    console.log(`\n  Summary: ${skippedCount} items skipped:`);
    if (skipReasons.invalid_json > 0) {
      console.log(`    - Invalid JSON: ${skipReasons.invalid_json}`);
    }
    if (skipReasons.invalid_help > 0) {
      console.log(`    - Invalid help array: ${skipReasons.invalid_help}`);
    }
    if (skipReasons.code_too_short > 0) {
      console.log(`    - Code too short: ${skipReasons.code_too_short}`);
    }
    if (skipReasons.no_dialog > 0) {
      console.log(`    - No dialog messages: ${skipReasons.no_dialog}`);
    }
  }

  // Sort by usage count
  trainingExamples.sort((a, b) => b.usage_count - a.usage_count);

  return trainingExamples;
}

// Main function
async function main() {
  try {
    console.log("Starting download of training examples from Firebase...\n");
    
    // Initialize Firebase
    initializeFirebase();
    
    // Create training directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created training directory: ${outputDir}`);
    }
    
    // Determine languages to process
    const languagesToProcess = languageFilter
      ? [languageFilter]
      : ["0002"];  // Default to L0002 if no language specified
    
    // Track total examples across all languages
    let totalExamplesCount = 0;
    const filesWritten: string[] = [];
    
    // Process each language and save to separate files
    for (const lang of languagesToProcess) {
      console.log(`\nProcessing language L${lang}...`);
      
      const items = await fetchItemsFromFirestore(lang, markValues, limit);
      const examples = processItems(items);
      
      console.log(`Processed ${examples.length} training examples for L${lang}`);
      
      if (examples.length === 0) {
        console.log(`No examples found for L${lang}, skipping...`);
        continue;
      }
      
      totalExamplesCount += examples.length;
      
      // Convert to markdown for this language
      const markdown = convertToMarkdownFormat(examples);
      
      // Generate filename - always include language prefix
      const filename = `l${lang}-training-examples.md`;
      const outputPath = path.join(outputDir, filename);
      
      // Write or append to file
      if (appendMode && fs.existsSync(outputPath)) {
        // In append mode, strip the header from the new content and append
        const markdownWithoutHeader = markdown.split('\n').slice(3).join('\n'); // Skip header lines
        fs.appendFileSync(outputPath, '\n' + markdownWithoutHeader, "utf8");
        console.log(`✅ Appended ${examples.length} examples to ${filename}`);
      } else {
        // Overwrite mode (default)
        fs.writeFileSync(outputPath, markdown, "utf8");
        console.log(`✅ Saved ${examples.length} examples to ${filename}`);
      }
      
      filesWritten.push(outputPath);
    }
    
    if (totalExamplesCount === 0) {
      console.log("\nNo training examples found. Check your filters and Firebase connection.");
      process.exit(1);
    }
    
    console.log(`\n✅ Total: ${totalExamplesCount} training examples downloaded`);
    console.log("📁 Files written:");
    filesWritten.forEach(file => {
      console.log(`   - ${file}`);
    });
    
  } catch (error) {
    console.error("Error downloading training examples:", error);
    process.exit(1);
  }
}

// Run the script
main();
