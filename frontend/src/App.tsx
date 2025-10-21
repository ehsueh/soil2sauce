import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useConnect, useDisconnect } from 'wagmi';
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
import { CONTRACT_ADDRESSES } from './wagmi';
import GameTokenABI from './contracts/GameToken.json';
import { formatUnits } from 'viem';
import { RefreshProvider, useRefresh } from './RefreshContext';

type Section =
  | 'farming'
  | 'market'
  | 'inventory'
  | 'makeSeed'
  | 'cropMarket'
  | 'animalMarket'
  | 'stable'
  | 'restaurant'
  | 'backKitchen';

function AppContent() {
  const [activeSection, setActiveSection] = useState<Section>('farming');
  const { isConnected, address } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { refreshTrigger } = useRefresh();

  // Read GCOIN balance
  const { data: balance = 0n, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.gameToken,
    abi: GameTokenABI.abi,
    functionName: 'balanceOf',
    args: [address],
  });

  // Refetch balance when global refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchBalance();
    }
  }, [refreshTrigger, refetchBalance]);

  const renderSection = () => {
    if (!isConnected) {
      return (
        <div className="connect-prompt">
          <h1>Welcome to Soil2Sauce</h1>
          <p>Connect your wallet to start playing!</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                className="expand-button"
              >
                Connect with {connector.name}
              </button>
            ))}
          </div>
        </div>
      );
    }

    switch (activeSection) {
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
      default:
        return <FarmGrid />;
    }
  };

  return (
    <div className="app-layout">
        <div className="sidebar">
        {isConnected && (
          <div className="wallet-section">
            <div style={{ padding: '0.5rem', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Connected Account:</div>
              <div style={{ wordBreak: 'break-all' }}>{address?.slice(0, 6)}...{address?.slice(-4)}</div>
              <button
                onClick={() => disconnect()}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Disconnect
              </button>
            </div>
            <div style={{ padding: '0.75rem', background: '#2E8B57', color: 'white', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>💰 {formatUnits(balance as bigint, 18)}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>GCOIN</div>
            </div>
          </div>
        )}
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
      </div>
      <div className="main-content">
        <div className="content-section">{renderSection()}</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <RefreshProvider>
      <AppContent />
    </RefreshProvider>
  );
}

export default App;
