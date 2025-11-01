// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ItemsERC1155.sol";

contract ItemsERC1155Test is Test {
    ItemsERC1155 public items;
    address public admin;
    address public minter;
    address public user1;
    address public user2;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    function setUp() public {
        admin = address(this);
        minter = makeAddr("minter");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        items = new ItemsERC1155();
        items.grantRole(MINTER_ROLE, minter);
    }

    function testMint() public {
        vm.prank(minter);
        items.mint(user1, 1, 100);

        assertEq(items.balanceOf(user1, 1), 100);
    }

    function testMintUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        items.mint(user1, 1, 100);
    }

    function testMintBatch() public {
        uint256[] memory ids = new uint256[](2);
        ids[0] = 1;
        ids[1] = 2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 50;
        amounts[1] = 75;

        vm.prank(minter);
        items.mintBatch(user1, ids, amounts);

        assertEq(items.balanceOf(user1, 1), 50);
        assertEq(items.balanceOf(user1, 2), 75);
    }

    function testBurn() public {
        vm.prank(minter);
        items.mint(user1, 1, 100);

        vm.prank(minter);
        items.burn(user1, 1, 30);

        assertEq(items.balanceOf(user1, 1), 70);
    }

    function testBurnInsufficientBalance() public {
        vm.prank(minter);
        items.mint(user1, 1, 50);

        vm.prank(minter);
        vm.expectRevert();
        items.burn(user1, 1, 100);
    }

    function testBurnBatch() public {
        uint256[] memory ids = new uint256[](2);
        ids[0] = 1;
        ids[1] = 2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100;
        amounts[1] = 200;

        vm.prank(minter);
        items.mintBatch(user1, ids, amounts);

        uint256[] memory burnAmounts = new uint256[](2);
        burnAmounts[0] = 30;
        burnAmounts[1] = 50;

        vm.prank(minter);
        items.burnBatch(user1, ids, burnAmounts);

        assertEq(items.balanceOf(user1, 1), 70);
        assertEq(items.balanceOf(user1, 2), 150);
    }

    function testBalanceOfBatch() public {
        vm.prank(minter);
        items.mint(user1, 1, 100);

        vm.prank(minter);
        items.mint(user2, 1, 200);

        address[] memory accounts = new address[](2);
        accounts[0] = user1;
        accounts[1] = user2;

        uint256[] memory ids = new uint256[](2);
        ids[0] = 1;
        ids[1] = 1;

        uint256[] memory balances = items.balanceOfBatch(accounts, ids);

        assertEq(balances[0], 100);
        assertEq(balances[1], 200);
    }

    function testTransfer() public {
        vm.prank(minter);
        items.mint(user1, 1, 100);

        vm.prank(user1);
        items.safeTransferFrom(user1, user2, 1, 50, "");

        assertEq(items.balanceOf(user1, 1), 50);
        assertEq(items.balanceOf(user2, 1), 50);
    }

    function testSupportsInterface() public {
        // ERC1155 interface
        assertTrue(items.supportsInterface(0xd9b67a26));
        // AccessControl interface
        assertTrue(items.supportsInterface(0x7965db0b));
    }
}
