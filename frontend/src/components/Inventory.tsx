import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, CropType, CROP_EMOJIS, ProductType, PRODUCT_EMOJIS } from '../wagmi';
import FarmLandABI from '../contracts/FarmLand.json';
import AnimalFarmABI from '../contracts/AnimalFarm.json';
import { useRefresh } from '../RefreshContext';
import { useEffect } from 'react';

const Inventory = () => {
  const { address } = useAccount();
  const { refreshTrigger } = useRefresh();

  // Read seed inventory
  const { data: wheatSeeds = 0n, refetch: refetchWheatSeeds } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getSeedInventory',
    args: [address, CropType.WHEAT],
  });

  const { data: tomatoSeeds = 0n, refetch: refetchTomatoSeeds } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getSeedInventory',
    args: [address, CropType.TOMATO],
  });

  const { data: strawberrySeeds = 0n, refetch: refetchStrawberrySeeds } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getSeedInventory',
    args: [address, CropType.STRAWBERRY],
  });

  const { data: carrotSeeds = 0n, refetch: refetchCarrotSeeds } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getSeedInventory',
    args: [address, CropType.CARROT],
  });

  // Read harvested crops
  const { data: wheatCrops = 0n, refetch: refetchWheatCrops } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getHarvestedCrops',
    args: [address, CropType.WHEAT],
  });

  const { data: tomatoCrops = 0n, refetch: refetchTomatoCrops } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getHarvestedCrops',
    args: [address, CropType.TOMATO],
  });

  const { data: strawberryCrops = 0n, refetch: refetchStrawberryCrops } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getHarvestedCrops',
    args: [address, CropType.STRAWBERRY],
  });

  const { data: carrotCrops = 0n, refetch: refetchCarrotCrops } = useReadContract({
    address: CONTRACT_ADDRESSES.farmLand,
    abi: FarmLandABI.abi,
    functionName: 'getHarvestedCrops',
    args: [address, CropType.CARROT],
  });

  // Read animal products
  const { data: milk = 0n, refetch: refetchMilk } = useReadContract({
    address: CONTRACT_ADDRESSES.animalFarm,
    abi: AnimalFarmABI.abi,
    functionName: 'getAnimalProducts',
    args: [address, ProductType.MILK],
  });

  const { data: eggs = 0n, refetch: refetchEggs } = useReadContract({
    address: CONTRACT_ADDRESSES.animalFarm,
    abi: AnimalFarmABI.abi,
    functionName: 'getAnimalProducts',
    args: [address, ProductType.EGG],
  });

  // Refetch all when global refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchWheatSeeds();
      refetchTomatoSeeds();
      refetchStrawberrySeeds();
      refetchCarrotSeeds();
      refetchWheatCrops();
      refetchTomatoCrops();
      refetchStrawberryCrops();
      refetchCarrotCrops();
      refetchMilk();
      refetchEggs();
    }
  }, [refreshTrigger, refetchWheatSeeds, refetchTomatoSeeds, refetchStrawberrySeeds, refetchCarrotSeeds, refetchWheatCrops, refetchTomatoCrops, refetchStrawberryCrops, refetchCarrotCrops, refetchMilk, refetchEggs]);

  return (
    <div>
      <h1>📦 Inventory</h1>

      <div className="inventory-section">
        <h2>🌾 Seeds</h2>
        <div className="inventory-grid">
          <div className="inventory-item">
            <span className="item-icon">{CROP_EMOJIS[CropType.WHEAT]}</span>
            <span className="item-name">Wheat Seeds</span>
            <span className="item-count">{(wheatSeeds as bigint).toString()}</span>
          </div>
          <div className="inventory-item">
            <span className="item-icon">{CROP_EMOJIS[CropType.TOMATO]}</span>
            <span className="item-name">Tomato Seeds</span>
            <span className="item-count">{(tomatoSeeds as bigint).toString()}</span>
          </div>
          <div className="inventory-item">
            <span className="item-icon">{CROP_EMOJIS[CropType.STRAWBERRY]}</span>
            <span className="item-name">Strawberry Seeds</span>
            <span className="item-count">{(strawberrySeeds as bigint).toString()}</span>
          </div>
          <div className="inventory-item">
            <span className="item-icon">{CROP_EMOJIS[CropType.CARROT]}</span>
            <span className="item-name">Carrot Seeds</span>
            <span className="item-count">{(carrotSeeds as bigint).toString()}</span>
          </div>
        </div>
      </div>

      <div className="inventory-section">
        <h2>🌱 Harvested Crops</h2>
        <div className="inventory-grid">
          <div className="inventory-item">
            <span className="item-icon">{CROP_EMOJIS[CropType.WHEAT]}</span>
            <span className="item-name">Wheat</span>
            <span className="item-count">{(wheatCrops as bigint).toString()}</span>
          </div>
          <div className="inventory-item">
            <span className="item-icon">{CROP_EMOJIS[CropType.TOMATO]}</span>
            <span className="item-name">Tomatoes</span>
            <span className="item-count">{(tomatoCrops as bigint).toString()}</span>
          </div>
          <div className="inventory-item">
            <span className="item-icon">{CROP_EMOJIS[CropType.STRAWBERRY]}</span>
            <span className="item-name">Strawberries</span>
            <span className="item-count">{(strawberryCrops as bigint).toString()}</span>
          </div>
          <div className="inventory-item">
            <span className="item-icon">{CROP_EMOJIS[CropType.CARROT]}</span>
            <span className="item-name">Carrots</span>
            <span className="item-count">{(carrotCrops as bigint).toString()}</span>
          </div>
        </div>
      </div>

      <div className="inventory-section">
        <h2>🥛 Animal Products</h2>
        <div className="inventory-grid">
          <div className="inventory-item">
            <span className="item-icon">{PRODUCT_EMOJIS[ProductType.MILK]}</span>
            <span className="item-name">Milk</span>
            <span className="item-count">{(milk as bigint).toString()}</span>
          </div>
          <div className="inventory-item">
            <span className="item-icon">{PRODUCT_EMOJIS[ProductType.EGG]}</span>
            <span className="item-name">Eggs</span>
            <span className="item-count">{(eggs as bigint).toString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
