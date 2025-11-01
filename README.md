# Soil2Sauce - On-Chain Farming Game

An on-chain farming and restaurant simulation game built with Foundry and Solidity.

## Overview

Soil2Sauce is a Web3 game where players can:
- 🌾 Farm crops with realistic growth timers
- 🐮 Raise livestock with probability-based product generation
- 🛒 Buy seeds and animals from an in-game shop
- 🎮 Manage their farm with expandable plots (3-9 plots)

## Smart Contracts

### Token Layer
- **ItemsERC1155**: Manages all in-game items (seeds, crops, animals, products)
- **STOKEN**: In-game currency (ERC20)

### System Logic Layer
- **GameRegistry**: Player onboarding and starter pack distribution
- **PlantSystem**: Crop planting, growth, and harvesting with plot management
- **LivestockSystem**: Animal ownership and probability-based product claiming
- **ShopSystem**: Fixed-price shop for purchasing items

## Features Implemented

### ✅ Farming System
- Plant seeds in plots identified by frontend-provided IDs
- Growth timers (12h to 72h depending on crop type)
- Harvest mature crops for ingredients
- Plot expansion system (unlock up to 9 plots)

### ✅ Livestock System
- Probability-based product generation:
  - Cow: 95% Milk, 5% Cheese (12h cooldown)
  - Chicken: 90% Eggs, 10% Feathers (8h cooldown)
  - Pig: 80% Pork, 20% Bacon (24h cooldown)
- Products scale with number of animals owned
- Cooldown system prevents spam

### ✅ Shop System
- Fixed prices configurable by admins
- Seeds: 8-20 STOKEN
- Animals: 200-800 STOKEN
- Burns STOKEN on purchase (deflationary sink)

### ✅ Admin Controls
- Update seed configurations (growth time, yield)
- Update animal configurations (cooldown, probabilities)
- Update shop prices and availability
- Update plot unlock costs
- Update starter pack contents

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd soil2sauce

# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test
```

## Testing

The project includes comprehensive unit tests:

```bash
# Run all tests
forge test

# Run tests with verbosity
forge test -vv

# Run specific test file
forge test --match-contract PlantSystemTest

# Run tests with gas reporting
forge test --gas-report
```

### Test Coverage

- ✅ ItemsERC1155: 9 tests
- ✅ STOKEN: 9 tests
- ✅ GameRegistry: 8 tests
- ✅ PlantSystem: 18 tests
- ✅ LivestockSystem: 12 tests
- ✅ ShopSystem: 17 tests

**Total: 75 tests passing**

## Deployment

### Local Deployment (Anvil)

```bash
# Terminal 1: Start local blockchain
anvil

# Terminal 2: Deploy contracts
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545 --private-key <PRIVATE_KEY>
```

### Testnet Deployment

```bash
# Set up environment variables
cp .env.example .env
# Edit .env and add your PRIVATE_KEY and RPC_URL

# Deploy to testnet
forge script script/Deploy.s.sol --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY --verify
```

## Contract Addresses

After deployment, contract addresses will be displayed in the console:

```
=== Deployment Summary ===
ItemsERC1155: 0x...
STOKEN: 0x...
PlantSystem: 0x...
LivestockSystem: 0x...
ShopSystem: 0x...
GameRegistry: 0x...
```

## Game Mechanics

### Getting Started

1. **Register**: Call `GameRegistry.registerPlayer()`
   - Receive 100 STOKEN
   - Receive 5 Wheat Seeds + 3 Tomato Seeds
   - Initialize 3 farm plots

2. **Plant**: Call `PlantSystem.plant(plotId, seedId)`
   - Burns 1 seed
   - Creates PlantTicket with growth timer
   - Plot is locked until harvest

3. **Harvest**: Call `PlantSystem.harvest(plotId)` after growth time
   - Mints crops to inventory
   - Frees up plot for replanting

4. **Buy Animals**: Call `ShopSystem.buyItem(animalId, quantity)`
   - Burns STOKEN payment
   - Receive animals in inventory

5. **Claim Products**: Call `LivestockSystem.claimProducts(animalId)`
   - Rolls probability for product type
   - Mints products (amount × animal count)
   - Starts cooldown timer

### Item IDs

**Seeds (1-5)**:
- 1: Wheat Seed (24h growth, yields 5 Wheat)
- 2: Tomato Seed (48h growth, yields 3 Tomato)
- 3: Corn Seed (72h growth, yields 4 Corn)
- 4: Lettuce Seed (12h growth, yields 4 Lettuce)
- 5: Carrot Seed (36h growth, yields 3 Carrot)

**Crops (10-14)**:
- 10: Wheat
- 11: Tomato
- 12: Corn
- 13: Lettuce
- 14: Carrot

**Animals (20-22)**:
- 20: Cow (500 STOKEN)
- 21: Chicken (200 STOKEN)
- 22: Pig (800 STOKEN)

**Products (30-35)**:
- 30: Milk (common from Cow)
- 31: Egg (common from Chicken)
- 32: Pork (common from Pig)
- 33: Cheese (rare from Cow - 5%)
- 34: Feather (rare from Chicken - 10%)
- 35: Bacon (rare from Pig - 20%)

## Access Control

### Roles

- **DEFAULT_ADMIN_ROLE**: Can grant/revoke all roles
- **MINTER_ROLE**: Can mint/burn tokens (system contracts)
- **CONFIG_ADMIN_ROLE**: Can update game parameters

### Role Assignments

After deployment:
- System contracts have MINTER_ROLE on relevant token contracts
- Deployer has all admin roles initially
- Transfer DEFAULT_ADMIN_ROLE to multisig for production

## Development

### Project Structure

```
soil2sauce/
├── src/
│   ├── ItemsERC1155.sol      # Multi-token for all items
│   ├── STOKEN.sol             # ERC20 game currency
│   ├── GameRegistry.sol       # Player onboarding
│   ├── PlantSystem.sol        # Farming mechanics
│   ├── LivestockSystem.sol    # Animal products
│   └── ShopSystem.sol         # Item shop
├── test/
│   ├── ItemsERC1155.t.sol
│   ├── STOKEN.t.sol
│   ├── GameRegistry.t.sol
│   ├── PlantSystem.t.sol
│   ├── LivestockSystem.t.sol
│   └── ShopSystem.t.sol
├── script/
│   └── Deploy.s.sol           # Deployment script
└── foundry.toml               # Foundry configuration
```

### Architecture

```
Frontend
   ↓
GameRegistry → PlantSystem → ItemsERC1155
   ↓              ↓             ↓
STOKEN ← ShopSystem → LivestockSystem
```

## Not Implemented (Future)

- ❌ AI Recipe System
- ❌ RecipeNFT (ERC721)
- ❌ Marketplace trading
- ❌ Recipe evaluation
- ❌ Restaurant revenue system
- ❌ Leaderboard

These features are documented in PROJECT_PLAN.md and AI_SERVICES.md but not implemented per requirements.

## Documentation

- **PROJECT_PLAN.md**: Complete technical specifications
- **CONTRACTS_OVERVIEW.md**: Non-technical contract explanations
- **AI_SERVICES.md**: AI backend specifications (not implemented)

## Security Considerations

- All role-based access control uses OpenZeppelin's AccessControl
- STOKEN burns require approval or MINTER_ROLE
- Plot IDs use keccak256 hashing to prevent collisions
- Cooldowns prevent spam claiming
- Input validation on all public functions

## License

MIT
