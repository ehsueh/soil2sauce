import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi.ts';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses.ts';
import ItemsERC1155ABI from '../contracts/ItemsERC1155.json';

interface SeedOptionProps {
  seedId: number;
  onPlant: (seedId: number) => void;
}

export function SeedOption({ seedId, onPlant }: SeedOptionProps) {
  const { address } = useAccount();
  const metadata = ITEM_METADATA[seedId];

  // Note: EventProvider automatically invalidates 'inventory' query
  // when ItemPurchased events are emitted
  const { data: balance } = useQuery({
    queryKey: ['inventory', address, seedId],
    queryFn: async () => {
      if (!address) return 0n;
      return await readContract(config, {
        address: CONTRACT_ADDRESSES.ItemsERC1155,
        abi: ItemsERC1155ABI,
        functionName: 'balanceOf',
        args: [address, BigInt(seedId)],
      });
    },
    enabled: !!address,
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
