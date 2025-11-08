// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/ShopSystem.sol";

contract UpdateShopPricesScript is Script {
    function run() external {
        // ShopSystem address from deployment
        address shopSystemAddress = 0x3Aa5ebB10DC797CAC828524e59A333d0A371443c;
        ShopSystem shopSystem = ShopSystem(shopSystemAddress);

        console.log("ShopSystem address:", shopSystemAddress);

        vm.startBroadcast();

        // Update animal prices
        // Cow (itemId 20): 20 STOKEN
        console.log("\nUpdating Cow price to 20 STOKEN...");
        shopSystem.setShopItem(20, 20 * 10**18, true);
        console.log("Cow price updated!");

        // Chicken (itemId 21): 30 STOKEN
        console.log("Updating Chicken price to 30 STOKEN...");
        shopSystem.setShopItem(21, 30 * 10**18, true);
        console.log("Chicken price updated!");

        // Pig (itemId 22): 40 STOKEN
        console.log("Updating Pig price to 40 STOKEN...");
        shopSystem.setShopItem(22, 40 * 10**18, true);
        console.log("Pig price updated!");

        vm.stopBroadcast();

        // Verify the updates
        console.log("\n=== Verifying New Prices ===");
        uint256 cowPrice = shopSystem.getItemPrice(20);
        uint256 chickenPrice = shopSystem.getItemPrice(21);
        uint256 pigPrice = shopSystem.getItemPrice(22);

        console.log("Cow (itemId 20):", cowPrice / 10**18, "STOKEN");
        console.log("Chicken (itemId 21):", chickenPrice / 10**18, "STOKEN");
        console.log("Pig (itemId 22):", pigPrice / 10**18, "STOKEN");
        console.log("\n=== Price Update Complete ===");
    }
}
