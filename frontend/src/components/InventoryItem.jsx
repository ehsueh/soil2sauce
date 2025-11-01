import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses';
import ItemsERC1155ABI from '../contracts/ItemsERC1155.json';

export function InventoryItem({ itemId }) {
  const { address } = useAccount();
  const metadata = ITEM_METADATA[itemId];

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.ItemsERC1155,
    abi: ItemsERC1155ABI,
    functionName: 'balanceOf',
    args: [address, BigInt(itemId)],
    query: {
      enabled: !!address,
    }
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
