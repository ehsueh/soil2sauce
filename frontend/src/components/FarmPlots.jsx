import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses';
import PlantSystemABI from '../contracts/PlantSystem.json';
import { SeedOption } from './SeedOption';

export function FarmPlots() {
  const { address } = useAccount();
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const { writeContract } = useWriteContract();

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get plot capacity
  const { data: plotCapacity } = useReadContract({
    address: CONTRACT_ADDRESSES.PlantSystem,
    abi: PlantSystemABI,
    functionName: 'plotCapacity',
    args: [address],
    query: {
      enabled: !!address,
    }
  });

  // Get seed balances
  const getSeedBalance = (seedId) => {
    const { data } = useReadContract({
      address: CONTRACT_ADDRESSES.ItemsERC1155,
      abi: ItemsERC1155ABI,
      functionName: 'balanceOf',
      args: [address, BigInt(seedId)],
      query: {
        enabled: !!address,
      }
    });
    return data || 0n;
  };

  // Get plot info
  const getPlotInfo = (plotId) => {
    const { data } = useReadContract({
      address: CONTRACT_ADDRESSES.PlantSystem,
      abi: PlantSystemABI,
      functionName: 'getPlot',
      args: [address, plotId],
      query: {
        enabled: !!address,
      }
    });
    return data;
  };

  const handlePlant = async (plotId, seedId) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.PlantSystem,
        abi: PlantSystemABI,
        functionName: 'plant',
        args: [plotId, BigInt(seedId)],
      });
      setSelectedPlot(null);
      setSelectedSeed(null);
    } catch (error) {
      console.error('Planting failed:', error);
    }
  };

  const handleHarvest = async (plotId) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.PlantSystem,
        abi: PlantSystemABI,
        functionName: 'harvest',
        args: [plotId],
      });
    } catch (error) {
      console.error('Harvesting failed:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const renderPlot = (plotIndex) => {
    const plotId = `plot-${plotIndex}`;
    const plotInfo = getPlotInfo(plotId);

    if (!plotInfo) {
      return (
        <div key={plotIndex} className="farm-plot empty">
          <div className="plot-content">Loading...</div>
        </div>
      );
    }

    const [seedId, plantedTime, mature] = plotInfo;

    // Plot is empty
    if (seedId === 0n) {
      return (
        <div
          key={plotIndex}
          className="farm-plot empty"
          onClick={() => setSelectedPlot(plotId)}
        >
          <div className="plot-content">
            <span className="plot-icon">🌱</span>
            <p>Empty Plot</p>
            <button className="plot-btn">Plant Seed</button>
          </div>
        </div>
      );
    }

    // Plot has a crop
    const seedMetadata = ITEM_METADATA[Number(seedId)];
    const cropId = Number(seedId) + 9; // Crop ID is seed ID + 9
    const cropMetadata = ITEM_METADATA[cropId];
    const plantedTimestamp = Number(plantedTime);
    const harvestTime = plantedTimestamp + seedMetadata.growthTime;
    const timeRemaining = Math.max(0, harvestTime - currentTime);
    const isReady = timeRemaining === 0;

    return (
      <div key={plotIndex} className={`farm-plot ${isReady ? 'ready' : 'growing'}`}>
        <div className="plot-content">
          <span className="plot-icon">{cropMetadata.emoji}</span>
          <p className="crop-name">{cropMetadata.name}</p>
          {isReady ? (
            <>
              <p className="status ready">Ready to Harvest!</p>
              <button onClick={() => handleHarvest(plotId)} className="harvest-btn">
                Harvest
              </button>
            </>
          ) : (
            <>
              <p className="status growing">Growing...</p>
              <p className="time-remaining">{formatTime(timeRemaining)}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  if (!address) {
    return <div className="farm-plots">Connect wallet to view farm</div>;
  }

  const capacity = Number(plotCapacity || 0);
  const plots = Array.from({ length: capacity }, (_, i) => i);

  return (
    <div className="farm-plots">
      <h2>Farm 🌾</h2>

      <div className="plots-grid">
        {plots.map(i => renderPlot(i))}
      </div>

      {selectedPlot && (
        <div className="seed-selector-modal" onClick={() => setSelectedPlot(null)}>
          <div className="seed-selector-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Seed to Plant</h3>
            <div className="seed-list">
              {[1, 2, 3, 4, 5].map(seedId => (
                <SeedOption
                  key={seedId}
                  seedId={seedId}
                  onPlant={(id) => handlePlant(selectedPlot, id)}
                />
              ))}
            </div>
            <button onClick={() => setSelectedPlot(null)} className="close-btn">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
