/**
 * Embedding service for generating vector representations of text
 * Uses OpenAI's text-embedding-3-small model for efficient embeddings
 */

import OpenAI from "openai";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { ragLog } from "./logger";
import { safeRAGAnalytics } from "./rag-analytics-safe";

// VectorValue may not be available in older Firebase Admin SDK versions
let VectorValue: any;
try {
  // VectorValue is available as a static property on firestore namespace
  // @ts-ignore - VectorValue exists at runtime but not in type definitions
  VectorValue = admin.firestore.VectorValue;
} catch (e) {
  // VectorValue not available, will use arrays directly
  VectorValue = null;
}

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
      throw new Error("OPENAI_API_KEY environment variable is not set");
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
export async function generateEmbedding(
  text: string,
  options: { model?: string; rid?: string } = {},
) {
  const startTime = Date.now();

  try {
    const model = options.model || "text-embedding-3-small";
    const openai = getOpenAIClient();

    // Clean and prepare text
    const cleanedText = text.trim().substring(0, 8000); // Model has token limits

    if (options.rid) {
      ragLog(options.rid, "embedding.generate", {
        model,
        inputLength: cleanedText.length,
        truncated: text.length > 8000,
      });
    }

    const response = await openai.embeddings.create({
      model: model,
      input: cleanedText,
      encoding_format: "float",
    });

    const elapsedMs = Date.now() - startTime;

    if (options.rid) {
      ragLog(options.rid, "embedding.complete", {
        model,
        elapsedMs,
        textLength: cleanedText.length,
      });

      // Track in analytics with enhanced information
      safeRAGAnalytics.trackEmbedding(
        options.rid,
        response.data[0].embedding,
        elapsedMs,
        cleanedText,  // Pass the actual text that was embedded
        model         // Pass the model used
      );
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);

    if (options.rid) {
      ragLog(options.rid, "embedding.error", {
        error: error.message,
        elapsedMs: Date.now() - startTime,
      });
    }

    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to generate embeddings for
 * @param {Object} options - Options for embedding generation
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
export async function generateBatchEmbeddings(
  texts: string[],
  options: { model?: string; rid?: string } = {},
) {
  const startTime = Date.now();

  try {
    const model = options.model || "text-embedding-3-small";
    const openai = getOpenAIClient();

    // Clean and prepare texts (OpenAI can handle up to 2048 inputs per batch)
    const batchSize = 100;
    const embeddings = [];

    if (options.rid) {
      ragLog(options.rid, "embedding.batch.start", {
        model,
        totalTexts: texts.length,
        batchSize,
      });
    }

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

    if (options.rid) {
      ragLog(options.rid, "embedding.batch.complete", {
        model,
        totalTexts: texts.length,
        elapsedMs: Date.now() - startTime,
      });
    }

    return embeddings;
  } catch (error) {
    console.error("Error generating batch embeddings:", error);

    if (options.rid) {
      ragLog(options.rid, "embedding.batch.error", {
        error: error.message,
        elapsedMs: Date.now() - startTime,
      });
    }

    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
}

/**
 * Create a combined text representation for code examples
 * @param {Object} example - The example object
 * @returns {string} - Combined text for embedding
 */
export function createEmbeddingText(example) {
  // Helper: extract simple feature tags from code without embedding the code itself
  function extractFeatureTags(code) {
    if (!code || typeof code !== "string") return [];
    const tags = new Set();

    // Common L0165/Graffiticode constructs
    const keywordMatches = code.match(/\b(title|instructions|columns|cells|width|justify|border|format|assess|expected|method|text)\b/gi);
    if (keywordMatches) keywordMatches.forEach((k) => tags.add(k.toLowerCase()));

    // Cell references like A1, B12, AA3
    const cellRefs = code.match(/\b[A-Z]{1,2}\d{1,3}\b/g);
    if (cellRefs) cellRefs.slice(0, 25).forEach((r) => tags.add(r));

    // Detect formulas that start with '=' and simple operators
    if (/text\s*:\s*"?=/.test(code) || /=\s*[A-Z]{1,2}\d+/.test(code)) tags.add("formula");

    // Common attribute values
    if (/justify\s*:\s*"center"/i.test(code)) tags.add("center");
    if (/justify\s*:\s*"right"/i.test(code)) tags.add("right");
    if (/border\s*:\s*"bottom"/i.test(code) || /border\s*:\s*bottom/i.test(code)) tags.add("border bottom");
    const formatMatch = code.match(/format\s*:\s*"([^"]+)"/i);
    if (formatMatch) tags.add(`format ${formatMatch[1]}`);

    // Version marker often appears at end
    if (/\bv:\s*"[0-9.]+"/.test(code)) tags.add("version");

    // Limit total tags to keep vector text concise
    return Array.from(tags).slice(0, 40);
  }

  // Helper: pull concatenated user turns from messages/help
  function extractUserTurns(obj) {
    const userTexts = [];

    if (Array.isArray(obj?.messages)) {
      obj.messages.forEach((m) => {
        if (m && m.role === "user" && m.content) userTexts.push(String(m.content));
      });
    } else if (obj?.help) {
      // help may be a JSON string or an array of {type:'user'|'bot', ...}
      try {
        const helpArr = typeof obj.help === "string" ? JSON.parse(obj.help) : obj.help;
        if (Array.isArray(helpArr)) {
          helpArr.forEach((h) => {
            if (h?.type === "user" && h.user) userTexts.push(String(h.user));
          });
        }
      } catch (_) {
        // ignore parse errors; fall back below
      }
    }

    return userTexts.filter(Boolean).join("\n");
  }

  // Language marker
  const lang = example.lang || example.language || "";

  // Prompt/task fields
  const prompt = example.prompt || example.task || "";
  const userTurns = extractUserTurns(example);

  // Code features (do not include raw code in the vector text)
  const code = example.code || example.src || "";
  const tags = extractFeatureTags(code);

  // Compose vector text per recommendations
  const parts = [];
  if (lang) parts.push(`L${lang}`);
  if (prompt) parts.push(`Prompt: ${prompt}`);
  if (userTurns) parts.push(`User: ${userTurns}`);
  if (tags.length) parts.push(`Features: ${tags.join(", ")}`);

  // If nothing useful, fall back to description or empty string
  if (parts.length === 0) {
    if (example.description) return example.description;
    // As a last resort, avoid embedding raw code; return empty string
    return "";
  }

  return parts.join(". ");
}

/**
 * Extract concise feature tags from example/code for metadata storage
 * (kept in sync with createEmbeddingText's internal logic)
 */
export function buildFeatureTags(example: any): string[] {
  const code = example?.code || example?.src || "";
  if (!code) return [];
  // Reuse the same heuristics as in createEmbeddingText
  const tags = new Set<string>();
  const keywordMatches = code.match(/\b(title|instructions|columns|cells|width|justify|border|format|assess|expected|method|text)\b/gi);
  if (keywordMatches) keywordMatches.forEach((k) => tags.add(k.toLowerCase()));
  const cellRefs = code.match(/\b[A-Z]{1,2}\d{1,3}\b/g);
  if (cellRefs) cellRefs.slice(0, 25).forEach((r) => tags.add(r));
  if (/text\s*:\s*"?=/.test(code) || /=\s*[A-Z]{1,2}\d+/.test(code)) tags.add("formula");
  if (/justify\s*:\s*"center"/i.test(code)) tags.add("center");
  if (/justify\s*:\s*"right"/i.test(code)) tags.add("right");
  if (/border\s*:\s*"bottom"/i.test(code) || /border\s*:\s*bottom/i.test(code)) tags.add("border bottom");
  const formatMatch = code.match(/format\s*:\s*"([^"]+)"/i);
  if (formatMatch) tags.add(`format ${formatMatch[1]}`);
  if (/\bv:\s*"[0-9.]+"/.test(code)) tags.add("version");
  return Array.from(tags).slice(0, 40);
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
export async function vectorSearch({
  collection,
  query,
  limit = 5,
  lang,
  db,
  rid = null,
}) {
  const startTime = Date.now();

  try {
    if (rid) {
      ragLog(rid, "vectorSearch.start", {
        collection,
        k: limit,
        lang,
        filters: lang ? ["lang"] : [],
      });
    }

    // Build the query
    let searchQuery = db.collection(collection);

    // Add language filter if specified
    if (lang) {
      searchQuery = searchQuery.where("lang", "==", lang);
    }

    // Check if vector search is available
    if (typeof searchQuery.findNearest !== "function") {
      console.warn(
        "Vector search not available - findNearest is not a function. This may require a newer Firebase SDK version.",
      );
      return [];
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, { rid });

    // Convert to VectorValue if available, otherwise use array directly
    const vectorQuery = VectorValue
      ? new VectorValue(queryEmbedding)
      : queryEmbedding;

    // Log the query text for analysis
    if (rid) {
      ragLog(rid, "vectorSearch.queryText", {
        query: query,
        queryLength: query.length,
        embeddingDimensions: queryEmbedding.length,
      });
    }

    // Perform vector similarity search
    // Note: Firebase requires a specific index for vector search
    const results = await searchQuery
      .findNearest("embedding", vectorQuery, {
        limit: limit,
        distanceMeasure: "COSINE", // or 'EUCLIDEAN', 'DOT_PRODUCT'
      })
      .get();

    // Extract documents and add similarity scores
    const documents = [];
    results.forEach((doc) => {
      const data = doc.data();
      // Firebase returns distance, convert to similarity score
      const distance = doc.get("__distance__") || 0;
      const similarity = 1 - distance; // For cosine distance

      documents.push({
        id: doc.id,
        ...data,
        similarity: similarity,
      });
    });

    if (rid) {
      ragLog(rid, "vectorSearch.complete", {
        resultsFound: documents.length,
        topResults: documents.slice(0, 3).map((doc) => ({
          id: doc.id,
          similarity: doc.similarity,
        })),
      });

      // Track retrieval in analytics with enhanced information
      safeRAGAnalytics.trackRetrieval(
        rid,
        documents.map(doc => ({
          id: doc.id,
          similarity: doc.similarity,
          features: buildFeatureTags(doc),
          embeddingText: createEmbeddingText(doc),  // Include embedding text
          code: doc.code || doc.src,                // Include code
          prompt: doc.prompt || doc.task,           // Include prompt
        })),
        "vector",
        Date.now() - startTime,
        undefined
      );
    }

    return documents;
  } catch (error) {
    console.error("Error performing vector search:", error);

    if (rid) {
      ragLog(rid, "vectorSearch.error", {
        error: error.message,
      });
    }

    // If vector search fails, fall back to empty results
    // This might happen if indexes aren't configured yet
    if (
      error.message.includes("index") ||
      error.message.includes("findNearest")
    ) {
      console.warn(
        "Vector search not available, indexes may need to be configured",
      );
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
  vectorWeight = 0.7,
  rid = null,
}) {
  const startTime = Date.now();

  try {
    if (rid) {
      ragLog(rid, "hybridSearch.start", {
        collection,
        k: limit,
        lang,
        vectorWeight,
        query: query,  // Log the query text
        queryLength: query.length,
      });
    }

    // Perform vector search
    const vectorResults = await vectorSearch({
      collection,
      query,
      limit: limit * 2, // Get more results for reranking
      lang,
      db,
      rid,
    });

    // Extract keywords from query
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // Score results based on both vector similarity and keyword matching
    const scoredResults = vectorResults.map((doc) => {
      // Vector similarity score (already computed)
      const vectorScore = doc.similarity || 0;

      // Keyword matching score
      let keywordScore = 0;
      if (keywords.length > 0) {
        const docText = createEmbeddingText(doc).toLowerCase();
        const matchedKeywords = keywords.filter((keyword) =>
          docText.includes(keyword),
        );
        keywordScore = matchedKeywords.length / keywords.length;
      }

      // Combined score
      const combinedScore =
        vectorScore * vectorWeight + keywordScore * (1 - vectorWeight);

      return {
        ...doc,
        vectorScore,
        keywordScore,
        combinedScore,
      };
    });


    // Sort by combined score and return top results
    const topResults = scoredResults
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);

    if (rid) {
      ragLog(rid, "hybridSearch.complete", {
        resultsFound: topResults.length,
        topDocs: topResults.map((doc) => ({
          id: doc.id,
          similarity: doc.vectorScore,
          keywordScore: doc.keywordScore,
          combinedScore: doc.combinedScore,
        })),
      });

      // Track hybrid search in analytics with enhanced information
      safeRAGAnalytics.trackRetrieval(
        rid,
        topResults.map(doc => ({
          id: doc.id,
          similarity: doc.vectorScore,
          keywordScore: doc.keywordScore,
          combinedScore: doc.combinedScore,
          features: buildFeatureTags(doc),
          embeddingText: createEmbeddingText(doc),  // Include embedding text
          code: doc.code || doc.src,                // Include code
          prompt: doc.prompt || doc.task,           // Include prompt
        })),
        "hybrid",
        Date.now() - startTime,
        vectorWeight
      );
    }

    return topResults;
  } catch (error) {
    console.error("Error performing hybrid search:", error);

    if (rid) {
      ragLog(rid, "hybridSearch.error", {
        error: error.message,
      });
    }

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
export async function addDocumentWithEmbedding({
  db,
  collection,
  docId = null,
  data,
}: {
  db: any;
  collection: any;
  docId?: any;
  data: any;
}) {
  try {
    // Create embedding text from the document data
    const embeddingText = createEmbeddingText(data);

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    // Convert to VectorValue if available, otherwise use array directly
    const vectorValue = VectorValue
      ? new VectorValue(embedding)
      : embedding;

    // Add or update document with embedding
    const docRef = docId
      ? db.collection(collection).doc(docId)
      : db.collection(collection).doc();

    await docRef.set(
      {
        ...data,
        embedding: vectorValue,
        embeddingUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return docRef.id;
  } catch (error) {
    console.error("Error adding document with embedding:", error);
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
      const texts = batch.map((doc) => createEmbeddingText(doc));

      // Generate embeddings in batch
      const embeddings = await generateBatchEmbeddings(texts);

      // Update documents in Firestore batch
      const writeBatch = db.batch();

      batch.forEach((doc, index) => {
        const docRef = db.collection(collection).doc(doc.id);
        const vectorValue = embeddings[index];

        writeBatch.update(docRef, {
          embedding: vectorValue,
          embeddingUpdatedAt: FieldValue.serverTimestamp(),
        });
      });

      await writeBatch.commit();
      updatedCount += batch.length;

      console.log(
        `Updated embeddings for ${updatedCount}/${documents.length} documents`,
      );
    }

    return updatedCount;
  } catch (error) {
    console.error("Error updating embeddings in batch:", error);
    throw error;
  }
}
