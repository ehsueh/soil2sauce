import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { hardhat } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';

// Load contract ABIs
const gameTokenABI = JSON.parse(readFileSync('./frontend/src/contracts/GameToken.json', 'utf8')).abi;
const farmLandABI = JSON.parse(readFileSync('./frontend/src/contracts/FarmLand.json', 'utf8')).abi;

// Setup
const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const playerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

const walletClient = createWalletClient({
  account,
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

const gameTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const farmLandAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

console.log('🎮 Populating game data for player:', playerAddress);

// Check current balance
const currentBalance = await publicClient.readContract({
  address: gameTokenAddress,
  abi: gameTokenABI,
  functionName: 'balanceOf',
  args: [playerAddress],
});

console.log('💰 Current GCOIN balance:', formatEther(currentBalance), 'GCOIN');

if (currentBalance > 0n) {
  console.log('✅ Player already has GCOIN, skipping minting');
} else {
  console.log('\n💎 Player has no GCOIN');
}

// 1. Initialize farm
console.log('\n🌱 Initializing farm...');
const hash2 = await walletClient.writeContract({
  address: farmLandAddress,
  abi: farmLandABI,
  functionName: 'initializePlayer',
  args: [playerAddress],
});
await publicClient.waitForTransactionReceipt({ hash: hash2 });
console.log('✅ Initialized farm with 9 plots and 5 wheat seeds');


// Check final balance
const balance = await publicClient.readContract({
  address: gameTokenAddress,
  abi: gameTokenABI,
  functionName: 'balanceOf',
  args: [playerAddress],
});

const plots = await publicClient.readContract({
  address: farmLandAddress,
  abi: farmLandABI,
  functionName: 'getPlayerPlots',
  args: [playerAddress],
});

const wheatSeeds = await publicClient.readContract({
  address: farmLandAddress,
  abi: farmLandABI,
  functionName: 'getSeedInventory',
  args: [playerAddress, 0],
});

console.log('\n✨ Game data population complete!');
console.log('\n📊 Summary:');
console.log('   - GCOIN Balance:', formatEther(balance), 'GCOIN');
console.log('   - Farm Plots:', plots.length);
console.log('   - Wheat Seeds:', wheatSeeds.toString());
console.log('\n🎮 Ready to play!');
