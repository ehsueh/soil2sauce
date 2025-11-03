import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import STOKENABI from '../contracts/STOKEN.json';
import { formatEther } from 'viem';
import { InventoryItem } from './InventoryItem';
import { useEventContext } from '../contexts/EventProvider';

export function Inventory() {
  const { address } = useAccount();
  const { getLastEvent } = useEventContext();

  // Read STOKEN balance using React Query
  // Note: EventProvider automatically invalidates 'currencies' query
  // when Harvested or ItemPurchased events are emitted
  const { data: stokenBalance } = useQuery({
    queryKey: ['currencies', 'stoken', address],
    queryFn: async () => {
      if (!address) return 0n;
      return await readContract(config, {
        address: CONTRACT_ADDRESSES.STOKEN,
        abi: STOKENABI,
        functionName: 'balanceOf',
        args: [address],
      });
    },
    enabled: !!address,
  });

  const renderItemCategory = (title, itemIds) => {
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

      <div className="stoken-balance">
        <h3>💰 STOKEN Balance</h3>
        <p className="balance-amount">
          {stokenBalance ? parseFloat(formatEther(stokenBalance)).toFixed(2) : '0.00'}
        </p>
      </div>

      {renderItemCategory('Seeds 🌱', [1, 2, 3, 4, 5])}
      {renderItemCategory('Crops 🌾', [10, 11, 12, 13, 14])}
      {renderItemCategory('Animals 🐄', [20, 21, 22])}
      {renderItemCategory('Products 🥛', [30, 31, 32, 33, 34, 35])}
    </div>
  );
}
