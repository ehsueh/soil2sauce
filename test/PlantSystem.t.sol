// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PlantSystem.sol";
import "../src/ItemsERC1155.sol";
import "../src/STOKEN.sol";

contract PlantSystemTest is Test {
    PlantSystem public plantSystem;
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
        plantSystem = new PlantSystem(address(items), address(stoken));

        items.grantRole(MINTER_ROLE, address(plantSystem));
        stoken.grantRole(MINTER_ROLE, address(plantSystem));
    }

    function testInitializePlayer() public {
        plantSystem.initializePlayer(user1);

        assertEq(plantSystem.getPlotCapacity(user1), 3);
    }

    function testInitializePlayerTwice() public {
        plantSystem.initializePlayer(user1);

        vm.expectRevert("Already initialized");
        plantSystem.initializePlayer(user1);
    }

    function testPlant() public {
        plantSystem.initializePlayer(user1);

        // Give user1 some wheat seeds
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 1, 10);

        vm.prank(user1);
        plantSystem.plant("plot-0", 1);

        PlantSystem.PlantTicket memory ticket = plantSystem.getPlot(user1, "plot-0");
        assertTrue(ticket.exists);
        assertEq(ticket.seedId, 1);
        assertEq(items.balanceOf(user1, 1), 9); // 1 seed burned
    }

    function testPlantOccupiedPlot() public {
        plantSystem.initializePlayer(user1);
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 1, 10);

        vm.prank(user1);
        plantSystem.plant("plot-0", 1);

        vm.prank(user1);
        vm.expectRevert("Plot already in use");
        plantSystem.plant("plot-0", 1);
    }

    function testPlantInsufficientSeeds() public {
        plantSystem.initializePlayer(user1);

        vm.prank(user1);
        vm.expectRevert("Insufficient seeds");
        plantSystem.plant("plot-0", 1);
    }

    function testPlantInactiveSeed() public {
        plantSystem.initializePlayer(user1);
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 99, 10); // Non-configured seed

        vm.prank(user1);
        vm.expectRevert("Seed not active");
        plantSystem.plant("plot-0", 99);
    }

    function testHarvest() public {
        plantSystem.initializePlayer(user1);
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 1, 10);

        vm.prank(user1);
        plantSystem.plant("plot-0", 1);

        // Fast forward 24 hours
        vm.warp(block.timestamp + 24 hours);

        vm.prank(user1);
        plantSystem.harvest("plot-0");

        assertEq(items.balanceOf(user1, 10), 5); // 5 wheat crops
        PlantSystem.PlantTicket memory ticket = plantSystem.getPlot(user1, "plot-0");
        assertFalse(ticket.exists); // Ticket deleted
    }

    function testHarvestTooEarly() public {
        plantSystem.initializePlayer(user1);
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 1, 10);

        vm.prank(user1);
        plantSystem.plant("plot-0", 1);

        // Fast forward only 12 hours (not enough)
        vm.warp(block.timestamp + 12 hours);

        vm.prank(user1);
        vm.expectRevert("Crop not ready");
        plantSystem.harvest("plot-0");
    }

    function testHarvestEmptyPlot() public {
        plantSystem.initializePlayer(user1);

        vm.prank(user1);
        vm.expectRevert("No crop planted");
        plantSystem.harvest("plot-0");
    }

    function testUnlockPlot() public {
        plantSystem.initializePlayer(user1);
        stoken.grantRole(MINTER_ROLE, admin);
        stoken.mint(user1, 1000 * 10**18);

        assertEq(plantSystem.getPlotCapacity(user1), 3);

        vm.prank(user1);
        plantSystem.unlockNextPlot();

        assertEq(plantSystem.getPlotCapacity(user1), 4);
        assertEq(stoken.balanceOf(user1), 900 * 10**18); // 100 STOKEN burned
    }

    function testUnlockPlotInsufficientFunds() public {
        plantSystem.initializePlayer(user1);
        stoken.grantRole(MINTER_ROLE, admin);
        stoken.mint(user1, 50 * 10**18); // Not enough for 4th plot (100 STOKEN)

        vm.prank(user1);
        vm.expectRevert("Insufficient STOKEN");
        plantSystem.unlockNextPlot();
    }

    function testUnlockPlotMaxCapacity() public {
        plantSystem.initializePlayer(user1);
        stoken.grantRole(MINTER_ROLE, admin);
        stoken.mint(user1, 10000 * 10**18);

        // Unlock plots 4-9
        for (uint256 i = 0; i < 6; i++) {
            vm.prank(user1);
            plantSystem.unlockNextPlot();
        }

        assertEq(plantSystem.getPlotCapacity(user1), 9);

        vm.prank(user1);
        vm.expectRevert("Max capacity reached");
        plantSystem.unlockNextPlot();
    }

    function testMultiplePlotIds() public {
        plantSystem.initializePlayer(user1);
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 1, 10);
        items.mint(user1, 2, 10);

        vm.prank(user1);
        plantSystem.plant("plot-0", 1);

        vm.prank(user1);
        plantSystem.plant("plot-1", 2);

        PlantSystem.PlantTicket memory ticket0 = plantSystem.getPlot(user1, "plot-0");
        PlantSystem.PlantTicket memory ticket1 = plantSystem.getPlot(user1, "plot-1");

        assertTrue(ticket0.exists);
        assertTrue(ticket1.exists);
        assertEq(ticket0.seedId, 1);
        assertEq(ticket1.seedId, 2);
    }

    function testSetSeedConfig() public {
        plantSystem.setSeedConfig(99, 199, 10, 1 hours, true);

        (uint256 seedId, uint256 cropId, uint256 cropAmount, uint256 growthTime, bool active) =
            plantSystem.seedConfigs(99);

        assertEq(seedId, 99);
        assertEq(cropId, 199);
        assertEq(cropAmount, 10);
        assertEq(growthTime, 1 hours);
        assertTrue(active);
    }

    function testSetSeedConfigUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        plantSystem.setSeedConfig(99, 199, 10, 1 hours, true);
    }

    function testSetPlotUnlockCosts() public {
        uint256[] memory newCosts = new uint256[](9);
        for (uint256 i = 0; i < 9; i++) {
            newCosts[i] = i * 50 * 10**18;
        }

        plantSystem.setPlotUnlockCosts(newCosts);

        assertEq(plantSystem.plotUnlockCosts(3), 150 * 10**18);
        assertEq(plantSystem.plotUnlockCosts(8), 400 * 10**18);
    }

    function testSetPlotUnlockCostsInvalidLength() public {
        uint256[] memory newCosts = new uint256[](5);

        vm.expectRevert("Must provide 9 costs");
        plantSystem.setPlotUnlockCosts(newCosts);
    }

    function testPlotKeyGeneration() public {
        plantSystem.initializePlayer(user1);
        items.grantRole(MINTER_ROLE, admin);
        items.mint(user1, 1, 10);

        vm.prank(user1);
        plantSystem.plant("my-custom-plot-id", 1);

        PlantSystem.PlantTicket memory ticket = plantSystem.getPlot(user1, "my-custom-plot-id");
        assertTrue(ticket.exists);
    }
}
