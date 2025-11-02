// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Recipe.sol";

/**
 * @title Leaderboard
 * @dev Manages global leaderboard rankings based on recipe grades
 */
contract Leaderboard is Ownable {
    struct LeaderboardEntry {
        address player;
        string playerName;
        uint256 bestRecipeId;
        Recipe.Grade bestGrade;
        uint256 totalRecipesPublished;
        uint256 averageGrade;
        uint256 totalRevenue;
    }

    Recipe public recipeContract;

    mapping(address => LeaderboardEntry) public leaderboardEntries;
    address[] public leaderboardPlayers;

    event EntryUpdated(address indexed player, Recipe.Grade bestGrade, uint256 totalRecipesPublished);

    constructor(address _recipeContractAddress) Ownable(msg.sender) {
        recipeContract = Recipe(_recipeContractAddress);
    }

    /**
     * @dev Update leaderboard entry for a player (called when recipe is published)
     * @param _player Player address
     * @param _playerName Player name
     * @param _recipeId Recipe ID
     */
    function updateEntry(
        address _player,
        string calldata _playerName,
        uint256 _recipeId
    ) external onlyOwner {
        Recipe.RecipeData memory recipe = recipeContract.getRecipe(_recipeId);
        require(recipe.owner == _player, "Leaderboard: recipe owner mismatch");

        Recipe.RecipeEvaluation memory evaluation = recipeContract.getEvaluation(_recipeId);

        // If entry doesn't exist, create it
        if (leaderboardEntries[_player].player == address(0)) {
            leaderboardPlayers.push(_player);
        }

        LeaderboardEntry storage entry = leaderboardEntries[_player];
        entry.player = _player;
        entry.playerName = _playerName;
        entry.bestRecipeId = _recipeId;
        entry.bestGrade = evaluation.grade;
        entry.totalRevenue += evaluation.revenueRate;

        // Count published recipes
        uint256[] memory playerRecipes = recipeContract.getPlayerRecipes(_player);
        uint256 publishedCount = 0;
        for (uint256 i = 0; i < playerRecipes.length; i++) {
            Recipe.RecipeData memory recipeData = recipeContract.getRecipe(playerRecipes[i]);
            if (recipeData.published) {
                publishedCount++;
            }
        }
        entry.totalRecipesPublished = publishedCount;

        emit EntryUpdated(_player, evaluation.grade, publishedCount);
    }

    /**
     * @dev Get leaderboard entry for a player
     * @param _player Player address
     */
    function getEntry(address _player) external view returns (LeaderboardEntry memory) {
        return leaderboardEntries[_player];
    }

    /**
     * @dev Get leaderboard size
     */
    function getLeaderboardSize() external view returns (uint256) {
        return leaderboardPlayers.length;
    }

    /**
     * @dev Get player at leaderboard position
     * @param _index Position in leaderboard
     */
    function getLeaderboardAt(uint256 _index) external view returns (LeaderboardEntry memory) {
        require(_index < leaderboardPlayers.length, "Leaderboard: index out of bounds");
        return leaderboardEntries[leaderboardPlayers[_index]];
    }

    /**
     * @dev Get top N players by grade
     * @param _count Number of top players to return
     */
    function getTopPlayers(uint256 _count) external view returns (LeaderboardEntry[] memory) {
        uint256 size = leaderboardPlayers.length;
        uint256 returnCount = _count < size ? _count : size;

        LeaderboardEntry[] memory topPlayers = new LeaderboardEntry[](returnCount);

        // Create array of entries
        LeaderboardEntry[] memory allEntries = new LeaderboardEntry[](size);
        for (uint256 i = 0; i < size; i++) {
            allEntries[i] = leaderboardEntries[leaderboardPlayers[i]];
        }

        // Sort by grade (simple bubble sort for small arrays)
        for (uint256 i = 0; i < size; i++) {
            for (uint256 j = 0; j < size - i - 1; j++) {
                if (uint256(allEntries[j].bestGrade) < uint256(allEntries[j + 1].bestGrade)) {
                    LeaderboardEntry memory temp = allEntries[j];
                    allEntries[j] = allEntries[j + 1];
                    allEntries[j + 1] = temp;
                }
            }
        }

        // Return top entries
        for (uint256 i = 0; i < returnCount; i++) {
            topPlayers[i] = allEntries[i];
        }

        return topPlayers;
    }

    /**
     * @dev Get player rank
     * @param _player Player address
     */
    function getPlayerRank(address _player) external view returns (uint256) {
        require(leaderboardEntries[_player].player != address(0), "Leaderboard: player not found");

        uint256 rank = 1;
        uint256 playerGrade = uint256(leaderboardEntries[_player].bestGrade);

        for (uint256 i = 0; i < leaderboardPlayers.length; i++) {
            if (uint256(leaderboardEntries[leaderboardPlayers[i]].bestGrade) > playerGrade) {
                rank++;
            } else if (
                uint256(leaderboardEntries[leaderboardPlayers[i]].bestGrade) == playerGrade
                    && leaderboardEntries[leaderboardPlayers[i]].totalRevenue
                        > leaderboardEntries[_player].totalRevenue
            ) {
                rank++;
            }
        }

        return rank;
    }
}
