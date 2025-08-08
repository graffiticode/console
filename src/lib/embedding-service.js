/**
 * Embedding service for generating vector representations of text
 * Uses OpenAI's text-embedding-3-small model for efficient embeddings
 */

import OpenAI from 'openai';
import admin from 'firebase-admin';
import { FieldValue, VectorValue } from 'firebase-admin/firestore';

// Initialize OpenAI client
let openaiClient = null;

/**
 * Get or initialize OpenAI client
 * @returns {OpenAI} OpenAI client instance
 */
function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiClient;
}

/**
 * Generate embedding for a given text
 * @param {string} text - Text to generate embedding for
 * @param {Object} options - Options for embedding generation
 * @param {string} options.model - Model to use (default: text-embedding-3-small)
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export async function generateEmbedding(text, options = {}) {
  try {
    const model = options.model || 'text-embedding-3-small';
    const openai = getOpenAIClient();

    // Clean and prepare text
    const cleanedText = text.trim().substring(0, 8000); // Model has token limits

    const response = await openai.embeddings.create({
      model: model,
      input: cleanedText,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to generate embeddings for
 * @param {Object} options - Options for embedding generation
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
export async function generateBatchEmbeddings(texts, options = {}) {
  try {
    const model = options.model || 'text-embedding-3-small';
    const openai = getOpenAIClient();

    // Clean and prepare texts (OpenAI can handle up to 2048 inputs per batch)
    const batchSize = 100;
    const embeddings = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const cleanedBatch = batch.map(text =>
        text.trim().substring(0, 8000)
      );

      const response = await openai.embeddings.create({
        model: model,
        input: cleanedBatch,
        encoding_format: 'float',
      });

      embeddings.push(...response.data.map(item => item.embedding));
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
}

/**
 * Create a combined text representation for code examples
 * @param {Object} example - The example object
 * @returns {string} - Combined text for embedding
 */
export function createEmbeddingText(example) {
  let textParts = [];

  // Add task/prompt if available
  if (example.task) {
    textParts.push(`Task: ${example.task}`);
  }

  // Add description if available
  if (example.description) {
    textParts.push(`Description: ${example.description}`);
  }

  // Add code with context
  if (example.code) {
    textParts.push(`Code: ${example.code}`);
  }

  // Add messages if available (for dialog-based examples)
  if (example.messages && Array.isArray(example.messages)) {
    const messageText = example.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    textParts.push(`Dialog:\n${messageText}`);
  }

  // Add explanation if available
  if (example.explanation) {
    textParts.push(`Explanation: ${example.explanation}`);
  }

  return textParts.join('\n\n');
}

/**
 * Perform vector similarity search in Firestore
 * @param {Object} params - Search parameters
 * @param {string} params.collection - Firestore collection name
 * @param {string} params.query - Query text to search for
 * @param {number} params.limit - Maximum number of results (default: 5)
 * @param {string} params.lang - Language filter (optional)
 * @param {Object} params.db - Firestore database instance
 * @returns {Promise<Array>} - Array of similar documents
 */
export async function vectorSearch({ collection, query, limit = 5, lang, db }) {
  try {
    // Build the query
    let searchQuery = db.collection(collection);

    // Add language filter if specified
    if (lang) {
      searchQuery = searchQuery.where('lang', '==', lang);
    }

    // Check if vector search is available
    if (typeof searchQuery.findNearest !== 'function') {
      console.warn('Vector search not available - findNearest is not a function. This may require a newer Firebase SDK version.');
      return [];
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Convert to VectorValue if available, otherwise use array directly
    const vectorQuery = VectorValue ? VectorValue.fromArray(queryEmbedding) : queryEmbedding;

    // Perform vector similarity search
    // Note: Firebase requires a specific index for vector search
    const results = await searchQuery
      .findNearest('embedding', vectorQuery, {
        limit: limit,
        distanceMeasure: 'COSINE', // or 'EUCLIDEAN', 'DOT_PRODUCT'
      })
      .get();

    // Extract documents and add similarity scores
    const documents = [];
    results.forEach(doc => {
      const data = doc.data();
      // Firebase returns distance, convert to similarity score
      const distance = doc.get('__distance__') || 0;
      const similarity = 1 - distance; // For cosine distance

      documents.push({
        id: doc.id,
        ...data,
        similarity: similarity
      });
    });

    return documents;
  } catch (error) {
    console.error('Error performing vector search:', error);

    // If vector search fails, fall back to empty results
    // This might happen if indexes aren't configured yet
    if (error.message.includes('index') || error.message.includes('findNearest')) {
      console.warn('Vector search not available, indexes may need to be configured');
      return [];
    }

    throw error;
  }
}

/**
 * Hybrid search combining vector similarity and keyword matching
 * @param {Object} params - Search parameters
 * @param {string} params.collection - Firestore collection name
 * @param {string} params.query - Query text to search for
 * @param {number} params.limit - Maximum number of results
 * @param {string} params.lang - Language filter
 * @param {Object} params.db - Firestore database instance
 * @param {number} params.vectorWeight - Weight for vector similarity (0-1)
 * @returns {Promise<Array>} - Array of similar documents
 */
export async function hybridSearch({
  collection,
  query,
  limit = 5,
  lang,
  db,
  vectorWeight = 0.7
}) {
  try {
    // Perform vector search
    const vectorResults = await vectorSearch({
      collection,
      query,
      limit: limit * 2, // Get more results for reranking
      lang,
      db
    });

    // Extract keywords from query
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Score results based on both vector similarity and keyword matching
    const scoredResults = vectorResults.map(doc => {
      // Vector similarity score (already computed)
      const vectorScore = doc.similarity || 0;

      // Keyword matching score
      let keywordScore = 0;
      if (keywords.length > 0) {
        const docText = createEmbeddingText(doc).toLowerCase();
        const matchedKeywords = keywords.filter(keyword =>
          docText.includes(keyword)
        );
        keywordScore = matchedKeywords.length / keywords.length;
      }

      // Combined score
      const combinedScore = (vectorScore * vectorWeight) +
                          (keywordScore * (1 - vectorWeight));

      return {
        ...doc,
        vectorScore,
        keywordScore,
        combinedScore
      };
    });

    console.log(
      "hybridSearch()",
      "scoreResults[].combinedScore=" + JSON.stringify(scoredResults.map(r => r.combinedScore)),
      "scoredResults=" + JSON.stringify(scoredResults),
    );

    // Sort by combined score and return top results
    return scoredResults
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    throw error;
  }
}

/**
 * Add or update embedding for a document
 * @param {Object} params - Parameters
 * @param {Object} params.db - Firestore database instance
 * @param {string} params.collection - Collection name
 * @param {string} params.docId - Document ID
 * @param {Object} params.data - Document data
 * @returns {Promise<void>}
 */
export async function addDocumentWithEmbedding({ db, collection, docId, data }) {
  try {
    // Create embedding text from the document data
    const embeddingText = createEmbeddingText(data);

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    // Convert to VectorValue if available, otherwise use array directly
    const vectorValue = VectorValue ? VectorValue.fromArray(embedding) : embedding;

    // Add or update document with embedding
    const docRef = docId
      ? db.collection(collection).doc(docId)
      : db.collection(collection).doc();

    await docRef.set({
      ...data,
      embedding: vectorValue,
      embeddingUpdatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return docRef.id;
  } catch (error) {
    console.error('Error adding document with embedding:', error);
    throw error;
  }
}

/**
 * Update embeddings for existing documents in batch
 * @param {Object} params - Parameters
 * @param {Object} params.db - Firestore database instance
 * @param {string} params.collection - Collection name
 * @param {Array} params.documents - Array of documents to update
 * @returns {Promise<number>} - Number of documents updated
 */
export async function updateEmbeddingsInBatch({ db, collection, documents }) {
  try {
    let updatedCount = 0;
    const batchSize = 10; // Process in smaller batches to avoid timeouts

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const texts = batch.map(doc => createEmbeddingText(doc));

      // Generate embeddings in batch
      const embeddings = await generateBatchEmbeddings(texts);

      // Update documents in Firestore batch
      const writeBatch = db.batch();

      batch.forEach((doc, index) => {
        const docRef = db.collection(collection).doc(doc.id);
        const vectorValue = embeddings[index];

        writeBatch.update(docRef, {
          embedding: vectorValue,
          embeddingUpdatedAt: FieldValue.serverTimestamp()
        });
      });

      await writeBatch.commit();
      updatedCount += batch.length;

      console.log(`Updated embeddings for ${updatedCount}/${documents.length} documents`);
    }

    return updatedCount;
  } catch (error) {
    console.error('Error updating embeddings in batch:', error);
    throw error;
  }
}
