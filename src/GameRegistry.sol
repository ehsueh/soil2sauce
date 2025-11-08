// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ItemsERC1155.sol";
import "./STOKEN.sol";
import "./PlantSystem.sol";

/// @title GameRegistry
/// @notice Handles player onboarding and starter pack distribution
/// @dev Central registry for player registration
contract GameRegistry is AccessControl {
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");

    ItemsERC1155 public immutable items;
    STOKEN public immutable stoken;
    PlantSystem public plantSystem;

    uint256 public starterSTOKEN;

    uint256[] public starterItemIds;
    uint256[] public starterItemAmounts;

    mapping(address => bool) public registered;

    event PlayerRegistered(address indexed player, uint256 timestamp);
    event StarterPackUpdated(uint256[] itemIds, uint256[] amounts);
    event StarterSTOKENUpdated(uint256 amount);

    constructor(address _items, address _stoken) {
        items = ItemsERC1155(_items);
        stoken = STOKEN(_stoken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONFIG_ADMIN_ROLE, msg.sender);

        // Default starter pack: 5 Wheat Seeds (id=1), 3 Tomato Seeds (id=2)
        starterItemIds = [1, 2];
        starterItemAmounts = [5, 3];
    }

    /// @notice Sets the PlantSystem contract address
    /// @param _plantSystem Address of the PlantSystem contract
    function setPlantSystem(address _plantSystem) external onlyRole(DEFAULT_ADMIN_ROLE) {
        plantSystem = PlantSystem(_plantSystem);
    }

    /// @notice Registers a new player and distributes starter pack
    /// @dev Can only be called once per address
    function registerPlayer() external {
        require(!registered[msg.sender], "Already registered");
        require(address(plantSystem) != address(0), "PlantSystem not set");

        registered[msg.sender] = true;

        // Mint starter STOKEN
        if (starterSTOKEN > 0) {
            stoken.mint(msg.sender, starterSTOKEN);
        }

        // Mint starter items
        if (starterItemIds.length > 0) {
            items.mintBatch(msg.sender, starterItemIds, starterItemAmounts);
        }

        // Initialize player in PlantSystem (3 plots)
        plantSystem.initializePlayer(msg.sender);

        emit PlayerRegistered(msg.sender, block.timestamp);
    }

    /// @notice Checks if an address is registered
    /// @param player The address to check
    /// @return True if registered, false otherwise
    function isRegistered(address player) external view returns (bool) {
        return registered[player];
    }

    /// @notice Updates the starter pack contents
    /// @param itemIds Array of item token IDs
    /// @param amounts Array of amounts for each item
    function setStarterPack(uint256[] memory itemIds, uint256[] memory amounts)
        external
        onlyRole(CONFIG_ADMIN_ROLE)
    {
        require(itemIds.length == amounts.length, "Length mismatch");

        starterItemIds = itemIds;
        starterItemAmounts = amounts;

        emit StarterPackUpdated(itemIds, amounts);
    }

    /// @notice Gets the current starter pack configuration
    /// @return itemIds Array of item token IDs
    /// @return amounts Array of amounts for each item
    function getStarterPack() external view returns (uint256[] memory itemIds, uint256[] memory amounts) {
        return (starterItemIds, starterItemAmounts);
    }

    /// @notice Sets the starter STOKEN amount
    /// @param amount Amount of STOKEN to give new players
    function setStarterSTOKEN(uint256 amount) external onlyRole(CONFIG_ADMIN_ROLE) {
        starterSTOKEN = amount;
        emit StarterSTOKENUpdated(amount);
    }
}
