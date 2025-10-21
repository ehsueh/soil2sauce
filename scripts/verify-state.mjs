import { createPublicClient, http, formatEther } from 'viem';
import { hardhat } from 'viem/chains';
import { readFileSync } from 'fs';

// Load contract ABIs
const gameTokenABI = JSON.parse(readFileSync('./frontend/src/contracts/GameToken.json', 'utf8')).abi;
const farmLandABI = JSON.parse(readFileSync('./frontend/src/contracts/FarmLand.json', 'utf8')).abi;
const animalFarmABI = JSON.parse(readFileSync('./frontend/src/contracts/AnimalFarm.json', 'utf8')).abi;

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

const playerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const gameTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const farmLandAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const animalFarmAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

console.log('🔍 Verifying Blockchain State\n');
console.log('=' .repeat(60));

// 1. Check GCOIN balance
console.log('\n💰 GameToken (GCOIN)');
console.log('-'.repeat(60));
const balance = await publicClient.readContract({
  address: gameTokenAddress,
  abi: gameTokenABI,
  functionName: 'balanceOf',
  args: [playerAddress],
});
console.log(`Player Balance: ${formatEther(balance)} GCOIN`);

// 2. Check farm plots
console.log('\n🌱 FarmLand');
console.log('-'.repeat(60));
const plots = await publicClient.readContract({
  address: farmLandAddress,
  abi: farmLandABI,
  functionName: 'getPlayerPlots',
  args: [playerAddress],
});
console.log(`Total Plots: ${plots.length}`);

// Check seed inventory
const wheatSeeds = await publicClient.readContract({
  address: farmLandAddress,
  abi: farmLandABI,
  functionName: 'getSeedInventory',
  args: [playerAddress, 0], // WHEAT = 0
});
console.log(`Wheat Seeds: ${wheatSeeds.toString()}`);

// Check harvested crops
const wheatCrops = await publicClient.readContract({
  address: farmLandAddress,
  abi: farmLandABI,
  functionName: 'getHarvestedCrops',
  args: [playerAddress, 0], // WHEAT = 0
});
console.log(`Harvested Wheat: ${wheatCrops.toString()}`);

// 3. Check plot statuses
console.log('\n📊 Plot Status Details:');
console.log('-'.repeat(60));
for (let i = 0; i < Math.min(plots.length, 5); i++) {
  const plotId = plots[i];
  const status = await publicClient.readContract({
    address: farmLandAddress,
    abi: farmLandABI,
    functionName: 'getPlotStatus',
    args: [plotId],
  });
  const statusNames = ['EMPTY', 'GROWING', 'READY'];
  const cropNames = ['WHEAT', 'TOMATO', 'STRAWBERRY', 'CARROT'];
  console.log(`Plot ${i}: ${statusNames[status[0]]} | Crop: ${cropNames[status[1]]} | Ready: ${status[2]} | Time left: ${status[3]}s`);
}
if (plots.length > 5) {
  console.log(`... and ${plots.length - 5} more plots`);
}

// 4. Check animals
console.log('\n🐄 AnimalFarm');
console.log('-'.repeat(60));
const animals = await publicClient.readContract({
  address: animalFarmAddress,
  abi: animalFarmABI,
  functionName: 'getPlayerAnimals',
  args: [playerAddress],
});
console.log(`Total Animals: ${animals.length}`);

const milk = await publicClient.readContract({
  address: animalFarmAddress,
  abi: animalFarmABI,
  functionName: 'getAnimalProducts',
  args: [playerAddress, 0], // MILK = 0
});
console.log(`Milk Products: ${milk.toString()}`);

const eggs = await publicClient.readContract({
  address: animalFarmAddress,
  abi: animalFarmABI,
  functionName: 'getAnimalProducts',
  args: [playerAddress, 1], // EGG = 1
});
console.log(`Egg Products: ${eggs.toString()}`);

// 5. Check blockchain info
console.log('\n⛓️  Blockchain Info');
console.log('-'.repeat(60));
const blockNumber = await publicClient.getBlockNumber();
console.log(`Current Block: #${blockNumber}`);
const chainId = await publicClient.getChainId();
console.log(`Chain ID: ${chainId}`);

console.log('\n' + '='.repeat(60));
console.log('✅ Verification Complete!\n');
