import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses';
import ItemsERC1155ABI from '../contracts/ItemsERC1155.json';
import STOKENABI from '../contracts/STOKEN.json';
import { formatEther } from 'viem';

export function Inventory() {
  const { address } = useAccount();

  // Read STOKEN balance
  const { data: stokenBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.STOKEN,
    abi: STOKENABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    }
  });

  // Get balances for all items
  const getItemBalance = (itemId) => {
    const { data: balance } = useReadContract({
      address: CONTRACT_ADDRESSES.ItemsERC1155,
      abi: ItemsERC1155ABI,
      functionName: 'balanceOf',
      args: [address, BigInt(itemId)],
      query: {
        enabled: !!address,
      }
    });
    return balance || 0n;
  };

  const renderItemCategory = (title, itemIds) => {
    return (
      <div className="inventory-category">
        <h3>{title}</h3>
        <div className="inventory-items">
          {itemIds.map(id => {
            const metadata = ITEM_METADATA[id];
            const { data: balance } = useReadContract({
              address: CONTRACT_ADDRESSES.ItemsERC1155,
              abi: ItemsERC1155ABI,
              functionName: 'balanceOf',
              args: [address, BigInt(id)],
              query: {
                enabled: !!address,
              }
            });

            if (!balance || balance === 0n) return null;

            return (
              <div key={id} className="inventory-item">
                <span className="item-emoji">{metadata.emoji}</span>
                <span className="item-name">{metadata.name}</span>
                <span className="item-count">{balance.toString()}</span>
              </div>
            );
          })}
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
