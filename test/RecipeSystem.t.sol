// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/RecipeSystem.sol";

contract RecipeSystemTest is Test {
    RecipeSystem public recipeSystem;
    address public admin;
    address public grader;
    address public chef1;
    address public chef2;
    address public nonGrader;

    bytes32 public constant GRADER_ROLE = keccak256("GRADER_ROLE");

    event RecipeRequested(
        uint256 indexed recipeId,
        address indexed chef,
        string instruction,
        string ingredients,
        uint256 timestamp
    );

    event RecipeFinalized(
        uint256 indexed recipeId,
        address indexed chef,
        string dishDescription,
        uint8 grade,
        uint256 revenueRate,
        string critics
    );

    function setUp() public {
        admin = address(this);
        grader = makeAddr("grader");
        chef1 = makeAddr("chef1");
        chef2 = makeAddr("chef2");
        nonGrader = makeAddr("nonGrader");

        recipeSystem = new RecipeSystem();
        recipeSystem.grantRole(GRADER_ROLE, grader);
    }

    // ============ requestRecipe Tests ============

    function testRequestRecipe() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe(
            "Mix ingredients and bake at 350F for 30 minutes",
            "flour, sugar, eggs, butter"
        );

        assertEq(recipeId, 1);

        RecipeSystem.Recipe memory recipe = recipeSystem.getRecipe(1);
        assertEq(recipe.recipeId, 1);
        assertEq(recipe.chef, chef1);
        assertEq(recipe.instruction, "Mix ingredients and bake at 350F for 30 minutes");
        assertEq(recipe.ingredients, "flour, sugar, eggs, butter");
        assertEq(recipe.evaluated, false);
        assertEq(recipe.grade, 0);
    }

    function testRequestRecipeEmitsEvent() public {
        vm.prank(chef1);

        vm.expectEmit(true, true, false, true);
        emit RecipeRequested(
            1,
            chef1,
            "Mix ingredients and bake at 350F for 30 minutes",
            "flour, sugar, eggs, butter",
            block.timestamp
        );

        recipeSystem.requestRecipe(
            "Mix ingredients and bake at 350F for 30 minutes",
            "flour, sugar, eggs, butter"
        );
    }

    function testRequestRecipeIncrementsId() public {
        vm.prank(chef1);
        uint256 recipeId1 = recipeSystem.requestRecipe("instruction1", "ingredients1");

        vm.prank(chef2);
        uint256 recipeId2 = recipeSystem.requestRecipe("instruction2", "ingredients2");

        assertEq(recipeId1, 1);
        assertEq(recipeId2, 2);
        assertEq(recipeSystem.getTotalRecipes(), 2);
    }

    function testRequestRecipeRevertsOnEmptyInstruction() public {
        vm.prank(chef1);
        vm.expectRevert("Instruction cannot be empty");
        recipeSystem.requestRecipe("", "flour, sugar");
    }

    function testRequestRecipeRevertsOnEmptyIngredients() public {
        vm.prank(chef1);
        vm.expectRevert("Ingredients cannot be empty");
        recipeSystem.requestRecipe("Mix and bake", "");
    }

    function testGetRecipesByChef() public {
        vm.prank(chef1);
        recipeSystem.requestRecipe("instruction1", "ingredients1");

        vm.prank(chef1);
        recipeSystem.requestRecipe("instruction2", "ingredients2");

        vm.prank(chef2);
        recipeSystem.requestRecipe("instruction3", "ingredients3");

        uint256[] memory chef1Recipes = recipeSystem.getRecipesByChef(chef1);
        uint256[] memory chef2Recipes = recipeSystem.getRecipesByChef(chef2);

        assertEq(chef1Recipes.length, 2);
        assertEq(chef2Recipes.length, 1);
        assertEq(chef1Recipes[0], 1);
        assertEq(chef1Recipes[1], 2);
        assertEq(chef2Recipes[0], 3);
    }

    // ============ finalizeRecipe Tests ============

    function testFinalizeRecipe() public {
        // First create a recipe
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        // Finalize it
        vm.prank(grader);
        recipeSystem.finalizeRecipe(
            recipeId,
            "Delicious homemade cake",
            85,
            150,
            "Great creativity and technique"
        );

        RecipeSystem.Recipe memory recipe = recipeSystem.getRecipe(recipeId);
        assertEq(recipe.evaluated, true);
        assertEq(recipe.dishDescription, "Delicious homemade cake");
        assertEq(recipe.grade, 85);
        assertEq(recipe.revenueRate, 150);
        assertEq(recipe.critics, "Great creativity and technique");
    }

    function testFinalizeRecipeMintsNFT() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        assertEq(recipeSystem.balanceOf(chef1), 0);

        vm.prank(grader);
        recipeSystem.finalizeRecipe(recipeId, "Delicious dish", 85, 150, "Great job");

        assertEq(recipeSystem.balanceOf(chef1), 1);
        assertEq(recipeSystem.ownerOf(recipeId), chef1);
    }

    function testFinalizeRecipeEmitsEvent() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        vm.prank(grader);
        vm.expectEmit(true, true, false, true);
        emit RecipeFinalized(
            recipeId,
            chef1,
            "Delicious dish",
            85,
            150,
            "Great job"
        );

        recipeSystem.finalizeRecipe(recipeId, "Delicious dish", 85, 150, "Great job");
    }

    function testFinalizeRecipeSetsProcessingLock() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        assertEq(recipeSystem.isProcessing(recipeId), false);

        vm.prank(grader);
        recipeSystem.finalizeRecipe(recipeId, "Delicious dish", 85, 150, "Great job");

        assertEq(recipeSystem.isProcessing(recipeId), true);
    }

    function testFinalizeRecipeRevertsIfNotGrader() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        vm.prank(nonGrader);
        vm.expectRevert();
        recipeSystem.finalizeRecipe(recipeId, "Delicious dish", 85, 150, "Great job");
    }

    function testFinalizeRecipeRevertsIfAlreadyEvaluated() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        vm.prank(grader);
        recipeSystem.finalizeRecipe(recipeId, "Delicious dish", 85, 150, "Great job");

        vm.prank(grader);
        vm.expectRevert("Recipe already evaluated");
        recipeSystem.finalizeRecipe(recipeId, "Another dish", 90, 160, "Even better");
    }

    function testFinalizeRecipeRevertsIfRecipeDoesNotExist() public {
        vm.prank(grader);
        vm.expectRevert("Recipe does not exist");
        recipeSystem.finalizeRecipe(999, "Delicious dish", 85, 150, "Great job");
    }

    function testFinalizeRecipeRevertsOnInvalidGradeTooLow() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        vm.prank(grader);
        vm.expectRevert("Grade must be between 1 and 100");
        recipeSystem.finalizeRecipe(recipeId, "Delicious dish", 0, 150, "Great job");
    }

    function testFinalizeRecipeRevertsOnInvalidGradeTooHigh() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        vm.prank(grader);
        vm.expectRevert("Grade must be between 1 and 100");
        recipeSystem.finalizeRecipe(recipeId, "Delicious dish", 101, 150, "Great job");
    }

    function testFinalizeRecipeWithMinimumGrade() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        vm.prank(grader);
        recipeSystem.finalizeRecipe(recipeId, "Needs improvement", 1, 50, "Try again");

        RecipeSystem.Recipe memory recipe = recipeSystem.getRecipe(recipeId);
        assertEq(recipe.grade, 1);
    }

    function testFinalizeRecipeWithMaximumGrade() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        vm.prank(grader);
        recipeSystem.finalizeRecipe(recipeId, "Perfect dish", 100, 200, "Masterpiece");

        RecipeSystem.Recipe memory recipe = recipeSystem.getRecipe(recipeId);
        assertEq(recipe.grade, 100);
    }

    // ============ Access Control Tests ============

    function testAdminCanGrantGraderRole() public {
        address newGrader = makeAddr("newGrader");

        recipeSystem.grantRole(GRADER_ROLE, newGrader);

        assertTrue(recipeSystem.hasRole(GRADER_ROLE, newGrader));
    }

    function testAdminCanRevokeGraderRole() public {
        recipeSystem.revokeRole(GRADER_ROLE, grader);

        assertFalse(recipeSystem.hasRole(GRADER_ROLE, grader));
    }

    function testNonAdminCannotGrantGraderRole() public {
        address newGrader = makeAddr("newGrader");

        vm.prank(nonGrader);
        vm.expectRevert();
        recipeSystem.grantRole(GRADER_ROLE, newGrader);
    }

    // ============ View Function Tests ============

    function testGetRecipe() public {
        vm.prank(chef1);
        recipeSystem.requestRecipe("instruction", "ingredients");

        RecipeSystem.Recipe memory recipe = recipeSystem.getRecipe(1);

        assertEq(recipe.recipeId, 1);
        assertEq(recipe.chef, chef1);
        assertEq(recipe.instruction, "instruction");
        assertEq(recipe.ingredients, "ingredients");
    }

    function testGetRecipeRevertsForNonExistentRecipe() public {
        vm.expectRevert("Recipe does not exist");
        recipeSystem.getRecipe(999);
    }

    function testGetTotalRecipes() public {
        assertEq(recipeSystem.getTotalRecipes(), 0);

        vm.prank(chef1);
        recipeSystem.requestRecipe("instruction1", "ingredients1");
        assertEq(recipeSystem.getTotalRecipes(), 1);

        vm.prank(chef2);
        recipeSystem.requestRecipe("instruction2", "ingredients2");
        assertEq(recipeSystem.getTotalRecipes(), 2);
    }

    function testIsProcessing() public {
        vm.prank(chef1);
        uint256 recipeId = recipeSystem.requestRecipe("instruction", "ingredients");

        assertEq(recipeSystem.isProcessing(recipeId), false);

        vm.prank(grader);
        recipeSystem.finalizeRecipe(recipeId, "Delicious dish", 85, 150, "Great job");

        assertEq(recipeSystem.isProcessing(recipeId), true);
    }

    // ============ Integration Tests ============

    function testMultipleRecipesEndToEnd() public {
        // Chef1 creates two recipes
        vm.prank(chef1);
        uint256 recipe1 = recipeSystem.requestRecipe("instruction1", "ingredients1");

        vm.prank(chef1);
        uint256 recipe2 = recipeSystem.requestRecipe("instruction2", "ingredients2");

        // Chef2 creates one recipe
        vm.prank(chef2);
        uint256 recipe3 = recipeSystem.requestRecipe("instruction3", "ingredients3");

        // Grader finalizes recipe1 and recipe3
        vm.prank(grader);
        recipeSystem.finalizeRecipe(recipe1, "Dish 1", 75, 120, "Good");

        vm.prank(grader);
        recipeSystem.finalizeRecipe(recipe3, "Dish 3", 90, 180, "Excellent");

        // Check NFT ownership
        assertEq(recipeSystem.balanceOf(chef1), 1);
        assertEq(recipeSystem.balanceOf(chef2), 1);
        assertEq(recipeSystem.ownerOf(recipe1), chef1);
        assertEq(recipeSystem.ownerOf(recipe3), chef2);

        // Check recipe states
        assertTrue(recipeSystem.getRecipe(recipe1).evaluated);
        assertFalse(recipeSystem.getRecipe(recipe2).evaluated);
        assertTrue(recipeSystem.getRecipe(recipe3).evaluated);
    }

    function testSupportsInterface() public {
        // ERC721 interface
        assertTrue(recipeSystem.supportsInterface(0x80ac58cd));
        // AccessControl interface
        assertTrue(recipeSystem.supportsInterface(0x7965db0b));
    }
}
