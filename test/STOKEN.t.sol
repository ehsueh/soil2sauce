// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../src/STOKEN.sol";

contract STOKENTest is Test {
    STOKEN public stoken;
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

        stoken = new STOKEN();
        stoken.grantRole(MINTER_ROLE, minter);
    }

    function testMint() public {
        vm.prank(minter);
        stoken.mint(user1, 1000 * 10**18);

        assertEq(stoken.balanceOf(user1), 1000 * 10**18);
    }

    function testMintUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        stoken.mint(user1, 1000 * 10**18);
    }

    function testBurn() public {
        vm.prank(minter);
        stoken.mint(user1, 1000 * 10**18);

        vm.prank(minter);
        stoken.burn(user1, 300 * 10**18);

        assertEq(stoken.balanceOf(user1), 700 * 10**18);
    }

    function testBurnInsufficientBalance() public {
        vm.prank(minter);
        stoken.mint(user1, 500 * 10**18);

        vm.prank(minter);
        vm.expectRevert();
        stoken.burn(user1, 1000 * 10**18);
    }

    function testTransfer() public {
        vm.prank(minter);
        stoken.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        stoken.transfer(user2, 300 * 10**18);

        assertEq(stoken.balanceOf(user1), 700 * 10**18);
        assertEq(stoken.balanceOf(user2), 300 * 10**18);
    }

    function testApproveAndTransferFrom() public {
        vm.prank(minter);
        stoken.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        stoken.approve(user2, 500 * 10**18);

        assertEq(stoken.allowance(user1, user2), 500 * 10**18);

        vm.prank(user2);
        stoken.transferFrom(user1, user2, 300 * 10**18);

        assertEq(stoken.balanceOf(user1), 700 * 10**18);
        assertEq(stoken.balanceOf(user2), 300 * 10**18);
        assertEq(stoken.allowance(user1, user2), 200 * 10**18);
    }

    function testName() public {
        assertEq(stoken.name(), "Soil2Sauce Token");
    }

    function testSymbol() public {
        assertEq(stoken.symbol(), "STOKEN");
    }

    function testDecimals() public {
        assertEq(stoken.decimals(), 18);
    }
}
