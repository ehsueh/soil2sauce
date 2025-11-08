// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ItemsERC1155.sol";
import "./STOKEN.sol";

/// @title ShopSystem
/// @notice Fixed-price item shop for seeds and animals
/// @dev Burns STOKEN and mints items to buyers
contract ShopSystem is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");

    ItemsERC1155 public immutable items;
    STOKEN public immutable stoken;

    struct ShopItem {
        uint256 itemId;
        uint256 price;
        bool available;
    }

    mapping(uint256 => ShopItem) public shopItems;
    uint256[] private _itemIds;

    event ItemPurchased(address indexed buyer, uint256 indexed itemId, uint256 quantity, uint256 totalCost);
    event ShopItemUpdated(uint256 indexed itemId, uint256 price, bool available);

    constructor(address _items, address _stoken) {
        items = ItemsERC1155(_items);
        stoken = STOKEN(_stoken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONFIG_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // Initialize default shop items
        _initializeDefaultShop();
    }

    /// @notice Purchases items from the shop
    /// @param itemId The item token ID to purchase
    /// @param quantity The quantity to purchase
    function buyItem(uint256 itemId, uint256 quantity) external {
        require(quantity > 0, "Quantity must be > 0");

        ShopItem memory item = shopItems[itemId];
        require(item.available, "Item not available");

        uint256 totalCost = item.price * quantity;
        require(stoken.balanceOf(msg.sender) >= totalCost, "Insufficient STOKEN");

        // Burn STOKEN payment
        stoken.burn(msg.sender, totalCost);

        // Mint items to buyer
        items.mint(msg.sender, itemId, quantity);

        emit ItemPurchased(msg.sender, itemId, quantity, totalCost);
    }

    /// @notice Gets the price of an item
    /// @param itemId The item token ID
    /// @return The price in STOKEN (with 18 decimals)
    function getItemPrice(uint256 itemId) external view returns (uint256) {
        return shopItems[itemId].price;
    }

    /// @notice Gets shop item details
    /// @param itemId The item token ID
    /// @return The shop item struct
    function getShopItem(uint256 itemId) external view returns (ShopItem memory) {
        return shopItems[itemId];
    }

    /// @notice Gets all available shop items
    /// @return items Array of available shop items
    function getAvailableItems() external view returns (ShopItem[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _itemIds.length; i++) {
            if (shopItems[_itemIds[i]].available) {
                count++;
            }
        }

        ShopItem[] memory availableItems = new ShopItem[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _itemIds.length; i++) {
            if (shopItems[_itemIds[i]].available) {
                availableItems[index] = shopItems[_itemIds[i]];
                index++;
            }
        }

        return availableItems;
    }

    /// @notice Updates or adds a shop item
    /// @param itemId The item token ID
    /// @param price The price in STOKEN (with 18 decimals)
    /// @param available Whether the item is available for purchase
    function setShopItem(uint256 itemId, uint256 price, bool available) external onlyRole(CONFIG_ADMIN_ROLE) {
        bool exists = shopItems[itemId].price > 0 || shopItems[itemId].available;

        shopItems[itemId] = ShopItem(itemId, price, available);

        if (!exists) {
            _itemIds.push(itemId);
        }

        emit ShopItemUpdated(itemId, price, available);
    }

    /// @dev Initializes default shop catalog
    function _initializeDefaultShop() private {
        // Seeds (prices in STOKEN with 18 decimals)
        shopItems[1] = ShopItem(1, 10 * 10**18, true); // Wheat Seed: 10 STOKEN
        shopItems[2] = ShopItem(2, 15 * 10**18, true); // Tomato Seed: 15 STOKEN
        shopItems[3] = ShopItem(3, 20 * 10**18, true); // Corn Seed: 20 STOKEN
        shopItems[4] = ShopItem(4, 8 * 10**18, true);  // Lettuce Seed: 8 STOKEN
        shopItems[5] = ShopItem(5, 12 * 10**18, true); // Carrot Seed: 12 STOKEN

        // Animals (prices in STOKEN with 18 decimals)
        shopItems[20] = ShopItem(20, 500 * 10**18, true); // Cow: 500 STOKEN
        shopItems[21] = ShopItem(21, 200 * 10**18, true); // Chicken: 200 STOKEN
        shopItems[22] = ShopItem(22, 800 * 10**18, true); // Pig: 800 STOKEN

        // Track item IDs
        _itemIds = [1, 2, 3, 4, 5, 20, 21, 22];
    }
}
