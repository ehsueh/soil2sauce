import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../wagmi.ts';
import RecipeSystemABI from '../contracts/RecipeSystem.json';
import './RecipeSubmission.css';

interface AIEvaluationResult {
  dishDescription: string;
  grade: number;
  revenueRate: number;
  critics: string;
  metadataURI: string;
  hash: string;
  timestamp: number;
}

export default function RecipeSubmission() {
  const { address, isConnected, chain } = useAccount();
  const [instruction, setInstruction] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [error, setError] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{ recipeId: string; txHash: string } | null>(null);

  const { data: requestHash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isRequestConfirmed } =
    useWaitForTransactionReceipt({
      hash: requestHash,
    });

  const handleEvaluate = async () => {
    console.log('🍳 Starting recipe evaluation process:', {
      timestamp: new Date().toISOString(),
      walletConnected: isConnected,
      walletAddress: address,
      chainId: chain?.id,
      instructionLength: instruction.trim().length,
      ingredientsLength: ingredients.trim().length,
    });

    if (!isConnected || !address) {
      console.warn('❌ Wallet not connected for evaluation');
      setError('Please connect your wallet first');
      return;
    }

    if (chain?.id !== 84532) {
      console.warn('❌ Wrong network for evaluation. Expected: 84532, Got:', chain?.id);
      setError('Please switch to Base Sepolia network');
      return;
    }

    if (!instruction.trim()) {
      console.warn('❌ Empty cooking instructions');
      setError('Please provide cooking instructions');
      return;
    }

    if (!ingredients.trim()) {
      console.warn('❌ Empty ingredients list');
      setError('Please list the ingredients');
      return;
    }

    console.log('✅ All validation checks passed, proceeding with AI evaluation');
    setError('');
    setIsEvaluating(true);

    const evaluationStartTime = Date.now();
    try {
      // Call AI endpoint to get evaluation
      console.log('🤖 Calling backend AI evaluation API:', {
        endpoint: 'http://localhost:3001/api/evaluate-recipe',
        walletAddress: address,
        instructionPreview: instruction.trim().substring(0, 50) + '...',
        ingredientsPreview: ingredients.trim().substring(0, 50) + '...',
      });

      const response = await fetch('http://localhost:3001/api/evaluate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: instruction.trim(),
          ingredients: ingredients.trim(),
          walletAddress: address,
        }),
      });

      console.log('📡 AI evaluation API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ AI evaluation API error:', errorData);
        throw new Error(errorData.error || 'Failed to evaluate recipe');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        console.error('❌ Invalid AI evaluation response:', result);
        throw new Error('Invalid response from AI service');
      }

      const evaluationTime = Date.now() - evaluationStartTime;
      console.log('✅ AI evaluation completed successfully:', {
        processingTimeMs: evaluationTime,
        dishDescription: result.data.dishDescription,
        grade: result.data.grade,
        revenueRate: result.data.revenueRate,
        hash: result.data.hash?.substring(0, 10) + '...',
      });

      setAiEvaluation(result.data);
    } catch (err) {
      const evaluationTime = Date.now() - evaluationStartTime;
      console.error('❌ AI evaluation failed after', evaluationTime, 'ms:', err);
      setError(err instanceof Error ? err.message : 'Failed to evaluate recipe');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmitToBlockchain = async () => {
    console.log('🚀 Starting blockchain submission process:', {
      timestamp: new Date().toISOString(),
      walletAddress: address,
      chainId: chain?.id,
      hasAiEvaluation: !!aiEvaluation,
    });

    if (!aiEvaluation) {
      console.warn('❌ No AI evaluation available for blockchain submission');
      setError('Please evaluate the recipe first');
      return;
    }

    if (!address) {
      console.warn('❌ No wallet address for blockchain submission');
      setError('Please connect your wallet first');
      return;
    }

    setError('');

    try {
      // Step 1: Call requestRecipe on contract (user becomes chef)
      console.log('📝 Calling requestRecipe on blockchain:', {
        contract: CONTRACT_ADDRESSES.recipeSystem,
        dishDescription: aiEvaluation.dishDescription,
        ingredientsLength: ingredients.trim().length,
        userWallet: address,
      });

      writeContract({
        address: CONTRACT_ADDRESSES.recipeSystem,
        abi: RecipeSystemABI,
        functionName: 'requestRecipe',
        args: [aiEvaluation.dishDescription, ingredients.trim()],
      });

      console.log('⏳ requestRecipe transaction initiated, waiting for confirmation...');
    } catch (err) {
      console.error('❌ Failed to initiate requestRecipe transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create recipe on blockchain');
    }
  };

  // Effect to handle after requestRecipe confirms
  useEffect(() => {
    const handleRequestConfirmed = async () => {
      if (!isRequestConfirmed || !requestHash || !aiEvaluation || !address || mintResult || isMinting) return;

      console.log('✅ requestRecipe transaction confirmed, starting NFT minting process:', {
        txHash: requestHash,
        timestamp: new Date().toISOString(),
      });

      setIsMinting(true);
      setError('');
      const mintingStartTime = Date.now();

      try {
        // Step 2: Extract recipeId from transaction logs
        const provider = (window as any).ethereum;
        if (!provider) {
          console.error('❌ No ethereum provider found');
          throw new Error('No ethereum provider found');
        }

        console.log('🔍 Fetching transaction receipt to extract recipe ID...');
        // Get transaction receipt
        const receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [requestHash],
        });

        console.log('📋 Transaction receipt received:', {
          blockNumber: receipt?.blockNumber,
          status: receipt?.status,
          logsCount: receipt?.logs?.length || 0,
        });

        if (!receipt || !receipt.logs || receipt.logs.length === 0) {
          console.error('❌ No logs found in transaction receipt');
          throw new Error('No logs found in transaction');
        }

        // Extract recipeId from first log topics (indexed parameter)
        const recipeIdHex = receipt.logs[0].topics[1];
        const recipeId = BigInt(recipeIdHex).toString();

        console.log('🆔 Recipe ID extracted from blockchain event:', recipeId);

        // Step 3: Call backend to finalize (mint NFT)
        console.log('🎨 Calling backend mint API:', {
          endpoint: 'http://localhost:3001/api/mint-recipe',
          recipeId,
          walletAddress: address,
          dishDescription: aiEvaluation.dishDescription,
        });

        const response = await fetch('http://localhost:3001/api/mint-recipe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeId,
            walletAddress: address,
            dishDescription: aiEvaluation.dishDescription,
            ingredients: ingredients.trim(),
            grade: aiEvaluation.grade,
            revenueRate: aiEvaluation.revenueRate,
            critics: aiEvaluation.critics,
            metadataURI: aiEvaluation.metadataURI,
            hash: aiEvaluation.hash,
            timestamp: aiEvaluation.timestamp,
          }),
        });

        console.log('📡 Mint API response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Mint API error:', errorData);
          throw new Error(errorData.error || 'Failed to mint recipe NFT');
        }

        const result = await response.json();

        if (!result.success) {
          console.error('❌ Mint API unsuccessful result:', result);
          throw new Error(result.error || 'Failed to mint recipe NFT');
        }

        const mintingTime = Date.now() - mintingStartTime;
        console.log('🎉 NFT minting completed successfully:', {
          processingTimeMs: mintingTime,
          recipeId: result.recipeId,
          txHash: result.txHash,
          walletAddress: address,
        });

        setMintResult({
          recipeId: result.recipeId,
          txHash: result.txHash,
        });
      } catch (err) {
        const mintingTime = Date.now() - mintingStartTime;
        console.error('❌ NFT minting failed after', mintingTime, 'ms:', err);
        setError(err instanceof Error ? err.message : 'Failed to mint recipe');
        setIsMinting(false);
      }
    };

    handleRequestConfirmed();
  }, [isRequestConfirmed, requestHash, aiEvaluation, address, ingredients, mintResult, isMinting]);

  // Handle success
  if (mintResult) {
    return (
      <div className="recipe-submission">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h2>Recipe Submitted Successfully!</h2>
          <p className="success-message">
            Your recipe NFT has been minted successfully!
          </p>
          {aiEvaluation && (
            <div className="evaluation-summary">
              <h3>{aiEvaluation.dishDescription}</h3>
              <div className="eval-stats">
                <div className="stat">
                  <span className="label">Grade:</span>
                  <span className="value">{aiEvaluation.grade}/100</span>
                </div>
                <div className="stat">
                  <span className="label">Revenue Rate:</span>
                  <span className="value">{aiEvaluation.revenueRate}</span>
                </div>
              </div>
              <div className="critics-box">
                <strong>Critics:</strong> {aiEvaluation.critics}
              </div>
            </div>
          )}
          <div className="transaction-info">
            <p><strong>Recipe ID:</strong> {mintResult.recipeId}</p>
            <p><strong>Transaction Hash:</strong></p>
            <p className="tx-hash">{mintResult.txHash}</p>
            <a
              href={`https://sepolia.basescan.org/tx/${mintResult.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-tx-btn"
            >
              🔗 View Transaction on BaseScan →
            </a>
          </div>
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#e7f3ff',
            border: '1px solid #a8d4ff',
            borderRadius: '8px'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1a1a1a' }}>
              💡 <strong>View Your NFT:</strong> Go to <strong>"My Recipes"</strong> to see your recipe NFT on BaseScan and access the IPFS metadata!
            </p>
          </div>
          <button
            className="submit-another-btn"
            onClick={() => {
              setInstruction('');
              setIngredients('');
              setAiEvaluation(null);
              setMintResult(null);
              window.location.reload();
            }}
          >
            Submit Another Recipe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-submission">
      <div className="submission-container">
        <h2>🍳 Submit Recipe for AI Evaluation</h2>
        <p className="subtitle">
          Submit your recipe on-chain and get it evaluated by our Michelin-starred AI chef!
        </p>

        {chain?.id !== 84532 && (
          <div className="network-warning">
            ⚠️ Please switch to Base Sepolia network to submit recipes
          </div>
        )}

        <div className="submission-form">
          <div className="form-group">
            <label htmlFor="ingredients">
              Ingredients
              <span className="required">*</span>
            </label>
            <textarea
              id="ingredients"
              placeholder="e.g., 2 cups flour, 1 cup sugar, 3 eggs, 1 stick butter, 1 tsp vanilla extract, 1 tsp baking powder"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              disabled={isEvaluating || isPending || isConfirming || isMinting || !!aiEvaluation}
              rows={3}
            />
            <small>List all ingredients with amounts</small>
          </div>

          <div className="form-group">
            <label htmlFor="instruction">
              Cooking Instructions
              <span className="required">*</span>
            </label>
            <textarea
              id="instruction"
              placeholder="e.g., Mix flour, sugar, eggs, and butter in a bowl. Pour into greased pan. Bake at 350F for 30 minutes until golden brown."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isEvaluating || isPending || isConfirming || isMinting || !!aiEvaluation}
              rows={5}
            />
            <small>Provide step-by-step cooking instructions</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          {aiEvaluation && (
            <div className="ai-evaluation-result">
              <h3>✨ AI Evaluation Complete!</h3>
              <div className="dish-name">
                <strong>Dish:</strong> {aiEvaluation.dishDescription}
              </div>
              <div className="eval-details">
                <div className="eval-item">
                  <span className="eval-label">Grade:</span>
                  <span className="eval-value">{aiEvaluation.grade}/100</span>
                </div>
                <div className="eval-item">
                  <span className="eval-label">Revenue Rate:</span>
                  <span className="eval-value">{aiEvaluation.revenueRate}</span>
                </div>
              </div>
              <div className="critics-feedback">
                <strong>Critics Feedback:</strong>
                <p>{aiEvaluation.critics}</p>
              </div>
              <div className="hash-info" style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#f5f5f5',
                borderRadius: '6px',
                fontSize: '0.85rem',
                wordBreak: 'break-all'
              }}>
                <strong>Verification Hash:</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontFamily: 'monospace', color: '#666' }}>
                  {aiEvaluation.hash}
                </p>
              </div>
            </div>
          )}

          {isConfirming && (
            <div className="confirming-message">
              ⏳ Confirming recipe creation on blockchain...
            </div>
          )}

          {isMinting && (
            <div className="confirming-message">
              🎨 Minting NFT...
            </div>
          )}

          {!aiEvaluation ? (
            <button
              className="submit-button"
              onClick={handleEvaluate}
              disabled={isEvaluating || isPending || isConfirming || isMinting || !isConnected || chain?.id !== 84532}
            >
              {isEvaluating
                ? '🤖 Evaluating with AI...'
                : '✨ Evaluate Recipe'}
            </button>
          ) : (
            <button
              className="submit-button"
              onClick={handleSubmitToBlockchain}
              disabled={isPending || isConfirming || isMinting || !isConnected || chain?.id !== 84532}
            >
              {isPending
                ? '📝 Submitting...'
                : isConfirming
                ? '⏳ Confirming...'
                : isMinting
                ? '🎨 Minting NFT...'
                : '🚀 Mint as NFT'}
            </button>
          )}

          <div className="info-box">
            <h4>📋 How it works:</h4>
            <ol>
              <li>Enter your ingredients and cooking instructions</li>
              <li>Click "Evaluate Recipe" to get AI evaluation (5-10 seconds)</li>
              <li>Review the dish name, grade, revenue rate, and critics feedback</li>
              <li>Click "Mint as NFT" - requires 2 transactions:</li>
              <ul>
                <li>First: Create recipe on-chain (you become the chef/owner)</li>
                <li>Second: Mint NFT with AI evaluation</li>
              </ul>
              <li>Your recipe NFT will be minted to your wallet!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
