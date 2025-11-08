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
        string dishDescription;
        string ingredients;
        // Evaluation results (populated after grading)
        uint8 grade; // 1-100
        uint256 revenueRate;
        string critics;
        bool evaluated;
        uint256 timestamp;
        string metadataURI; // IPFS URI for NFT metadata
    }

    /// @notice Mapping from recipe ID to Recipe data
    mapping(uint256 => Recipe) public recipes;

    /// @notice Mapping to prevent double grading
    mapping(uint256 => bool) public processingLock;

    /// @notice Mapping from token ID to metadata URI
    mapping(uint256 => string) private _tokenURIs;

    /// @notice Counter for recipe IDs
    uint256 private _nextRecipeId;

    /// @notice Mapping from chef address to their recipe IDs
    mapping(address => uint256[]) private _chefRecipes;

    /// @notice Emitted when a new recipe is requested
    event RecipeRequested(
        uint256 indexed recipeId,
        address indexed chef,
        string dishDescription,
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
    /// @param dishDescription The AI-generated dish description
    /// @param ingredients The list of ingredients
    /// @return recipeId The temporary ID of the created recipe (0 until finalized)
    function requestRecipe(
        string calldata dishDescription,
        string calldata ingredients
    ) external returns (uint256) {
        require(bytes(dishDescription).length > 0, "Dish description cannot be empty");
        require(bytes(ingredients).length > 0, "Ingredients cannot be empty");

        // Use 0 as temporary ID until finalized
        uint256 tempRecipeId = 0;

        recipes[tempRecipeId] = Recipe({
            recipeId: tempRecipeId,
            chef: msg.sender,
            dishDescription: dishDescription,
            ingredients: ingredients,
            grade: 0,
            revenueRate: 0,
            critics: "",
            evaluated: false,
            timestamp: block.timestamp,
            metadataURI: ""
        });

        emit RecipeRequested(
            tempRecipeId,
            msg.sender,
            dishDescription,
            ingredients,
            block.timestamp
        );

        return tempRecipeId;
    }

    /// @notice Finalize a recipe with AI evaluation results
    /// @param tempRecipeId The temporary ID of the recipe to finalize (should be 0)
    /// @param dishDescription The AI-generated dish description
    /// @param grade The grade (1-100)
    /// @param revenueRate The revenue multiplier rate
    /// @param critics The AI-generated critics feedback
    /// @param metadataURI The IPFS URI for NFT metadata
    function finalizeRecipe(
        uint256 tempRecipeId,
        string calldata dishDescription,
        uint8 grade,
        uint256 revenueRate,
        string calldata critics,
        string calldata metadataURI
    ) external onlyRole(GRADER_ROLE) {
        require(tempRecipeId == 0, "Invalid temporary recipe ID");
        require(recipes[tempRecipeId].chef != address(0), "Recipe does not exist");
        require(!recipes[tempRecipeId].evaluated, "Recipe already evaluated");
        require(!processingLock[tempRecipeId], "Recipe is being processed");
        require(grade >= 1 && grade <= 100, "Grade must be between 1 and 100");

        // Lock to prevent double processing
        processingLock[tempRecipeId] = true;

        // Get the actual recipe ID and increment counter
        uint256 actualRecipeId = _nextRecipeId++;
        
        Recipe storage tempRecipe = recipes[tempRecipeId];
        
        // Create the finalized recipe with actual ID
        recipes[actualRecipeId] = Recipe({
            recipeId: actualRecipeId,
            chef: tempRecipe.chef,
            dishDescription: dishDescription,
            ingredients: tempRecipe.ingredients,
            grade: grade,
            revenueRate: revenueRate,
            critics: critics,
            evaluated: true,
            timestamp: tempRecipe.timestamp,
            metadataURI: metadataURI
        });

        // Add to chef's recipe list
        _chefRecipes[tempRecipe.chef].push(actualRecipeId);

        // Set token URI
        _tokenURIs[actualRecipeId] = metadataURI;

        // Mint NFT to the chef with actual recipe ID
        _safeMint(tempRecipe.chef, actualRecipeId);

        // Clean up temporary recipe
        delete recipes[tempRecipeId];
        delete processingLock[tempRecipeId];

        emit RecipeFinalized(
            actualRecipeId,
            tempRecipe.chef,
            dishDescription,
            grade,
            revenueRate,
            critics
        );
    }

    /// @notice Get a recipe by ID
    /// @param recipeId The ID of the recipe (use 0 for pending recipes)
    /// @return The recipe data
    function getRecipe(uint256 recipeId) external view returns (Recipe memory) {
        if (recipeId == 0) {
            // Return pending recipe
            require(recipes[0].chef != address(0), "No pending recipe exists");
        } else {
            // Return finalized recipe
            require(recipeId > 0 && recipeId < _nextRecipeId, "Recipe does not exist");
        }
        return recipes[recipeId];
    }

    /// @notice Get all recipe IDs for a chef
    /// @param chef The address of the chef
    /// @return Array of recipe IDs
    function getRecipesByChef(address chef) external view returns (uint256[] memory) {
        return _chefRecipes[chef];
    }

    /// @notice Check if a recipe is being processed
    /// @param recipeId The ID of the recipe (use 0 for pending recipes)
    /// @return True if locked for processing
    function isProcessing(uint256 recipeId) external view returns (bool) {
        return processingLock[recipeId];
    }

    /// @notice Get the total number of finalized recipes
    /// @return The total count
    function getTotalRecipes() external view returns (uint256) {
        return _nextRecipeId - 1;
    }

    /// @notice Check if there's a pending recipe waiting for evaluation
    /// @return True if there's a pending recipe
    function hasPendingRecipe() external view returns (bool) {
        return recipes[0].chef != address(0);
    }

    /// @notice Get the pending recipe (if any)
    /// @return The pending recipe data
    function getPendingRecipe() external view returns (Recipe memory) {
        require(recipes[0].chef != address(0), "No pending recipe exists");
        return recipes[0];
    }

    /// @notice Get the token URI for a recipe NFT
    /// @param tokenId The token ID
    /// @return The metadata URI (IPFS)
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory uri = _tokenURIs[tokenId];
        return bytes(uri).length > 0 ? uri : "";
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
