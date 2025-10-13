import { useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, CropType, CROP_EMOJIS } from '../wagmi';
import FarmLandABI from '../contracts/FarmLand.json';

const SeedMarket = () => {
  const { writeContract } = useWriteContract();

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
        abi: FarmLandABI.abi,
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
                {emoji} {CropType[cropType]}
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
