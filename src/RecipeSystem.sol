// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title RecipeSystem
/// @notice Manages recipe submission and AI-evaluated NFT minting for Soil2Sauce
/// @dev ERC721 with AI agent grading system
contract RecipeSystem is ERC721, AccessControl {
    bytes32 public constant GRADER_ROLE = keccak256("GRADER_ROLE");

    /// @notice Recipe data structure
    struct Recipe {
        uint256 recipeId;
        address chef;
        string instruction;
        string ingredients;
        // Evaluation results (populated after grading)
        string dishDescription;
        uint8 grade; // 1-100
        uint256 revenueRate;
        string critics;
        bool evaluated;
        uint256 timestamp;
    }

    /// @notice Mapping from recipe ID to Recipe data
    mapping(uint256 => Recipe) public recipes;

    /// @notice Mapping to prevent double grading
    mapping(uint256 => bool) public processingLock;

    /// @notice Counter for recipe IDs
    uint256 private _nextRecipeId;

    /// @notice Mapping from chef address to their recipe IDs
    mapping(address => uint256[]) private _chefRecipes;

    /// @notice Emitted when a new recipe is requested
    event RecipeRequested(
        uint256 indexed recipeId,
        address indexed chef,
        string instruction,
        string ingredients,
        uint256 timestamp
    );

    /// @notice Emitted when a recipe is finalized with evaluation
    event RecipeFinalized(
        uint256 indexed recipeId,
        address indexed chef,
        string dishDescription,
        uint8 grade,
        uint256 revenueRate,
        string critics
    );

    constructor() ERC721("Soil2Sauce Recipe", "S2SRECIPE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _nextRecipeId = 1; // Start recipe IDs from 1
    }

    /// @notice Request a new recipe to be evaluated
    /// @param instruction The cooking instructions
    /// @param ingredients The list of ingredients
    /// @return recipeId The ID of the created recipe
    function requestRecipe(
        string calldata instruction,
        string calldata ingredients
    ) external returns (uint256) {
        require(bytes(instruction).length > 0, "Instruction cannot be empty");
        require(bytes(ingredients).length > 0, "Ingredients cannot be empty");

        uint256 recipeId = _nextRecipeId++;

        recipes[recipeId] = Recipe({
            recipeId: recipeId,
            chef: msg.sender,
            instruction: instruction,
            ingredients: ingredients,
            dishDescription: "",
            grade: 0,
            revenueRate: 0,
            critics: "",
            evaluated: false,
            timestamp: block.timestamp
        });

        _chefRecipes[msg.sender].push(recipeId);

        emit RecipeRequested(
            recipeId,
            msg.sender,
            instruction,
            ingredients,
            block.timestamp
        );

        return recipeId;
    }

    /// @notice Finalize a recipe with AI evaluation results
    /// @param recipeId The ID of the recipe to finalize
    /// @param dishDescription The AI-generated dish description
    /// @param grade The grade (1-100)
    /// @param revenueRate The revenue multiplier rate
    /// @param critics The AI-generated critics feedback
    function finalizeRecipe(
        uint256 recipeId,
        string calldata dishDescription,
        uint8 grade,
        uint256 revenueRate,
        string calldata critics
    ) external onlyRole(GRADER_ROLE) {
        require(recipeId > 0 && recipeId < _nextRecipeId, "Recipe does not exist");
        require(!recipes[recipeId].evaluated, "Recipe already evaluated");
        require(!processingLock[recipeId], "Recipe is being processed");
        require(grade >= 1 && grade <= 100, "Grade must be between 1 and 100");

        // Lock to prevent double processing
        processingLock[recipeId] = true;

        Recipe storage recipe = recipes[recipeId];
        recipe.dishDescription = dishDescription;
        recipe.grade = grade;
        recipe.revenueRate = revenueRate;
        recipe.critics = critics;
        recipe.evaluated = true;

        // Mint NFT to the chef
        _safeMint(recipe.chef, recipeId);

        emit RecipeFinalized(
            recipeId,
            recipe.chef,
            dishDescription,
            grade,
            revenueRate,
            critics
        );
    }

    /// @notice Get a recipe by ID
    /// @param recipeId The ID of the recipe
    /// @return The recipe data
    function getRecipe(uint256 recipeId) external view returns (Recipe memory) {
        require(recipeId > 0 && recipeId < _nextRecipeId, "Recipe does not exist");
        return recipes[recipeId];
    }

    /// @notice Get all recipe IDs for a chef
    /// @param chef The address of the chef
    /// @return Array of recipe IDs
    function getRecipesByChef(address chef) external view returns (uint256[] memory) {
        return _chefRecipes[chef];
    }

    /// @notice Check if a recipe is being processed
    /// @param recipeId The ID of the recipe
    /// @return True if locked for processing
    function isProcessing(uint256 recipeId) external view returns (bool) {
        return processingLock[recipeId];
    }

    /// @notice Get the total number of recipes
    /// @return The total count
    function getTotalRecipes() external view returns (uint256) {
        return _nextRecipeId - 1;
    }

    /// @notice Override supportsInterface to support multiple inheritance
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
