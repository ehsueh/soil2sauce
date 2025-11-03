// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ItemsERC1155.sol";
import "../src/STOKEN.sol";
import "../src/GameRegistry.sol";
import "../src/PlantSystem.sol";
import "../src/LivestockSystem.sol";
import "../src/ShopSystem.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with account:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy token contracts
        console.log("Deploying ItemsERC1155...");
        ItemsERC1155 items = new ItemsERC1155();
        console.log("ItemsERC1155 deployed at:", address(items));

        console.log("Deploying STOKEN...");
        STOKEN stoken = new STOKEN();
        console.log("STOKEN deployed at:", address(stoken));

        // 2. Deploy system contracts
        console.log("Deploying PlantSystem...");
        PlantSystem plantSystem = new PlantSystem(address(items), address(stoken));
        console.log("PlantSystem deployed at:", address(plantSystem));

        console.log("Deploying LivestockSystem...");
        LivestockSystem livestockSystem = new LivestockSystem(address(items));
        console.log("LivestockSystem deployed at:", address(livestockSystem));

        console.log("Deploying ShopSystem...");
        ShopSystem shopSystem = new ShopSystem(address(items), address(stoken));
        console.log("ShopSystem deployed at:", address(shopSystem));

        console.log("Deploying GameRegistry...");
        GameRegistry gameRegistry = new GameRegistry(address(items), address(stoken));
        console.log("GameRegistry deployed at:", address(gameRegistry));

        // 3. Set up roles
        console.log("\nSetting up roles...");

        bytes32 MINTER_ROLE = keccak256("MINTER_ROLE");

        // Grant MINTER_ROLE to system contracts on ItemsERC1155
        console.log("Granting MINTER_ROLE to GameRegistry on ItemsERC1155");
        items.grantRole(MINTER_ROLE, address(gameRegistry));

        console.log("Granting MINTER_ROLE to PlantSystem on ItemsERC1155");
        items.grantRole(MINTER_ROLE, address(plantSystem));

        console.log("Granting MINTER_ROLE to LivestockSystem on ItemsERC1155");
        items.grantRole(MINTER_ROLE, address(livestockSystem));

        console.log("Granting MINTER_ROLE to ShopSystem on ItemsERC1155");
        items.grantRole(MINTER_ROLE, address(shopSystem));

        // Grant MINTER_ROLE to system contracts on STOKEN
        console.log("Granting MINTER_ROLE to GameRegistry on STOKEN");
        stoken.grantRole(MINTER_ROLE, address(gameRegistry));

        console.log("Granting MINTER_ROLE to PlantSystem on STOKEN");
        stoken.grantRole(MINTER_ROLE, address(plantSystem));

        console.log("Granting MINTER_ROLE to ShopSystem on STOKEN");
        stoken.grantRole(MINTER_ROLE, address(shopSystem));

        // Grant MINTER_ROLE to GameRegistry on PlantSystem
        console.log("Granting MINTER_ROLE to GameRegistry on PlantSystem");
        plantSystem.grantRole(MINTER_ROLE, address(gameRegistry));

        // 4. Link PlantSystem to GameRegistry
        console.log("\nLinking PlantSystem to GameRegistry...");
        gameRegistry.setPlantSystem(address(plantSystem));

        // 5. Set starter STOKEN amount (10 tokens with 18 decimals)
        console.log("\nSetting starter STOKEN amount to 10...");
        gameRegistry.setStarterSTOKEN(10 * 10**18);

        vm.stopBroadcast();

        // 5. Print deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("ItemsERC1155:", address(items));
        console.log("STOKEN:", address(stoken));
        console.log("PlantSystem:", address(plantSystem));
        console.log("LivestockSystem:", address(livestockSystem));
        console.log("ShopSystem:", address(shopSystem));
        console.log("GameRegistry:", address(gameRegistry));
        console.log("\n=== Deployment Complete ===");
    }
}
