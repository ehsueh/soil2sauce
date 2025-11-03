// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ItemsERC1155.sol";

/// @title LivestockSystem
/// @notice Manages animal ownership and probability-based product generation
/// @dev Uses VRF-lite probability for product rolling
contract LivestockSystem is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");

    ItemsERC1155 public immutable items;

    struct ProductProbability {
        uint256 productId;
        uint256 probability; // Out of 10000 (basis points)
    }

    struct AnimalConfig {
        uint256 animalId;
        ProductProbability[] products;
        uint256 productAmount;
        uint256 cooldownSeconds;
        bool active;
    }

    mapping(address => mapping(uint256 => uint256)) public lastClaimed;
    mapping(uint256 => AnimalConfig) private _animalConfigs;
    uint256[] private _configuredAnimalIds;

    event ProductsClaimed(address indexed player, uint256 indexed animalId, uint256 productId, uint256 amount);
    event AnimalConfigUpdated(uint256 indexed animalId);

    constructor(address _items) {
        items = ItemsERC1155(_items);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONFIG_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // Initialize default animal configs
        _initializeDefaultConfigs();
    }

    /// @notice Claims products from owned animals
    /// @param animalId The animal token ID
    /// @return productId The ID of the product claimed
    /// @return amount The amount of product claimed
    function claimProducts(uint256 animalId) external returns (uint256 productId, uint256 amount) {
        require(items.balanceOf(msg.sender, animalId) > 0, "No animals owned");

        AnimalConfig storage config = _animalConfigs[animalId];
        require(config.active, "Animal not active");

        uint256 lastClaimTime = lastClaimed[msg.sender][animalId];

        // Only check cooldown if this isn't the first claim
        if (lastClaimTime > 0) {
            uint256 timeSinceLastClaim = block.timestamp - lastClaimTime;
            require(timeSinceLastClaim >= config.cooldownSeconds, "Cooldown active");
        }

        // Update last claimed time
        lastClaimed[msg.sender][animalId] = block.timestamp;

        // Roll for product
        productId = _rollProduct(config.products);

        // Calculate amount: productAmount × number of animals owned
        uint256 animalCount = items.balanceOf(msg.sender, animalId);
        amount = config.productAmount * animalCount;

        // Mint products
        items.mint(msg.sender, productId, amount);

        emit ProductsClaimed(msg.sender, animalId, productId, amount);

        return (productId, amount);
    }

    /// @notice Gets the next claim time for a player and animal
    /// @param player The player address
    /// @param animalId The animal token ID
    /// @return The timestamp when claiming is available
    function getNextClaimTime(address player, uint256 animalId) external view returns (uint256) {
        AnimalConfig storage config = _animalConfigs[animalId];
        uint256 lastClaimTime = lastClaimed[player][animalId];

        if (lastClaimTime == 0) {
            return 0; // Can claim immediately
        }

        return lastClaimTime + config.cooldownSeconds;
    }

    /// @notice Gets animal configuration
    /// @param animalId The animal token ID
    /// @return id The animal ID
    /// @return products Array of possible products with probabilities
    /// @return productAmount Amount of product per claim
    /// @return cooldownSeconds Cooldown time in seconds
    /// @return active Whether the animal is active
    function getAnimalConfig(uint256 animalId)
        external
        view
        returns (
            uint256 id,
            ProductProbability[] memory products,
            uint256 productAmount,
            uint256 cooldownSeconds,
            bool active
        )
    {
        AnimalConfig storage config = _animalConfigs[animalId];
        return (config.animalId, config.products, config.productAmount, config.cooldownSeconds, config.active);
    }

    /// @notice Sets animal configuration
    /// @param animalId The animal token ID
    /// @param products Array of possible products with probabilities
    /// @param productAmount How many products per claim
    /// @param cooldownSeconds Time between claims
    /// @param active Whether the animal is active
    function setAnimalConfig(
        uint256 animalId,
        ProductProbability[] memory products,
        uint256 productAmount,
        uint256 cooldownSeconds,
        bool active
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        require(products.length > 0, "Must have at least one product");

        // Validate probabilities sum to 10000
        uint256 totalProbability = 0;
        for (uint256 i = 0; i < products.length; i++) {
            totalProbability += products[i].probability;
        }
        require(totalProbability == 10000, "Probabilities must sum to 10000");

        // Clear existing products
        delete _animalConfigs[animalId].products;

        // Set new config
        AnimalConfig storage config = _animalConfigs[animalId];
        config.animalId = animalId;
        config.productAmount = productAmount;
        config.cooldownSeconds = cooldownSeconds;
        config.active = active;

        // Add products
        for (uint256 i = 0; i < products.length; i++) {
            config.products.push(products[i]);
        }

        // Track configured animal IDs
        bool found = false;
        for (uint256 i = 0; i < _configuredAnimalIds.length; i++) {
            if (_configuredAnimalIds[i] == animalId) {
                found = true;
                break;
            }
        }
        if (!found) {
            _configuredAnimalIds.push(animalId);
        }

        emit AnimalConfigUpdated(animalId);
    }

    /// @dev Rolls for a product based on probabilities
    function _rollProduct(ProductProbability[] storage products) private view returns (uint256) {
        // Generate pseudo-random number using blockchain data
        uint256 roll = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 10000;

        uint256 cumulative = 0;
        for (uint256 i = 0; i < products.length; i++) {
            cumulative += products[i].probability;
            if (roll < cumulative) {
                return products[i].productId;
            }
        }

        revert("Invalid probability config");
    }

    /// @dev Initializes default animal configurations
    function _initializeDefaultConfigs() private {
        // Cow (id=20): 95% Milk (id=30), 5% Cheese (id=33), 2 per claim, 12h cooldown
        ProductProbability[] memory cowProducts = new ProductProbability[](2);
        cowProducts[0] = ProductProbability(30, 9500);
        cowProducts[1] = ProductProbability(33, 500);
        _setAnimalConfigInternal(20, cowProducts, 2, 12 hours, true);

        // Chicken (id=21): 90% Egg (id=31), 10% Feather (id=34), 3 per claim, 8h cooldown
        ProductProbability[] memory chickenProducts = new ProductProbability[](2);
        chickenProducts[0] = ProductProbability(31, 9000);
        chickenProducts[1] = ProductProbability(34, 1000);
        _setAnimalConfigInternal(21, chickenProducts, 3, 8 hours, true);

        // Pig (id=22): 80% Pork (id=32), 20% Bacon (id=35), 1 per claim, 24h cooldown
        ProductProbability[] memory pigProducts = new ProductProbability[](2);
        pigProducts[0] = ProductProbability(32, 8000);
        pigProducts[1] = ProductProbability(35, 2000);
        _setAnimalConfigInternal(22, pigProducts, 1, 24 hours, true);
    }

    /// @dev Internal helper to set animal config during initialization
    function _setAnimalConfigInternal(
        uint256 animalId,
        ProductProbability[] memory products,
        uint256 productAmount,
        uint256 cooldownSeconds,
        bool active
    ) private {
        AnimalConfig storage config = _animalConfigs[animalId];
        config.animalId = animalId;
        config.productAmount = productAmount;
        config.cooldownSeconds = cooldownSeconds;
        config.active = active;

        for (uint256 i = 0; i < products.length; i++) {
            config.products.push(products[i]);
        }

        _configuredAnimalIds.push(animalId);
    }
}
