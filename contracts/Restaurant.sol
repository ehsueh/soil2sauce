// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameToken.sol";
import "./FarmLand.sol";
import "./AnimalFarm.sol";

/**
 * @title Restaurant
 * @dev Manages restaurant dishes and passive income generation
 */
contract Restaurant is Ownable {
    GameToken public gameToken;
    FarmLand public farmLand;
    AnimalFarm public animalFarm;

    struct Dish {
        string name;
        string description;
        uint256 unitCost;
        uint256 revenueRate; // Tokens per minute
        uint256 createdAt;
        bool isActive;
        uint256 lastRevenueTime;
    }

    // Player address => array of dish IDs
    mapping(address => uint256[]) public playerDishes;
    // Dish ID => Dish data
    mapping(uint256 => Dish) public dishes;
    // Dish ID => owner address
    mapping(uint256 => address) public dishOwner;

    uint256 public nextDishId;
    uint256 public constant REVENUE_INTERVAL = 60; // 60 seconds

    event DishCreated(address indexed player, uint256 dishId, string name);
    event DishToggled(address indexed player, uint256 dishId, bool isActive);
    event DishRemoved(address indexed player, uint256 dishId);
    event RevenueGenerated(address indexed player, uint256 dishId, uint256 amount);

    constructor(
        address _gameToken,
        address _farmLand,
        address _animalFarm
    ) Ownable(msg.sender) {
        gameToken = GameToken(_gameToken);
        farmLand = FarmLand(_farmLand);
        animalFarm = AnimalFarm(_animalFarm);
    }

    /**
     * @dev Create a custom dish for the restaurant
     * @param name Name of the dish
     * @param description Description of the dish
     * @param unitCost Cost to create the dish
     * @param revenueRate Revenue generated per minute
     */
    function createDish(
        string memory name,
        string memory description,
        uint256 unitCost,
        uint256 revenueRate
    ) external {
        uint256 dishId = nextDishId++;
        uint256 currentTime = block.timestamp;

        dishes[dishId] = Dish({
            name: name,
            description: description,
            unitCost: unitCost,
            revenueRate: revenueRate,
            createdAt: currentTime,
            isActive: false,
            lastRevenueTime: currentTime
        });

        dishOwner[dishId] = msg.sender;
        playerDishes[msg.sender].push(dishId);

        emit DishCreated(msg.sender, dishId, name);
    }

    /**
     * @dev Toggle dish active/inactive status
     * @param dishId ID of the dish
     */
    function toggleDish(uint256 dishId) external {
        require(dishOwner[dishId] == msg.sender, "Restaurant: not dish owner");

        Dish storage dish = dishes[dishId];

        if (!dish.isActive) {
            // Activating - reset revenue timer
            dish.lastRevenueTime = block.timestamp;
        } else {
            // Deactivating - collect any pending revenue first
            _collectDishRevenue(dishId);
        }

        dish.isActive = !dish.isActive;

        emit DishToggled(msg.sender, dishId, dish.isActive);
    }

    /**
     * @dev Remove a dish from the restaurant
     * @param dishId ID of the dish
     */
    function removeDish(uint256 dishId) external {
        require(dishOwner[dishId] == msg.sender, "Restaurant: not dish owner");

        // Collect any pending revenue before removing
        if (dishes[dishId].isActive) {
            _collectDishRevenue(dishId);
        }

        // Remove from player's dishes array
        uint256[] storage playerDishArray = playerDishes[msg.sender];
        for (uint256 i = 0; i < playerDishArray.length; i++) {
            if (playerDishArray[i] == dishId) {
                playerDishArray[i] = playerDishArray[playerDishArray.length - 1];
                playerDishArray.pop();
                break;
            }
        }

        delete dishes[dishId];
        delete dishOwner[dishId];

        emit DishRemoved(msg.sender, dishId);
    }

    /**
     * @dev Manually collect revenue from an active dish
     * @param dishId ID of the dish
     */
    function collectDishRevenue(uint256 dishId) external {
        require(dishOwner[dishId] == msg.sender, "Restaurant: not dish owner");
        require(dishes[dishId].isActive, "Restaurant: dish not active");

        _collectDishRevenue(dishId);
    }

    /**
     * @dev Collect revenue from all active dishes for a player
     */
    function collectAllRevenue() external {
        uint256[] memory playerDishArray = playerDishes[msg.sender];

        for (uint256 i = 0; i < playerDishArray.length; i++) {
            uint256 dishId = playerDishArray[i];
            if (dishes[dishId].isActive) {
                _collectDishRevenue(dishId);
            }
        }
    }

    /**
     * @dev Internal function to collect revenue from a dish
     * @param dishId ID of the dish
     */
    function _collectDishRevenue(uint256 dishId) internal {
        Dish storage dish = dishes[dishId];
        address owner = dishOwner[dishId];

        uint256 timeSinceLastRevenue = block.timestamp - dish.lastRevenueTime;

        if (timeSinceLastRevenue >= REVENUE_INTERVAL) {
            uint256 intervals = timeSinceLastRevenue / REVENUE_INTERVAL;
            uint256 revenue = dish.revenueRate * intervals * 10 ** 18;

            dish.lastRevenueTime = block.timestamp;

            if (revenue > 0) {
                gameToken.mint(owner, revenue);
                emit RevenueGenerated(owner, dishId, revenue);
            }
        }
    }

    /**
     * @dev Get all dish IDs for a player
     * @param player Address of the player
     * @return Array of dish IDs
     */
    function getPlayerDishes(address player) external view returns (uint256[] memory) {
        return playerDishes[player];
    }

    /**
     * @dev Get pending revenue for a dish
     * @param dishId ID of the dish
     * @return pendingRevenue Amount of revenue ready to collect
     * @return timeUntilNextRevenue Time until next revenue interval
     */
    function getPendingRevenue(uint256 dishId) external view returns (
        uint256 pendingRevenue,
        uint256 timeUntilNextRevenue
    ) {
        Dish memory dish = dishes[dishId];

        if (!dish.isActive) {
            return (0, 0);
        }

        uint256 timeSinceLastRevenue = block.timestamp - dish.lastRevenueTime;

        if (timeSinceLastRevenue >= REVENUE_INTERVAL) {
            uint256 intervals = timeSinceLastRevenue / REVENUE_INTERVAL;
            pendingRevenue = dish.revenueRate * intervals * 10 ** 18;
            timeUntilNextRevenue = REVENUE_INTERVAL - (timeSinceLastRevenue % REVENUE_INTERVAL);
        } else {
            pendingRevenue = 0;
            timeUntilNextRevenue = REVENUE_INTERVAL - timeSinceLastRevenue;
        }
    }

    /**
     * @dev Get dish details
     * @param dishId ID of the dish
     * @return name Name of the dish
     * @return description Description of the dish
     * @return unitCost Unit cost
     * @return revenueRate Revenue per minute
     * @return isActive Whether the dish is active
     */
    function getDish(uint256 dishId) external view returns (
        string memory name,
        string memory description,
        uint256 unitCost,
        uint256 revenueRate,
        bool isActive
    ) {
        Dish memory dish = dishes[dishId];
        return (
            dish.name,
            dish.description,
            dish.unitCost,
            dish.revenueRate,
            dish.isActive
        );
    }
}
