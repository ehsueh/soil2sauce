// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DeployNew.s.sol";

contract DeployWithVerification is Script {
    function run() external returns (DeployNewScript.DeployedContracts memory deployed) {
        // Create and run the deployment script
        DeployNewScript deployScript = new DeployNewScript();
        deployed = deployScript.run();
        
        console.log("\n=== Contract Verification Commands ===");
        console.log("Run these commands to verify your contracts:");
        console.log("");
        
        _printVerificationCommands(deployed);
        
        return deployed;
    }
    
    function _printVerificationCommands(DeployNewScript.DeployedContracts memory deployed) internal pure {
        string memory baseCommand = "forge verify-contract ";
        string memory chainFlag = " --chain 84532"; // Base Sepolia
        
        console.log("# ItemsERC1155");
        console.log(string(abi.encodePacked(baseCommand, _addressToString(deployed.items), " src/ItemsERC1155.sol:ItemsERC1155", chainFlag)));
        console.log("");
        
        console.log("# STOKEN");
        console.log(string(abi.encodePacked(baseCommand, _addressToString(deployed.stoken), " src/STOKEN.sol:STOKEN", chainFlag)));
        console.log("");
        
        console.log("# PlantSystem");
        console.log(string(abi.encodePacked(baseCommand, _addressToString(deployed.plantSystem), " src/PlantSystem.sol:PlantSystem", chainFlag, " --constructor-args $(cast abi-encode \"constructor(address,address)\" ", _addressToString(deployed.items), " ", _addressToString(deployed.stoken), ")")));
        console.log("");
        
        console.log("# LivestockSystem");
        console.log(string(abi.encodePacked(baseCommand, _addressToString(deployed.livestockSystem), " src/LivestockSystem.sol:LivestockSystem", chainFlag, " --constructor-args $(cast abi-encode \"constructor(address)\" ", _addressToString(deployed.items), ")")));
        console.log("");
        
        console.log("# ShopSystem");
        console.log(string(abi.encodePacked(baseCommand, _addressToString(deployed.shopSystem), " src/ShopSystem.sol:ShopSystem", chainFlag, " --constructor-args $(cast abi-encode \"constructor(address,address)\" ", _addressToString(deployed.items), " ", _addressToString(deployed.stoken), ")")));
        console.log("");
        
        console.log("# GameRegistry");
        console.log(string(abi.encodePacked(baseCommand, _addressToString(deployed.gameRegistry), " src/GameRegistry.sol:GameRegistry", chainFlag, " --constructor-args $(cast abi-encode \"constructor(address,address)\" ", _addressToString(deployed.items), " ", _addressToString(deployed.stoken), ")")));
        console.log("");
        
        console.log("# RecipeSystem");
        console.log(string(abi.encodePacked(baseCommand, _addressToString(deployed.recipeSystem), " src/RecipeSystem.sol:RecipeSystem", chainFlag)));
        console.log("");
        
        console.log("TIP: You can also use --verify flag during deployment:");
        console.log("forge script script/DeployNew.s.sol:DeployNewScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify");
    }
    
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(addr);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}