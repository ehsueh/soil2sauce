import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PopulateGameDataModule = buildModule("PopulateGameDataModule", (m) => {
  // Player account (first Hardhat test account)
  const playerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // Get deployed contracts
  const gameToken = m.contractAt("GameToken", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const farmLand = m.contractAt("FarmLand", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

  // 1. Give starter tokens (100 GCOIN)
  m.call(gameToken, "giveStarterTokens", [playerAddress], {
    id: "give_starter_tokens",
  });

  // 2. Initialize farm (9 plots + 5 wheat seeds)
  m.call(farmLand, "initializePlayer", [playerAddress], {
    id: "initialize_farm",
    after: ["give_starter_tokens"],
  });

  // 3. Mint additional GCOIN for testing
  m.call(gameToken, "mint", [playerAddress, 700n * 10n ** 18n], {
    id: "mint_extra_gcoin",
    after: ["initialize_farm"],
  });

  return { gameToken, farmLand };
});

export default PopulateGameDataModule;
