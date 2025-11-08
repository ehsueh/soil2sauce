// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameToken.sol";

/**
 * @title Player
 * @dev Manages player registration, roles (Farmer/Chef), and co-player partnerships
 */
contract Player is Ownable {
    enum Role {
        FARMER,
        CHEF
    }

    struct PlayerProfile {
        address playerAddress;
        string playerName;
        Role role;
        uint256 experienceLevel;
        uint256 totalExperience;
        address coPlayer;
        uint256 registeredAt;
        bool exists;
    }

    GameToken public gameToken;

    mapping(address => PlayerProfile) public players;
    mapping(string => bool) public playerNameTaken;
    mapping(address => address[]) public playerCoPlayers;

    address[] public allPlayers;

    event PlayerRegistered(address indexed player, string playerName, Role role);
    event CoPlayerAdded(address indexed player, address indexed coPlayer);
    event CoPlayerRemoved(address indexed player, address indexed coPlayer);
    event RoleChanged(address indexed player, Role newRole);
    event ExperienceGained(address indexed player, uint256 amount, uint256 newLevel);

    constructor(address _gameTokenAddress) Ownable(msg.sender) {
        gameToken = GameToken(_gameTokenAddress);
    }

    /**
     * @dev Register a new player with a role
     * @param _playerName Unique name for the player
     * @param _role Role selection (FARMER=0, CHEF=1)
     * @param _coPlayer Optional co-player address (can be address(0) for none)
     */
    function registerPlayer(
        string calldata _playerName,
        Role _role,
        address _coPlayer
    ) external {
        require(!players[msg.sender].exists, "Player: already registered");
        require(!playerNameTaken[_playerName], "Player: name already taken");
        require(bytes(_playerName).length > 0, "Player: name cannot be empty");
        require(bytes(_playerName).length <= 32, "Player: name too long");

        // Register the player
        players[msg.sender] = PlayerProfile({
            playerAddress: msg.sender,
            playerName: _playerName,
            role: _role,
            experienceLevel: 1,
            totalExperience: 0,
            coPlayer: _coPlayer,
            registeredAt: block.timestamp,
            exists: true
        });

        playerNameTaken[_playerName] = true;
        allPlayers.push(msg.sender);

        // Give starter tokens and crops from external system
        gameToken.giveStarterTokens(msg.sender);

        // Add co-player relationship if provided
        if (_coPlayer != address(0) && _coPlayer != msg.sender) {
            require(players[_coPlayer].exists, "Player: co-player not registered");
            playerCoPlayers[msg.sender].push(_coPlayer);
            if (players[_coPlayer].coPlayer == address(0)) {
                players[_coPlayer].coPlayer = msg.sender;
            }
            emit CoPlayerAdded(msg.sender, _coPlayer);
        }

        emit PlayerRegistered(msg.sender, _playerName, _role);
    }

    /**
     * @dev Change a player's role
     * @param _newRole New role for the player
     */
    function changeRole(Role _newRole) external {
        require(players[msg.sender].exists, "Player: not registered");
        require(players[msg.sender].role != _newRole, "Player: already has this role");

        players[msg.sender].role = _newRole;
        emit RoleChanged(msg.sender, _newRole);
    }

    /**
     * @dev Add experience to a player (called by other contracts)
     * @param _player Address of the player
     * @param _amount Amount of experience to add
     */
    function addExperience(address _player, uint256 _amount) external onlyOwner {
        require(players[_player].exists, "Player: not registered");

        players[_player].totalExperience += _amount;
        uint256 newLevel = 1 + (players[_player].totalExperience / 100);

        if (newLevel > players[_player].experienceLevel) {
            players[_player].experienceLevel = newLevel;
            emit ExperienceGained(_player, _amount, newLevel);
        }
    }

    /**
     * @dev Get player profile
     * @param _player Address of the player
     */
    function getPlayer(address _player) external view returns (PlayerProfile memory) {
        require(players[_player].exists, "Player: not registered");
        return players[_player];
    }

    /**
     * @dev Check if player is registered
     * @param _player Address of the player
     */
    function isPlayerRegistered(address _player) external view returns (bool) {
        return players[_player].exists;
    }

    /**
     * @dev Get player's role
     * @param _player Address of the player
     */
    function getPlayerRole(address _player) external view returns (Role) {
        require(players[_player].exists, "Player: not registered");
        return players[_player].role;
    }

    /**
     * @dev Get all players count
     */
    function getPlayersCount() external view returns (uint256) {
        return allPlayers.length;
    }

    /**
     * @dev Get player at index
     */
    function getPlayerAtIndex(uint256 _index) external view returns (PlayerProfile memory) {
        require(_index < allPlayers.length, "Player: index out of bounds");
        return players[allPlayers[_index]];
    }

    /**
     * @dev Get player's co-players
     */
    function getCoPlayers(address _player) external view returns (address[] memory) {
        return playerCoPlayers[_player];
    }
}
