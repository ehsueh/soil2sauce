import { useState } from 'react';
import { useAccount } from 'wagmi';
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
  const { address, isConnected } = useAccount();
  const [dishDescription, setDishDescription] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [researched, setResearched] = useState<ResearchedRecipe | null>(null);
  const [error, setError] = useState('');

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
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!dishDescription.trim()) {
      setError('Please describe your dish');
      return;
    }

    const filledIngredients = ingredients.filter(ing => ing.name && ing.amount);
    if (filledIngredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/recipes/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: dishDescription,
          ingredients: filledIngredients
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to research recipe: ${response.statusText}`);
      }

      const data = await response.json();
      setResearched(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to research recipe');
      setResearched(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecipe = async () => {
    if (!researched) return;
    // TODO: Call smart contract createRecipe function
    console.log('Creating recipe:', researched);
    alert('Recipe creation would be submitted to smart contract');
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return '#4ade80';
    if (level <= 6) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div className="recipe-research">
      <div className="research-container">
        <h2>🔬 Recipe Research</h2>
        <p className="subtitle">Describe your dish and let AI help you create the perfect recipe</p>

        {!researched ? (
          <div className="research-form">
            <div className="form-group">
              <label htmlFor="description">Dish Description</label>
              <textarea
                id="description"
                placeholder="Describe your dish... e.g., 'A hearty tomato and egg breakfast scramble with fresh herbs'"
                value={dishDescription}
                onChange={(e) => setDishDescription(e.target.value)}
                disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                    {ingredients.length > 1 && (
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveIngredient(index)}
                        disabled={loading}
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
                disabled={loading}
              >
                + Add Ingredient
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="research-button"
              onClick={handleResearch}
              disabled={loading || !isConnected}
            >
              {loading ? 'Researching Recipe...' : '🚀 Research Recipe with AI'}
            </button>
          </div>
        ) : (
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

            <div className="recipe-section">
              <h4>Cooking Instructions</h4>
              <ol className="instructions-list">
                {researched.cooking_instructions.split(/(?:^|\. )/m).filter(Boolean).map((step, i) => (
                  <li key={i}>{step.trim()}</li>
                ))}
              </ol>
            </div>

            <div className="action-buttons">
              <button
                className="create-recipe-btn"
                onClick={handleCreateRecipe}
              >
                ✅ Create This Recipe
              </button>
              <button
                className="back-btn"
                onClick={() => {
                  setResearched(null);
                  setDishDescription('');
                  setIngredients([{ name: '', amount: '' }]);
                }}
              >
                ← Try Another Recipe
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
