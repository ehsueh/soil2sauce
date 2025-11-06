import { useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, CropType, CROP_EMOJIS, getCropTypeName } from '../wagmi.ts';
import FarmLandABI from '../contracts/FarmLand.json';
import { useRefresh } from '../RefreshContext';

const SeedMarket = () => {
  const { writeContract, data: hash } = useWriteContract();
  const { triggerRefresh } = useRefresh();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      triggerRefresh();
      setTimeout(() => triggerRefresh(), 500);
    }
  }, [isConfirmed, triggerRefresh]);

  const SEED_PRICES = {
    [CropType.WHEAT]: '5',
    [CropType.TOMATO]: '8',
    [CropType.STRAWBERRY]: '10',
    [CropType.CARROT]: '6',
  };

  const handleBuy = async (cropType: CropType, quantity: number) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.farmLand,
        abi: FarmLandABI,
        functionName: 'buySeeds',
        args: [cropType, BigInt(quantity)],
      });
    } catch (error) {
      console.error('Error buying seeds:', error);
    }
  };

  return (
    <div>
      <h1>🛒 Seed Market</h1>
      <div className="market-grid">
        {Object.entries(CROP_EMOJIS).map(([type, emoji]) => {
          const cropType = parseInt(type) as CropType;
          return (
            <div key={type} className="market-item">
              <h3>
                {emoji} {getCropTypeName(cropType)}
              </h3>
              <div className="price">{SEED_PRICES[cropType]} GCOIN</div>
              <div className="purchase-controls">
                <input type="number" defaultValue="1" className="quantity-input" id={`qty-${type}`} />
                <button className="buy-button" onClick={() => {
                  const qty = (document.getElementById(`qty-${type}`) as HTMLInputElement).value;
                  handleBuy(cropType, parseInt(qty));
                }}>
                  Buy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeedMarket;
