import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, CropType, CROP_EMOJIS, getCropTypeName } from '../wagmi.ts';
import FarmLandABI from '../contracts/FarmLand.json';
import { useRefresh } from '../RefreshContext';

const FarmGrid = () => {
  const { address } = useAccount();
  const [selectedSeed, setSelectedSeed] = useState<CropType>(CropType.WHEAT);
  const { writeContract, data: hash } = useWriteContract();
  const { triggerRefresh } = useRefresh();
  const [plotRefreshTrigger, setPlotRefreshTrigger] = useState(0);

  // Read player's plots
  const { data: plotIds = [], refetch: refetchPlots } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI,
    functionName: 'getPlayerPlots',
    args: [address],
  });

  // Read seed inventory for selected seed type
  const { data: seedCount = 0n, refetch: refetchSeedCount } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI,
    functionName: 'getSeedInventory',
    args: [address, selectedSeed],
  });

  // Wait for transaction confirmation
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Refetch seed count when selected seed changes
  useEffect(() => {
    refetchSeedCount();
  }, [selectedSeed, refetchSeedCount]);

  // Refetch plots when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      console.log('✅ Transaction confirmed! Refetching plots...');
      refetchPlots();
      refetchSeedCount();
      setPlotRefreshTrigger(prev => prev + 1);
      triggerRefresh(); // Trigger global refresh for inventory
      // Force a small delay to ensure blockchain state is updated
      setTimeout(() => {
        refetchPlots();
        refetchSeedCount();
        setPlotRefreshTrigger(prev => prev + 1);
        triggerRefresh();
      }, 500);
    }
  }, [isConfirmed, triggerRefresh, refetchSeedCount]);

  const handlePlantSeed = (plotId: bigint) => {
    try {
      console.log('🌱 Planting seed...', { plotId: plotId.toString(), selectedSeed });

      writeContract({
        address: CONTRACT_ADDRESSES.farmLand,
        abi: FarmLandABI,
        functionName: 'plantSeed',
        args: [plotId, selectedSeed],
      });
    } catch (error) {
      console.error('❌ Error planting seed:', error);
      alert(`Error planting seed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleHarvest = (plotId: bigint) => {
    try {
      console.log('🌾 Harvesting crop...', { plotId: plotId.toString() });

      writeContract({
        address: CONTRACT_ADDRESSES.farmLand,
        abi: FarmLandABI,
        functionName: 'harvestCrop',
        args: [plotId],
      });
    } catch (error) {
      console.error('❌ Error harvesting:', error);
      alert(`Error harvesting: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleExpandFarm = () => {
    try {
      console.log('🏗️ Expanding farm...');

      writeContract({
        address: CONTRACT_ADDRESSES.farmLand,
        abi: FarmLandABI,
        functionName: 'expandFarm',
        args: [],
      });
    } catch (error) {
      console.error('❌ Error expanding farm:', error);
      alert(`Error expanding farm: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleInitializeFarm = () => {
    try {
      console.log('🌾 Initializing farm...');

      writeContract({
        address: CONTRACT_ADDRESSES.farmLand,
        abi: FarmLandABI,
        functionName: 'initializePlayer',
        args: [address],
      });
    } catch (error) {
      console.error('❌ Error initializing farm:', error);
      alert(`Error initializing farm: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // If player has no plots, show initialization button
  if ((plotIds as bigint[]).length === 0) {
    return (
      <div>
        <h1>🌱 Your Farm</h1>
        <div className="connect-prompt">
          <h2>Welcome to your new farm!</h2>
          <p>Click below to start your farming journey with 9 plots and 5 wheat seeds</p>
          <button className="expand-button" onClick={handleInitializeFarm}>
            🌾 Start Farming
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>🌱 Your Farm</h1>

      <div className="seed-selector">
        <h3>Select Seed to Plant:</h3>
        <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#f0f8f0', borderRadius: '8px' }}>
          <strong style={{ color: '#1a1a1a' }}>Available: {(seedCount as bigint).toString()} {CROP_EMOJIS[selectedSeed]} {getCropTypeName(selectedSeed)} Seeds</strong>
          {(seedCount as bigint) === 0n && (
            <div style={{ color: '#dc3545', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              ⚠️ No seeds! Go to "🧪 Make Seed" to convert crops into seeds
            </div>
          )}
        </div>
        <div className="seed-buttons">
          {Object.entries(CROP_EMOJIS).map(([type, emoji]) => (
            <button
              key={type}
              className={`seed-button ${
                selectedSeed === parseInt(type) ? 'selected' : ''
              }`}
              onClick={() => setSelectedSeed(parseInt(type) as CropType)}
            >
              {emoji} {getCropTypeName(parseInt(type))}
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
            refreshTrigger={plotRefreshTrigger}
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
  refreshTrigger: number;
}

const PlotCell = ({ plotId, onPlant, onHarvest, refreshTrigger }: PlotCellProps) => {
  const [countdown, setCountdown] = useState<number>(0);
  const { data: plotStatus, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI,
    functionName: 'getPlotStatus',
    args: [plotId],
  });

  // Parse plot status data (null-safe)
  const status = plotStatus ? (plotStatus as [number, number, boolean, bigint])[0] : 0;
  const cropType = plotStatus ? (plotStatus as [number, number, boolean, bigint])[1] : 0;
  const isReady = plotStatus ? (plotStatus as [number, number, boolean, bigint])[2] : false;
  const remainingTime = plotStatus ? (plotStatus as [number, number, boolean, bigint])[3] : 0n;

  // Refetch when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Update countdown when plot status changes
  useEffect(() => {
    if (plotStatus && status === 1 && !isReady) {
      setCountdown(Number(remainingTime));
    }
  }, [plotStatus, status, isReady, remainingTime]);

  // Frontend countdown timer
  useEffect(() => {
    if (plotStatus && status === 1 && !isReady && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            refetch(); // Refetch when countdown reaches 0 to check if ready
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [plotStatus, status, isReady, countdown, refetch]);

  // Early return after all hooks
  if (!plotStatus) return <div className="plot empty">...</div>;

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
      {status === 1 && !isReady && countdown > 0 && (
        <div className="timer">{countdown}s</div>
      )}
    </div>
  );
};

export default FarmGrid;
