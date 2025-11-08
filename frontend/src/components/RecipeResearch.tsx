import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../wagmi.ts';
import RecipeSystemABI from '../contracts/RecipeSystem.json';
import './RecipeResearch.css';

interface Ingredient {
  name: string;
  amount: string;
}

interface ResearchedRecipe {
  name: string;
  description: string;
  difficulty_level: number;
  ingredient_rates: Record<string, number>;
  cooking_instructions: string;
}

const AVAILABLE_INGREDIENTS = [
  'Wheat', 'Tomato', 'Strawberry', 'Carrot',
  'Milk', 'Egg', 'Butter', 'Cheese', 'Honey'
];

export default function RecipeResearch() {
  const { address, isConnected, chain } = useAccount();
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [researched, setResearched] = useState<ResearchedRecipe | null>(null);
  const [error, setError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Log write errors
  if (writeError) {
    console.error('❌ Write contract error:', writeError);
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: 'name' | 'amount',
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleResearch = async () => {
    console.log('🔍 RecipeResearch: Starting recipe research:', {
      timestamp: new Date().toISOString(),
      walletConnected: isConnected,
      walletAddress: address,
      instructionsLength: cookingInstructions.trim().length,
    });

    if (!isConnected || !address) {
      console.warn('❌ RecipeResearch: Wallet not connected for research');
      setError('Please connect your wallet first');
      return;
    }

    if (!cookingInstructions.trim()) {
      console.warn('❌ RecipeResearch: No cooking instructions provided');
      setError('Please provide cooking instructions');
      return;
    }

    const filledIngredients = ingredients.filter(ing => ing.name && ing.amount);
    console.log('📋 RecipeResearch: Ingredients prepared:', {
      totalIngredients: ingredients.length,
      filledIngredients: filledIngredients.length,
      ingredientsList: filledIngredients.map(ing => `${ing.amount} ${ing.name}`),
    });

    if (filledIngredients.length === 0) {
      console.warn('❌ RecipeResearch: No valid ingredients provided');
      setError('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setError('');
    const researchStartTime = Date.now();
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
      console.log('🤖 RecipeResearch: Calling AI research API:', {
        endpoint: `${backendUrl}/api/recipes/research`,
        ingredientsCount: filledIngredients.length,
        instructionsPreview: cookingInstructions.substring(0, 50) + '...',
      });

      const response = await fetch(`${backendUrl}/api/recipes/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: cookingInstructions,
          ingredients: filledIngredients
        })
      });

      console.log('📡 RecipeResearch: Research API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        console.error('❌ RecipeResearch: Research API failed:', response.statusText);
        throw new Error(`Failed to research recipe: ${response.statusText}`);
      }

      const data = await response.json();
      const researchTime = Date.now() - researchStartTime;
      console.log('✅ RecipeResearch: Recipe research completed:', {
        processingTimeMs: researchTime,
        recipeDescription: data.recipe?.description?.substring(0, 100) + '...',
        hasRecipe: !!data.recipe,
      });
      
      setResearched(data.recipe);
    } catch (err) {
      const researchTime = Date.now() - researchStartTime;
      console.error('❌ RecipeResearch: Research failed after', researchTime, 'ms:', err);
      setError(err instanceof Error ? err.message : 'Failed to research recipe');
      setResearched(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToBlockchain = async () => {
    console.log('🚀 RecipeResearch: Starting blockchain submission:', {
      timestamp: new Date().toISOString(),
      walletConnected: isConnected,
      walletAddress: address,
      chainId: chain?.id,
      hasResearchedRecipe: !!researched,
    });

    if (!researched) {
      console.warn('❌ RecipeResearch: No researched recipe available');
      return;
    }

    if (!isConnected || !address) {
      console.warn('❌ RecipeResearch: Wallet not connected');
      setError('Please connect your wallet first');
      return;
    }

    if (chain?.id !== 84532) {
      console.warn('❌ RecipeResearch: Wrong network. Expected: 84532, Got:', chain?.id);
      setError('Please switch to Base Sepolia network to submit');
      return;
    }

    setError('');

    const submissionStartTime = Date.now();
    try {
      // Format ingredients for blockchain submission
      const filledIngredients = ingredients.filter(ing => ing.name && ing.amount);
      const ingredientsStr = filledIngredients
        .map(ing => `${ing.amount} ${ing.name}`)
        .join(', ');

      console.log('📝 RecipeResearch: Submitting AI-generated recipe to blockchain:', {
        dishDescription: researched.description,
        ingredientsStr,
        ingredientsCount: filledIngredients.length,
        contract: CONTRACT_ADDRESSES.recipeSystem,
        userWallet: address,
      });

      // Submit AI-generated dish description and ingredients to blockchain
      writeContract({
        address: CONTRACT_ADDRESSES.recipeSystem,
        abi: RecipeSystemABI,
        functionName: 'requestRecipe',
        args: [researched.description, ingredientsStr],
      });

      console.log('✅ RecipeResearch: writeContract called successfully');
    } catch (err) {
      const submissionTime = Date.now() - submissionStartTime;
      console.error('❌ RecipeResearch: Error after', submissionTime, 'ms:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit recipe');
    }
  };

  // Handle submission success
  if (isConfirmed && hash) {
    return (
      <div className="recipe-research">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h2>Recipe Submitted to Blockchain!</h2>
          <p className="success-message">
            Your AI-generated recipe has been submitted on-chain and will be evaluated by our Michelin-starred AI chef within 15-45 seconds.
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
              💡 <strong>Next Steps:</strong> After evaluation, check <strong>"My Recipes"</strong> to view your NFT on BaseScan and access the IPFS metadata!
            </p>
          </div>
          <button
            className="submit-another-btn"
            onClick={() => {
              setResearched(null);
              setCookingInstructions('');
              setIngredients([{ name: '', amount: '' }]);
              window.location.reload();
            }}
          >
            Create Another Recipe
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return '#4ade80';
    if (level <= 6) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div className="recipe-research">
      <div className="research-container">
        <h2>🔬 Recipe Research</h2>
        <p className="subtitle">Provide cooking instructions and ingredients, then AI will generate your recipe details</p>

        {chain?.id !== 84532 && isConnected && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404'
          }}>
            ⚠️ Note: Recipe research is available on any network, but blockchain submission requires Base Sepolia.
          </div>
        )}

        <div className="research-form">
          <div className="form-group">
            <label htmlFor="instructions">Cooking Instructions</label>
            <textarea
              id="instructions"
              placeholder="e.g., 'Mix flour, sugar, eggs, and butter in a bowl. Pour into greased pan. Bake at 350F for 30 minutes until golden brown.'"
              value={cookingInstructions}
              onChange={(e) => setCookingInstructions(e.target.value)}
              disabled={loading || isPending || isConfirming}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Ingredients</label>
            <div className="ingredients-list">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="ingredient-row">
                  <select
                    value={ingredient.name}
                    onChange={(e) =>
                      handleIngredientChange(index, 'name', e.target.value)
                    }
                    disabled={loading || isPending || isConfirming}
                  >
                    <option value="">Select ingredient</option>
                    {AVAILABLE_INGREDIENTS.map((ing) => (
                      <option key={ing} value={ing}>
                        {ing}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Amount (e.g., 2 cups, 100g)"
                    value={ingredient.amount}
                    onChange={(e) =>
                      handleIngredientChange(index, 'amount', e.target.value)
                    }
                    disabled={loading || isPending || isConfirming}
                  />
                  {ingredients.length > 1 && (
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveIngredient(index)}
                      disabled={loading || isPending || isConfirming}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="add-ingredient-btn"
              onClick={handleAddIngredient}
              disabled={loading || isPending || isConfirming}
            >
              + Add Ingredient
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {writeError && (
            <div className="error-message">
              Transaction Error: {writeError.message}
            </div>
          )}

          {isConfirming && (
            <div className="confirming-message">
              ⏳ Waiting for confirmation...
            </div>
          )}

          <div className="action-buttons-row">
            <button
              className="research-button"
              onClick={handleResearch}
              disabled={loading || !isConnected || isPending || isConfirming}
            >
              {loading ? 'Researching Recipe...' : '🔬 Research Recipe with AI'}
            </button>
            <button
              className="submit-blockchain-button"
              onClick={handleSubmitToBlockchain}
              disabled={!researched || isPending || isConfirming || !isConnected || chain?.id !== 84532}
              title={!researched ? 'Research a recipe first' : ''}
            >
              {isPending
                ? '📝 Submitting...'
                : isConfirming
                ? '⏳ Confirming...'
                : '🚀 Submit to Blockchain'}
            </button>
          </div>

          {researched && (
            <button
              className="reset-btn"
              onClick={() => {
                setResearched(null);
                setCookingInstructions('');
                setIngredients([{ name: '', amount: '' }]);
              }}
              disabled={isPending || isConfirming}
            >
              ↺ Start New Recipe
            </button>
          )}
        </div>

        {researched && (
          <div className="recipe-result">
            <div className="recipe-header">
              <h3>{researched.name}</h3>
              <div className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(researched.difficulty_level) }}>
                Difficulty: {researched.difficulty_level}/10
              </div>
            </div>

            <div className="recipe-section">
              <h4>Description</h4>
              <p>{researched.description}</p>
            </div>

            <div className="recipe-section">
              <h4>Ingredient Rates</h4>
              <div className="ingredient-rates">
                {Object.entries(researched.ingredient_rates).map(([name, rate]) => (
                  <div key={name} className="rate-item">
                    <span className="ingredient-name">{name}</span>
                    <span className="rate-value">{rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
