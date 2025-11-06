import { useAccount } from 'wagmi';
import { WalletConnect } from './components/WalletConnect.tsx';
import { PlayerRegistration } from './components/PlayerRegistration.tsx';
import { FarmPlots } from './components/FarmPlots.tsx';
import { Livestock } from './components/Livestock.tsx';
import { Shop } from './components/Shop.tsx';
import { Inventory } from './components/Inventory.tsx';
import MyRecipes from './components/MyRecipes.tsx';
import RecipeResearch from './components/RecipeResearch.tsx';
import './App.css';

function App() {
  const { address, isConnected, isConnecting } = useAccount();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌾 Soil2Sauce</h1>
        <WalletConnect />
      </header>

      {isConnecting ? (
        <div className="connect-prompt">
          <h2>Connecting Wallet...</h2>
          <p>Please approve the connection in your wallet</p>
        </div>
      ) : !isConnected || !address ? (
        <div className="connect-prompt">
          <h2>Welcome to Soil2Sauce!</h2>
          <p>Connect your wallet to start farming</p>
        </div>
      ) : (
        <div className="game-container">
          <PlayerRegistration />

          <section className="game-section">
            <Inventory />
          </section>

          <section className="game-section">
            <FarmPlots />
          </section>

          <section className="game-section">
            <Livestock />
          </section>

          <section className="game-section">
            <Shop />
          </section>

          <section className="game-section">
            <RecipeResearch />
          </section>

          <section className="game-section">
            <MyRecipes />
          </section>
        </div>
      )}

      <footer className="app-footer">
        <p>Built on Base</p>
      </footer>
    </div>
  );
}

export default App;
