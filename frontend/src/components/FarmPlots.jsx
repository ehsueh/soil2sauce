import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import PlantSystemABI from '../contracts/PlantSystem.json';
import { SeedOption } from './SeedOption';
import { PlotItem } from './PlotItem';

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

  if (!address) {
    return <div className="farm-plots">Connect wallet to view farm</div>;
  }

  const capacity = Number(plotCapacity || 0);
  const plots = Array.from({ length: capacity }, (_, i) => i);

  return (
    <div className="farm-plots">
      <h2>Farm 🌾</h2>

      <div className="plots-grid">
        {plots.map(i => (
          <PlotItem
            key={i}
            plotIndex={i}
            onPlantClick={setSelectedPlot}
            onHarvestClick={handleHarvest}
            currentTime={currentTime}
          />
        ))}
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
