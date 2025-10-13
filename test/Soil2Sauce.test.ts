import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("Soil2Sauce Game - Full Integration Test", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, player1, player2] = await viem.getWalletClients();

  let gameToken: any;
  let farmLand: any;
  let animalFarm: any;
  let restaurant: any;

  before(async () => {
    // Deploy all contracts
    gameToken = await viem.deployContract("GameToken");
    farmLand = await viem.deployContract("FarmLand", [gameToken.address]);
    animalFarm = await viem.deployContract("AnimalFarm", [gameToken.address]);
    restaurant = await viem.deployContract("Restaurant", [
      gameToken.address,
      farmLand.address,
      animalFarm.address,
    ]);

    // Authorize contracts
    await gameToken.write.setAuthorizedContract([farmLand.address, true]);
    await gameToken.write.setAuthorizedContract([animalFarm.address, true]);
    await gameToken.write.setAuthorizedContract([restaurant.address, true]);
  });

  it("GameToken - Initial state and starter tokens", async function () {
    // Check deployer has initial supply
    const deployerBalance = await gameToken.read.balanceOf([
      deployer.account.address,
    ]);
    assert.ok(deployerBalance > 0n, "Deployer should have initial token supply");

    // Give starter tokens to player1
    await gameToken.write.giveStarterTokens([player1.account.address]);
    const player1Balance = await gameToken.read.balanceOf([
      player1.account.address,
    ]);
    assert.equal(
      player1Balance,
      parseEther("100"),
      "Player1 should receive 100 starter tokens"
    );
  });

  it("FarmLand - Initialize player and plant seeds", async function () {
    const farmLandPlayer1 = await viem.getContractAt(
      "FarmLand",
      farmLand.address,
      { client: { wallet: player1 } }
    );

    // Initialize player
    await farmLand.write.initializePlayer([player1.account.address]);

    // Check initial plots
    const plots = await farmLand.read.getPlayerPlots([player1.account.address]);
    assert.equal(plots.length, 9, "Player should have 9 initial plots");

    // Check initial wheat seeds
    const wheatSeeds = await farmLand.read.getSeedInventory([
      player1.account.address,
      0, // CropType.WHEAT
    ]);
    assert.equal(wheatSeeds, 5n, "Player should have 5 initial wheat seeds");

    // Plant a wheat seed
    await farmLandPlayer1.write.plantSeed([plots[0], 0]); // Plot 0, WHEAT

    // Check plot status
    const [status, cropType, isReady, remainingTime] =
      await farmLand.read.getPlotStatus([plots[0]]);
    assert.equal(status, 1, "Plot should be GROWING"); // PlotStatus.GROWING = 1
    assert.equal(cropType, 0, "Crop should be WHEAT");
    assert.equal(isReady, false, "Crop should not be ready yet");

    // Wait for crop to grow (10 seconds)
    await publicClient.increaseTime({ seconds: 11 });
    await publicClient.mine({ blocks: 1 });

    // Check if ready
    const [statusAfter, , isReadyAfter] = await farmLand.read.getPlotStatus([
      plots[0],
    ]);
    assert.equal(statusAfter, 1, "Plot should still be GROWING status");
    assert.equal(isReadyAfter, true, "Crop should be ready to harvest");

    // Harvest crop
    await farmLandPlayer1.write.harvestCrop([plots[0]]);

    // Check harvested crops
    const harvestedWheat = await farmLand.read.getHarvestedCrops([
      player1.account.address,
      0,
    ]);
    assert.equal(harvestedWheat, 1n, "Player should have 1 harvested wheat");
  });

  it("FarmLand - Buy seeds and sell crops", async function () {
    const farmLandPlayer1 = await viem.getContractAt(
      "FarmLand",
      farmLand.address,
      { client: { wallet: player1 } }
    );

    const initialBalance = await gameToken.read.balanceOf([
      player1.account.address,
    ]);

    // Sell 1 harvested wheat (price: 4 tokens)
    // First make sure we have wheat to sell
    const harvestedWheatBefore = await farmLand.read.getHarvestedCrops([
      player1.account.address,
      0,
    ]);
    if (harvestedWheatBefore > 0n) {
      await farmLandPlayer1.write.sellCrops([0, 1n]); // WHEAT, 1 quantity
    }

    const afterSellBalance = await gameToken.read.balanceOf([
      player1.account.address,
    ]);
    if (harvestedWheatBefore > 0n) {
      assert.equal(
        afterSellBalance - initialBalance,
        parseEther("4"),
        "Should receive 4 tokens for 1 wheat"
      );
    }

    // Buy tomato seeds (price: 8 tokens each)
    await farmLandPlayer1.write.buySeeds([1, 2n]); // TOMATO, 2 quantity

    const tomatoSeeds = await farmLand.read.getSeedInventory([
      player1.account.address,
      1, // TOMATO
    ]);
    assert.equal(tomatoSeeds, 2n, "Should have 2 tomato seeds");
  });

  it("FarmLand - Convert crops to seeds", async function () {
    const farmLandPlayer1 = await viem.getContractAt(
      "FarmLand",
      farmLand.address,
      { client: { wallet: player1 } }
    );

    // Plant, wait, and harvest wheat again
    const plots = await farmLand.read.getPlayerPlots([player1.account.address]);
    await farmLandPlayer1.write.plantSeed([plots[1], 0]); // WHEAT
    await publicClient.increaseTime({ seconds: 11 });
    await publicClient.mine({ blocks: 1 });
    await farmLandPlayer1.write.harvestCrop([plots[1]]);

    // Convert 1 wheat to seeds (1 crop = 2 seeds)
    const wheatBefore = await farmLand.read.getSeedInventory([
      player1.account.address,
      0,
    ]);
    await farmLandPlayer1.write.convertCropsToSeeds([0, 1n]); // WHEAT, 1 quantity

    const wheatAfter = await farmLand.read.getSeedInventory([
      player1.account.address,
      0,
    ]);
    assert.equal(wheatAfter - wheatBefore, 2n, "Should gain 2 seeds from 1 crop");
  });

  it("FarmLand - Expand farm", async function () {
    const farmLandPlayer1 = await viem.getContractAt(
      "FarmLand",
      farmLand.address,
      { client: { wallet: player1 } }
    );

    const plotsBefore = await farmLand.read.getPlayerPlots([
      player1.account.address,
    ]);
    await farmLandPlayer1.write.expandFarm();

    const plotsAfter = await farmLand.read.getPlayerPlots([
      player1.account.address,
    ]);
    assert.equal(
      plotsAfter.length,
      plotsBefore.length + 1,
      "Should have one more plot"
    );
  });

  it("AnimalFarm - Buy animal and collect products", async function () {
    const animalFarmPlayer1 = await viem.getContractAt(
      "AnimalFarm",
      animalFarm.address,
      { client: { wallet: player1 } }
    );

    // Buy a chicken (costs 50 tokens)
    await animalFarmPlayer1.write.buyAnimal([1]); // AnimalType.CHICKEN = 1

    const animals = await animalFarm.read.getPlayerAnimals([
      player1.account.address,
    ]);
    assert.equal(animals.length, 1, "Player should have 1 animal");

    // Check animal status
    const [canProduce, timeUntilReady] = await animalFarm.read.getAnimalStatus([
      animals[0],
    ]);
    assert.equal(
      canProduce,
      false,
      "Animal should not be ready immediately"
    );

    // Wait for production (20 seconds for chicken)
    await publicClient.increaseTime({ seconds: 21 });
    await publicClient.mine({ blocks: 1 });

    const [canProduceAfter] = await animalFarm.read.getAnimalStatus([
      animals[0],
    ]);
    assert.equal(
      canProduceAfter,
      true,
      "Animal should be ready after production time"
    );

    // Collect product
    await animalFarmPlayer1.write.collectProduct([animals[0]]);

    const eggCount = await animalFarm.read.getAnimalProducts([
      player1.account.address,
      1, // ProductType.EGG = 1
    ]);
    assert.equal(eggCount, 1n, "Should have collected 1 egg");
  });

  it("AnimalFarm - Multiple production cycles", async function () {
    const animalFarmPlayer1 = await viem.getContractAt(
      "AnimalFarm",
      animalFarm.address,
      { client: { wallet: player1 } }
    );

    const animals = await animalFarm.read.getPlayerAnimals([
      player1.account.address,
    ]);

    // Wait for 2 more production cycles (40 seconds)
    await publicClient.increaseTime({ seconds: 40 });
    await publicClient.mine({ blocks: 1 });

    // Check status shows multiple products ready
    const [, , productsReady] = await animalFarm.read.getAnimalStatus([
      animals[0],
    ]);
    assert.equal(productsReady, 2n, "Should have 2 products ready");

    // Collect products
    await animalFarmPlayer1.write.collectProduct([animals[0]]);

    const eggCount = await animalFarm.read.getAnimalProducts([
      player1.account.address,
      1, // EGG
    ]);
    assert.equal(eggCount, 3n, "Should have 3 eggs total");
  });

  it("Restaurant - Create and manage dishes", async function () {
    const restaurantPlayer1 = await viem.getContractAt(
      "Restaurant",
      restaurant.address,
      { client: { wallet: player1 } }
    );

    // Create a custom dish
    await restaurantPlayer1.write.createDish([
      "Special Egg Dish",
      "A delicious creation",
      10n,
      5n, // 5 tokens per minute
    ]);

    const dishes = await restaurant.read.getPlayerDishes([
      player1.account.address,
    ]);
    assert.equal(dishes.length, 1, "Player should have 1 dish");

    // Get dish details
    const [name, description, unitCost, revenueRate, isActive] =
      await restaurant.read.getDish([dishes[0]]);
    assert.equal(name, "Special Egg Dish", "Dish name should match");
    assert.equal(isActive, false, "Dish should start inactive");

    // Toggle dish active
    await restaurantPlayer1.write.toggleDish([dishes[0]]);

    const [, , , , isActiveAfter] = await restaurant.read.getDish([dishes[0]]);
    assert.equal(isActiveAfter, true, "Dish should be active");
  });

  it("Restaurant - Revenue generation", async function () {
    const restaurantPlayer1 = await viem.getContractAt(
      "Restaurant",
      restaurant.address,
      { client: { wallet: player1 } }
    );

    const dishes = await restaurant.read.getPlayerDishes([
      player1.account.address,
    ]);
    const balanceBefore = await gameToken.read.balanceOf([
      player1.account.address,
    ]);

    // Wait 1 minute for revenue
    await publicClient.increaseTime({ seconds: 60 });
    await publicClient.mine({ blocks: 1 });

    // Collect revenue
    await restaurantPlayer1.write.collectDishRevenue([dishes[0]]);

    const balanceAfter = await gameToken.read.balanceOf([
      player1.account.address,
    ]);

    // Should receive 5 tokens (5 per minute * 1 minute)
    assert.equal(
      balanceAfter - balanceBefore,
      parseEther("5"),
      "Should receive 5 tokens revenue"
    );
  });

  it("Restaurant - Remove dish", async function () {
    const restaurantPlayer1 = await viem.getContractAt(
      "Restaurant",
      restaurant.address,
      { client: { wallet: player1 } }
    );

    const dishes = await restaurant.read.getPlayerDishes([
      player1.account.address,
    ]);
    const dishCount = dishes.length;

    await restaurantPlayer1.write.removeDish([dishes[0]]);

    const dishesAfter = await restaurant.read.getPlayerDishes([
      player1.account.address,
    ]);
    assert.equal(
      dishesAfter.length,
      dishCount - 1,
      "Should have one less dish"
    );
  });
});
