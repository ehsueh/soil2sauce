// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title STOKEN
/// @notice In-game currency for Soil2Sauce
/// @dev ERC20 token with minting and burning controlled by MINTER_ROLE
contract STOKEN is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Soil2Sauce Token", "STOKEN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Mints STOKEN to a specified address
    /// @param to The address to receive the tokens
    /// @param amount The amount to mint (in wei, 18 decimals)
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Burns STOKEN from a specified address
    /// @param from The address to burn tokens from
    /// @param amount The amount to burn (in wei, 18 decimals)
    /// @dev Requires the caller to have MINTER_ROLE and sufficient allowance
    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
}
