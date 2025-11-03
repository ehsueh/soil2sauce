import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses';
import LivestockSystemABI from '../contracts/LivestockSystem.json';
import ItemsERC1155ABI from '../contracts/ItemsERC1155.json';
import { useEventContext } from '../contexts/EventProvider';

const ANIMALS = [
  { id: 20, cooldown: 60 }, // Cow - 1 min (updated for testing)
  { id: 21, cooldown: 60 }, // Chicken - 1 min (updated for testing)
  { id: 22, cooldown: 60 }, // Pig - 1 min (updated for testing)
];

export function Livestock() {
  const { address } = useAccount();
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const { writeContract } = useWriteContract();
  const { getLastEvent } = useEventContext();

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

  return (
    <div className="livestock">
      <h2>Livestock 🐄</h2>
      <div className="livestock-info">
        <p>Claim products from your animals based on probability:</p>
        <ul>
          <li>🐮 Cow: 95% Milk, 5% Cheese (1 min cooldown)</li>
          <li>🐔 Chicken: 90% Egg, 10% Feather (1 min cooldown)</li>
          <li>🐷 Pig: 80% Pork, 20% Bacon (1 min cooldown)</li>
        </ul>
      </div>
      {!address ? (
        <div>Connect wallet to view livestock</div>
      ) : (
        <div className="livestock-grid">
          {ANIMALS.map(animal => (
            <AnimalItem
              key={animal.id}
              animalId={animal.id}
              cooldown={animal.cooldown}
              currentTime={currentTime}
              onClaimProducts={handleClaimProducts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Separate component to use hooks properly
function AnimalItem({ animalId, cooldown, currentTime, onClaimProducts }) {
  const { address } = useAccount();
  const metadata = ITEM_METADATA[animalId];

  // Get animal count using React Query
  // Note: EventProvider automatically invalidates 'inventory' query
  // when ItemPurchased events are emitted
  const { data: animalCount } = useQuery({
    queryKey: ['inventory', address, animalId],
    queryFn: async () => {
      if (!address) return 0n;
      return await readContract(config, {
        address: CONTRACT_ADDRESSES.ItemsERC1155,
        abi: ItemsERC1155ABI,
        functionName: 'balanceOf',
        args: [address, BigInt(animalId)],
      });
    },
    enabled: !!address,
  });

  // Get next claim time using React Query
  // Note: When ProductsClaimed event listener is added, it will invalidate 'livestock' query
  const { data: nextClaimTime } = useQuery({
    queryKey: ['livestock', address, animalId],
    queryFn: async () => {
      if (!address) return 0n;
      return await readContract(config, {
        address: CONTRACT_ADDRESSES.LivestockSystem,
        abi: LivestockSystemABI,
        functionName: 'getNextClaimTime',
        args: [address, BigInt(animalId)],
      });
    },
    enabled: !!address,
  });

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (!animalCount || animalCount === 0n) {
    return (
      <div className="livestock-item no-animals">
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
    <div className={`livestock-item ${canClaim ? 'ready' : 'cooldown'}`}>
      <span className="animal-emoji">{metadata.emoji}</span>
      <div className="animal-info">
        <h4>{metadata.name}</h4>
        <p className="animal-count">Owned: {animalCount.toString()}</p>

        {canClaim ? (
          <>
            <p className="status ready">Ready to claim products!</p>
            <button onClick={() => onClaimProducts(animalId)} className="claim-btn">
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
}
