// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameToken
 * @dev ERC20 token for the Soil2Sauce farming game
 * Players earn tokens by selling crops and can spend them to buy seeds, animals, and expand their farm
 */
contract GameToken is ERC20, Ownable {
    // Authorized game contracts that can mint/burn tokens
    mapping(address => bool) public authorizedContracts;

    event ContractAuthorized(address indexed contractAddress, bool authorized);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor() ERC20("GameCoin", "GCOIN") Ownable(msg.sender) {
        // Mint initial supply to deployer for distribution
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    /**
     * @dev Authorize a game contract to mint/burn tokens
     * @param contractAddress Address of the contract to authorize
     * @param authorized Whether the contract is authorized
     */
    function setAuthorizedContract(address contractAddress, bool authorized) external onlyOwner {
        authorizedContracts[contractAddress] = authorized;
        emit ContractAuthorized(contractAddress, authorized);
    }

    /**
     * @dev Mint tokens to a player (called by authorized game contracts)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(authorizedContracts[msg.sender], "GameToken: caller not authorized");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens from a player (called by authorized game contracts)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(authorizedContracts[msg.sender], "GameToken: caller not authorized");
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Give initial tokens to new players
     * @param player Address of the new player
     */
    function giveStarterTokens(address player) external onlyOwner {
        require(balanceOf(player) == 0, "GameToken: player already has tokens");
        _mint(player, 100 * 10 ** decimals());
    }
}
