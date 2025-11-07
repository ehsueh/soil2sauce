import { useState } from 'react';
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
}

export default function RecipeSubmission() {
  const { address, isConnected, chain } = useAccount();
  const [instruction, setInstruction] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [error, setError] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleEvaluate = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (chain?.id !== 84532) {
      setError('Please switch to Base Sepolia network');
      return;
    }

    if (!instruction.trim()) {
      setError('Please provide cooking instructions');
      return;
    }

    if (!ingredients.trim()) {
      setError('Please list the ingredients');
      return;
    }

    setError('');
    setIsEvaluating(true);

    try {
      // Call AI endpoint to get evaluation
      const response = await fetch('http://localhost:3001/api/evaluate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: instruction.trim(),
          ingredients: ingredients.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to evaluate recipe');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response from AI service');
      }

      setAiEvaluation(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate recipe');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmitToBlockchain = async () => {
    if (!aiEvaluation) {
      setError('Please evaluate the recipe first');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.recipeSystem,
        abi: RecipeSystemABI,
        functionName: 'requestRecipe',
        args: [aiEvaluation.dishDescription, ingredients],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit recipe');
    }
  };

  // Handle success
  if (isConfirmed && hash) {
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
            <p><strong>Transaction Hash:</strong></p>
            <p className="tx-hash">{hash}</p>
            <a
              href={`https://sepolia.basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-tx-btn"
            >
              View on BaseScan →
            </a>
          </div>
          <button
            className="submit-another-btn"
            onClick={() => {
              setInstruction('');
              setIngredients('');
              setAiEvaluation(null);
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
              disabled={isPending || isConfirming || isEvaluating || !!aiEvaluation}
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
              disabled={isPending || isConfirming || isEvaluating || !!aiEvaluation}
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
            </div>
          )}

          {isConfirming && (
            <div className="confirming-message">
              ⏳ Waiting for confirmation...
            </div>
          )}

          {!aiEvaluation ? (
            <button
              className="submit-button"
              onClick={handleEvaluate}
              disabled={isPending || isConfirming || isEvaluating || !isConnected || chain?.id !== 84532}
            >
              {isEvaluating
                ? '🤖 Evaluating with AI...'
                : '✨ Evaluate Recipe'}
            </button>
          ) : (
            <button
              className="submit-button"
              onClick={handleSubmitToBlockchain}
              disabled={isPending || isConfirming || !isConnected || chain?.id !== 84532}
            >
              {isPending
                ? '📝 Submitting...'
                : isConfirming
                ? '⏳ Confirming...'
                : '🚀 Mint as NFT'}
            </button>
          )}

          <div className="info-box">
            <h4>📋 How it works:</h4>
            <ol>
              <li>Enter your ingredients and cooking instructions</li>
              <li>Click "Evaluate Recipe" to get AI evaluation (5-10 seconds)</li>
              <li>Review the dish name, grade, revenue rate, and critics feedback</li>
              <li>Click "Mint as NFT" to submit on-chain (transaction required)</li>
              <li>Your recipe NFT will be minted immediately!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
