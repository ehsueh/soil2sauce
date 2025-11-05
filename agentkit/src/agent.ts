import { createPublicClient, createWalletClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from './config.js';
import { logger } from './logger.js';
import { storage } from './storage.js';
import { EventProcessor } from './eventProcessor.js';
import { RecipeRequestedEvent } from './types.js';

const RECIPE_REQUESTED_EVENT = parseAbiItem(
  'event RecipeRequested(uint256 indexed recipeId, address indexed chef, string instruction, string ingredients, uint256 timestamp)'
);

class RecipeAgent {
  private publicClient;
  private walletClient;
  private eventProcessor: EventProcessor;
  private isRunning = false;
  private lastProcessedBlock: bigint = 0n;

  constructor() {
    logger.info('Initializing Recipe Agent');

    // Create public client for reading
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(config.baseRpcUrl),
    });

    // Create wallet client for writing
    const account = privateKeyToAccount(config.agentPrivateKey);
    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(config.baseRpcUrl),
    });

    logger.info('Wallet configured', {
      address: account.address,
    });

    // Initialize event processor
    this.eventProcessor = new EventProcessor(
      this.publicClient,
      this.walletClient
    );
  }

  async start(): Promise<void> {
    try {
      // Initialize storage
      await storage.init();
      logger.info('Storage initialized');

      // Get last processed block from storage
      const lastBlock = await storage.getLastProcessedBlock();
      this.lastProcessedBlock = BigInt(lastBlock);

      logger.info('Agent starting', {
        lastProcessedBlock: lastBlock,
        pollInterval: config.pollIntervalMs,
      });

      this.isRunning = true;

      // Setup graceful shutdown
      this.setupShutdownHandlers();

      // Start polling for events
      await this.pollEvents();
    } catch (error) {
      logger.error('Failed to start agent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  private async pollEvents(): Promise<void> {
    while (this.isRunning) {
      try {
        const latestBlock = await this.publicClient.getBlockNumber();

        if (this.lastProcessedBlock === 0n) {
          // First run, start from 10 blocks ago (Alchemy free tier limit)
          this.lastProcessedBlock = latestBlock - 10n;
        }

        const fromBlock = this.lastProcessedBlock + 1n;

        if (fromBlock > latestBlock) {
          // No new blocks, wait
          await this.sleep(config.pollIntervalMs);
          continue;
        }

        // Limit block range to 10 blocks for Alchemy free tier
        const toBlock = fromBlock + 9n > latestBlock ? latestBlock : fromBlock + 9n;

        logger.debug('Polling for events', {
          fromBlock: Number(fromBlock),
          toBlock: Number(toBlock),
        });

        // Get RecipeRequested events
        const logs = await this.publicClient.getLogs({
          address: config.recipeContractAddress,
          event: RECIPE_REQUESTED_EVENT,
          fromBlock,
          toBlock,
        });

        logger.info(`Found ${logs.length} recipe request events`, {
          fromBlock: Number(fromBlock),
          toBlock: Number(toBlock),
        });

        // Process each event
        for (const log of logs) {
          try {
            const event: RecipeRequestedEvent = {
              recipeId: log.args.recipeId!,
              chef: log.args.chef!,
              instruction: log.args.instruction!,
              ingredients: log.args.ingredients!,
              timestamp: log.args.timestamp!,
            };

            await this.eventProcessor.processRecipeRequest(event);
          } catch (error) {
            logger.error('Failed to process event', {
              recipeId: log.args.recipeId ? Number(log.args.recipeId) : 'unknown',
              error: error instanceof Error ? error.message : 'Unknown error',
            });

            // Continue processing other events even if one fails
          }
        }

        // Update last processed block
        this.lastProcessedBlock = toBlock;

        // Wait before next poll
        await this.sleep(config.pollIntervalMs);
      } catch (error) {
        logger.error('Error in polling loop', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Wait before retrying
        await this.sleep(config.retryDelayMs);
      }
    }
  }

  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      logger.info('Shutdown signal received', { signal });
      this.isRunning = false;

      // Save current state
      await storage.flush();

      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Start the agent
logger.info('🤖 Soil2Sauce Recipe Agent starting...');

const agent = new RecipeAgent();
agent.start().catch((error) => {
  logger.error('Fatal error', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
