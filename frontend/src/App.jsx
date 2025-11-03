import { useAccount } from 'wagmi';
import { WalletConnect } from './components/WalletConnect';
import { PlayerRegistration } from './components/PlayerRegistration';
import { FarmPlots } from './components/FarmPlots';
import { Livestock } from './components/Livestock';
import { Shop } from './components/Shop';
import { Inventory } from './components/Inventory';
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
        </div>
      )}

      <footer className="app-footer">
        <p>Built on Ethereum • Local Anvil Chain</p>
      </footer>
    </div>
  );
}

export default App;
