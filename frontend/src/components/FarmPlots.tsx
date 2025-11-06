import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi.ts';
import { CONTRACT_ADDRESSES } from '../contracts/addresses.ts';
import PlantSystemABI from '../contracts/PlantSystem.json';
import { SeedOption } from './SeedOption.tsx';
import { PlotItem } from './PlotItem.tsx';

export function FarmPlots() {
  const { address } = useAccount();
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const { writeContract } = useWriteContract();

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get plot capacity using React Query
  // Note: EventProvider automatically invalidates 'plots' query
  // when Planted/Harvested events are emitted
  const { data: plotCapacity, error, isLoading } = useQuery({
    queryKey: ['plots', 'capacity', address],
    queryFn: async () => {
      if (!address) return 0n;
      try {
        return await readContract(config, {
          address: CONTRACT_ADDRESSES.PlantSystem,
          abi: PlantSystemABI,
          functionName: 'plotCapacity',
          args: [address],
        });
      } catch (err) {
        console.error('Error reading plot capacity:', err);
        return 0n;
      }
    },
    enabled: !!address,
  });

  const handlePlant = async (plotId: string, seedId: number) => {
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

  const handleHarvest = async (plotId: string) => {
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

      {isLoading && <p>Loading farm plots...</p>}
      {error && <p className="error">Error loading plots: {error.message}</p>}

      {!isLoading && !error && capacity === 0 && (
        <div className="no-plots-message" style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#f0f0f0',
          borderRadius: '8px',
          margin: '1rem 0'
        }}>
          <p>🌱 You don't have any farm plots yet!</p>
          <p>Register to receive your starter pack with 3 farm plots.</p>
        </div>
      )}

      {capacity > 0 && (
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
      )}

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
