# Soil2Sauce - Web3 Panel-Based Farming Game

A decentralized farming game built on Ethereum using Hardhat 3 and Solidity 0.8.28. This project is a Web3 reimagination of a traditional farming game, featuring on-chain game mechanics, ERC20 token economics, and true asset ownership.

## Overview

Soil2Sauce is a blockchain-based farming simulation game where players:
- Plant and harvest crops on their farm plots
- Buy and manage animals that produce resources
- Create custom dishes in a restaurant for passive income generation
- Trade resources and earn game tokens (GCOIN)

All game state and assets are stored on-chain, making them truly owned by players.

## Smart Contracts Architecture

### GameToken (ERC20)
- **Symbol**: GCOIN
- **Purpose**: In-game currency for all transactions
- **Features**: Mintable/burnable by authorized game contracts, starter tokens (100 GCOIN)

### FarmLand
Manages farm plots, planting, and harvesting mechanics.
- 9 initial plots per player (expandable for 50 GCOIN)
- 4 crop types: Wheat, Tomato, Strawberry, Carrot
- Time-based crop growth, seed market, crop-to-seed conversion (1 crop → 2 seeds)

### AnimalFarm
Manages animals and their product generation.
- Animals: Cow (100 GCOIN), Chicken (50 GCOIN)
- Time-based product generation (Milk: 30s, Eggs: 20s)

### Restaurant
Manages custom dishes and passive income generation.
- Create custom dishes with configurable revenue rates
- Revenue generation every 60 seconds
- Toggle dishes active/inactive

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Deployment

Deploy all game contracts using Hardhat Ignition:

**Local deployment:**
```shell
npx hardhat ignition deploy ignition/modules/Soil2Sauce.ts
```

**Sepolia testnet:**
```shell
# Set your private key
npx hardhat keystore set SEPOLIA_PRIVATE_KEY

# Deploy
npx hardhat ignition deploy --network sepolia ignition/modules/Soil2Sauce.ts
```

## Game Mechanics

### Crop Economics
| Crop | Growth Time | Seed Price | Sell Price |
|------|------------|------------|------------|
| Wheat | 10s | 5 GCOIN | 4 GCOIN |
| Tomato | 15s | 8 GCOIN | 6 GCOIN |
| Strawberry | 12s | 10 GCOIN | 8 GCOIN |
| Carrot | 8s | 6 GCOIN | 5 GCOIN |

### Progression Loop
1. Start with 100 GCOIN + 5 wheat seeds
2. Plant → Harvest → Sell crops
3. Buy more diverse seeds or animals
4. Expand farm for more plots
5. Create restaurant dishes for passive income
6. Scale up operations

## Technology Stack

- **Blockchain**: Ethereum (EVM-compatible)
- **Smart Contracts**: Solidity ^0.8.28
- **Framework**: Hardhat 3
- **Testing**: Node.js test runner + Viem
- **Standards**: OpenZeppelin contracts

## Original Game

Inspired by the panel-based farming game in the `18--panel-based-farming-game` directory, reimagined for Web3 with blockchain mechanics and true asset ownership.

## License

MIT
