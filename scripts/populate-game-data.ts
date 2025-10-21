import hre from "hardhat";
import { parseEther, formatEther } from "viem";

async function main() {
  // Get contract addresses from deployment
  const gameTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const farmLandAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const animalFarmAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Player account (first Hardhat test account)
  const playerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  console.log("🎮 Populating game data for player:", playerAddress);

  // Get contract instances
  const gameToken = await hre.viem.getContractAt("GameToken", gameTokenAddress as `0x${string}`);
  const farmLand = await hre.viem.getContractAt("FarmLand", farmLandAddress as `0x${string}`);
  const animalFarm = await hre.viem.getContractAt("AnimalFarm", animalFarmAddress as `0x${string}`);

  // 1. Give starter tokens (100 GCOIN)
  console.log("\n💰 Giving starter tokens...");
  const giveTokensTx = await gameToken.write.giveStarterTokens([playerAddress]);
  console.log("✅ Gave 100 GCOIN to player");

  // 2. Initialize farm (9 plots + 5 wheat seeds)
  console.log("\n🌱 Initializing farm...");
  const initFarmTx = await farmLand.write.initializePlayer([playerAddress]);
  console.log("✅ Initialized farm with 9 plots and 5 wheat seeds");

  // 3. Add some extra seeds for testing
  console.log("\n🌾 Adding extra seeds...");

  // Mint tokens to player for buying seeds
  await gameToken.write.mint([playerAddress, parseEther("200")]);
  console.log("✅ Minted 200 GCOIN for seed purchases");

  // 4. Add some harvested crops for testing
  console.log("\n🥕 Adding harvested crops (simulating some harvests)...");
  // We'll do this by using the mint function to give tokens, then having the player buy seeds and plant/harvest
  // For now, let's just give more tokens so player can interact with the game
  await gameToken.write.mint([playerAddress, parseEther("500")]);
  console.log("✅ Minted additional 500 GCOIN");

  // 5. Check final balance
  const balance = await gameToken.read.balanceOf([playerAddress]);
  console.log("\n💎 Final GCOIN balance:", formatEther(balance), "GCOIN");

  // 6. Get plot count
  const plots = await farmLand.read.getPlayerPlots([playerAddress]);
  console.log("🏞️  Total farm plots:", plots.length);

  // 7. Get seed inventory
  const wheatSeeds = await farmLand.read.getSeedInventory([playerAddress, 0]); // WHEAT = 0
  console.log("🌾 Wheat seeds:", wheatSeeds.toString());

  console.log("\n✨ Game data population complete!");
  console.log("\n📊 Summary:");
  console.log("   - GCOIN Balance:", formatEther(balance), "GCOIN");
  console.log("   - Farm Plots:", plots.length);
  console.log("   - Wheat Seeds:", wheatSeeds.toString());
  console.log("\n🎮 Ready to play!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
