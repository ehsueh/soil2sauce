import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../wagmi.ts';
import RecipeSystemABI from '../contracts/RecipeSystem.json';
import './RecipeSubmission.css';

export default function RecipeSubmission() {
  const { address, isConnected, chain } = useAccount();
  const [instruction, setInstruction] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [error, setError] = useState('');

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleSubmit = async () => {
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

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.recipeSystem,
        abi: RecipeSystemABI,
        functionName: 'requestRecipe',
        args: [instruction, ingredients],
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
            Your recipe has been submitted on-chain and will be evaluated by our AI chef within 15-45 seconds.
          </p>
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
              disabled={isPending || isConfirming}
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
              disabled={isPending || isConfirming}
              rows={5}
            />
            <small>Provide step-by-step cooking instructions</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          {isConfirming && (
            <div className="confirming-message">
              ⏳ Waiting for confirmation...
            </div>
          )}

          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={isPending || isConfirming || !isConnected || chain?.id !== 84532}
          >
            {isPending
              ? '📝 Submitting...'
              : isConfirming
              ? '⏳ Confirming...'
              : '🚀 Submit Recipe On-Chain'}
          </button>

          <div className="info-box">
            <h4>📋 How it works:</h4>
            <ol>
              <li>Submit your recipe on-chain (transaction required)</li>
              <li>Our AI agent detects your submission (~15 seconds)</li>
              <li>AI chef evaluates your recipe (5-10 seconds)</li>
              <li>Evaluation is recorded on-chain and NFT is minted</li>
              <li>Check "My Recipes" to see results!</li>
            </ol>
            <p className="timing-note">
              <strong>⏱️ Total time:</strong> 15-45 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
