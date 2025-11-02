import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi';
import { CONTRACT_ADDRESSES, ITEM_METADATA } from '../contracts/addresses';
import PlantSystemABI from '../contracts/PlantSystem.json';

export function PlotItem({ plotIndex, onPlantClick, onHarvestClick, currentTime }) {
  const { address } = useAccount();
  const plotId = `plot-${plotIndex}`;

  // Note: EventProvider automatically invalidates 'plots' query
  // when Planted/Harvested events are emitted
  const { data: plotInfo } = useQuery({
    queryKey: ['plots', address, plotId],
    queryFn: async () => {
      if (!address) return null;
      return await readContract(config, {
        address: CONTRACT_ADDRESSES.PlantSystem,
        abi: PlantSystemABI,
        functionName: 'getPlot',
        args: [address, plotId],
      });
    },
    enabled: !!address,
  });

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (!plotInfo) {
    return (
      <div className="farm-plot empty">
        <div className="plot-content">Loading...</div>
      </div>
    );
  }

  // Convert to array if it's an object with numeric keys
  const plotArray = Array.isArray(plotInfo) ? plotInfo : Object.values(plotInfo);
  const [seedId, plantedTime, mature] = plotArray;

  // Plot is empty
  if (seedId === 0n) {
    return (
      <div
        className="farm-plot empty"
        onClick={() => onPlantClick(plotId)}
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
    <div className={`farm-plot ${isReady ? 'ready' : 'growing'}`}>
      <div className="plot-content">
        <span className="plot-icon">{cropMetadata.emoji}</span>
        <p className="crop-name">{cropMetadata.name}</p>
        {isReady ? (
          <>
            <p className="status ready">Ready to Harvest!</p>
            <button onClick={() => onHarvestClick(plotId)} className="harvest-btn">
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
}
