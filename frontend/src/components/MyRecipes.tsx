import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../wagmi.ts';
import RecipeSystemABI from '../contracts/RecipeSystem.json';
import './MyRecipes.css';

interface Recipe {
  recipeId: bigint;
  chef: string;
  dishDescription: string;
  ingredients: string;
  grade: number;
  revenueRate: bigint;
  critics: string;
  evaluated: boolean;
  timestamp: bigint;
  metadataURI: string;
}

export default function MyRecipes() {
  const { address, isConnected, chain } = useAccount();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Get recipe IDs for the current user
  const { data: recipeIds = [], refetch: refetchIds } = useReadContract({
    address: CONTRACT_ADDRESSES.recipeSystem,
    abi: RecipeSystemABI,
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
    const { data: recipe, isError, error } = useReadContract({
      address: CONTRACT_ADDRESSES.recipeSystem,
      abi: RecipeSystemABI,
      functionName: 'getRecipe',
      args: [recipeId],
      query: {
        enabled: true,
      },
    });

    if (isError) {
      console.error('Error loading recipe:', error);
      return (
        <div className="recipe-card error">
          <p>Error loading recipe #{Number(recipeId)}</p>
        </div>
      );
    }

    if (!recipe) return null;

    try {
      // Recipe is returned as an object with named properties from the contract struct
      const recipeObj = recipe as any;

      const recipeData: Recipe = {
        recipeId: recipeObj.recipeId,
        chef: recipeObj.chef,
        dishDescription: recipeObj.dishDescription,
        ingredients: recipeObj.ingredients,
        grade: Number(recipeObj.grade),
        revenueRate: recipeObj.revenueRate,
        critics: recipeObj.critics,
        evaluated: recipeObj.evaluated,
        timestamp: recipeObj.timestamp,
        metadataURI: recipeObj.metadataURI,
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
          className={`recipe-card ${!recipeData.evaluated ? 'pending' : ''}`}
          onClick={() => setSelectedRecipe(recipeData)}
        >
          <div className="recipe-card-header">
            <h3>Recipe #{Number(recipeData.recipeId)}</h3>
            {recipeData.evaluated ? (
              <div
                className="grade-badge"
                style={{ backgroundColor: getGradeColor(recipeData.grade) }}
              >
                Grade: {recipeData.grade}
              </div>
            ) : (
              <div className="pending-badge">⏳ Pending Evaluation</div>
            )}
          </div>
          <p className="recipe-preview">
            {recipeData.dishDescription.substring(0, 80)}
            {recipeData.dishDescription.length > 80 ? '...' : ''}
          </p>
          {recipeData.evaluated && (
            <div className="recipe-stats">
              <span>💰 Revenue: {Number(recipeData.revenueRate)}</span>
              <span>📅 {new Date(Number(recipeData.timestamp) * 1000).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      );
    } catch (err) {
      console.error('Error rendering recipe card:', err);
      return (
        <div className="recipe-card error">
          <p>Error rendering recipe #{Number(recipeId)}</p>
        </div>
      );
    }
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
          <button className="back-button" onClick={() => setSelectedRecipe(null)} style={{ color: '#1a1a1a' }}>
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
          </div>

          <div className="blockchain-links" style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1a1a1a' }}>🔗 Blockchain & IPFS Links</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href={`https://sepolia.basescan.org/token/${CONTRACT_ADDRESSES.recipeSystem}?a=${selectedRecipe.recipeId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#0066cc',
                  textDecoration: 'none',
                  padding: '0.5rem',
                  background: 'white',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                🔍 View NFT on BaseScan →
              </a>

              {selectedRecipe.metadataURI && (
                <a
                  href={selectedRecipe.metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#0066cc',
                    textDecoration: 'none',
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  📦 View Metadata on IPFS →
                </a>
              )}
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
