// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ItemsERC1155.sol";
import "./STOKEN.sol";

/// @title PlantSystem
/// @notice Manages crop planting, harvesting, and plot capacity
/// @dev Uses frontend-provided plot IDs stored via keccak256(player, plotId)
contract PlantSystem is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");

    ItemsERC1155 public immutable items;
    STOKEN public immutable stoken;

    uint256 public constant MAX_PLOT_CAPACITY = 9;

    struct PlantTicket {
        uint256 seedId;
        uint256 plantedAt;
        uint256 harvestTime;
        bool exists;
    }

    struct SeedConfig {
        uint256 seedId;
        uint256 cropId;
        uint256 cropAmount;
        uint256 growthTime;
        bool active;
    }

    mapping(address => uint256) public plotCapacity;
    mapping(address => mapping(bytes32 => PlantTicket)) public plots;
    mapping(uint256 => SeedConfig) public seedConfigs;
    uint256[] public plotUnlockCosts;

    event Planted(address indexed player, string plotId, uint256 seedId, uint256 harvestTime);
    event Harvested(address indexed player, string plotId, uint256 cropId, uint256 amount);
    event PlotUnlocked(address indexed player, uint256 newCapacity, uint256 cost);
    event PlayerInitialized(address indexed player, uint256 initialCapacity);
    event SeedConfigUpdated(uint256 indexed seedId);
    event PlotUnlockCostsUpdated();

    constructor(address _items, address _stoken) {
        items = ItemsERC1155(_items);
        stoken = STOKEN(_stoken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONFIG_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // Initialize plot unlock costs (in STOKEN with 18 decimals): [0,0,0, 100, 150, 200, 300, 500, 800]
        plotUnlockCosts = [0, 0, 0, 100 * 10**18, 150 * 10**18, 200 * 10**18, 300 * 10**18, 500 * 10**18, 800 * 10**18];

        // Initialize default seed configs
        // Wheat: 5 seconds
        seedConfigs[1] = SeedConfig(1, 10, 5, 5 seconds, true);
        // Tomato: 7 seconds
        seedConfigs[2] = SeedConfig(2, 11, 3, 7 seconds, true);
        // Corn: 10 seconds
        seedConfigs[3] = SeedConfig(3, 12, 4, 10 seconds, true);
        // Lettuce: 15 seconds
        seedConfigs[4] = SeedConfig(4, 13, 4, 15 seconds, true);
        // Carrot: 20 seconds
        seedConfigs[5] = SeedConfig(5, 14, 3, 20 seconds, true);
    }

    /// @notice Initializes a player with starting plot capacity
    /// @param player The player address to initialize
    /// @dev Called by GameRegistry during registration
    function initializePlayer(address player) external onlyRole(MINTER_ROLE) {
        require(plotCapacity[player] == 0, "Already initialized");
        plotCapacity[player] = 3;
        emit PlayerInitialized(player, 3);
    }

    /// @notice Plants a seed in a specific plot
    /// @param plotId The plot identifier from frontend (e.g., "plot-0")
    /// @param seedId The seed token ID to plant
    function plant(string memory plotId, uint256 seedId) external {
        bytes32 plotKey = _getPlotKey(msg.sender, plotId);
        require(!plots[msg.sender][plotKey].exists, "Plot already in use");

        SeedConfig memory config = seedConfigs[seedId];
        require(config.active, "Seed not active");
        require(items.balanceOf(msg.sender, seedId) > 0, "Insufficient seeds");

        // Burn seed
        items.burn(msg.sender, seedId, 1);

        // Create plant ticket
        uint256 harvestTime = block.timestamp + config.growthTime;
        plots[msg.sender][plotKey] = PlantTicket({
            seedId: seedId,
            plantedAt: block.timestamp,
            harvestTime: harvestTime,
            exists: true
        });

        emit Planted(msg.sender, plotId, seedId, harvestTime);
    }

    /// @notice Harvests a mature crop from a plot
    /// @param plotId The plot identifier to harvest
    function harvest(string memory plotId) external {
        bytes32 plotKey = _getPlotKey(msg.sender, plotId);
        PlantTicket memory ticket = plots[msg.sender][plotKey];

        require(ticket.exists, "No crop planted");
        require(block.timestamp >= ticket.harvestTime, "Crop not ready");

        SeedConfig memory config = seedConfigs[ticket.seedId];

        // Delete plant ticket
        delete plots[msg.sender][plotKey];

        // Mint crops
        items.mint(msg.sender, config.cropId, config.cropAmount);

        emit Harvested(msg.sender, plotId, config.cropId, config.cropAmount);
    }

    /// @notice Unlocks the next plot for the player
    function unlockNextPlot() external {
        uint256 currentCapacity = plotCapacity[msg.sender];
        require(currentCapacity < MAX_PLOT_CAPACITY, "Max capacity reached");
        require(currentCapacity >= 3, "Not initialized");

        uint256 cost = plotUnlockCosts[currentCapacity];
        require(stoken.balanceOf(msg.sender) >= cost, "Insufficient STOKEN");

        // Burn STOKEN cost
        stoken.burn(msg.sender, cost);

        // Increment capacity
        plotCapacity[msg.sender] = currentCapacity + 1;

        emit PlotUnlocked(msg.sender, currentCapacity + 1, cost);
    }

    /// @notice Gets plot information for a player
    /// @param player The player address
    /// @param plotId The plot identifier
    /// @return The PlantTicket for the plot
    function getPlot(address player, string memory plotId) external view returns (PlantTicket memory) {
        bytes32 plotKey = _getPlotKey(player, plotId);
        return plots[player][plotKey];
    }

    /// @notice Gets the plot capacity for a player
    /// @param player The player address
    /// @return The number of unlocked plots (3-9)
    function getPlotCapacity(address player) external view returns (uint256) {
        return plotCapacity[player];
    }

    /// @notice Updates seed configuration
    /// @param _seedId The seed token ID
    /// @param _cropId The crop token ID it produces
    /// @param _cropAmount How many crops per harvest
    /// @param _growthTime Time in seconds to maturity
    /// @param _active Whether the seed is active
    function setSeedConfig(
        uint256 _seedId,
        uint256 _cropId,
        uint256 _cropAmount,
        uint256 _growthTime,
        bool _active
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        seedConfigs[_seedId] = SeedConfig(_seedId, _cropId, _cropAmount, _growthTime, _active);
        emit SeedConfigUpdated(_seedId);
    }

    /// @notice Updates plot unlock costs
    /// @param costs Array of costs for plots 0-8
    function setPlotUnlockCosts(uint256[] memory costs) external onlyRole(CONFIG_ADMIN_ROLE) {
        require(costs.length == 9, "Must provide 9 costs");
        plotUnlockCosts = costs;
        emit PlotUnlockCostsUpdated();
    }

    /// @dev Generates storage key for a plot
    function _getPlotKey(address player, string memory plotId) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(player, plotId));
    }
}
