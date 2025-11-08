// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ItemsERC1155.sol";
import "../src/STOKEN.sol";
import "../src/GameRegistry.sol";
import "../src/PlantSystem.sol";
import "../src/LivestockSystem.sol";
import "../src/ShopSystem.sol";
import "../src/RecipeSystem.sol";

contract DeployNewScript is Script {
    // Deployment addresses will be stored here
    struct DeployedContracts {
        address items;
        address stoken;
        address plantSystem;
        address livestockSystem;
        address shopSystem;
        address gameRegistry;
        address recipeSystem;
    }

    function run() external returns (DeployedContracts memory deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address agentWallet = vm.envOr("AGENT_WALLET_ADDRESS", address(0));

        console.log("=== Soil2Sauce Contract Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Agent Wallet:", agentWallet);
        console.log("Chain ID:", block.chainid);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Phase 1: Deploy Core Token Contracts
        console.log("[1/5] Deploying Core Token Contracts");
        deployed.items = address(new ItemsERC1155());
        console.log("ItemsERC1155 deployed at:", deployed.items);

        deployed.stoken = address(new STOKEN());
        console.log("STOKEN deployed at:", deployed.stoken);

        // Phase 2: Deploy Game System Contracts
        console.log("\n[2/5] Deploying Game System Contracts");
        deployed.plantSystem = address(new PlantSystem(deployed.items, deployed.stoken));
        console.log("PlantSystem deployed at:", deployed.plantSystem);

        deployed.livestockSystem = address(new LivestockSystem(deployed.items));
        console.log("LivestockSystem deployed at:", deployed.livestockSystem);

        deployed.shopSystem = address(new ShopSystem(deployed.items, deployed.stoken));
        console.log("ShopSystem deployed at:", deployed.shopSystem);

        deployed.gameRegistry = address(new GameRegistry(deployed.items, deployed.stoken));
        console.log("GameRegistry deployed at:", deployed.gameRegistry);

        deployed.recipeSystem = address(new RecipeSystem());
        console.log("RecipeSystem deployed at:", deployed.recipeSystem);

        // Phase 3: Configure Roles and Permissions
        console.log("\n[3/5] Configuring Roles and Permissions");
        _configureRoles(deployed, agentWallet);

        // Phase 4: Link Systems and Set Initial Parameters
        console.log("\n[4/5] Linking Systems and Setting Parameters");
        _linkSystems(deployed);

        vm.stopBroadcast();

        // Phase 5: Verification and Summary
        console.log("\n[5/5] Deployment Summary");
        _printDeploymentSummary(deployed);

        return deployed;
    }

    function _configureRoles(DeployedContracts memory deployed, address agentWallet) internal {
        bytes32 MINTER_ROLE = keccak256("MINTER_ROLE");
        bytes32 GRADER_ROLE = keccak256("GRADER_ROLE");

        ItemsERC1155 items = ItemsERC1155(deployed.items);
        STOKEN stoken = STOKEN(deployed.stoken);
        PlantSystem plantSystem = PlantSystem(deployed.plantSystem);
        RecipeSystem recipeSystem = RecipeSystem(deployed.recipeSystem);

        // Configure ItemsERC1155 minter roles
        console.log("  - Configuring ItemsERC1155 minter roles...");
        items.grantRole(MINTER_ROLE, deployed.gameRegistry);
        items.grantRole(MINTER_ROLE, deployed.plantSystem);
        items.grantRole(MINTER_ROLE, deployed.livestockSystem);
        items.grantRole(MINTER_ROLE, deployed.shopSystem);

        // Configure STOKEN minter roles
        console.log("  - Configuring STOKEN minter roles...");
        stoken.grantRole(MINTER_ROLE, deployed.gameRegistry);
        stoken.grantRole(MINTER_ROLE, deployed.plantSystem);
        stoken.grantRole(MINTER_ROLE, deployed.shopSystem);

        // Configure PlantSystem minter role
        console.log("  - Configuring PlantSystem minter roles...");
        plantSystem.grantRole(MINTER_ROLE, deployed.gameRegistry);

        // Configure RecipeSystem grader role
        if (agentWallet != address(0)) {
            console.log("  - Granting GRADER_ROLE to agent wallet:", agentWallet);
            recipeSystem.grantRole(GRADER_ROLE, agentWallet);
        } else {
            console.log("  - WARNING: AGENT_WALLET_ADDRESS not set, skipping GRADER_ROLE grant");
        }
    }

    function _linkSystems(DeployedContracts memory deployed) internal {
        GameRegistry gameRegistry = GameRegistry(deployed.gameRegistry);

        console.log("  - Linking PlantSystem to GameRegistry...");
        gameRegistry.setPlantSystem(deployed.plantSystem);

        console.log("  - Setting starter STOKEN amount to 10 tokens...");
        gameRegistry.setStarterSTOKEN(10 * 10**18);
    }

    function _printDeploymentSummary(DeployedContracts memory deployed) internal pure {
        console.log("================================================================");
        console.log("                    DEPLOYMENT SUMMARY                          ");
        console.log("================================================================");
        console.log("Contract Name      | Address                                   ");
        console.log("================================================================");
        console.log("ItemsERC1155       |", deployed.items);
        console.log("STOKEN             |", deployed.stoken);
        console.log("PlantSystem        |", deployed.plantSystem);
        console.log("LivestockSystem    |", deployed.livestockSystem);
        console.log("ShopSystem         |", deployed.shopSystem);
        console.log("GameRegistry       |", deployed.gameRegistry);
        console.log("RecipeSystem       |", deployed.recipeSystem);
        console.log("================================================================");
        console.log("");
        console.log("SUCCESS: All contracts deployed and configured successfully!");
        console.log("TIP: To verify contracts, run:");
        console.log("   forge verify-contract <address> <contract> --chain <chain-id>");
        console.log("");
        console.log("NOTE: Save these addresses to your environment or configuration files.");
    }

    // Helper function for manual verification of individual contracts
    function getVerificationCommand(string memory contractName, address contractAddress) internal view returns (string memory) {
        return string(abi.encodePacked(
            "forge verify-contract ",
            vm.toString(contractAddress),
            " src/",
            contractName,
            ".sol:",
            contractName,
            " --chain ",
            vm.toString(block.chainid)
        ));
    }
}