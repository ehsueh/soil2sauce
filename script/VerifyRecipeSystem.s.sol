// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/RecipeSystem.sol";

contract VerifyRecipeSystemScript is Script {
    function run() external {
        // Contract address on Base Sepolia
        address contractAddress = 0xA5d01289948Efe9E8c9a9B9D04C73C280De35ee1;
        
        console.log("Verifying RecipeSystem contract at:", contractAddress);
        console.log("Network: Base Sepolia (Chain ID: 84532)");
        
        // Create verification command
        console.log("\nTo verify this contract, run:");
        console.log("forge verify-contract \\");
        console.log("  --chain-id 84532 \\");
        console.log("  --watch \\");
        console.log("  --etherscan-api-key $BASESCAN_API_KEY \\");
        console.log("  --verifier-url https://api-sepolia.basescan.org/api \\");
        string memory addressStr = vm.toString(contractAddress);
        console.log("  ", addressStr, " \\");
        console.log("  src/RecipeSystem.sol:RecipeSystem");
        
        console.log("\nOr use the verification helper script:");
        console.log("./verify-recipe-contract.sh");
    }
}