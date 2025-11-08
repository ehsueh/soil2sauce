import { Request, Response } from 'express';
import OpenAI from 'openai';
import { createRecipeMetadata, uploadMetadataToIPFS } from '../services/ipfs.js';
import { hashService } from '../services/hashService.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

if (!ASSISTANT_ID) {
  console.warn('WARNING: OPENAI_ASSISTANT_ID not set. Recipe evaluation will fail.');
}

interface EvaluateRecipeRequest {
  instruction: string;
  ingredients: string;
  walletAddress: string;
}

interface EvaluateRecipeResponse {
  dishDescription: string;
  grade: number; // 1-100
  revenueRate: number;
  critics: string;
}

/**
 * Recipe Evaluation Handler
 * Accepts ingredients and cooking instructions, generates dish description via AI,
 * and returns evaluation data (dishDescription, grade, revenueRate, critics)
 */
export async function evaluateRecipeHandler(req: Request, res: Response) {
  const startTime = Date.now();
  console.log('🍳 Recipe evaluation request started', {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('user-agent')?.substring(0, 100),
  });

  try {
    const { instruction, ingredients, walletAddress }: EvaluateRecipeRequest = req.body;

    console.log('📝 Recipe evaluation request details:', {
      walletAddress,
      instructionLength: instruction?.length || 0,
      ingredientsLength: ingredients?.length || 0,
      instructionPreview: instruction?.substring(0, 50) + (instruction?.length > 50 ? '...' : ''),
      ingredientsPreview: ingredients?.substring(0, 50) + (ingredients?.length > 50 ? '...' : ''),
    });

    // Validate input
    if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
      console.warn('❌ Invalid instruction provided');
      return res.status(400).json({
        success: false,
        error: 'Invalid input: instruction is required and must be a non-empty string'
      });
    }

    if (!ingredients || typeof ingredients !== 'string' || ingredients.trim().length === 0) {
      console.warn('❌ Invalid ingredients provided');
      return res.status(400).json({
        success: false,
        error: 'Invalid input: ingredients is required and must be a non-empty string'
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
      console.warn('❌ Invalid wallet address provided:', walletAddress);
      return res.status(400).json({
        success: false,
        error: 'Invalid input: walletAddress is required and must be a valid Ethereum address'
      });
    }

    if (!ASSISTANT_ID) {
      console.error('❌ OpenAI Assistant not configured');
      return res.status(500).json({
        success: false,
        error: 'OpenAI Assistant not configured. Please set OPENAI_ASSISTANT_ID environment variable.'
      });
    }

    // Create user message content
    const userMessage = `Ingredients: ${ingredients}

Cooking Instructions: ${instruction}`;

    console.log('🤖 Starting AI evaluation with OpenAI Assistant:', {
      assistantId: ASSISTANT_ID,
      messageLength: userMessage.length,
    });

    // Create a thread
    const thread = await openai.beta.threads.create();
    console.log('📝 Created OpenAI thread:', thread.id);

    // Add message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessage
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });
    console.log('⚡ Started OpenAI run:', run.id);

    // Wait for completion (with timeout)
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max
    console.log('⏳ Waiting for AI evaluation to complete...');

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Assistant run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }

    if (runStatus.status !== 'completed') {
      console.error('❌ OpenAI Assistant run timed out after 60 seconds');
      throw new Error('Assistant run timed out');
    }

    console.log('✅ AI evaluation completed successfully in', attempts, 'seconds');

    // Get the assistant's messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    console.log('📨 Retrieved', assistantMessages.length, 'assistant messages');

    if (assistantMessages.length === 0) {
      throw new Error('No response from assistant');
    }

    // Get the latest assistant message
    const latestMessage = assistantMessages[0];
    const messageContent = latestMessage.content[0];

    let responseText = '';
    if (messageContent.type === 'text') {
      responseText = messageContent.text.value;
    } else {
      throw new Error('Unexpected message content type');
    }

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', responseText);
      throw new Error('Failed to parse AI response as JSON');
    }

    const evaluation: EvaluateRecipeResponse = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!evaluation.dishDescription ||
        evaluation.grade === undefined ||
        evaluation.revenueRate === undefined ||
        !evaluation.critics) {
      throw new Error('Invalid evaluation response structure from AI');
    }

    // Validate and clamp grade between 1 and 100
    const clampedGrade = Math.max(1, Math.min(100, Math.round(evaluation.grade)));

    // Validate and clamp revenue rate
    const clampedRevenueRate = Math.max(50, Math.min(200, Math.round(evaluation.revenueRate)));

    // Ensure critics are reasonable length
    const critics = evaluation.critics.substring(0, 500);

    // Ensure dish description is reasonable length
    const dishDescription = evaluation.dishDescription.substring(0, 100);

    // Create and upload metadata to IPFS
    let metadataURI = '';
    try {
      const metadata = createRecipeMetadata(
        dishDescription,
        ingredients,
        clampedGrade,
        clampedRevenueRate,
        critics
      );
      metadataURI = await uploadMetadataToIPFS(metadata);
    } catch (ipfsError) {
      console.error('IPFS upload failed:', ipfsError);
      // Continue without IPFS URI - it's optional
    }

    // Generate hash for integrity verification
    const timestamp = Date.now();
    const { hash } = hashService.createHash({
      walletAddress,
      dishDescription,
      grade: clampedGrade,
      revenueRate: clampedRevenueRate,
      critics,
      metadataURI,
      timestamp,
    });

    const processingTime = Date.now() - startTime;
    console.log('✅ Recipe evaluation completed successfully', {
      walletAddress,
      dishDescription,
      grade: clampedGrade,
      revenueRate: clampedRevenueRate,
      processingTimeMs: processingTime,
      hash: hash.substring(0, 10) + '...',
      metadataURI: metadataURI ? 'Generated' : 'Failed',
    });

    res.json({
      success: true,
      data: {
        dishDescription,
        grade: clampedGrade,
        revenueRate: clampedRevenueRate,
        critics,
        metadataURI,
        hash,
        timestamp,
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Recipe evaluation error after', processingTime, 'ms:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      walletAddress: req.body.walletAddress,
    });

    // Determine error type
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to evaluate recipe',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
