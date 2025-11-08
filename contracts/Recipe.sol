// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Player.sol";

/**
 * @title Recipe
 * @dev Manages recipe creation, evaluation, and publishing to restaurant
 */
contract Recipe is Ownable {
    enum Grade {
        F,
        D,
        C,
        B,
        A,
        S
    }

    struct RecipeData {
        uint256 recipeId;
        address owner;
        address inventor;
        string name;
        string description;
        uint256 difficultyLevel;
        string ingredientRates; // JSON format: {"tomato": 2, "egg": 1}
        string cookingInstructions;
        uint256 createdAt;
        bool published;
    }

    struct RecipeEvaluation {
        uint256 recipeId;
        Grade grade;
        uint256 revenueRate; // tokens per minute
        string critics;
        uint256 evaluatedAt;
    }

    Player public playerContract;

    mapping(uint256 => RecipeData) public recipes;
    mapping(uint256 => RecipeEvaluation) public evaluations;
    mapping(address => uint256[]) public playerRecipes;

    uint256 public nextRecipeId = 1;

    event RecipeCreated(uint256 indexed recipeId, address indexed owner, string name);
    event RecipeEvaluated(uint256 indexed recipeId, Grade grade, uint256 revenueRate);
    event RecipePublished(uint256 indexed recipeId, address indexed owner);

    constructor(address _playerContractAddress) Ownable(msg.sender) {
        playerContract = Player(_playerContractAddress);
    }

    /**
     * @dev Create a new recipe (requires CHEF role)
     * @param _name Recipe name
     * @param _description Recipe description
     * @param _difficultyLevel Difficulty level (1-10)
     * @param _ingredientRates JSON string of ingredient rates
     * @param _cookingInstructions Cooking instructions
     */
    function createRecipe(
        string calldata _name,
        string calldata _description,
        uint256 _difficultyLevel,
        string calldata _ingredientRates,
        string calldata _cookingInstructions
    ) external returns (uint256) {
        require(playerContract.isPlayerRegistered(msg.sender), "Recipe: player not registered");
        Player.Role role = playerContract.getPlayerRole(msg.sender);
        require(role == Player.Role.CHEF, "Recipe: only CHEF role can create recipes");
        require(_difficultyLevel > 0 && _difficultyLevel <= 10, "Recipe: difficulty must be 1-10");

        uint256 recipeId = nextRecipeId++;

        recipes[recipeId] = RecipeData({
            recipeId: recipeId,
            owner: msg.sender,
            inventor: msg.sender,
            name: _name,
            description: _description,
            difficultyLevel: _difficultyLevel,
            ingredientRates: _ingredientRates,
            cookingInstructions: _cookingInstructions,
            createdAt: block.timestamp,
            published: false
        });

        playerRecipes[msg.sender].push(recipeId);

        emit RecipeCreated(recipeId, msg.sender, _name);
        return recipeId;
    }

    /**
     * @dev Evaluate a recipe with grade and revenue rate (called by owner/authorized evaluator)
     * @param _recipeId Recipe ID
     * @param _grade Recipe grade (0=F, 1=D, 2=C, 3=B, 4=A, 5=S)
     * @param _revenueRate Revenue rate (tokens per minute)
     * @param _critics Evaluation comments
     */
    function evaluateRecipe(
        uint256 _recipeId,
        Grade _grade,
        uint256 _revenueRate,
        string calldata _critics
    ) external onlyOwner {
        require(recipes[_recipeId].createdAt > 0, "Recipe: recipe not found");

        evaluations[_recipeId] = RecipeEvaluation({
            recipeId: _recipeId,
            grade: _grade,
            revenueRate: _revenueRate,
            critics: _critics,
            evaluatedAt: block.timestamp
        });

        emit RecipeEvaluated(_recipeId, _grade, _revenueRate);
    }

    /**
     * @dev Publish a recipe to restaurant (makes it deployable)
     * @param _recipeId Recipe ID
     */
    function publishRecipe(uint256 _recipeId) external {
        require(recipes[_recipeId].createdAt > 0, "Recipe: recipe not found");
        require(recipes[_recipeId].owner == msg.sender, "Recipe: only owner can publish");
        require(!recipes[_recipeId].published, "Recipe: already published");
        require(evaluations[_recipeId].evaluatedAt > 0, "Recipe: must be evaluated first");

        recipes[_recipeId].published = true;
        emit RecipePublished(_recipeId, msg.sender);
    }

    /**
     * @dev Get recipe data
     * @param _recipeId Recipe ID
     */
    function getRecipe(uint256 _recipeId) external view returns (RecipeData memory) {
        require(recipes[_recipeId].createdAt > 0, "Recipe: recipe not found");
        return recipes[_recipeId];
    }

    /**
     * @dev Get recipe evaluation
     * @param _recipeId Recipe ID
     */
    function getEvaluation(uint256 _recipeId) external view returns (RecipeEvaluation memory) {
        require(evaluations[_recipeId].evaluatedAt > 0, "Recipe: not evaluated");
        return evaluations[_recipeId];
    }

    /**
     * @dev Get all recipes by a player
     * @param _player Player address
     */
    function getPlayerRecipes(address _player) external view returns (uint256[] memory) {
        return playerRecipes[_player];
    }

    /**
     * @dev Get published recipes count
     */
    function getPublishedRecipesCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextRecipeId; i++) {
            if (recipes[i].published) {
                count++;
            }
        }
        return count;
    }
}
