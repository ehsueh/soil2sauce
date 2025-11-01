import { useAccount } from 'wagmi';
import { WalletConnect } from './components/WalletConnect';
import { PlayerRegistration } from './components/PlayerRegistration';
import { FarmPlots } from './components/FarmPlots';
import { Livestock } from './components/Livestock';
import { Shop } from './components/Shop';
import { Inventory } from './components/Inventory';
import './App.css';

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌾 Soil2Sauce</h1>
        <WalletConnect />
      </header>

      {!isConnected ? (
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
        </div>
      )}

      <footer className="app-footer">
        <p>Built on Ethereum • Local Anvil Chain</p>
      </footer>
    </div>
  );
}

export default App;
