import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses';
import LivestockSystemABI from '../contracts/LivestockSystem.json';
import ItemsERC1155ABI from '../contracts/ItemsERC1155.json';

const ANIMALS = [
  { id: 20, cooldown: 12 * 3600 }, // Cow - 12h
  { id: 21, cooldown: 8 * 3600 },  // Chicken - 8h
  { id: 22, cooldown: 24 * 3600 }, // Pig - 24h
];

export function Livestock() {
  const { address } = useAccount();
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const { writeContract } = useWriteContract();

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimProducts = async (animalId) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.LivestockSystem,
        abi: LivestockSystemABI,
        functionName: 'claimProducts',
        args: [BigInt(animalId)],
      });
    } catch (error) {
      console.error('Claiming products failed:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const renderAnimal = (animalId, cooldown) => {
    const metadata = ITEM_METADATA[animalId];

    // Get animal count
    const { data: animalCount } = useReadContract({
      address: CONTRACT_ADDRESSES.ItemsERC1155,
      abi: ItemsERC1155ABI,
      functionName: 'balanceOf',
      args: [address, BigInt(animalId)],
      query: {
        enabled: !!address,
      }
    });

    // Get next claim time
    const { data: nextClaimTime } = useReadContract({
      address: CONTRACT_ADDRESSES.LivestockSystem,
      abi: LivestockSystemABI,
      functionName: 'getNextClaimTime',
      args: [address, BigInt(animalId)],
      query: {
        enabled: !!address,
      }
    });

    if (!animalCount || animalCount === 0n) {
      return (
        <div key={animalId} className="livestock-item no-animals">
          <span className="animal-emoji">{metadata.emoji}</span>
          <div className="animal-info">
            <h4>{metadata.name}</h4>
            <p>You don't own any {metadata.name.toLowerCase()}s yet</p>
            <p className="hint">Buy from shop to start producing!</p>
          </div>
        </div>
      );
    }

    const nextClaim = Number(nextClaimTime || 0);
    const timeRemaining = Math.max(0, nextClaim - currentTime);
    const canClaim = timeRemaining === 0;

    return (
      <div key={animalId} className={`livestock-item ${canClaim ? 'ready' : 'cooldown'}`}>
        <span className="animal-emoji">{metadata.emoji}</span>
        <div className="animal-info">
          <h4>{metadata.name}</h4>
          <p className="animal-count">Owned: {animalCount.toString()}</p>

          {canClaim ? (
            <>
              <p className="status ready">Ready to claim products!</p>
              <button onClick={() => handleClaimProducts(animalId)} className="claim-btn">
                Claim Products
              </button>
            </>
          ) : (
            <>
              <p className="status cooldown">Cooldown</p>
              <p className="time-remaining">{formatTime(timeRemaining)}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  if (!address) {
    return <div className="livestock">Connect wallet to view livestock</div>;
  }

  return (
    <div className="livestock">
      <h2>Livestock 🐄</h2>
      <div className="livestock-info">
        <p>Claim products from your animals based on probability:</p>
        <ul>
          <li>🐮 Cow: 95% Milk, 5% Cheese (12h cooldown)</li>
          <li>🐔 Chicken: 90% Egg, 10% Feather (8h cooldown)</li>
          <li>🐷 Pig: 80% Pork, 20% Bacon (24h cooldown)</li>
        </ul>
      </div>
      <div className="livestock-grid">
        {ANIMALS.map(animal => renderAnimal(animal.id, animal.cooldown))}
      </div>
    </div>
  );
}
