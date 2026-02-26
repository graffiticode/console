#!/usr/bin/env node

/**
 * Script to read training examples from markdown files and store them with embeddings in Firestore
 * Following the recommended structure for RAG chunks
 * 
 * Usage:
 *   npm run update-embeddings-from-md -- [options]
 * 
 * Options:
 *   --lang <code>        Language code to process (e.g., "0165")
 *   --file <path>        Specific markdown file to process
 *   --batch-size <num>   Number of documents to process at once (default: 10)
 *   --collection <name>  Target collection name (default: training_examples)
 *   --refresh            Delete existing docs for the language before uploading new ones
 */

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import OpenAI from "openai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Force connection to production Firestore (bypass emulator)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string | null = null) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : defaultValue;
};

const lang = getArg('lang');
const specificFile = getArg('file');
const batchSize = parseInt(getArg('batch-size', '10') || '10');
const collectionName = getArg('collection', 'training_examples');
const refresh = args.includes('--refresh');

// Show help if requested
if (args.includes('--help')) {
  console.log(`
Usage: npm run update-embeddings-from-md -- [options]

Options:
  --lang <code>        Language code to process (e.g., "0165")
  --file <path>        Specific markdown file to process
  --batch-size <num>   Number of documents to process at once (default: 10)
  --collection <name>  Target collection name (default: training_examples)
  --refresh            Delete existing docs for the language before uploading new ones
  --help               Show this help message

Examples:
  npm run update-embeddings-from-md -- --lang 0165
  npm run update-embeddings-from-md -- --file training/l0165-training-examples.md
  npm run update-embeddings-from-md -- --lang 0002 --batch-size 5
  npm run update-embeddings-from-md -- --lang 0165 --refresh
`);
  process.exit(0);
}

// Validate environment
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

// Use GRAFFITICODE_APP_CREDENTIALS for the graffiticode-app project
if (process.env.GRAFFITICODE_APP_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;
} else {
  console.error('Error: GRAFFITICODE_APP_CREDENTIALS environment variable not set');
  console.error('Set it to the path of your graffiticode-app service account key');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'graffiticode-app'
  });
}

const db = admin.firestore();

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Get or initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiClient;
}

/**
 * Generate embeddings for multiple texts in batch
 * Local version without analytics dependencies
 */
async function generateBatchEmbeddings(
  texts: string[],
  options: { model?: string } = {},
): Promise<number[][]> {
  const startTime = Date.now();

  try {
    const model = options.model || "text-embedding-3-small";
    const openai = getOpenAIClient();

    // Clean and prepare texts (OpenAI can handle up to 2048 inputs per batch)
    const batchSize = 100;
    const embeddings: number[][] = [];

    console.log(`  Generating embeddings for ${texts.length} texts...`);

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const cleanedBatch = batch.map((text) => text.trim().substring(0, 8000));

      const response = await openai.embeddings.create({
        model: model,
        input: cleanedBatch,
        encoding_format: "float",
      });

      embeddings.push(...response.data.map((item) => item.embedding));
    }

    console.log(`  Embeddings generated in ${Date.now() - startTime}ms`);
    return embeddings;
  } catch (error: any) {
    console.error("Error generating batch embeddings:", error);
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
}

// Import VectorValue after Firebase is initialized
let VectorValue: any;
try {
  // VectorValue is available as a static property on firestore namespace
  // @ts-ignore - VectorValue exists at runtime but not in type definitions
  VectorValue = admin.firestore.VectorValue;
  if (!VectorValue) {
    throw new Error('VectorValue not found');
  }
} catch (e) {
  // VectorValue not available, will use arrays directly
  VectorValue = null;
}

interface TrainingExample {
  lang: string;
  exampleId: number;
  prompt: string;
  code: string;
  title?: string;
  instructions?: string;
  tags: string[];
  expectedValues?: string[];
  sourcePath: string;
  messages: Array<{role: string, content: string}>;
}

/**
 * Extract features and tags from prompt text only
 */
function extractFeatures(prompt: string): string[] {
  const features = new Set<string>();
  
  // Extract cell references that appear in formulas or operations
  const formulaPattern = /=\s*[A-Z]\d+[+\-*/][A-Z]\d+/g;
  const formulas = prompt.match(formulaPattern);
  if (formulas) {
    formulas.forEach(formula => {
      features.add(`formula ${formula}`);
      // Extract cell references from the formula
      const cells = formula.match(/[A-Z]\d+/g);
      if (cells) {
        cells.forEach(cell => features.add(cell));
      }
    });
  }
  
  // Extract formatting instructions
  const formatMatches = prompt.match(/format[^.;,]*/gi);
  if (formatMatches) {
    formatMatches.forEach(match => {
      const cleaned = match.toLowerCase().trim();
      if (cleaned.length < 30) features.add(cleaned);
    });
  }
  
  // Extract border instructions
  const borderMatches = prompt.match(/border[^.;,]*/gi);
  if (borderMatches) {
    borderMatches.forEach(match => {
      const cleaned = match.toLowerCase().trim();
      if (cleaned.length < 30) features.add(cleaned);
    });
  }
  
  // Extract alignment instructions
  const alignments = prompt.match(/\b(left|right|center)\s*(justify|align)?/gi);
  if (alignments) {
    alignments.forEach(align => features.add(align.toLowerCase()));
  }
  
  // Extract column/row references
  const columnRefs = prompt.match(/column\s+[A-Z]\b/gi);
  if (columnRefs) {
    columnRefs.forEach(ref => features.add(ref.toLowerCase()));
  }
  
  const rowRefs = prompt.match(/row\s+\d+/gi);
  if (rowRefs) {
    rowRefs.forEach(ref => features.add(ref.toLowerCase()));
  }
  
  // Extract action words
  const actions = prompt.match(/\b(add|subtract|multiply|divide|sum|average|count|bold|italic|underline|merge|sort|filter|validate|remove|create|prepare|calculate)\b/gi);
  if (actions) {
    actions.forEach(action => features.add(action.toLowerCase()));
  }
  
  // Extract specific spreadsheet terms
  const spreadsheetTerms = prompt.match(/\b(spreadsheet|table|cell|cells|formula|currency|percentage|decimal)\b/gi);
  if (spreadsheetTerms) {
    spreadsheetTerms.forEach(term => features.add(term.toLowerCase()));
  }
  
  // Extract expected numeric values mentioned in validation
  const validatePattern = /validate.*?(\d+)/gi;
  const validateMatches = prompt.match(validatePattern);
  if (validateMatches) {
    validateMatches.forEach(match => {
      const num = match.match(/\d+/);
      if (num) features.add(`expected:${num[0]}`);
    });
  }
  
  return Array.from(features);
}

/**
 * Extract expected values from code
 */
function extractExpectedValues(code: string): string[] {
  const values: string[] = [];
  
  const expectedMatches = code.match(/expected:\s*["']?([^,\s}]+)/g);
  if (expectedMatches) {
    expectedMatches.forEach(match => {
      const value = match.replace(/expected:\s*["']?/, '').replace(/["']/, '');
      values.push(value);
    });
  }
  
  return values;
}

/**
 * Create the vector text for embedding.
 * Uses plain prompt text only — lang is filtered at query time,
 * and feature tags add noise without helping differentiation.
 */
function createVectorText(example: TrainingExample): string {
  if (example.prompt) return example.prompt;
  // Fall back to first user message from chat transcript
  const userMsg = example.messages?.find(m => m.role === 'user');
  return userMsg?.content || '';
}

/**
 * Parse a markdown file to extract training examples
 */
function parseMarkdownFile(filePath: string, langCode: string): TrainingExample[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const examples: TrainingExample[] = [];
  
  // Split by example sections
  const exampleSections = content.split(/### Example \d+/);
  
  for (let i = 1; i < exampleSections.length; i++) {
    const section = exampleSections[i];
    
    // Extract prompt
    let prompt = '';
    const promptSection = section.match(/#### Prompt\s*\n([\s\S]*?)(?=####|$)/);
    if (promptSection) {
      let raw = promptSection[1].trim();
      // Strip surrounding quotes if present
      if (raw.startsWith('"') && raw.endsWith('"')) {
        raw = raw.slice(1, -1);
      }
      prompt = raw;
    }
    
    // Extract chat transcript
    const messages: Array<{role: string, content: string}> = [];
    const transcriptMatch = section.match(/#### Chat Transcript([\s\S]*?)(?=####|$)/);
    
    if (transcriptMatch) {
      const transcript = transcriptMatch[1];
      // Split by **User**: or **Assistant**:
      const messageParts = transcript.split(/\*\*(User|Assistant)\*\*:/);
      
      for (let j = 1; j < messageParts.length; j += 2) {
        const role = messageParts[j].toLowerCase() === 'user' ? 'user' : 'assistant';
        const content = messageParts[j + 1].trim();
        if (content) {
          messages.push({ role, content });
        }
      }
    }
    
    // Extract code
    let code = '';
    const codeMatch = section.match(/#### Code\s*\n```([\s\S]*?)```/);
    if (codeMatch) {
      code = codeMatch[1].trim();
    }
    
    if (prompt || messages.length > 0 || code) {
      // Extract features and tags from prompt only
      const tags = extractFeatures(prompt);
      const expectedValues = extractExpectedValues(code);
      
      // Extract title and instructions from code if present
      let title: string | undefined;
      let instructions: string | undefined;
      
      const titleMatch = code.match(/title\s+["']([^"']+)["']/);
      if (titleMatch) {
        title = titleMatch[1];
      }
      
      const instructionsMatch = code.match(/instructions\s+["']([^"']+)["']/);
      if (instructionsMatch) {
        instructions = instructionsMatch[1];
      }
      
      examples.push({
        lang: langCode,
        exampleId: i,
        prompt,
        code,
        title,
        instructions,
        tags,
        expectedValues: expectedValues.length > 0 ? expectedValues : undefined,
        sourcePath: `training/${path.basename(filePath)}`,
        messages
      });
    }
  }
  
  return examples;
}

/**
 * Delete existing documents for specified language(s)
 */
async function deleteExistingDocs(languages: string[]): Promise<number> {
  console.log(`\nDeleting existing documents for language(s): ${languages.join(', ')}`);
  
  let totalDeleted = 0;
  
  for (const langCode of languages) {
    console.log(`  Querying documents for language ${langCode}...`);
    
    // Query all documents with this language
    const snapshot = await db.collection(collectionName)
      .where('lang', '==', langCode)
      .get();
    
    if (snapshot.empty) {
      console.log(`  No existing documents found for language ${langCode}`);
      continue;
    }
    
    console.log(`  Found ${snapshot.size} documents for language ${langCode}`);
    
    // Delete in batches (Firestore batch limit is 500)
    const batchSize = 500;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = docs.slice(i, Math.min(i + batchSize, docs.length));
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      const deletedCount = batchDocs.length;
      totalDeleted += deletedCount;
      console.log(`  Deleted batch of ${deletedCount} documents`);
    }
    
    console.log(`  ✓ Deleted ${snapshot.size} documents for language ${langCode}`);
  }
  
  return totalDeleted;
}

/**
 * Get markdown files to process
 */
function getMarkdownFiles(): Array<{path: string, lang: string}> {
  const trainingDir = path.join(process.cwd(), 'training');
  const files: Array<{path: string, lang: string}> = [];
  
  if (specificFile) {
    // Process specific file
    const fullPath = path.isAbsolute(specificFile) 
      ? specificFile 
      : path.join(process.cwd(), specificFile);
    
    if (fs.existsSync(fullPath)) {
      // Extract language from filename (e.g., l0165-training-examples.md -> 0165)
      const langMatch = path.basename(fullPath).match(/l(\d+)/);
      const langCode = langMatch ? langMatch[1] : 'unknown';
      files.push({ path: fullPath, lang: langCode });
    } else {
      console.error(`File not found: ${fullPath}`);
      process.exit(1);
    }
  } else if (lang) {
    // Process files for specific language
    const fileName = `l${lang}-training-examples.md`;
    const filePath = path.join(trainingDir, fileName);
    
    if (fs.existsSync(filePath)) {
      files.push({ path: filePath, lang });
    } else {
      console.error(`File not found: ${filePath}`);
      console.log(`Available files in training directory:`);
      const availableFiles = fs.readdirSync(trainingDir)
        .filter(f => f.endsWith('.md'))
        .filter(f => f.includes('training-examples'));
      availableFiles.forEach(f => console.log(`  - ${f}`));
      process.exit(1);
    }
  } else {
    // Process all training example files
    const allFiles = fs.readdirSync(trainingDir)
      .filter(f => f.endsWith('-training-examples.md'));
    
    for (const file of allFiles) {
      const langMatch = file.match(/l(\d+)/);
      if (langMatch) {
        files.push({ 
          path: path.join(trainingDir, file), 
          lang: langMatch[1] 
        });
      }
    }
  }
  
  return files;
}

/**
 * Store training examples with embeddings in Firestore
 */
async function storeExamplesWithEmbeddings(examples: TrainingExample[]) {
  const stats = {
    total: examples.length,
    stored: 0,
    errors: 0,
    skipped: 0
  };
  
  console.log(`\nStoring ${stats.total} examples in Firestore collection: ${collectionName}`);
  
  // Process in batches
  for (let i = 0; i < examples.length; i += batchSize) {
    const batch = examples.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} (${batch.length} examples)...`);
    
    try {
      // Prepare texts for embedding
      const textsToEmbed: string[] = [];
      const docsToStore: Array<{id: string, data: any}> = [];
      
      for (const example of batch) {
        // Create a unique ID for the example
        const docId = `${example.lang}_example_${example.exampleId}_${Date.now()}`;
        
        // Create the vector text
        const vectorText = createVectorText(example);
        textsToEmbed.push(vectorText);
        
        // Prepare document data (the value/payload to store)
        // Only include defined fields to avoid Firestore errors
        const docData: any = {
          lang: example.lang,
          exampleId: example.exampleId,
          prompt: example.prompt,
          code: example.code,
          tags: example.tags,
          sourcePath: example.sourcePath,
          messages: example.messages,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };
        
        // Add optional fields only if they exist
        if (example.title) docData.title = example.title;
        if (example.instructions) docData.instructions = example.instructions;
        if (example.expectedValues && example.expectedValues.length > 0) {
          docData.expectedValues = example.expectedValues;
        }
        
        docsToStore.push({ id: docId, data: docData });
        console.log(`  Prepared example ${example.exampleId} with ${example.tags.length} tags`);
      }
      
      // Generate embeddings in batch
      console.log(`  Generating embeddings for ${textsToEmbed.length} examples...`);
      const embeddings = await generateBatchEmbeddings(textsToEmbed);
      
      // Store documents with embeddings
      const writeBatch = db.batch();
      
      docsToStore.forEach((doc, index) => {
        const docRef = db.collection(collectionName).doc(doc.id);
        // Convert to VectorValue if available, otherwise use array directly
        const vectorValue = VectorValue 
          ? new VectorValue(embeddings[index])
          : embeddings[index];
        
        writeBatch.set(docRef, {
          ...doc.data,
          embedding: vectorValue,
          embeddingText: textsToEmbed[index],
          embeddingUpdatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`  Storing ${doc.id}`);
      });
      
      await writeBatch.commit();
      stats.stored += docsToStore.length;
      console.log(`  ✓ Batch stored successfully`);
      
    } catch (error: any) {
      console.error(`  ✗ Error processing batch:`, error.message);
      stats.errors += batch.length;
    }
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < examples.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return stats;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Reading training examples from markdown files...\n');
    
    // Get files to process
    const files = getMarkdownFiles();
    
    if (files.length === 0) {
      console.log('No markdown files found to process');
      process.exit(1);
    }
    
    console.log(`Found ${files.length} file(s) to process:`);
    files.forEach(f => console.log(`  - ${f.path} (language: ${f.lang})`));
    
    // If refresh flag is set, delete existing documents for these languages
    if (refresh) {
      const languages = [...new Set(files.map(f => f.lang))]; // Get unique languages
      const deletedCount = await deleteExistingDocs(languages);
      console.log(`\n✓ Deleted ${deletedCount} existing documents`);
    }
    
    // Parse all files
    const allExamples: TrainingExample[] = [];
    
    for (const file of files) {
      console.log(`\nParsing ${path.basename(file.path)}...`);
      const examples = parseMarkdownFile(file.path, file.lang);
      console.log(`  Found ${examples.length} examples`);
      
      // Show sample of extracted features for first example
      if (examples.length > 0) {
        console.log(`  Sample tags from first example: ${examples[0].tags.slice(0, 10).join(', ')}`);
      }
      
      allExamples.push(...examples);
    }
    
    if (allExamples.length === 0) {
      console.log('\nNo training examples found in the markdown files');
      process.exit(1);
    }
    
    console.log(`\nTotal examples to process: ${allExamples.length}`);
    
    // Store examples with embeddings
    const stats = await storeExamplesWithEmbeddings(allExamples);
    
    // Print summary
    console.log('\n===== SUMMARY =====');
    console.log(`Total examples: ${stats.total}`);
    console.log(`Successfully stored: ${stats.stored}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log('==================\n');
    
    if (stats.stored > 0) {
      console.log('✅ Training examples successfully stored with embeddings in Firestore');
      console.log(`Collection: ${collectionName}`);
      console.log('\nDocument structure:');
      console.log('  - vector_text: "L<lang>. Prompt: <...>. User: <...>. Features: <...>"');
      console.log('  - value: { lang, exampleId, prompt, code, tags, expectedValues, sourcePath, ... }');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();