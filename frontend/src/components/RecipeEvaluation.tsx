import { useState } from 'react';
import { useAccount } from 'wagmi';
import './RecipeEvaluation.css';

interface RecipeData {
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
  }>;
}

interface EvaluationResult {
  grade: 'F' | 'D' | 'C' | 'B' | 'A' | 'S';
  revenue_rate: number;
  critics: string;
}

const AVAILABLE_INGREDIENTS = [
  'Wheat', 'Tomato', 'Strawberry', 'Carrot',
  'Milk', 'Egg', 'Butter', 'Cheese', 'Honey'
];

export default function RecipeEvaluation() {
  const { address, isConnected } = useAccount();
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', amount: '' }]);
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
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

  const handleEvaluate = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!recipeName.trim()) {
      setError('Please enter a recipe name');
      return;
    }

    if (!recipeDescription.trim()) {
      setError('Please describe your recipe');
      return;
    }

    if (!cookingInstructions.trim()) {
      setError('Please provide cooking instructions');
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
      const response = await fetch('http://localhost:3001/api/recipes/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipe: {
            name: recipeName,
            description: recipeDescription,
            ingredients: filledIngredients
          },
          instructions: cookingInstructions
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to evaluate recipe: ${response.statusText}`);
      }

      const data = await response.json();
      setEvaluation(data.evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate recipe');
      setEvaluation(null);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string): string => {
    const colors: Record<string, string> = {
      'F': '#ef4444',
      'D': '#f97316',
      'C': '#eab308',
      'B': '#84cc16',
      'A': '#22c55e',
      'S': '#8b5cf6'
    };
    return colors[grade] || '#6b7280';
  };

  const getGradeDescription = (grade: string): string => {
    const descriptions: Record<string, string> = {
      'F': 'Inedible or dangerously flawed',
      'D': 'Poor execution or bad ingredient pairing',
      'C': 'Average, lacks creativity',
      'B': 'Good technique and interesting combination',
      'A': 'Excellent, professional quality',
      'S': 'Exceptional, innovative, restaurant-worthy'
    };
    return descriptions[grade] || '';
  };

  if (evaluation) {
    return (
      <div className="recipe-evaluation">
        <div className="evaluation-result">
          <h2>📋 Recipe Evaluation Result</h2>

          <div className="recipe-info">
            <h3>{recipeName}</h3>
            <p>{recipeDescription}</p>
          </div>

          <div className="evaluation-highlights">
            <div className="highlight-card grade-card">
              <div className="highlight-label">Grade</div>
              <div
                className="grade-display"
                style={{ backgroundColor: getGradeColor(evaluation.grade) }}
              >
                {evaluation.grade}
              </div>
              <div className="grade-description">
                {getGradeDescription(evaluation.grade)}
              </div>
            </div>

            <div className="highlight-card revenue-card">
              <div className="highlight-label">Revenue Rate</div>
              <div className="revenue-display">
                💰 {evaluation.revenue_rate}
                <span className="revenue-unit">tokens/min</span>
              </div>
              <div className="revenue-description">
                Expected earnings when served to customers
              </div>
            </div>
          </div>

          <div className="critics-section">
            <h4>👨‍🍳 Chef's Critique</h4>
            <p className="critics-text">{evaluation.critics}</p>
          </div>

          <div className="action-buttons">
            <button
              className="publish-btn"
              onClick={() => {
                console.log('Publishing recipe...');
                alert('Recipe published to your restaurant!');
              }}
            >
              ✅ Publish to Restaurant
            </button>
            <button
              className="revise-btn"
              onClick={() => {
                setEvaluation(null);
                setRecipeName('');
                setRecipeDescription('');
                setIngredients([{ name: '', amount: '' }]);
                setCookingInstructions('');
              }}
            >
              ← Revise Recipe
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-evaluation">
      <div className="evaluation-container">
        <h2>🔍 Recipe Evaluation</h2>
        <p className="subtitle">Get AI feedback on your recipe before publishing</p>

        <div className="evaluation-form">
          <div className="form-group">
            <label htmlFor="name">Recipe Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Sunrise Tomato Omelette"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe your recipe and what makes it special..."
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              disabled={loading}
              rows={3}
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
                    placeholder="Amount"
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

          <div className="form-group">
            <label htmlFor="instructions">Cooking Instructions</label>
            <textarea
              id="instructions"
              placeholder="Step-by-step instructions for preparing your recipe..."
              value={cookingInstructions}
              onChange={(e) => setCookingInstructions(e.target.value)}
              disabled={loading}
              rows={5}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="evaluate-button"
            onClick={handleEvaluate}
            disabled={loading || !isConnected}
          >
            {loading ? 'Evaluating...' : '⭐ Get AI Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
}
