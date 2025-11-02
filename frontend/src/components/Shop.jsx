import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses';
import ShopSystemABI from '../contracts/ShopSystem.json';
import STOKENABI from '../contracts/STOKEN.json';
import { useEventContext } from '../contexts/EventProvider';

const SHOP_ITEMS = [
  { id: 1, price: '10' },   // Wheat Seed
  { id: 2, price: '15' },   // Tomato Seed
  { id: 3, price: '20' },   // Corn Seed
  { id: 4, price: '8' },    // Lettuce Seed
  { id: 5, price: '12' },   // Carrot Seed
  { id: 20, price: '500' }, // Cow
  { id: 21, price: '200' }, // Chicken
  { id: 22, price: '800' }, // Pig
];

export function Shop() {
  const { address } = useAccount();
  const [quantities, setQuantities] = useState({});
  const { writeContract } = useWriteContract();
  const { getLastEvent } = useEventContext();

  // Get STOKEN balance using React Query
  // Note: EventProvider automatically invalidates 'currencies' query
  // when ItemPurchased events are emitted
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

  const handleBuy = async (itemId, price) => {
    const quantity = quantities[itemId] || 1;
    const totalCost = parseEther((parseFloat(price) * quantity).toString());

    try {
      // First approve STOKEN
      await writeContract({
        address: CONTRACT_ADDRESSES.STOKEN,
        abi: STOKENABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.ShopSystem, totalCost],
      });

      // Wait a bit for approval
      setTimeout(async () => {
        // Then buy the item
        await writeContract({
          address: CONTRACT_ADDRESSES.ShopSystem,
          abi: ShopSystemABI,
          functionName: 'buyItem',
          args: [BigInt(itemId), BigInt(quantity)],
        });
      }, 2000);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  if (!address) {
    return <div className="shop">Connect wallet to access shop</div>;
  }

  return (
    <div className="shop">
      <h2>Shop 🛒</h2>

      <div className="balance-display">
        <span>Your Balance:</span>
        <strong>
          {stokenBalance ? parseFloat(formatEther(stokenBalance)).toFixed(2) : '0.00'} STOKEN
        </strong>
      </div>

      <div className="shop-categories">
        <div className="shop-category">
          <h3>Seeds 🌱</h3>
          <div className="shop-items">
            {SHOP_ITEMS.filter(item => item.id < 10).map(item => {
              const metadata = ITEM_METADATA[item.id];
              const quantity = quantities[item.id] || 1;
              const totalCost = parseFloat(item.price) * quantity;

              return (
                <div key={item.id} className="shop-item">
                  <div className="item-info">
                    <span className="item-emoji">{metadata.emoji}</span>
                    <span className="item-name">{metadata.name}</span>
                    <span className="item-price">{item.price} STOKEN</span>
                  </div>
                  <div className="item-actions">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantities({
                        ...quantities,
                        [item.id]: parseInt(e.target.value) || 1
                      })}
                      className="quantity-input"
                    />
                    <button
                      onClick={() => handleBuy(item.id, item.price)}
                      className="buy-btn"
                    >
                      Buy ({totalCost} STOKEN)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="shop-category">
          <h3>Animals 🐄</h3>
          <div className="shop-items">
            {SHOP_ITEMS.filter(item => item.id >= 20).map(item => {
              const metadata = ITEM_METADATA[item.id];
              const quantity = quantities[item.id] || 1;
              const totalCost = parseFloat(item.price) * quantity;

              return (
                <div key={item.id} className="shop-item">
                  <div className="item-info">
                    <span className="item-emoji">{metadata.emoji}</span>
                    <span className="item-name">{metadata.name}</span>
                    <span className="item-price">{item.price} STOKEN</span>
                  </div>
                  <div className="item-actions">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantities({
                        ...quantities,
                        [item.id]: parseInt(e.target.value) || 1
                      })}
                      className="quantity-input"
                    />
                    <button
                      onClick={() => handleBuy(item.id, item.price)}
                      className="buy-btn"
                    >
                      Buy ({totalCost} STOKEN)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
