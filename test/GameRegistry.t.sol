// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GameRegistry.sol";
import "../src/ItemsERC1155.sol";
import "../src/STOKEN.sol";
import "../src/PlantSystem.sol";

contract GameRegistryTest is Test {
    GameRegistry public registry;
    ItemsERC1155 public items;
    STOKEN public stoken;
    PlantSystem public plantSystem;

    address public admin;
    address public user1;
    address public user2;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");

    function setUp() public {
        admin = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy contracts
        items = new ItemsERC1155();
        stoken = new STOKEN();
        registry = new GameRegistry(address(items), address(stoken));
        plantSystem = new PlantSystem(address(items), address(stoken));

        // Set up roles
        items.grantRole(MINTER_ROLE, address(registry));
        items.grantRole(MINTER_ROLE, address(plantSystem));
        stoken.grantRole(MINTER_ROLE, address(registry));
        plantSystem.grantRole(MINTER_ROLE, address(registry));

        // Link PlantSystem to GameRegistry
        registry.setPlantSystem(address(plantSystem));
    }

    function testRegisterPlayer() public {
        vm.prank(user1);
        registry.registerPlayer();

        assertTrue(registry.isRegistered(user1));
        assertEq(stoken.balanceOf(user1), 100 * 10**18);
        assertEq(items.balanceOf(user1, 1), 5); // 5 Wheat Seeds
        assertEq(items.balanceOf(user1, 2), 3); // 3 Tomato Seeds
        assertEq(plantSystem.getPlotCapacity(user1), 3);
    }

    function testRegisterPlayerTwice() public {
        vm.prank(user1);
        registry.registerPlayer();

        vm.prank(user1);
        vm.expectRevert("Already registered");
        registry.registerPlayer();
    }

    function testIsRegistered() public {
        assertFalse(registry.isRegistered(user1));

        vm.prank(user1);
        registry.registerPlayer();

        assertTrue(registry.isRegistered(user1));
    }

    function testSetStarterPack() public {
        uint256[] memory itemIds = new uint256[](3);
        itemIds[0] = 1;
        itemIds[1] = 2;
        itemIds[2] = 3;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 10;
        amounts[1] = 5;
        amounts[2] = 3;

        registry.setStarterPack(itemIds, amounts);

        (uint256[] memory storedIds, uint256[] memory storedAmounts) = registry.getStarterPack();

        assertEq(storedIds.length, 3);
        assertEq(storedIds[0], 1);
        assertEq(storedIds[1], 2);
        assertEq(storedIds[2], 3);
        assertEq(storedAmounts[0], 10);
        assertEq(storedAmounts[1], 5);
        assertEq(storedAmounts[2], 3);
    }

    function testSetStarterPackUnauthorized() public {
        uint256[] memory itemIds = new uint256[](1);
        itemIds[0] = 1;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 10;

        vm.prank(user1);
        vm.expectRevert();
        registry.setStarterPack(itemIds, amounts);
    }

    function testSetStarterPackLengthMismatch() public {
        uint256[] memory itemIds = new uint256[](2);
        itemIds[0] = 1;
        itemIds[1] = 2;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 10;

        vm.expectRevert("Length mismatch");
        registry.setStarterPack(itemIds, amounts);
    }

    function testStarterPackDistributed() public {
        // Custom starter pack
        uint256[] memory itemIds = new uint256[](2);
        itemIds[0] = 3;
        itemIds[1] = 4;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 7;
        amounts[1] = 9;

        registry.setStarterPack(itemIds, amounts);

        vm.prank(user1);
        registry.registerPlayer();

        assertEq(items.balanceOf(user1, 3), 7);
        assertEq(items.balanceOf(user1, 4), 9);
    }

    function testRegisterPlayerEvent() public {
        vm.expectEmit(true, false, false, true);
        emit GameRegistry.PlayerRegistered(user1, block.timestamp);

        vm.prank(user1);
        registry.registerPlayer();
    }
}
