import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import './App.css';
import FarmGrid from './components/FarmGrid';
import SeedMarket from './components/SeedMarket';
import Inventory from './components/Inventory';
import MakeSeed from './components/MakeSeed';
import CropMarket from './components/CropMarket';
import AnimalMarket from './components/AnimalMarket';
import Stable from './components/Stable';
import Restaurant from './components/Restaurant';
import BackKitchen from './components/BackKitchen';
import PlayerRegistration from './components/PlayerRegistration';
import RecipeResearch from './components/RecipeResearch';
import RecipeEvaluation from './components/RecipeEvaluation';
import Leaderboard from './components/Leaderboard';

type Section =
  | 'registration'
  | 'farming'
  | 'market'
  | 'inventory'
  | 'makeSeed'
  | 'cropMarket'
  | 'animalMarket'
  | 'stable'
  | 'restaurant'
  | 'backKitchen'
  | 'recipeResearch'
  | 'recipeEvaluation'
  | 'leaderboard';

function App() {
  const [activeSection, setActiveSection] = useState<Section>('registration');
  const { isConnected } = useAccount();

  const renderSection = () => {
    if (!isConnected) {
      return (
        <div className="connect-prompt">
          <h2>Welcome to Soil2Sauce!</h2>
          <p>Connect your wallet to start farming</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'registration':
        return <PlayerRegistration />;
      case 'farming':
        return <FarmGrid />;
      case 'market':
        return <SeedMarket />;
      case 'inventory':
        return <Inventory />;
      case 'makeSeed':
        return <MakeSeed />;
      case 'cropMarket':
        return <CropMarket />;
      case 'animalMarket':
        return <AnimalMarket />;
      case 'stable':
        return <Stable />;
      case 'restaurant':
        return <Restaurant />;
      case 'backKitchen':
        return <BackKitchen />;
      case 'recipeResearch':
        return <RecipeResearch />;
      case 'recipeEvaluation':
        return <RecipeEvaluation />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <PlayerRegistration />;
    }
  };

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="wallet-section">
          <ConnectButton />
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'registration' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('registration')}
        >
          <h3>👤 Profile</h3>
        </div>

        <div className="sidebar-divider">Farming</div>

        <div
          className={`sidebar-section ${
            activeSection === 'farming' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('farming')}
        >
          <h3>🌱 Farming</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'market' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('market')}
        >
          <h3>🛒 Seed Market</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'inventory' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('inventory')}
        >
          <h3>📦 Inventory</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'makeSeed' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('makeSeed')}
        >
          <h3>🧪 Make Seed</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'cropMarket' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('cropMarket')}
        >
          <h3>💰 Crop Market</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'animalMarket' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('animalMarket')}
        >
          <h3>🏪 Animal Market</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'stable' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('stable')}
        >
          <h3>🏠 Stable</h3>
        </div>

        <div className="sidebar-divider">Cooking</div>

        <div
          className={`sidebar-section ${
            activeSection === 'recipeResearch' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('recipeResearch')}
        >
          <h3>🔬 Research Recipe</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'recipeEvaluation' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('recipeEvaluation')}
        >
          <h3>🔍 Evaluate Recipe</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'restaurant' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('restaurant')}
        >
          <h3>🍽️ Restaurant</h3>
        </div>
        <div
          className={`sidebar-section ${
            activeSection === 'backKitchen' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('backKitchen')}
        >
          <h3>👨‍🍳 Back Kitchen</h3>
        </div>

        <div className="sidebar-divider">Community</div>

        <div
          className={`sidebar-section ${
            activeSection === 'leaderboard' ? 'active' : ''
          }`}
          onClick={() => setActiveSection('leaderboard')}
        >
          <h3>🏆 Leaderboard</h3>
        </div>
      </div>
      <div className="main-content">
        <div className="content-section">{renderSection()}</div>
      </div>
    </div>
  );
}

export default App;
