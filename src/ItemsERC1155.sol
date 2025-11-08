// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title ItemsERC1155
/// @notice Manages all in-game items using ERC1155 multi-token standard
/// @dev Handles seeds, crops, animals, and animal products
contract ItemsERC1155 is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Mints items to a specified address
    /// @param to The address to receive the items
    /// @param id The item token ID
    /// @param amount The amount to mint
    function mint(address to, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, "");
    }

    /// @notice Mints multiple item types to a specified address
    /// @param to The address to receive the items
    /// @param ids Array of item token IDs
    /// @param amounts Array of amounts to mint
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts)
        external
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, "");
    }

    /// @notice Burns items from a specified address
    /// @param from The address to burn items from
    /// @param id The item token ID
    /// @param amount The amount to burn
    function burn(address from, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, id, amount);
    }

    /// @notice Burns multiple item types from a specified address
    /// @param from The address to burn items from
    /// @param ids Array of item token IDs
    /// @param amounts Array of amounts to burn
    function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts)
        external
        onlyRole(MINTER_ROLE)
    {
        _burnBatch(from, ids, amounts);
    }

    /// @notice Required override for AccessControl and ERC1155
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
