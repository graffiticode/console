#!/usr/bin/env node

/**
 * Script to update existing training examples and successful generations with embeddings
 * 
 * Usage:
 *   node scripts/update-embeddings.js [options]
 * 
 * Options:
 *   --collection <name>  Collection to update (training_examples or successful_generations)
 *   --lang <code>        Language code to filter by (optional)
 *   --limit <number>     Maximum number of documents to process (default: all)
 *   --batch-size <num>   Number of documents to process at once (default: 10)
 */

import admin from 'firebase-admin';
import { 
  createEmbeddingText, 
  updateEmbeddingsInBatch,
  generateBatchEmbeddings 
} from '../src/lib/embedding-service';
import { FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : defaultValue;
};

const collection = getArg('collection', 'training_examples');
const lang = getArg('lang', null);
const limit = parseInt(getArg('limit', '0')) || null;
const batchSize = parseInt(getArg('batch-size', '10'));

// Validate environment
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Update embeddings for documents in a collection
 */
async function updateCollectionEmbeddings() {
  try {
    console.log(`\nUpdating embeddings for collection: ${collection}`);
    if (lang) {
      console.log(`Filtering by language: ${lang}`);
    }
    if (limit) {
      console.log(`Processing up to ${limit} documents`);
    }
    console.log(`Batch size: ${batchSize}`);
    console.log('');
    
    // Build query
    let query = db.collection(collection);
    
    // Add language filter if specified
    if (lang) {
      query = query.where('lang', '==', lang);
    }
    
    // Add limit if specified
    if (limit) {
      query = query.limit(limit);
    }
    
    // Get documents
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('No documents found matching the criteria');
      return;
    }
    
    console.log(`Found ${snapshot.size} documents to process`);
    
    // Process documents in batches
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process in batches
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} (${batch.length} documents)...`);
      
      try {
        // Prepare texts for embedding
        const textsToEmbed = [];
        const docsToUpdate = [];
        
        for (const doc of batch) {
          // Skip if document already has an embedding (unless forced)
          if (doc.embedding && !args.includes('--force')) {
            console.log(`  Skipping ${doc.id} (already has embedding)`);
            skippedCount++;
            continue;
          }
          
          const embeddingText = createEmbeddingText(doc);
          textsToEmbed.push(embeddingText);
          docsToUpdate.push(doc);
        }
        
        if (textsToEmbed.length === 0) {
          continue;
        }
        
        // Generate embeddings
        console.log(`  Generating embeddings for ${textsToEmbed.length} documents...`);
        const embeddings = await generateBatchEmbeddings(textsToEmbed);
        
        // Update documents in Firestore
        const writeBatch = db.batch();
        
        docsToUpdate.forEach((doc, index) => {
          const docRef = db.collection(collection).doc(doc.id);
          const vectorValue = embeddings[index];
          
          writeBatch.update(docRef, {
            embedding: vectorValue,
            embeddingText: textsToEmbed[index], // Store the text used for embedding
            embeddingUpdatedAt: FieldValue.serverTimestamp()
          });
          
          console.log(`  Updating ${doc.id}`);
        });
        
        await writeBatch.commit();
        processedCount += docsToUpdate.length;
        console.log(`  ✓ Batch committed successfully`);
        
      } catch (error) {
        console.error(`  ✗ Error processing batch:`, error.message);
        errorCount += batch.length;
      }
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Summary
    console.log('\n========================================');
    console.log('Update Complete');
    console.log('========================================');
    console.log(`Total documents: ${documents.length}`);
    console.log(`Processed: ${processedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // Deploy indexes reminder
    if (processedCount > 0) {
      console.log('\n⚠️  Important: Deploy Firestore indexes for vector search');
      console.log('Run: firebase deploy --only firestore:indexes');
      console.log('This will enable vector similarity search on the embedding field');
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateCollectionEmbeddings()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });