import axios from 'axios';
import { PublicClient, WalletClient } from 'viem';
import { config } from './config.js';
import { logger } from './logger.js';
import { storage } from './storage.js';
import { RecipeRequestedEvent, EvaluationData } from './types.js';

const RECIPE_SYSTEM_ABI = [
  {
    type: 'function',
    name: 'finalizeRecipe',
    inputs: [
      { name: 'recipeId', type: 'uint256' },
      { name: 'dishDescription', type: 'string' },
      { name: 'grade', type: 'uint8' },
      { name: 'revenueRate', type: 'uint256' },
      { name: 'critics', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isProcessing',
    inputs: [{ name: 'recipeId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

export class EventProcessor {
  constructor(
    private publicClient: PublicClient,
    private walletClient: WalletClient
  ) {}

  async processRecipeRequest(event: RecipeRequestedEvent): Promise<void> {
    const recipeId = Number(event.recipeId);

    logger.info('Recipe request received', {
      recipeId,
      chef: event.chef,
      instruction: event.instruction.substring(0, 50),
      timestamp: Number(event.timestamp),
    });

    try {
      // Check if already processed in local DB
      const alreadyProcessed = await storage.isProcessed(recipeId);
      if (alreadyProcessed) {
        logger.info('Recipe already processed (in local DB)', { recipeId });
        return;
      }

      // Check if processing locked on contract
      const isLocked = await this.publicClient.readContract({
        address: config.recipeContractAddress,
        abi: RECIPE_SYSTEM_ABI,
        functionName: 'isProcessing',
        args: [BigInt(recipeId)],
      });

      if (isLocked) {
        logger.info('Recipe is being processed (contract locked)', { recipeId });
        return;
      }

      // Call backend API for evaluation
      logger.debug('Calling evaluation API', {
        recipeId,
        endpoint: config.backendApiUrl,
      });

      const evaluation = await this.callBackendAPI(
        event.instruction,
        event.ingredients
      );

      logger.info('Evaluation received from API', {
        recipeId,
        grade: evaluation.grade,
        revenueRate: evaluation.revenueRate,
      });

      // Submit to blockchain
      const txHash = await this.finalizeOnChain(recipeId, evaluation);

      logger.info('Transaction submitted', {
        recipeId,
        txHash,
      });

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 300_000, // 5 minutes
      });

      logger.info('Transaction confirmed', {
        recipeId,
        txHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed),
      });

      // Mark as processed in local DB
      await storage.markProcessed(
        recipeId,
        txHash,
        Number(receipt.blockNumber)
      );

      logger.info('Recipe processing complete', { recipeId });
    } catch (error) {
      logger.error('Failed to process recipe', {
        recipeId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Optionally retry with exponential backoff (handled by caller)
      throw error;
    }
  }

  private async callBackendAPI(
    instruction: string,
    ingredients: string
  ): Promise<EvaluationData> {
    try {
      const response = await axios.post(
        `${config.backendApiUrl}/api/evaluate-recipe`,
        {
          instruction,
          ingredients,
        },
        {
          timeout: 30000, // 30 seconds
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'API returned unsuccessful response');
      }

      const { data } = response.data;

      // Validate response structure
      if (
        !data.dishDescription ||
        data.grade === undefined ||
        data.revenueRate === undefined ||
        !data.critics
      ) {
        throw new Error('Invalid evaluation response structure');
      }

      return {
        dishDescription: data.dishDescription,
        grade: data.grade,
        revenueRate: data.revenueRate,
        critics: data.critics,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Backend API error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        if (error.code === 'ECONNREFUSED') {
          throw new Error('Backend API is not reachable');
        }

        if (error.code === 'ETIMEDOUT') {
          throw new Error('Backend API request timed out');
        }
      }

      throw error;
    }
  }

  private async finalizeOnChain(
    recipeId: number,
    evaluation: EvaluationData
  ): Promise<`0x${string}`> {
    try {
      // Estimate gas
      const gas = await this.publicClient.estimateContractGas({
        address: config.recipeContractAddress,
        abi: RECIPE_SYSTEM_ABI,
        functionName: 'finalizeRecipe',
        args: [
          BigInt(recipeId),
          evaluation.dishDescription,
          evaluation.grade,
          BigInt(evaluation.revenueRate),
          evaluation.critics,
        ],
        account: this.walletClient.account!,
      });

      // Add 20% buffer to gas estimate
      const gasWithBuffer = (gas * 120n) / 100n;

      // Submit transaction
      const hash = await this.walletClient.writeContract({
        address: config.recipeContractAddress,
        abi: RECIPE_SYSTEM_ABI,
        functionName: 'finalizeRecipe',
        args: [
          BigInt(recipeId),
          evaluation.dishDescription,
          evaluation.grade,
          BigInt(evaluation.revenueRate),
          evaluation.critics,
        ],
        gas: gasWithBuffer,
      });

      return hash;
    } catch (error) {
      logger.error('Failed to submit transaction', {
        recipeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
