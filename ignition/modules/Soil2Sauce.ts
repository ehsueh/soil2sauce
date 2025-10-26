import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Soil2SauceModule = buildModule("Soil2SauceModule", (m) => {
  // Deploy GameToken first
  const gameToken = m.contract("GameToken");

  // Deploy FarmLand with GameToken address
  const farmLand = m.contract("FarmLand", [gameToken]);

  // Deploy AnimalFarm with GameToken address
  const animalFarm = m.contract("AnimalFarm", [gameToken]);

  // Deploy Restaurant with all contract addresses
  const restaurant = m.contract("Restaurant", [
    gameToken,
    farmLand,
    animalFarm,
  ]);

  // Deploy Player management contract
  const player = m.contract("Player", [gameToken]);

  // Deploy Recipe management contract
  const recipe = m.contract("Recipe", [player]);

  // Deploy Leaderboard contract
  const leaderboard = m.contract("Leaderboard", [recipe]);

  // Authorize FarmLand to mint/burn tokens
  m.call(gameToken, "setAuthorizedContract", [farmLand, true], {
    id: "authorize_farmland",
  });

  // Authorize AnimalFarm to mint/burn tokens
  m.call(gameToken, "setAuthorizedContract", [animalFarm, true], {
    id: "authorize_animalfarm",
  });

  // Authorize Restaurant to mint tokens
  m.call(gameToken, "setAuthorizedContract", [restaurant, true], {
    id: "authorize_restaurant",
  });

  return { gameToken, farmLand, animalFarm, restaurant, player, recipe, leaderboard };
});

export default Soil2SauceModule;
