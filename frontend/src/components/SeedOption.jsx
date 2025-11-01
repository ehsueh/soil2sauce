import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses';
import ItemsERC1155ABI from '../contracts/ItemsERC1155.json';

export function SeedOption({ seedId, onPlant }) {
  const { address } = useAccount();
  const metadata = ITEM_METADATA[seedId];

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.ItemsERC1155,
    abi: ItemsERC1155ABI,
    functionName: 'balanceOf',
    args: [address, BigInt(seedId)],
    query: {
      enabled: !!address,
    }
  });

  const hasSeeds = balance && balance > 0n;

  return (
    <button
      className={`seed-option ${!hasSeeds ? 'disabled' : ''}`}
      onClick={() => hasSeeds && onPlant(seedId)}
      disabled={!hasSeeds}
    >
      <span className="seed-emoji">{metadata.emoji}</span>
      <span className="seed-name">{metadata.name}</span>
      <span className="seed-balance">
        ({balance?.toString() || 0})
      </span>
    </button>
  );
}
