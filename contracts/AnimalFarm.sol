// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameToken.sol";

/**
 * @title AnimalFarm
 * @dev Manages animals and their product generation for the Soil2Sauce farming game
 */
contract AnimalFarm is Ownable {
    GameToken public gameToken;

    enum AnimalType { COW, CHICKEN }
    enum ProductType { MILK, EGG }

    struct Animal {
        AnimalType animalType;
        uint256 purchaseTime;
        uint256 lastProductionTime;
        address owner;
        bool active;
    }

    struct AnimalData {
        uint256 price;
        uint256 productionTime;
        ProductType productType;
        string name;
    }

    // Animal ID => Animal data
    mapping(uint256 => Animal) public animals;
    // Player address => array of animal IDs
    mapping(address => uint256[]) public playerAnimals;
    // Player address => ProductType => product quantity
    mapping(address => mapping(ProductType => uint256)) public animalProducts;
    // AnimalType => AnimalData
    mapping(AnimalType => AnimalData) public animalData;

    uint256 public nextAnimalId;

    event AnimalPurchased(address indexed player, uint256 animalId, AnimalType animalType);
    event ProductCollected(address indexed player, uint256 animalId, ProductType productType, uint256 quantity);

    constructor(address _gameToken) Ownable(msg.sender) {
        gameToken = GameToken(_gameToken);

        // Initialize animal data (production times in seconds)
        animalData[AnimalType.COW] = AnimalData({
            price: 100 * 10 ** 18,
            productionTime: 30, // 30 seconds
            productType: ProductType.MILK,
            name: "Cow"
        });

        animalData[AnimalType.CHICKEN] = AnimalData({
            price: 50 * 10 ** 18,
            productionTime: 20, // 20 seconds
            productType: ProductType.EGG,
            name: "Chicken"
        });
    }

    /**
     * @dev Buy an animal
     * @param animalType Type of animal to buy
     */
    function buyAnimal(AnimalType animalType) external {
        uint256 price = animalData[animalType].price;
        require(gameToken.balanceOf(msg.sender) >= price, "AnimalFarm: insufficient funds");

        gameToken.burn(msg.sender, price);

        uint256 animalId = nextAnimalId++;
        uint256 currentTime = block.timestamp;

        animals[animalId] = Animal({
            animalType: animalType,
            purchaseTime: currentTime,
            lastProductionTime: currentTime,
            owner: msg.sender,
            active: true
        });

        playerAnimals[msg.sender].push(animalId);

        emit AnimalPurchased(msg.sender, animalId, animalType);
    }

    /**
     * @dev Collect product from an animal
     * @param animalId ID of the animal
     */
    function collectProduct(uint256 animalId) external {
        Animal storage animal = animals[animalId];
        require(animal.owner == msg.sender, "AnimalFarm: not animal owner");
        require(animal.active, "AnimalFarm: animal not active");

        AnimalData memory data = animalData[animal.animalType];
        uint256 timeSinceLastProduction = block.timestamp - animal.lastProductionTime;

        require(
            timeSinceLastProduction >= data.productionTime,
            "AnimalFarm: product not ready"
        );

        // Calculate how many products can be collected (in case of multiple production cycles)
        uint256 productsToCollect = timeSinceLastProduction / data.productionTime;

        animal.lastProductionTime = block.timestamp;
        animalProducts[msg.sender][data.productType] += productsToCollect;

        emit ProductCollected(msg.sender, animalId, data.productType, productsToCollect);
    }

    /**
     * @dev Get all animal IDs for a player
     * @param player Address of the player
     * @return Array of animal IDs
     */
    function getPlayerAnimals(address player) external view returns (uint256[] memory) {
        return playerAnimals[player];
    }

    /**
     * @dev Check if an animal can produce
     * @param animalId ID of the animal
     * @return canProduce Whether the animal can produce
     * @return timeUntilReady Time until the animal can produce (0 if ready)
     * @return productsReady Number of products ready to collect
     */
    function getAnimalStatus(uint256 animalId) external view returns (
        bool canProduce,
        uint256 timeUntilReady,
        uint256 productsReady
    ) {
        Animal memory animal = animals[animalId];
        AnimalData memory data = animalData[animal.animalType];

        uint256 timeSinceLastProduction = block.timestamp - animal.lastProductionTime;

        if (timeSinceLastProduction >= data.productionTime) {
            canProduce = true;
            timeUntilReady = 0;
            productsReady = timeSinceLastProduction / data.productionTime;
        } else {
            canProduce = false;
            timeUntilReady = data.productionTime - timeSinceLastProduction;
            productsReady = 0;
        }
    }

    /**
     * @dev Get player's animal products
     * @param player Address of the player
     * @param productType Type of product
     * @return quantity Number of products
     */
    function getAnimalProducts(address player, ProductType productType) external view returns (uint256) {
        return animalProducts[player][productType];
    }

    /**
     * @dev Use animal products (called by other contracts like Restaurant)
     * @param player Address of the player
     * @param productType Type of product
     * @param quantity Amount to use
     */
    function useProducts(address player, ProductType productType, uint256 quantity) external {
        require(animalProducts[player][productType] >= quantity, "AnimalFarm: insufficient products");
        animalProducts[player][productType] -= quantity;
    }
}
