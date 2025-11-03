// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/LivestockSystem.sol";

contract UpdateAnimalCooldownsScript is Script {
    function run() external {
        // LivestockSystem address from deployment
        address livestockSystemAddress = 0x68B1D87F95878fE05B998F19b66F4baba5De1aed;
        LivestockSystem livestockSystem = LivestockSystem(livestockSystemAddress);

        console.log("Updating animal cooldowns to 1 minute (60 seconds)");
        console.log("LivestockSystem address:", livestockSystemAddress);

        vm.startBroadcast();

        // Update Cow (id=20)
        // Products: 95% Milk (id=30), 5% Cheese (id=33), 2 per claim
        console.log("\nUpdating Cow cooldown to 60 seconds...");
        LivestockSystem.ProductProbability[] memory cowProducts = new LivestockSystem.ProductProbability[](2);
        cowProducts[0] = LivestockSystem.ProductProbability(30, 9500); // Milk 95%
        cowProducts[1] = LivestockSystem.ProductProbability(33, 500);  // Cheese 5%
        livestockSystem.setAnimalConfig(20, cowProducts, 2, 60, true);
        console.log("Cow cooldown updated!");

        // Update Chicken (id=21)
        // Products: 90% Egg (id=31), 10% Feather (id=34), 3 per claim
        console.log("Updating Chicken cooldown to 60 seconds...");
        LivestockSystem.ProductProbability[] memory chickenProducts = new LivestockSystem.ProductProbability[](2);
        chickenProducts[0] = LivestockSystem.ProductProbability(31, 9000); // Egg 90%
        chickenProducts[1] = LivestockSystem.ProductProbability(34, 1000); // Feather 10%
        livestockSystem.setAnimalConfig(21, chickenProducts, 3, 60, true);
        console.log("Chicken cooldown updated!");

        // Update Pig (id=22)
        // Products: 80% Pork (id=32), 20% Bacon (id=35), 1 per claim
        console.log("Updating Pig cooldown to 60 seconds...");
        LivestockSystem.ProductProbability[] memory pigProducts = new LivestockSystem.ProductProbability[](2);
        pigProducts[0] = LivestockSystem.ProductProbability(32, 8000); // Pork 80%
        pigProducts[1] = LivestockSystem.ProductProbability(35, 2000); // Bacon 20%
        livestockSystem.setAnimalConfig(22, pigProducts, 1, 60, true);
        console.log("Pig cooldown updated!");

        vm.stopBroadcast();

        // Verify the updates
        console.log("\n=== Verifying New Cooldowns ===");
        (,, , uint256 cowCooldown,) = livestockSystem.getAnimalConfig(20);
        (,, , uint256 chickenCooldown,) = livestockSystem.getAnimalConfig(21);
        (,, , uint256 pigCooldown,) = livestockSystem.getAnimalConfig(22);

        console.log("Cow (id=20) cooldown:", cowCooldown, "seconds");
        console.log("Chicken (id=21) cooldown:", chickenCooldown, "seconds");
        console.log("Pig (id=22) cooldown:", pigCooldown, "seconds");
        console.log("\n=== Cooldown Update Complete ===");
    }
}
