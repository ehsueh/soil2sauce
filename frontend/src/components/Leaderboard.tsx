import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import './Leaderboard.css';

interface LeaderboardEntry {
  player: string;
  playerName: string;
  bestRecipeId: number;
  bestGrade: 'F' | 'D' | 'C' | 'B' | 'A' | 'S';
  totalRecipesPublished: number;
  averageGrade: number;
  totalRevenue: number;
}

export default function Leaderboard() {
  const { isConnected, chain } = useAccount();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'grade' | 'recipes' | 'revenue'>('grade');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // TODO: Call smart contract to get leaderboard entries
      // For now, use mock data
      const mockData: LeaderboardEntry[] = [
        {
          player: '0x1234...',
          playerName: 'MasterChef_Alex',
          bestRecipeId: 5,
          bestGrade: 'S',
          totalRecipesPublished: 8,
          averageGrade: 4.5,
          totalRevenue: 450
        },
        {
          player: '0x5678...',
          playerName: 'CulinaryArtist',
          bestRecipeId: 3,
          bestGrade: 'A',
          totalRecipesPublished: 6,
          averageGrade: 4.0,
          totalRevenue: 350
        },
        {
          player: '0x9abc...',
          playerName: 'RecipeCreator',
          bestRecipeId: 7,
          bestGrade: 'A',
          totalRecipesPublished: 5,
          averageGrade: 3.8,
          totalRevenue: 320
        }
      ];
      setEntries(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const gradeToScore = (grade: string): number => {
    const scores: Record<string, number> = {
      'F': 0,
      'D': 1,
      'C': 2,
      'B': 3,
      'A': 4,
      'S': 5
    };
    return scores[grade] || 0;
  };

  const gradeToColor = (grade: string): string => {
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

  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'recipes':
        return b.totalRecipesPublished - a.totalRecipesPublished;
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      default: // grade
        return gradeToScore(b.bestGrade) - gradeToScore(a.bestGrade);
    }
  });

  if (loading) {
    return (
      <div className="leaderboard">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <div className="error">{error}</div>
        <button onClick={loadLeaderboard}>Retry</button>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-container">
        <div className="header">
          <h2>🏆 Recipe Leaderboard</h2>
          <p className="subtitle">Top chefs competing for glory!</p>
        </div>

        {chain?.id !== 84532 && isConnected && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            textAlign: 'center'
          }}>
            ⚠️ Switch to Base Sepolia network to view the real leaderboard
          </div>
        )}

        <div className="sort-controls">
          <button
            className={`sort-btn ${sortBy === 'grade' ? 'active' : ''}`}
            onClick={() => setSortBy('grade')}
          >
            Best Grade
          </button>
          <button
            className={`sort-btn ${sortBy === 'recipes' ? 'active' : ''}`}
            onClick={() => setSortBy('recipes')}
          >
            Most Recipes
          </button>
          <button
            className={`sort-btn ${sortBy === 'revenue' ? 'active' : ''}`}
            onClick={() => setSortBy('revenue')}
          >
            Top Revenue
          </button>
        </div>

        {sortedEntries.length === 0 ? (
          <div className="empty-state">
            <p>No recipes published yet. Be the first chef!</p>
          </div>
        ) : (
          <div className="leaderboard-table">
            {sortedEntries.map((entry, index) => (
              <div
                key={entry.player}
                className={`leaderboard-row ${index < 3 ? `rank-${index + 1}` : ''}`}
              >
                <div className="rank-column">
                  <div className="rank-number">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index >= 3 && `#${index + 1}`}
                  </div>
                </div>

                <div className="player-column">
                  <div className="player-name">{entry.playerName}</div>
                  <div className="player-address">{entry.player}</div>
                </div>

                <div className="stats-column">
                  <div className="stat">
                    <span className="stat-label">Best Grade</span>
                    <span
                      className="stat-value grade"
                      style={{ backgroundColor: gradeToColor(entry.bestGrade) }}
                    >
                      {entry.bestGrade}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Recipes</span>
                    <span className="stat-value">{entry.totalRecipesPublished}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Revenue</span>
                    <span className="stat-value revenue">💰 {entry.totalRevenue}</span>
                  </div>
                </div>

                <div className="badge-column">
                  {entry.bestGrade === 'S' && <div className="badge S">S-Tier</div>}
                  {entry.bestGrade === 'A' && <div className="badge A">A-Class</div>}
                  {entry.totalRecipesPublished >= 5 && (
                    <div className="badge prolific">Prolific</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="leaderboard-info">
          <p>
            Leaderboard updated every hour. Compete with other chefs to earn the best grades!
          </p>
        </div>
      </div>
    </div>
  );
}
