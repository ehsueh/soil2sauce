import dotenv from 'dotenv';
import { Config } from './types.js';

dotenv.config();

function loadConfig(): Config {
  // Required variables
  const baseRpcUrl = process.env.BASE_RPC_URL;
  const recipeContractAddress = process.env.RECIPE_CONTRACT_ADDRESS;
  const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
  const backendApiUrl = process.env.BACKEND_API_URL;

  if (!baseRpcUrl) {
    throw new Error('BASE_RPC_URL environment variable is required');
  }

  if (!recipeContractAddress || !recipeContractAddress.startsWith('0x')) {
    throw new Error('RECIPE_CONTRACT_ADDRESS environment variable is required and must start with 0x');
  }

  if (!agentPrivateKey || !agentPrivateKey.startsWith('0x')) {
    throw new Error('AGENT_PRIVATE_KEY environment variable is required and must start with 0x');
  }

  if (!backendApiUrl) {
    throw new Error('BACKEND_API_URL environment variable is required');
  }

  // Optional variables with defaults
  const baseChainId = parseInt(process.env.BASE_CHAIN_ID || '8453', 10);
  const maxRetryAttempts = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10);
  const retryDelayMs = parseInt(process.env.RETRY_DELAY_MS || '5000', 10);
  const pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS || '15000', 10);
  const dbPath = process.env.DB_PATH || './data/processed.json';
  const logLevel = process.env.LOG_LEVEL || 'info';
  const logPath = process.env.LOG_PATH || './logs/agent.log';

  return {
    baseRpcUrl,
    baseChainId,
    recipeContractAddress: recipeContractAddress as `0x${string}`,
    agentPrivateKey: agentPrivateKey as `0x${string}`,
    backendApiUrl,
    maxRetryAttempts,
    retryDelayMs,
    pollIntervalMs,
    dbPath,
    logLevel,
    logPath,
  };
}

export const config = loadConfig();
