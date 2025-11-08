// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../src/ShopSystem.sol";
import "../src/ItemsERC1155.sol";
import "../src/STOKEN.sol";

contract ShopSystemTest is Test {
    ShopSystem public shop;
    ItemsERC1155 public items;
    STOKEN public stoken;

    address public admin;
    address public user1;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");

    function setUp() public {
        admin = address(this);
        user1 = makeAddr("user1");

        items = new ItemsERC1155();
        stoken = new STOKEN();
        shop = new ShopSystem(address(items), address(stoken));

        items.grantRole(MINTER_ROLE, address(shop));
        stoken.grantRole(MINTER_ROLE, address(shop));
        stoken.grantRole(MINTER_ROLE, admin);
    }

    function testBuyItem() public {
        // Give user STOKEN
        stoken.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        shop.buyItem(1, 5); // Buy 5 wheat seeds

        assertEq(items.balanceOf(user1, 1), 5);
        assertEq(stoken.balanceOf(user1), 950 * 10**18); // 1000 - (10 * 5) = 950
    }

    function testBuyItemInsufficientFunds() public {
        stoken.mint(user1, 30 * 10**18);

        vm.prank(user1);
        vm.expectRevert("Insufficient STOKEN");
        shop.buyItem(1, 5); // Trying to buy 5 wheat seeds (50 STOKEN total)
    }

    function testBuyItemUnavailable() public {
        // Make wheat seed unavailable
        shop.setShopItem(1, 10 * 10**18, false);

        stoken.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        vm.expectRevert("Item not available");
        shop.buyItem(1, 1);
    }

    function testBuyMultipleItems() public {
        stoken.mint(user1, 10000 * 10**18);

        vm.prank(user1);
        shop.buyItem(1, 10); // 10 wheat seeds

        vm.prank(user1);
        shop.buyItem(20, 1); // 1 cow

        assertEq(items.balanceOf(user1, 1), 10);
        assertEq(items.balanceOf(user1, 20), 1);
        assertEq(stoken.balanceOf(user1), 9400 * 10**18); // 10000 - 100 - 500
    }

    function testBuyItemZeroQuantity() public {
        stoken.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        vm.expectRevert("Quantity must be > 0");
        shop.buyItem(1, 0);
    }

    function testGetItemPrice() public {
        assertEq(shop.getItemPrice(1), 10 * 10**18); // Wheat seed
        assertEq(shop.getItemPrice(20), 500 * 10**18); // Cow
    }

    function testGetShopItem() public {
        ShopSystem.ShopItem memory item = shop.getShopItem(1);

        assertEq(item.itemId, 1);
        assertEq(item.price, 10 * 10**18);
        assertTrue(item.available);
    }

    function testSetShopItem() public {
        shop.setShopItem(99, 250 * 10**18, true);

        ShopSystem.ShopItem memory item = shop.getShopItem(99);

        assertEq(item.itemId, 99);
        assertEq(item.price, 250 * 10**18);
        assertTrue(item.available);
    }

    function testSetShopItemUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        shop.setShopItem(99, 250 * 10**18, true);
    }

    function testSetShopItemUpdateExisting() public {
        // Update wheat seed price
        shop.setShopItem(1, 20 * 10**18, true);

        assertEq(shop.getItemPrice(1), 20 * 10**18);
    }

    function testGetAvailableItems() public {
        ShopSystem.ShopItem[] memory availableItems = shop.getAvailableItems();

        assertEq(availableItems.length, 8); // 5 seeds + 3 animals

        // Check first item (wheat seed)
        assertEq(availableItems[0].itemId, 1);
        assertEq(availableItems[0].price, 10 * 10**18);
        assertTrue(availableItems[0].available);
    }

    function testGetAvailableItemsAfterDisabling() public {
        // Disable wheat seed
        shop.setShopItem(1, 10 * 10**18, false);

        ShopSystem.ShopItem[] memory availableItems = shop.getAvailableItems();

        assertEq(availableItems.length, 7); // Now only 7 items available
    }

    function testDefaultShopCatalog() public {
        // Test seeds
        assertEq(shop.getItemPrice(1), 10 * 10**18);  // Wheat
        assertEq(shop.getItemPrice(2), 15 * 10**18);  // Tomato
        assertEq(shop.getItemPrice(3), 20 * 10**18);  // Corn
        assertEq(shop.getItemPrice(4), 8 * 10**18);   // Lettuce
        assertEq(shop.getItemPrice(5), 12 * 10**18);  // Carrot

        // Test animals
        assertEq(shop.getItemPrice(20), 500 * 10**18); // Cow
        assertEq(shop.getItemPrice(21), 200 * 10**18); // Chicken
        assertEq(shop.getItemPrice(22), 800 * 10**18); // Pig
    }

    function testBuyExpensiveItem() public {
        stoken.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        shop.buyItem(22, 1); // Buy pig (800 STOKEN)

        assertEq(items.balanceOf(user1, 22), 1);
        assertEq(stoken.balanceOf(user1), 200 * 10**18);
    }

    function testBuyMultipleExpensiveItems() public {
        stoken.mint(user1, 5000 * 10**18);

        vm.prank(user1);
        shop.buyItem(20, 2); // Buy 2 cows

        vm.prank(user1);
        shop.buyItem(21, 3); // Buy 3 chickens

        assertEq(items.balanceOf(user1, 20), 2);
        assertEq(items.balanceOf(user1, 21), 3);
        assertEq(stoken.balanceOf(user1), 3400 * 10**18); // 5000 - 1000 - 600
    }

    function testItemPurchasedEvent() public {
        stoken.mint(user1, 1000 * 10**18);

        vm.expectEmit(true, true, false, true);
        emit ShopSystem.ItemPurchased(user1, 1, 5, 50 * 10**18);

        vm.prank(user1);
        shop.buyItem(1, 5);
    }

    function testShopItemUpdatedEvent() public {
        vm.expectEmit(true, false, false, true);
        emit ShopSystem.ShopItemUpdated(99, 100 * 10**18, true);

        shop.setShopItem(99, 100 * 10**18, true);
    }
}
