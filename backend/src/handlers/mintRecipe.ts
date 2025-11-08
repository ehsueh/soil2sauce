import { Request, Response } from 'express';
import { hashService } from '../services/hashService.js';
import { blockchainService } from '../services/blockchain.js';

interface MintRecipeRequest {
  recipeId: string;
  walletAddress: string;
  dishDescription: string;
  ingredients: string;
  grade: number;
  revenueRate: number;
  critics: string;
  metadataURI: string;
  hash: string;
  timestamp: number;
}

/**
 * Mint Recipe Handler
 * Verifies hash integrity and mints NFT on blockchain
 */
export async function mintRecipeHandler(req: Request, res: Response) {
  const startTime = Date.now();
  console.log('🎨 NFT minting request started:', {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('user-agent')?.substring(0, 100),
  });

  try {
    const {
      recipeId,
      walletAddress,
      dishDescription,
      ingredients,
      grade,
      revenueRate,
      critics,
      metadataURI,
      hash,
      timestamp,
    }: MintRecipeRequest = req.body;

    console.log('📋 Minting request details:', {
      recipeId,
      walletAddress,
      dishDescription,
      grade,
      revenueRate,
      hash: hash?.substring(0, 10) + '...',
      timestampAge: Date.now() - timestamp,
    });

    // Validate required fields
    if (!recipeId) {
      return res.status(400).json({
        success: false,
        error: 'Recipe ID is required'
      });
    }

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid walletAddress'
      });
    }

    if (!dishDescription || !ingredients || !critics || !metadataURI || !hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (typeof grade !== 'number' || grade < 1 || grade > 100) {
      return res.status(400).json({
        success: false,
        error: 'Grade must be between 1 and 100'
      });
    }

    if (typeof revenueRate !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid revenueRate'
      });
    }

    if (typeof timestamp !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid timestamp'
      });
    }

    console.log('🔍 Verifying hash for minting...', {
      walletAddress,
      dishDescription,
      hash: hash.substring(0, 10) + '...',
    });

    // Verify hash integrity
    try {
      hashService.verifyHash(hash, {
        walletAddress,
        dishDescription,
        grade,
        revenueRate,
        critics,
        metadataURI,
      }, timestamp);
    } catch (error) {
      console.error('❌ Hash verification failed:', error);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Hash verification failed'
      });
    }

    console.log('✅ Hash verified successfully');

    // Call finalizeRecipe to mint NFT (recipe already created by frontend)
    console.log('🎨 Minting NFT for recipe ID:', recipeId);
    let txHash: string;
    try {
      txHash = await blockchainService.finalizeRecipe(
        BigInt(recipeId),
        dishDescription,
        grade,
        revenueRate,
        critics,
        metadataURI
      );
      console.log('✅ NFT minted! Transaction:', txHash);
    } catch (error) {
      console.error('❌ Failed to mint NFT:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to mint NFT',
        details: error instanceof Error ? error.message : 'Unknown error',
        recipeId: recipeId, // Recipe was created but minting failed
      });
    }

    // Success!
    const processingTime = Date.now() - startTime;
    console.log('🎉 NFT minting completed successfully:', {
      recipeId,
      txHash,
      walletAddress,
      processingTimeMs: processingTime,
      dishDescription,
    });

    res.json({
      success: true,
      recipeId: recipeId,
      txHash,
      message: 'Recipe NFT minted successfully!'
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Mint recipe error after', processingTime, 'ms:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      recipeId: req.body.recipeId,
      walletAddress: req.body.walletAddress,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
