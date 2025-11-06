import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi.ts';
import { CONTRACT_ADDRESSES } from '../contracts/addresses.ts';
import STOKENABI from '../contracts/STOKEN.json';
import { formatEther } from 'viem';
import { InventoryItem } from './InventoryItem.tsx';

export function Inventory() {
  const { address } = useAccount();

  // Read STOKEN balance using React Query
  // Note: EventProvider automatically invalidates 'currencies' query
  // when Harvested or ItemPurchased events are emitted
  const { data: stokenBalance, isLoading, error } = useQuery({
    queryKey: ['currencies', 'stoken', address],
    queryFn: async () => {
      if (!address) return 0n;
      try {
        return await readContract(config, {
          address: CONTRACT_ADDRESSES.STOKEN,
          abi: STOKENABI,
          functionName: 'balanceOf',
          args: [address],
        });
      } catch (err) {
        console.error('Error reading STOKEN balance:', err);
        return 0n;
      }
    },
    enabled: !!address,
  });

  const renderItemCategory = (title: string, itemIds: number[]) => {
    return (
      <div className="inventory-category">
        <h3>{title}</h3>
        <div className="inventory-items">
          {itemIds.map(id => (
            <InventoryItem key={id} itemId={id} />
          ))}
        </div>
      </div>
    );
  };

  if (!address) {
    return <div className="inventory">Connect wallet to view inventory</div>;
  }

  return (
    <div className="inventory">
      <h2>Inventory 🎒</h2>

      {isLoading && <p>Loading inventory...</p>}
      {error && <p className="error">Error loading inventory: {error.message}</p>}

      <div className="stoken-balance">
        <h3>💰 STOKEN Balance</h3>
        <p className="balance-amount">
          {stokenBalance ? parseFloat(formatEther(stokenBalance)).toFixed(2) : '0.00'}
        </p>
        {stokenBalance === 0n && !isLoading && (
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5rem' }}>
            Register to receive 100 STOKEN starter tokens!
          </p>
        )}
      </div>

      {renderItemCategory('Seeds 🌱', [1, 2, 3, 4, 5])}
      {renderItemCategory('Crops 🌾', [10, 11, 12, 13, 14])}
      {renderItemCategory('Animals 🐄', [20, 21, 22])}
      {renderItemCategory('Products 🥛', [30, 31, 32, 33, 34, 35])}
    </div>
  );
}
