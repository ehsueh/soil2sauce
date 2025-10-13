// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameToken.sol";

/**
 * @title FarmLand
 * @dev Manages farm plots, planting, and harvesting for the Soil2Sauce farming game
 */
contract FarmLand is Ownable {
    GameToken public gameToken;

    enum CropType { WHEAT, TOMATO, STRAWBERRY, CARROT }
    enum PlotStatus { EMPTY, GROWING, READY }

    struct Plot {
        PlotStatus status;
        CropType cropType;
        uint256 sowTime;
        uint256 growthDuration;
        address owner;
    }

    struct CropData {
        uint256 growthTime;
        uint256 seedPrice;
        uint256 sellPrice;
        string name;
    }

    // Player address => array of plot IDs
    mapping(address => uint256[]) public playerPlots;
    // Plot ID => Plot data
    mapping(uint256 => Plot) public plots;
    // Player address => CropType => seed quantity
    mapping(address => mapping(CropType => uint256)) public seedInventory;
    // Player address => CropType => harvested crop quantity
    mapping(address => mapping(CropType => uint256)) public harvestedCrops;
    // CropType => CropData
    mapping(CropType => CropData) public cropData;

    uint256 public nextPlotId;
    uint256 public constant INITIAL_PLOTS = 9;
    uint256 public constant EXPANSION_COST = 50 * 10 ** 18; // 50 tokens
    uint256 public constant INITIAL_WHEAT_SEEDS = 5;

    event PlotCreated(address indexed player, uint256 plotId);
    event SeedPlanted(address indexed player, uint256 plotId, CropType cropType);
    event CropHarvested(address indexed player, uint256 plotId, CropType cropType);
    event SeedsPurchased(address indexed player, CropType cropType, uint256 quantity, uint256 cost);
    event CropsSold(address indexed player, CropType cropType, uint256 quantity, uint256 earnings);
    event CropsConverted(address indexed player, CropType cropType, uint256 cropsUsed, uint256 seedsGained);
    event FarmExpanded(address indexed player, uint256 newPlotId);

    constructor(address _gameToken) Ownable(msg.sender) {
        gameToken = GameToken(_gameToken);

        // Initialize crop data (growth times in seconds)
        cropData[CropType.WHEAT] = CropData({
            growthTime: 10, // 10 seconds for testing
            seedPrice: 5 * 10 ** 18,
            sellPrice: 4 * 10 ** 18,
            name: "Wheat"
        });

        cropData[CropType.TOMATO] = CropData({
            growthTime: 15,
            seedPrice: 8 * 10 ** 18,
            sellPrice: 6 * 10 ** 18,
            name: "Tomato"
        });

        cropData[CropType.STRAWBERRY] = CropData({
            growthTime: 12,
            seedPrice: 10 * 10 ** 18,
            sellPrice: 8 * 10 ** 18,
            name: "Strawberry"
        });

        cropData[CropType.CARROT] = CropData({
            growthTime: 8,
            seedPrice: 6 * 10 ** 18,
            sellPrice: 5 * 10 ** 18,
            name: "Carrot"
        });
    }

    /**
     * @dev Initialize a new player with plots and starter seeds
     * @param player Address of the new player
     */
    function initializePlayer(address player) external {
        require(playerPlots[player].length == 0, "FarmLand: player already initialized");

        // Create initial plots
        for (uint256 i = 0; i < INITIAL_PLOTS; i++) {
            uint256 plotId = nextPlotId++;
            plots[plotId] = Plot({
                status: PlotStatus.EMPTY,
                cropType: CropType.WHEAT,
                sowTime: 0,
                growthDuration: 0,
                owner: player
            });
            playerPlots[player].push(plotId);
            emit PlotCreated(player, plotId);
        }

        // Give starter seeds
        seedInventory[player][CropType.WHEAT] = INITIAL_WHEAT_SEEDS;
    }

    /**
     * @dev Plant a seed on a plot
     * @param plotId ID of the plot to plant on
     * @param cropType Type of crop to plant
     */
    function plantSeed(uint256 plotId, CropType cropType) external {
        Plot storage plot = plots[plotId];
        require(plot.owner == msg.sender, "FarmLand: not plot owner");
        require(plot.status == PlotStatus.EMPTY, "FarmLand: plot not empty");
        require(seedInventory[msg.sender][cropType] > 0, "FarmLand: no seeds available");

        seedInventory[msg.sender][cropType]--;
        plot.status = PlotStatus.GROWING;
        plot.cropType = cropType;
        plot.sowTime = block.timestamp;
        plot.growthDuration = cropData[cropType].growthTime;

        emit SeedPlanted(msg.sender, plotId, cropType);
    }

    /**
     * @dev Harvest a ready crop from a plot
     * @param plotId ID of the plot to harvest
     */
    function harvestCrop(uint256 plotId) external {
        Plot storage plot = plots[plotId];
        require(plot.owner == msg.sender, "FarmLand: not plot owner");
        require(plot.status == PlotStatus.GROWING, "FarmLand: plot not growing");
        require(
            block.timestamp >= plot.sowTime + plot.growthDuration,
            "FarmLand: crop not ready"
        );

        CropType cropType = plot.cropType;
        harvestedCrops[msg.sender][cropType]++;

        plot.status = PlotStatus.EMPTY;
        plot.sowTime = 0;
        plot.growthDuration = 0;

        emit CropHarvested(msg.sender, plotId, cropType);
    }

    /**
     * @dev Buy seeds from the seed market
     * @param cropType Type of seeds to buy
     * @param quantity Number of seeds to buy
     */
    function buySeeds(CropType cropType, uint256 quantity) external {
        require(quantity > 0, "FarmLand: quantity must be > 0");

        uint256 cost = cropData[cropType].seedPrice * quantity;
        require(gameToken.balanceOf(msg.sender) >= cost, "FarmLand: insufficient funds");

        gameToken.burn(msg.sender, cost);
        seedInventory[msg.sender][cropType] += quantity;

        emit SeedsPurchased(msg.sender, cropType, quantity, cost);
    }

    /**
     * @dev Sell harvested crops
     * @param cropType Type of crops to sell
     * @param quantity Number of crops to sell
     */
    function sellCrops(CropType cropType, uint256 quantity) external {
        require(harvestedCrops[msg.sender][cropType] >= quantity, "FarmLand: insufficient crops");
        require(quantity > 0, "FarmLand: quantity must be > 0");

        harvestedCrops[msg.sender][cropType] -= quantity;
        uint256 earnings = cropData[cropType].sellPrice * quantity;
        gameToken.mint(msg.sender, earnings);

        emit CropsSold(msg.sender, cropType, quantity, earnings);
    }

    /**
     * @dev Convert harvested crops to seeds (1 crop = 2 seeds)
     * @param cropType Type of crops to convert
     * @param quantity Number of crops to convert
     */
    function convertCropsToSeeds(CropType cropType, uint256 quantity) external {
        require(harvestedCrops[msg.sender][cropType] >= quantity, "FarmLand: insufficient crops");
        require(quantity > 0, "FarmLand: quantity must be > 0");

        harvestedCrops[msg.sender][cropType] -= quantity;
        seedInventory[msg.sender][cropType] += quantity * 2;

        emit CropsConverted(msg.sender, cropType, quantity, quantity * 2);
    }

    /**
     * @dev Expand farm by adding a new plot
     */
    function expandFarm() external {
        require(
            gameToken.balanceOf(msg.sender) >= EXPANSION_COST,
            "FarmLand: insufficient funds"
        );

        gameToken.burn(msg.sender, EXPANSION_COST);

        uint256 plotId = nextPlotId++;
        plots[plotId] = Plot({
            status: PlotStatus.EMPTY,
            cropType: CropType.WHEAT,
            sowTime: 0,
            growthDuration: 0,
            owner: msg.sender
        });
        playerPlots[msg.sender].push(plotId);

        emit FarmExpanded(msg.sender, plotId);
    }

    /**
     * @dev Get all plot IDs for a player
     * @param player Address of the player
     * @return Array of plot IDs
     */
    function getPlayerPlots(address player) external view returns (uint256[] memory) {
        return playerPlots[player];
    }

    /**
     * @dev Get plot status and check if ready for harvest
     * @param plotId ID of the plot
     * @return status Current status of the plot
     * @return cropType Type of crop growing
     * @return isReady Whether the crop is ready to harvest
     * @return remainingTime Time remaining until ready (0 if ready)
     */
    function getPlotStatus(uint256 plotId) external view returns (
        PlotStatus status,
        CropType cropType,
        bool isReady,
        uint256 remainingTime
    ) {
        Plot memory plot = plots[plotId];
        status = plot.status;
        cropType = plot.cropType;

        if (plot.status == PlotStatus.GROWING) {
            uint256 readyTime = plot.sowTime + plot.growthDuration;
            if (block.timestamp >= readyTime) {
                isReady = true;
                remainingTime = 0;
            } else {
                isReady = false;
                remainingTime = readyTime - block.timestamp;
            }
        }
    }

    /**
     * @dev Get player's seed inventory
     * @param player Address of the player
     * @param cropType Type of seed
     * @return quantity Number of seeds
     */
    function getSeedInventory(address player, CropType cropType) external view returns (uint256) {
        return seedInventory[player][cropType];
    }

    /**
     * @dev Get player's harvested crops
     * @param player Address of the player
     * @param cropType Type of crop
     * @return quantity Number of harvested crops
     */
    function getHarvestedCrops(address player, CropType cropType) external view returns (uint256) {
        return harvestedCrops[player][cropType];
    }
}
