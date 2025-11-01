import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('farm');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌾 Soil2Sauce</h1>
        <p className="tagline">On-Chain Farming Game</p>
        <WalletConnect />
      </header>

      {!isConnected ? (
        <div className="connect-prompt">
          <h2>Welcome to Soil2Sauce!</h2>
          <p>Connect your wallet to start farming</p>
        </div>
      ) : (
        <>
          <PlayerRegistration />

          <nav className="nav-tabs">
            <button
              className={activeTab === 'farm' ? 'active' : ''}
              onClick={() => setActiveTab('farm')}
            >
              🌾 Farm
            </button>
            <button
              className={activeTab === 'livestock' ? 'active' : ''}
              onClick={() => setActiveTab('livestock')}
            >
              🐄 Livestock
            </button>
            <button
              className={activeTab === 'shop' ? 'active' : ''}
              onClick={() => setActiveTab('shop')}
            >
              🛒 Shop
            </button>
            <button
              className={activeTab === 'inventory' ? 'active' : ''}
              onClick={() => setActiveTab('inventory')}
            >
              🎒 Inventory
            </button>
          </nav>

          <main className="main-content">
            {activeTab === 'farm' && <FarmPlots />}
            {activeTab === 'livestock' && <Livestock />}
            {activeTab === 'shop' && <Shop />}
            {activeTab === 'inventory' && <Inventory />}
          </main>
        </>
      )}

      <footer className="app-footer">
        <p>Built on Ethereum • Local Anvil Chain</p>
      </footer>
    </div>
  );
}

export default App;
