export interface Config {
  // Blockchain
  baseRpcUrl: string;
  baseChainId: number;
  recipeContractAddress: `0x${string}`;
  agentPrivateKey: `0x${string}`;

  // Backend
  backendApiUrl: string;

  // Processing
  maxRetryAttempts: number;
  retryDelayMs: number;
  pollIntervalMs: number;

  // Storage
  dbPath: string;

  // Logging
  logLevel: string;
  logPath: string;
}

export interface RecipeRequestedEvent {
  recipeId: bigint;
  chef: `0x${string}`;
  dishDescription: string;
  ingredients: string;
  timestamp: bigint;
}

export interface EvaluationData {
  grade: number;
  revenueRate: number;
  critics: string;
}

export interface ProcessedRecipe {
  recipeId: number;
  txHash: string;
  processedAt: number;
  blockNumber: number;
}

export interface Database {
  processed: ProcessedRecipe[];
  metadata: {
    lastProcessedBlock: number;
    lastHealthCheck: number;
  };
}
