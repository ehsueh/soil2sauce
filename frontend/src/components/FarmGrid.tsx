import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, CropType, CROP_EMOJIS } from '../wagmi';
import FarmLandABI from '../contracts/FarmLand.json';

const FarmGrid = () => {
  const { address } = useAccount();
  const [selectedSeed, setSelectedSeed] = useState<CropType>(CropType.WHEAT);
  const { writeContract } = useWriteContract();

  // Read player's plots
  const { data: plotIds = [], refetch: refetchPlots } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getPlayerPlots',
    args: [address],
  });

  const handlePlantSeed = async (plotId: bigint) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.farmLand,
        abi: FarmLandABI.abi,
        functionName: 'plantSeed',
        args: [plotId, selectedSeed],
      });
      setTimeout(() => refetchPlots(), 2000);
    } catch (error) {
      console.error('Error planting seed:', error);
    }
  };

  const handleHarvest = async (plotId: bigint) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.farmLand,
        abi: FarmLandABI.abi,
        functionName: 'harvestCrop',
        args: [plotId],
      });
      setTimeout(() => refetchPlots(), 2000);
    } catch (error) {
      console.error('Error harvesting:', error);
    }
  };

  const handleExpandFarm = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.farmLand,
        abi: FarmLandABI.abi,
        functionName: 'expandFarm',
      });
      setTimeout(() => refetchPlots(), 2000);
    } catch (error) {
      console.error('Error expanding farm:', error);
    }
  };

  return (
    <div>
      <h1>🌱 Your Farm</h1>

      <div className="seed-selector">
        <h3>Select Seed to Plant:</h3>
        <div className="seed-buttons">
          {Object.entries(CROP_EMOJIS).map(([type, emoji]) => (
            <button
              key={type}
              className={`seed-button ${
                selectedSeed === parseInt(type) ? 'selected' : ''
              }`}
              onClick={() => setSelectedSeed(parseInt(type) as CropType)}
            >
              {emoji} {CropType[parseInt(type)]}
            </button>
          ))}
        </div>
      </div>

      <div className="farm-grid">
        {(plotIds as bigint[]).map((plotId) => (
          <PlotCell
            key={plotId.toString()}
            plotId={plotId}
            onPlant={handlePlantSeed}
            onHarvest={handleHarvest}
          />
        ))}
      </div>

      <div className="farm-controls">
        <button className="expand-button" onClick={handleExpandFarm}>
          🏗️ Expand Farm (50 GCOIN)
        </button>
      </div>
    </div>
  );
};

interface PlotCellProps {
  plotId: bigint;
  onPlant: (plotId: bigint) => void;
  onHarvest: (plotId: bigint) => void;
}

const PlotCell = ({ plotId, onPlant, onHarvest }: PlotCellProps) => {
  const { data: plotStatus } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getPlotStatus',
    args: [plotId],
  });

  if (!plotStatus) return <div className="plot empty">...</div>;

  const [status, cropType, isReady, remainingTime] = plotStatus as [
    number,
    number,
    boolean,
    bigint
  ];

  const handleClick = () => {
    if (status === 0) {
      // EMPTY
      onPlant(plotId);
    } else if (status === 1 && isReady) {
      // GROWING and ready
      onHarvest(plotId);
    }
  };

  const getPlotClass = () => {
    if (status === 0) return 'empty';
    if (status === 1) return isReady ? 'ready' : 'growing';
    return 'empty';
  };

  const getPlotContent = () => {
    if (status === 0) return '🟫';
    if (status === 1) {
      const emoji = CROP_EMOJIS[cropType as CropType];
      return isReady ? `${emoji}✨` : emoji;
    }
    return '🟫';
  };

  return (
    <div className={`plot ${getPlotClass()}`} onClick={handleClick}>
      <span>{getPlotContent()}</span>
      {status === 1 && !isReady && (
        <div className="timer">{remainingTime.toString()}s</div>
      )}
    </div>
  );
};

export default FarmGrid;
