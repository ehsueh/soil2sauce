import { createPublicClient, createWalletClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const REQUEST_RECIPE_ABI = parseAbiItem(
  'function requestRecipe(string calldata dishDescription, string calldata ingredients) external returns (uint256)'
);

const FINALIZE_RECIPE_ABI = parseAbiItem(
  'function finalizeRecipe(uint256 recipeId, string calldata dishDescription, uint8 grade, uint256 revenueRate, string calldata critics, string calldata metadataURI) external'
);

const RECIPE_REQUESTED_EVENT = parseAbiItem(
  'event RecipeRequested(uint256 indexed recipeId, address indexed chef, string dishDescription, string ingredients, uint256 timestamp)'
);

class BlockchainService {
  private publicClient;
  private walletClient;
  private contractAddress: `0x${string}`;
  private account;

  constructor() {
    const rpcUrl = process.env.BASE_RPC_URL;
    const privateKey = process.env.GRADER_PRIVATE_KEY as `0x${string}`;
    const contractAddress = process.env.RECIPE_CONTRACT_ADDRESS as `0x${string}`;

    if (!rpcUrl) {
      throw new Error('BASE_RPC_URL environment variable is required');
    }

    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error('GRADER_PRIVATE_KEY environment variable is required and must start with 0x');
    }

    if (!contractAddress || !contractAddress.startsWith('0x')) {
      throw new Error('RECIPE_CONTRACT_ADDRESS environment variable is required and must start with 0x');
    }

    this.contractAddress = contractAddress;
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    this.account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    console.log('✅ Blockchain service initialized');
    console.log('📍 Contract:', this.contractAddress);
    console.log('🔑 Grader wallet:', this.account.address);
  }

  async requestRecipe(dishDescription: string, ingredients: string): Promise<bigint> {
    console.log('📝 Submitting requestRecipe transaction:', {
      contract: this.contractAddress,
      dishDescription,
      ingredientsLength: ingredients.length,
      graderWallet: this.account.address,
    });

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: [REQUEST_RECIPE_ABI],
      functionName: 'requestRecipe',
      args: [dishDescription, ingredients],
    });

    console.log('⏳ Waiting for requestRecipe transaction confirmation:', hash);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });

    console.log('✅ requestRecipe transaction confirmed:', {
      txHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      logsCount: receipt.logs.length,
    });

    // Extract recipeId from event topics
    // RecipeRequested event has indexed recipeId as first indexed parameter (topics[1])
    if (receipt.logs.length > 0 && receipt.logs[0].topics && receipt.logs[0].topics.length >= 2) {
      const recipeIdTopic = receipt.logs[0].topics[1];
      if (recipeIdTopic) {
        const recipeId = BigInt(recipeIdTopic);
        console.log('🆔 RecipeId extracted from event:', recipeId.toString());
        return recipeId;
      }
    }

    console.error('❌ RecipeRequested event not found in transaction receipt:', receipt.logs);
    throw new Error('RecipeRequested event not found in transaction receipt');
  }

  async finalizeRecipe(
    recipeId: bigint,
    dishDescription: string,
    grade: number,
    revenueRate: number,
    critics: string,
    metadataURI: string
  ): Promise<`0x${string}`> {
    console.log('🎨 Submitting finalizeRecipe transaction:', {
      contract: this.contractAddress,
      recipeId: recipeId.toString(),
      dishDescription,
      grade,
      revenueRate,
      criticsLength: critics.length,
      metadataURI: metadataURI ? 'Present' : 'Empty',
      graderWallet: this.account.address,
    });

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: [FINALIZE_RECIPE_ABI],
      functionName: 'finalizeRecipe',
      args: [recipeId, dishDescription, grade as number, BigInt(revenueRate), critics, metadataURI],
    });

    console.log('⏳ Waiting for finalizeRecipe transaction confirmation:', hash);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
    
    console.log('✅ finalizeRecipe transaction confirmed:', {
      txHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      recipeId: recipeId.toString(),
      status: receipt.status,
    });

    return hash;
  }

  getGraderAddress(): `0x${string}` {
    return this.account.address;
  }
}

export const blockchainService = new BlockchainService();
