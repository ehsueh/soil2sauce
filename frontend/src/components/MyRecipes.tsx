import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../wagmi';
import RecipeSystemABI from '../contracts/RecipeSystem.json';
import './MyRecipes.css';

interface Recipe {
  recipeId: bigint;
  chef: string;
  instruction: string;
  ingredients: string;
  dishDescription: string;
  grade: number;
  revenueRate: bigint;
  critics: string;
  evaluated: boolean;
  timestamp: bigint;
}

export default function MyRecipes() {
  const { address, isConnected, chain } = useAccount();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Get recipe IDs for the current user
  const { data: recipeIds = [], refetch: refetchIds } = useReadContract({
    address: CONTRACT_ADDRESSES.recipeSystem,
    abi: RecipeSystemABI.abi,
    functionName: 'getRecipesByChef',
    args: [address],
    query: {
      enabled: isConnected && chain?.id === 84532,
    },
  });

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!isConnected || chain?.id !== 84532) return;

    const interval = setInterval(() => {
      refetchIds();
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected, chain?.id, refetchIds]);

  const RecipeCard = ({ recipeId }: { recipeId: bigint }) => {
    const { data: recipe } = useReadContract({
      address: CONTRACT_ADDRESSES.recipeSystem,
      abi: RecipeSystemABI.abi,
      functionName: 'getRecipe',
      args: [recipeId],
      query: {
        enabled: true,
      },
    });

    if (!recipe) return null;

    const [
      id,
      chef,
      instruction,
      ingredients,
      dishDescription,
      grade,
      revenueRate,
      critics,
      evaluated,
      timestamp,
    ] = recipe as any[];

    const recipeData: Recipe = {
      recipeId: id,
      chef,
      instruction,
      ingredients,
      dishDescription,
      grade: Number(grade),
      revenueRate,
      critics,
      evaluated,
      timestamp,
    };

    const getGradeColor = (grade: number): string => {
      if (grade >= 90) return '#22c55e'; // Green
      if (grade >= 75) return '#84cc16'; // Light green
      if (grade >= 60) return '#eab308'; // Yellow
      if (grade >= 40) return '#f97316'; // Orange
      return '#ef4444'; // Red
    };

    const getGradeLabel = (grade: number): string => {
      if (grade >= 96) return 'S - Exceptional';
      if (grade >= 81) return 'A - Excellent';
      if (grade >= 61) return 'B - Good';
      if (grade >= 41) return 'C - Average';
      if (grade >= 21) return 'D - Below Average';
      return 'F - Poor';
    };

    return (
      <div
        className={`recipe-card ${!evaluated ? 'pending' : ''}`}
        onClick={() => setSelectedRecipe(recipeData)}
      >
        <div className="recipe-card-header">
          <h3>Recipe #{Number(id)}</h3>
          {evaluated ? (
            <div
              className="grade-badge"
              style={{ backgroundColor: getGradeColor(Number(grade)) }}
            >
              Grade: {Number(grade)}
            </div>
          ) : (
            <div className="pending-badge">⏳ Pending Evaluation</div>
          )}
        </div>
        <p className="recipe-preview">
          {instruction.substring(0, 80)}
          {instruction.length > 80 ? '...' : ''}
        </p>
        {evaluated && (
          <div className="recipe-stats">
            <span>💰 Revenue: {Number(revenueRate)}</span>
            <span>📅 {new Date(Number(timestamp) * 1000).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="my-recipes">
        <div className="empty-state">
          <h2>👋 Connect Your Wallet</h2>
          <p>Please connect your wallet to view your recipes</p>
        </div>
      </div>
    );
  }

  if (chain?.id !== 84532) {
    return (
      <div className="my-recipes">
        <div className="empty-state">
          <h2>⚠️ Wrong Network</h2>
          <p>Please switch to Base Sepolia network</p>
        </div>
      </div>
    );
  }

  if (selectedRecipe) {
    const getGradeColor = (grade: number): string => {
      if (grade >= 90) return '#22c55e';
      if (grade >= 75) return '#84cc16';
      if (grade >= 60) return '#eab308';
      if (grade >= 40) return '#f97316';
      return '#ef4444';
    };

    const getGradeLabel = (grade: number): string => {
      if (grade >= 96) return 'S - Exceptional';
      if (grade >= 81) return 'A - Excellent';
      if (grade >= 61) return 'B - Good';
      if (grade >= 41) return 'C - Average';
      if (grade >= 21) return 'D - Below Average';
      return 'F - Poor';
    };

    return (
      <div className="my-recipes">
        <div className="recipe-detail">
          <button className="back-button" onClick={() => setSelectedRecipe(null)}>
            ← Back to My Recipes
          </button>

          <div className="detail-header">
            <h2>Recipe #{Number(selectedRecipe.recipeId)}</h2>
            {selectedRecipe.evaluated ? (
              <div
                className="grade-badge-large"
                style={{ backgroundColor: getGradeColor(selectedRecipe.grade) }}
              >
                <div className="grade-number">{selectedRecipe.grade}</div>
                <div className="grade-label">{getGradeLabel(selectedRecipe.grade)}</div>
              </div>
            ) : (
              <div className="pending-badge-large">⏳ Awaiting Evaluation</div>
            )}
          </div>

          {selectedRecipe.evaluated && (
            <>
              <div className="dish-description">
                <h3>🍽️ Dish Description</h3>
                <p>{selectedRecipe.dishDescription}</p>
              </div>

              <div className="revenue-info">
                <h4>💰 Revenue Rate</h4>
                <p className="revenue-value">{Number(selectedRecipe.revenueRate)}</p>
                <small>Tokens per minute when served to customers</small>
              </div>

              <div className="critics-section">
                <h3>👨‍🍳 Chef's Critique</h3>
                <p className="critics-text">{selectedRecipe.critics}</p>
              </div>
            </>
          )}

          <div className="recipe-details">
            <div className="detail-section">
              <h3>📝 Ingredients</h3>
              <p>{selectedRecipe.ingredients}</p>
            </div>

            <div className="detail-section">
              <h3>👩‍🍳 Instructions</h3>
              <p>{selectedRecipe.instruction}</p>
            </div>
          </div>

          <div className="recipe-metadata">
            <p>
              <strong>Submitted:</strong>{' '}
              {new Date(Number(selectedRecipe.timestamp) * 1000).toLocaleString()}
            </p>
            <p>
              <strong>NFT Owner:</strong> {selectedRecipe.chef.slice(0, 6)}...
              {selectedRecipe.chef.slice(-4)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-recipes">
      <div className="recipes-container">
        <div className="recipes-header">
          <h2>📚 My Recipes</h2>
          <button className="refresh-button" onClick={() => refetchIds()}>
            🔄 Refresh
          </button>
        </div>

        {(recipeIds as bigint[]).length === 0 ? (
          <div className="empty-state">
            <h3>🍳 No Recipes Yet</h3>
            <p>Submit your first recipe to get started!</p>
          </div>
        ) : (
          <>
            <p className="recipes-count">
              You have {(recipeIds as bigint[]).length} recipe
              {(recipeIds as bigint[]).length !== 1 ? 's' : ''}
            </p>
            <div className="recipes-grid">
              {(recipeIds as bigint[]).map((id) => (
                <RecipeCard key={id.toString()} recipeId={id} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
