import { useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, CropType, CROP_EMOJIS } from '../wagmi';
import FarmLandABI from '../contracts/FarmLand.json';
import { useRefresh } from '../RefreshContext';

const MakeSeed = () => {
  const { address } = useAccount();
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

  // Read harvested crops for all crop types
  const wheatCrops = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'harvestedCrops',
    args: [address, CropType.WHEAT],
  });

  const tomatoCrops = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'harvestedCrops',
    args: [address, CropType.TOMATO],
  });

  const strawberryCrops = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'harvestedCrops',
    args: [address, CropType.STRAWBERRY],
  });

  const carrotCrops = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'harvestedCrops',
    args: [address, CropType.CARROT],
  });

  const totalCrops =
    Number(wheatCrops.data || 0) +
    Number(tomatoCrops.data || 0) +
    Number(strawberryCrops.data || 0) +
    Number(carrotCrops.data || 0);

  if (totalCrops === 0) {
    return (
      <div>
        <h1>🧪 Make Seed</h1>
        <div className="connect-prompt">
          <h2>No crops available</h2>
          <p>Come back when you have harvested crops to convert into seeds!</p>
          <p className="info">Harvest crops from your farm first, then return here to convert them into seeds (1 crop = 2 seeds)</p>
        </div>
      </div>
    );
  }

  const handleMakeSeed = (cropType: CropType, quantity: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.farmLand,
      abi: FarmLandABI.abi,
      functionName: 'makeSeed',
      args: [cropType, BigInt(quantity)],
    });
  };

  return (
    <div>
      <h1>🧪 Make Seed</h1>
      <p>Convert your harvested crops into seeds (2 crops = 1 seed)</p>

      <div className="market-grid">
        {Number(wheatCrops.data || 0) > 0 && (
          <div className="market-item">
            <div className="item-icon">{CROP_EMOJIS[CropType.WHEAT]}</div>
            <div className="item-details">
              <h3>Wheat</h3>
              <p>Available: {Number(wheatCrops.data)}</p>
              <p className="price">2 crops → 1 seed</p>
            </div>
            <button
              className="buy-button"
              onClick={() => handleMakeSeed(CropType.WHEAT, 1)}
              disabled={Number(wheatCrops.data) < 2}
            >
              Convert
            </button>
          </div>
        )}

        {Number(tomatoCrops.data || 0) > 0 && (
          <div className="market-item">
            <div className="item-icon">{CROP_EMOJIS[CropType.TOMATO]}</div>
            <div className="item-details">
              <h3>Tomato</h3>
              <p>Available: {Number(tomatoCrops.data)}</p>
              <p className="price">2 crops → 1 seed</p>
            </div>
            <button
              className="buy-button"
              onClick={() => handleMakeSeed(CropType.TOMATO, 1)}
              disabled={Number(tomatoCrops.data) < 2}
            >
              Convert
            </button>
          </div>
        )}

        {Number(strawberryCrops.data || 0) > 0 && (
          <div className="market-item">
            <div className="item-icon">{CROP_EMOJIS[CropType.STRAWBERRY]}</div>
            <div className="item-details">
              <h3>Strawberry</h3>
              <p>Available: {Number(strawberryCrops.data)}</p>
              <p className="price">2 crops → 1 seed</p>
            </div>
            <button
              className="buy-button"
              onClick={() => handleMakeSeed(CropType.STRAWBERRY, 1)}
              disabled={Number(strawberryCrops.data) < 2}
            >
              Convert
            </button>
          </div>
        )}

        {Number(carrotCrops.data || 0) > 0 && (
          <div className="market-item">
            <div className="item-icon">{CROP_EMOJIS[CropType.CARROT]}</div>
            <div className="item-details">
              <h3>Carrot</h3>
              <p>Available: {Number(carrotCrops.data)}</p>
              <p className="price">2 crops → 1 seed</p>
            </div>
            <button
              className="buy-button"
              onClick={() => handleMakeSeed(CropType.CARROT, 1)}
              disabled={Number(carrotCrops.data) < 2}
            >
              Convert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakeSeed;
