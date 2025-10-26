import { useState } from 'react';
import { useAccount } from 'wagmi';
import './PlayerRegistration.css';

interface PlayerProfile {
  playerName: string;
  role: 'farmer' | 'chef';
  coPlayerAddress?: string;
}

export default function PlayerRegistration() {
  const { address, isConnected } = useAccount();
  const [playerName, setPlayerName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'chef'>('farmer');
  const [coPlayerAddress, setCoPlayerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = async () => {
    if (!isConnected || !address) {
      setMessage('Please connect your wallet first');
      return;
    }

    if (!playerName.trim()) {
      setMessage('Please enter a player name');
      return;
    }

    if (playerName.length > 32) {
      setMessage('Player name must be 32 characters or less');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call smart contract registerPlayer function
      // For now, show success message
      setMessage(`Registration successful! Welcome, ${playerName}!`);
      setIsRegistered(true);

      // Show player profile
      const profile: PlayerProfile = {
        playerName,
        role: selectedRole,
        coPlayerAddress: coPlayerAddress || undefined
      };
      console.log('Player registered:', profile);
    } catch (error) {
      setMessage(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="player-registration">
        <div className="registration-success">
          <h2>Welcome to Soil2Sauce! 🌾</h2>
          <div className="player-profile">
            <p><strong>Player Name:</strong> {playerName}</p>
            <p><strong>Role:</strong> {selectedRole === 'farmer' ? '🌱 Farmer' : '👨‍🍳 Chef'}</p>
            {coPlayerAddress && (
              <p><strong>Co-Player:</strong> {coPlayerAddress}</p>
            )}
          </div>
          <p className="success-message">
            {selectedRole === 'farmer'
              ? 'Ready to grow your farm! Plant seeds, harvest crops, and build your agricultural empire.'
              : 'Ready to create delicious recipes! Research, evaluate, and publish your culinary creations.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-registration">
      <div className="registration-card">
        <h2>Create Your Player Profile</h2>
        <p className="subtitle">Choose your role and get started in Soil2Sauce!</p>

        <div className="form-group">
          <label htmlFor="playerName">Player Name</label>
          <input
            id="playerName"
            type="text"
            placeholder="Enter your unique player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={32}
            disabled={loading}
          />
          <small>{playerName.length}/32 characters</small>
        </div>

        <div className="form-group">
          <label>Choose Your Role</label>
          <div className="role-selector">
            <div
              className={`role-option ${selectedRole === 'farmer' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('farmer')}
            >
              <div className="role-icon">🌱</div>
              <h3>Farmer</h3>
              <p>Manage your farm, plant crops, and animals</p>
              <ul>
                <li>Own 9 plots of land</li>
                <li>Plant and harvest crops</li>
                <li>Raise animals for products</li>
                <li>Sell crops for coins</li>
              </ul>
            </div>

            <div
              className={`role-option ${selectedRole === 'chef' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('chef')}
            >
              <div className="role-icon">👨‍🍳</div>
              <h3>Chef</h3>
              <p>Research recipes and run a restaurant</p>
              <ul>
                <li>Research new recipes</li>
                <li>Get AI evaluations and grades</li>
                <li>Publish recipes for passive income</li>
                <li>Compete on leaderboard</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="coPlayer">Co-Player Address (Optional)</label>
          <input
            id="coPlayer"
            type="text"
            placeholder="0x... (optional - invite a co-player)"
            value={coPlayerAddress}
            onChange={(e) => setCoPlayerAddress(e.target.value)}
            disabled={loading}
          />
          <small>Leave blank if playing solo</small>
        </div>

        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button
          className="register-button"
          onClick={handleRegister}
          disabled={loading || !isConnected}
        >
          {loading ? 'Registering...' : 'Create Profile & Start Playing'}
        </button>

        {!isConnected && (
          <p className="warning">Please connect your wallet first</p>
        )}
      </div>
    </div>
  );
}
