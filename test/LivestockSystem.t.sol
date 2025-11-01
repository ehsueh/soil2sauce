// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LivestockSystem.sol";
import "../src/ItemsERC1155.sol";

contract LivestockSystemTest is Test {
    LivestockSystem public livestock;
    ItemsERC1155 public items;

    address public admin;
    address public user1;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");

    function setUp() public {
        admin = address(this);
        user1 = makeAddr("user1");

        items = new ItemsERC1155();
        livestock = new LivestockSystem(address(items));

        items.grantRole(MINTER_ROLE, address(livestock));
    }

    function testClaimProducts() public {
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 20, 1); // Give user 1 cow

        vm.prank(user1);
        (uint256 productId, uint256 amount) = livestock.claimProducts(20);

        // Should get either milk (30) or cheese (33)
        assertTrue(productId == 30 || productId == 33);
        assertEq(amount, 2); // 2 products per claim for cow
        assertEq(items.balanceOf(user1, productId), 2);
    }

    function testClaimProductsTooEarly() public {
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 20, 1);

        vm.prank(user1);
        livestock.claimProducts(20);

        // Try to claim immediately again
        vm.prank(user1);
        vm.expectRevert("Cooldown active");
        livestock.claimProducts(20);
    }

    function testClaimProductsNoAnimals() public {
        vm.prank(user1);
        vm.expectRevert("No animals owned");
        livestock.claimProducts(20);
    }

    function testClaimProductsMultipleAnimals() public {
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 20, 5); // Give user 5 cows

        vm.prank(user1);
        (uint256 productId, uint256 amount) = livestock.claimProducts(20);

        assertEq(amount, 10); // 2 products per claim × 5 cows = 10
    }

    function testClaimAfterCooldown() public {
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 20, 1);

        vm.prank(user1);
        livestock.claimProducts(20);

        // Fast forward 12 hours
        vm.warp(block.timestamp + 12 hours);

        vm.prank(user1);
        (uint256 productId, uint256 amount) = livestock.claimProducts(20);

        assertTrue(productId == 30 || productId == 33);
        assertEq(amount, 2);
    }

    function testGetNextClaimTime() public {
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 20, 1);

        // Before any claims
        assertEq(livestock.getNextClaimTime(user1, 20), 0);

        uint256 claimTime = block.timestamp;
        vm.prank(user1);
        livestock.claimProducts(20);

        // After claiming
        assertEq(livestock.getNextClaimTime(user1, 20), claimTime + 12 hours);
    }

    function testProbabilityDistribution() public {
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 20, 1);

        uint256 milkCount = 0;
        uint256 cheeseCount = 0;

        // Claim 100 times to test distribution
        for (uint256 i = 0; i < 100; i++) {
            vm.warp(block.timestamp + 12 hours);
            vm.prank(user1);
            (uint256 productId,) = livestock.claimProducts(20);

            if (productId == 30) milkCount++;
            if (productId == 33) cheeseCount++;
        }

        // Should get mostly milk (95%) and some cheese (5%)
        // With 100 samples, expect ~95 milk and ~5 cheese (allowing for variance)
        assertGt(milkCount, 80); // At least 80 milk
        assertGt(cheeseCount, 0); // At least some cheese
        assertEq(milkCount + cheeseCount, 100);
    }

    function testSetAnimalConfig() public {
        LivestockSystem.ProductProbability[] memory products = new LivestockSystem.ProductProbability[](2);
        products[0] = LivestockSystem.ProductProbability(100, 7000); // 70% product 100
        products[1] = LivestockSystem.ProductProbability(101, 3000); // 30% product 101

        livestock.setAnimalConfig(99, products, 5, 6 hours, true);

        (uint256 id, LivestockSystem.ProductProbability[] memory storedProducts, uint256 productAmount, uint256 cooldown, bool active) =
            livestock.getAnimalConfig(99);

        assertEq(id, 99);
        assertEq(storedProducts.length, 2);
        assertEq(storedProducts[0].productId, 100);
        assertEq(storedProducts[0].probability, 7000);
        assertEq(storedProducts[1].productId, 101);
        assertEq(storedProducts[1].probability, 3000);
        assertEq(productAmount, 5);
        assertEq(cooldown, 6 hours);
        assertTrue(active);
    }

    function testSetAnimalConfigUnauthorized() public {
        LivestockSystem.ProductProbability[] memory products = new LivestockSystem.ProductProbability[](1);
        products[0] = LivestockSystem.ProductProbability(100, 10000);

        vm.prank(user1);
        vm.expectRevert();
        livestock.setAnimalConfig(99, products, 5, 6 hours, true);
    }

    function testSetAnimalConfigInvalidProbability() public {
        LivestockSystem.ProductProbability[] memory products = new LivestockSystem.ProductProbability[](2);
        products[0] = LivestockSystem.ProductProbability(100, 5000);
        products[1] = LivestockSystem.ProductProbability(101, 4000); // Totals to 9000, not 10000

        vm.expectRevert("Probabilities must sum to 10000");
        livestock.setAnimalConfig(99, products, 5, 6 hours, true);
    }

    function testDefaultAnimalConfigs() public {
        // Test cow config (id=20)
        (uint256 id, LivestockSystem.ProductProbability[] memory products, uint256 productAmount, uint256 cooldown, bool active) =
            livestock.getAnimalConfig(20);

        assertEq(id, 20);
        assertEq(products.length, 2);
        assertEq(products[0].productId, 30); // Milk
        assertEq(products[0].probability, 9500); // 95%
        assertEq(products[1].productId, 33); // Cheese
        assertEq(products[1].probability, 500); // 5%
        assertEq(productAmount, 2);
        assertEq(cooldown, 12 hours);
        assertTrue(active);

        // Test chicken config (id=21)
        (id, products, productAmount, cooldown, active) = livestock.getAnimalConfig(21);

        assertEq(id, 21);
        assertEq(products[0].productId, 31); // Egg
        assertEq(products[0].probability, 9000); // 90%
        assertEq(products[1].productId, 34); // Feather
        assertEq(products[1].probability, 1000); // 10%
        assertEq(productAmount, 3);
        assertEq(cooldown, 8 hours);

        // Test pig config (id=22)
        (id, products, productAmount, cooldown, active) = livestock.getAnimalConfig(22);

        assertEq(id, 22);
        assertEq(products[0].productId, 32); // Pork
        assertEq(products[0].probability, 8000); // 80%
        assertEq(products[1].productId, 35); // Bacon
        assertEq(products[1].probability, 2000); // 20%
        assertEq(productAmount, 1);
        assertEq(cooldown, 24 hours);
    }

    function testClaimDifferentAnimals() public {
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 20, 1); // Cow
        items.mint(user1, 21, 1); // Chicken
        items.mint(user1, 22, 1); // Pig

        // Claim from cow
        vm.prank(user1);
        (uint256 productId1,) = livestock.claimProducts(20);
        assertTrue(productId1 == 30 || productId1 == 33);

        // Claim from chicken (different cooldown)
        vm.prank(user1);
        (uint256 productId2,) = livestock.claimProducts(21);
        assertTrue(productId2 == 31 || productId2 == 34);

        // Claim from pig (different cooldown)
        vm.prank(user1);
        (uint256 productId3,) = livestock.claimProducts(22);
        assertTrue(productId3 == 32 || productId3 == 35);
    }
}
