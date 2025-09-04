/**
 * RAG Analytics Service
 *
 * Provides comprehensive request-level tracing and analytics for the RAG system.
 * Persists detailed metrics to Firestore for analysis and fine-tuning.
 */

import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Analytics event types
export enum RAGEventType {
  REQUEST_START = "request.start",
  EMBEDDING_GENERATED = "embedding.generated",
  RETRIEVAL_START = "retrieval.start",
  RETRIEVAL_COMPLETE = "retrieval.complete",
  GENERATION_START = "generation.start",
  GENERATION_COMPLETE = "generation.complete",
  COMPILATION_ATTEMPT = "compilation.attempt",
  COMPILATION_RESULT = "compilation.result",
  REQUEST_COMPLETE = "request.complete",
  USER_FEEDBACK = "user.feedback",
  ERROR = "error",
}

// Document retrieved from vector search
export interface RetrievedDocument {
  id: string;
  similarity: number;
  keywordScore?: number;
  combinedScore?: number;
  position: number;
  wasUsedInPrompt: boolean;
  features?: string[];
}

// Generation metrics
export interface GenerationMetrics {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
  temperature?: number;
  maxTokens?: number;
  success: boolean;
  errorMessage?: string;
}

// Compilation result
export interface CompilationResult {
  success: boolean;
  taskId?: string;
  errorMessage?: string;
  retryCount: number;
  finalCode?: string;
}

// User feedback data
export interface UserFeedback {
  score: number; // 1-5 or thumbs up/down as 1/0
  comment?: string;
  edited: boolean;
  compiledSuccessfully?: boolean;
  timeToFeedbackMs?: number;
}

// Stage timing information
export interface StageTiming {
  stage: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
}

// Main analytics record
export interface RAGAnalyticsRecord {
  // Request identification
  requestId: string;
  sessionId?: string;
  userId?: string;
  timestamp: FirebaseFirestore.Timestamp;

  // Query information
  query: {
    text: string;
    length: number;
    language: string;
    keywords?: string[];
    embeddingVector?: number[]; // Store first N dimensions for analysis
  };

  // Retrieval information
  retrieval: {
    strategy: "vector" | "hybrid" | "keyword";
    documentsRetrieved: number;
    documentsUsed: number;
    documents: RetrievedDocument[];
    vectorWeight?: number;
    retrievalLatencyMs: number;
  };

  // Generation information
  generation: GenerationMetrics;

  // Compilation information
  compilation?: CompilationResult;

  // Response information
  response: {
    code: string;
    length: number;
    success: boolean;
  };

  // User feedback
  feedback?: UserFeedback;

  // Performance metrics
  performance: {
    totalLatencyMs: number;
    stages: StageTiming[];
  };

  // Error tracking
  errors?: Array<{
    stage: string;
    message: string;
    timestamp: number;
  }>;

  // Metadata
  metadata?: Record<string, any>;
}

// Analytics service class
export class RAGAnalyticsService {
  private static instance: RAGAnalyticsService;
  private db: FirebaseFirestore.Firestore;
  private collection: string = "rag_analytics";
  private activeRequests: Map<string, Partial<RAGAnalyticsRecord>>;
  private stageTiming: Map<string, StageTiming[]>;

  private constructor() {
    try {
      // Initialize Firebase Admin if needed
      if (!admin.apps.length) {
        admin.initializeApp();
      }

      this.db = admin.firestore();

      // Enable ignoreUndefinedProperties to handle undefined values
      // Wrap in try-catch as settings might already be set
      try {
        this.db.settings({ ignoreUndefinedProperties: true });
      } catch (e) {
        // Settings already set, ignore
      }
    } catch (error) {
      console.warn("Failed to initialize Firestore for RAG Analytics:", error.message);
      // Create a mock db that won't crash but won't persist
      this.db = null as any;
    }

    this.activeRequests = new Map();
    this.stageTiming = new Map();
  }

  /**
   * Clean object for Firestore by removing undefined values and replacing with null
   */
  private cleanForFirestore(obj: any): any {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanForFirestore(item));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        cleaned[key] = null;
      } else if (value === null) {
        cleaned[key] = null;
      } else if (typeof value === 'object') {
        cleaned[key] = this.cleanForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  public static getInstance(): RAGAnalyticsService {
    if (!RAGAnalyticsService.instance) {
      RAGAnalyticsService.instance = new RAGAnalyticsService();
    }
    return RAGAnalyticsService.instance;
  }

  /**
   * Start tracking a new RAG request
   */
  public startRequest(
    requestId: string,
    query: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): void {
    const record: Partial<RAGAnalyticsRecord> = {
      requestId,
      userId,
      sessionId,
      timestamp: FieldValue.serverTimestamp() as any,
      query: {
        text: query,
        length: query.length,
        language: "graffiticode", // Will be detected later
      },
      metadata,
      performance: {
        totalLatencyMs: 0,
        stages: [],
      },
    };

    this.activeRequests.set(requestId, record);
    this.stageTiming.set(requestId, []);
    this.startStage(requestId, "request");
  }

  /**
   * Start timing a stage
   */
  public startStage(
    requestId: string,
    stage: string,
    metadata?: Record<string, any>
  ): void {
    const stages = this.stageTiming.get(requestId) || [];
    stages.push({
      stage,
      startTime: Date.now(),
      metadata: metadata || null, // Use null instead of undefined for Firestore
    });
    this.stageTiming.set(requestId, stages);
  }

  /**
   * End timing a stage
   */
  public endStage(requestId: string, stage: string): void {
    const stages = this.stageTiming.get(requestId);
    if (!stages) return;

    const stageRecord = stages.find(
      (s) => s.stage === stage && !s.endTime
    );
    if (stageRecord) {
      stageRecord.endTime = Date.now();
      stageRecord.durationMs = stageRecord.endTime - stageRecord.startTime;
    }
  }

  /**
   * Track embedding generation
   */
  public trackEmbedding(
    requestId: string,
    embeddingVector: number[],
    latencyMs: number
  ): void {
    const record = this.activeRequests.get(requestId);
    if (!record) return;

    // Store first 10 dimensions for analysis (to save space)
    if (record.query) {
      record.query.embeddingVector = embeddingVector.slice(0, 10);
    }

    this.endStage(requestId, "embedding");
  }

  /**
   * Track retrieval results
   */
  public trackRetrieval(
    requestId: string,
    documents: Array<{
      id: string;
      similarity: number;
      keywordScore?: number;
      combinedScore?: number;
      features?: string[];
    }>,
    strategy: "vector" | "hybrid" | "keyword",
    latencyMs: number,
    vectorWeight?: number
  ): void {
    const record = this.activeRequests.get(requestId);
    if (!record) return;

    const retrievedDocs: RetrievedDocument[] = documents.map((doc, index) => ({
      id: doc.id,
      similarity: doc.similarity,
      keywordScore: doc.keywordScore,
      combinedScore: doc.combinedScore,
      position: index,
      wasUsedInPrompt: false, // Will be updated later
      features: doc.features,
    }));

    record.retrieval = {
      strategy,
      documentsRetrieved: documents.length,
      documentsUsed: 0, // Will be updated
      documents: retrievedDocs,
      vectorWeight,
      retrievalLatencyMs: latencyMs,
    };

    this.endStage(requestId, "retrieval");
  }

  /**
   * Mark which documents were actually used in the prompt
   */
  public markDocumentsUsed(
    requestId: string,
    usedDocumentIds: string[]
  ): void {
    const record = this.activeRequests.get(requestId);
    if (!record || !record.retrieval) return;

    record.retrieval.documents.forEach((doc) => {
      doc.wasUsedInPrompt = usedDocumentIds.includes(doc.id);
    });
    record.retrieval.documentsUsed = usedDocumentIds.length;
  }

  /**
   * Track generation metrics
   */
  public trackGeneration(
    requestId: string,
    metrics: GenerationMetrics,
    generatedCode: string
  ): void {
    const record = this.activeRequests.get(requestId);
    if (!record) return;

    record.generation = metrics;
    record.response = {
      code: generatedCode.substring(0, 1000), // Store first 1000 chars
      length: generatedCode.length,
      success: metrics.success,
    };

    this.endStage(requestId, "generation");
  }

  /**
   * Track compilation result
   */
  public trackCompilation(
    requestId: string,
    result: CompilationResult
  ): void {
    const record = this.activeRequests.get(requestId);
    if (!record) return;

    record.compilation = result;
    this.endStage(requestId, "compilation");
  }

  /**
   * Track user feedback
   */
  public async trackUserFeedback(
    requestId: string,
    feedback: UserFeedback
  ): Promise<void> {
    try {
      // Check if db is initialized
      if (!this.db) {
        console.warn("Firestore not initialized, skipping feedback tracking");
        return;
      }

      // Update existing record with feedback
      const docRef = this.db.collection(this.collection).doc(requestId);
      await docRef.update({
        feedback,
        "metadata.hasFeedback": true,
      });
    } catch (error) {
      console.error("Error tracking user feedback:", error);
    }
  }

  /**
   * Track an error
   */
  public trackError(
    requestId: string,
    stage: string,
    error: Error | string
  ): void {
    const record = this.activeRequests.get(requestId);
    if (!record) return;

    if (!record.errors) {
      record.errors = [];
    }

    record.errors.push({
      stage,
      message: typeof error === "string" ? error : error.message,
      timestamp: Date.now(),
    });
  }

  /**
   * Complete request tracking and persist to Firestore
   */
  public async completeRequest(
    requestId: string,
    success: boolean = true
  ): Promise<void> {
    try {
      const record = this.activeRequests.get(requestId);
      if (!record) return;

      // Calculate total latency
      this.endStage(requestId, "request");
      const stages = this.stageTiming.get(requestId) || [];
      const requestStage = stages.find((s) => s.stage === "request");

      if (requestStage && requestStage.durationMs) {
        record.performance = {
          totalLatencyMs: requestStage.durationMs,
          stages: stages.filter((s) => s.durationMs !== undefined),
        };
      }

      // Only save if db is initialized
      if (!this.db) {
        console.warn("Firestore not initialized, skipping analytics save");
        return;
      }

      // Clean the record before saving to Firestore
      const cleanedRecord = this.cleanForFirestore(record);

      // Save to Firestore
      await this.db
        .collection(this.collection)
        .doc(requestId)
        .set({
          ...cleanedRecord,
          "metadata.success": success,
          "metadata.completedAt": FieldValue.serverTimestamp(),
        });

      // Clean up
      this.activeRequests.delete(requestId);
      this.stageTiming.delete(requestId);
    } catch (error) {
      console.error("Error completing RAG analytics request:", error);
    }
  }

  /**
   * Query analytics data
   */
  public async queryAnalytics(
    filters: {
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
      minSimilarity?: number;
    },
    limit: number = 100
  ): Promise<RAGAnalyticsRecord[]> {
    try {
      // Check if db is initialized
      if (!this.db) {
        console.warn("Firestore not initialized, returning empty results");
        return [];
      }

      let query = this.db
        .collection(this.collection)
        .orderBy("timestamp", "desc")
        .limit(limit);

      if (filters.userId) {
        query = query.where("userId", "==", filters.userId);
      }

      if (filters.success !== undefined) {
        query = query.where("metadata.success", "==", filters.success);
      }

      if (filters.startDate) {
        query = query.where("timestamp", ">=", filters.startDate);
      }

      if (filters.endDate) {
        query = query.where("timestamp", "<=", filters.endDate);
      }

      const snapshot = await query.get();
      const records: RAGAnalyticsRecord[] = [];

      snapshot.forEach((doc) => {
        records.push({ ...doc.data(), requestId: doc.id } as RAGAnalyticsRecord);
      });

      // Post-filter for minSimilarity if needed
      if (filters.minSimilarity !== undefined) {
        return records.filter((r) => {
          const maxSim = Math.max(
            ...r.retrieval.documents.map((d) => d.similarity)
          );
          return maxSim >= filters.minSimilarity;
        });
      }

      return records;
    } catch (error) {
      console.error("Error querying RAG analytics:", error);
      return [];
    }
  }

  /**
   * Get aggregated metrics
   */
  public async getAggregatedMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    averageSimilarity: number;
    feedbackScore: number;
    topErrors: Array<{ stage: string; count: number }>;
  }> {
    try {
      const records = await this.queryAnalytics({ startDate, endDate }, 1000);

      const successful = records.filter((r) => r.metadata?.success).length;
      const withFeedback = records.filter((r) => r.feedback?.score);

      const totalLatency = records.reduce(
        (sum, r) => sum + (r.performance?.totalLatencyMs || 0),
        0
      );

      const allSimilarities = records.flatMap((r) =>
        r.retrieval?.documents?.map((d) => d.similarity) || []
      );

      const feedbackSum = withFeedback.reduce(
        (sum, r) => sum + (r.feedback?.score || 0),
        0
      );

      // Count errors by stage
      const errorCounts = new Map<string, number>();
      records.forEach((r) => {
        r.errors?.forEach((e) => {
          errorCounts.set(e.stage, (errorCounts.get(e.stage) || 0) + 1);
        });
      });

      const topErrors = Array.from(errorCounts.entries())
        .map(([stage, count]) => ({ stage, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalRequests: records.length,
        successRate: records.length > 0 ? successful / records.length : 0,
        averageLatency:
          records.length > 0 ? totalLatency / records.length : 0,
        averageSimilarity:
          allSimilarities.length > 0
            ? allSimilarities.reduce((a, b) => a + b, 0) / allSimilarities.length
            : 0,
        feedbackScore:
          withFeedback.length > 0 ? feedbackSum / withFeedback.length : 0,
        topErrors,
      };
    } catch (error) {
      console.error("Error getting aggregated metrics:", error);
      throw error;
    }
  }
}

// Export singleton instance helper
export const ragAnalytics = RAGAnalyticsService.getInstance();