/**
 * RAG Configuration and Feature Flags
 *
 * Centralized configuration for RAG features with graceful degradation support.
 * Allows disabling specific RAG components for debugging or when services are unavailable.
 */

export interface RAGConfig {
  // Feature flags
  enableVectorSearch: boolean;
  enableAnalytics: boolean;
  enableHybridSearch: boolean;
  enableUserFeedback: boolean;

  // Fallback behavior
  fallbackToKeywordSearch: boolean;
  fallbackToNoExamples: boolean;

  // Performance settings
  maxRetrievalAttempts: number;
  retrievalTimeoutMs: number;

  // Analytics settings
  analyticsEnabled: boolean;
  analyticsBatchSize: number;

  // Debug settings
  debugMode: boolean;
  logFailures: boolean;
}

// Default configuration with all features enabled but with fallbacks
const defaultConfig: RAGConfig = {
  // Feature flags - can be controlled via environment variables
  enableVectorSearch: process.env.DISABLE_VECTOR_SEARCH !== 'true',
  enableAnalytics: process.env.DISABLE_RAG_ANALYTICS !== 'true',
  enableHybridSearch: process.env.DISABLE_HYBRID_SEARCH !== 'true',
  enableUserFeedback: process.env.DISABLE_USER_FEEDBACK !== 'true',

  // Fallback behavior - always enabled for resilience
  fallbackToKeywordSearch: true,
  fallbackToNoExamples: true,

  // Performance settings
  maxRetrievalAttempts: 3,
  retrievalTimeoutMs: 5000,

  // Analytics settings
  analyticsEnabled: process.env.DISABLE_RAG_ANALYTICS !== 'true',
  analyticsBatchSize: 100,

  // Debug settings
  debugMode: process.env.RAG_DEBUG === 'true',
  logFailures: true,
};

// Configuration singleton
let currentConfig: RAGConfig = { ...defaultConfig };

/**
 * Get the current RAG configuration
 */
export function getRAGConfig(): RAGConfig {
  return { ...currentConfig };
}

/**
 * Update RAG configuration
 * Useful for testing or runtime adjustments
 */
export function updateRAGConfig(updates: Partial<RAGConfig>): void {
  currentConfig = { ...currentConfig, ...updates };
}

/**
 * Reset configuration to defaults
 */
export function resetRAGConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Check if a specific RAG feature is enabled
 */
export function isFeatureEnabled(feature: keyof RAGConfig): boolean {
  return !!currentConfig[feature];
}

/**
 * Safe wrapper for RAG operations with fallback
 */
export async function withRAGFallback<T>(
  operation: () => Promise<T>,
  fallback: () => T | Promise<T>,
  operationName: string
): Promise<T> {
  const config = getRAGConfig();

  try {
    // Set a timeout for the operation
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operationName} timeout`)), config.retrievalTimeoutMs);
    });

    // Race between operation and timeout
    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
  } catch (error) {
    if (config.logFailures) {
      console.warn(`RAG operation failed: ${operationName}`, error.message);
    }

    // Use fallback
    try {
      return await fallback();
    } catch (fallbackError) {
      if (config.logFailures) {
        console.error(`RAG fallback also failed: ${operationName}`, fallbackError.message);
      }
      throw fallbackError;
    }
  }
}