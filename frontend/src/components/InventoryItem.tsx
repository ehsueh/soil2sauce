import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi.ts';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses.ts';
import ItemsERC1155ABI from '../contracts/ItemsERC1155.json';

interface InventoryItemProps {
  itemId: number;
}

export function InventoryItem({ itemId }: InventoryItemProps) {
  const { address } = useAccount();
  const metadata = ITEM_METADATA[itemId];

  // Note: EventProvider automatically invalidates 'inventory' query
  // when Planted, Harvested, or ItemPurchased events are emitted
  const { data: balance } = useQuery({
    queryKey: ['inventory', address, itemId],
    queryFn: async () => {
      if (!address) return 0n;
      return await readContract(config, {
        address: CONTRACT_ADDRESSES.ItemsERC1155,
        abi: ItemsERC1155ABI,
        functionName: 'balanceOf',
        args: [address, BigInt(itemId)],
      });
    },
    enabled: !!address,
  });

  if (!balance || balance === 0n) return null;

  return (
    <div className="inventory-item">
      <span className="item-emoji">{metadata.emoji}</span>
      <span className="item-name">{metadata.name}</span>
      <span className="item-count">{balance.toString()}</span>
    </div>
  );
}
