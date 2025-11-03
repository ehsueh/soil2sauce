# Soil2Sauce Project Plan

**Version:** 2.0
**Date:** October 31, 2025
**Status:** Active Development

---

## 1. Executive Summary

### 1.1 Project Goals

Soil2Sauce is an on-chain farming and restaurant simulation game where players:
- Grow crops and raise livestock on their digital farm
- Create and publish unique recipes as NFTs using AI-assisted creativity
- Run a virtual restaurant earning revenue from their recipe portfolio
- Compete on leaderboards based on culinary creativity and business success
- Trade items and recipes in a player-driven marketplace

### 1.2 Success Criteria

**Technical Success:**
- All smart contracts deployed and audited on target EVM chain
- Zero critical security vulnerabilities
- 99.9% uptime for frontend and AI services
- Sub-500ms response time for AI recipe operations (see AI_SERVICES.md)

**Business Success:**
- 1,000+ active players in first month post-launch
- 500+ unique recipes created and minted
- $10,000+ in marketplace transaction volume
- 80%+ player retention rate (D7)
- Positive community sentiment score

### 1.3 MVP Scope

**In Scope for MVP:**
- Player onboarding and basic farm setup (3 starting plots)
- Planting and harvesting 5 crop types
- Raising 3 livestock types for ingredient production with probability-based outputs
- Fixed-price shop for purchasing seeds and animals
- AI-powered recipe research and evaluation (see AI_SERVICES.md)
- Recipe NFT minting with metadata (no images)
- Basic restaurant revenue simulation
- Leaderboard (top 10 chefs by total revenue)
- Marketplace for item trading (fixed-price listings)
- Inventory management UI
- Plot expansion to 9 plots maximum
- Admin controls for updating game parameters

**Out of Scope for MVP (Future Phases):**
- Dynamic marketplace pricing / auctions
- Recipe revenue sharing mechanisms
- Multiplayer co-op features
- Land ownership and expansion beyond 9 plots
- Advanced crafting and processing
- Seasonal events and limited items
- Mobile app
- Cross-chain bridging

---

## 2. Product Requirements and User Stories

### 2.1 Farmer Role

**US-F1:** As a farmer, I want to register and receive starter resources so I can begin playing immediately.
**Acceptance Criteria:**
- New player clicks "Start Farming"
- Transaction registers player in GameRegistry
- Player receives 100 STOKEN and starter seed pack
- PlantSystem initializes 3 unlocked plots for the player
- Player sees farm dashboard showing their plots

**US-F2:** As a farmer, I want to plant seeds in available plots so I can grow crops.
**Acceptance Criteria:**
- Farmer selects empty plot (by plot ID) and seed type
- Frontend passes plot ID to smart contract
- System checks seed inventory balance
- PlantTicket created with growth timer (e.g., 24 hours for wheat)
- Seed consumed from inventory
- UI shows growing crop with countdown timer at the correct plot location

**US-F3:** As a farmer, I want to harvest mature crops so I can collect ingredients.
**Acceptance Criteria:**
- Farmer clicks "Harvest" on mature plot
- System validates growth time elapsed
- Crop ingredient added to inventory (e.g., 5 wheat)
- PlantTicket deleted
- Plot becomes available for replanting

**US-F4:** As a farmer, I want to buy more seeds and animals from the shop so I can expand my production.
**Acceptance Criteria:**
- Farmer browses shop showing item prices in STOKEN
- Farmer selects items and quantity
- System validates STOKEN balance
- Transaction burns STOKEN and mints items to inventory
- Inventory UI updates immediately

**US-F5:** As a farmer, I want to unlock additional plots so I can grow more crops simultaneously.
**Acceptance Criteria:**
- Farmer views locked plots (plots 4-9)
- System displays unlock cost increasing progressively
- Farmer pays STOKEN to unlock next plot
- Plot capacity incremented in PlantSystem
- New plot becomes plantable

**US-F6:** As a farmer, I want to raise livestock and claim products so I have more ingredient variety.
**Acceptance Criteria:**
- Farmer owns livestock tokens (e.g., 1 cow)
- System calculates production based on probability (95% milk, 5% cheese)
- Farmer clicks "Claim" after cooldown
- Products added to inventory based on probability roll
- Cooldown resets

### 2.2 Chef Role

**US-C1:** As a chef, I want to research new recipe ideas using AI so I can create unique dishes.
**Acceptance Criteria:**
- Chef enters ingredients they want to use
- AI service returns recipe suggestions with name, description, ingredients (see AI_SERVICES.md)
- Chef reviews suggestions and selects one
- Recipe data cached for minting

**US-C2:** As a chef, I want to mint my recipe as an NFT so I own it on-chain.
**Acceptance Criteria:**
- Chef has recipe data from research
- Chef pays minting fee in STOKEN
- RecipeSystem mints ERC-721 NFT with full metadata (no image)
- Recipe added to chef's restaurant
- Recipe becomes eligible for evaluation

**US-C3:** As a chef, I want my recipes evaluated by AI critics so I can earn restaurant revenue.
**Acceptance Criteria:**
- Chef requests evaluation for minted recipe
- AI service grades recipe (F to S tier) (see AI_SERVICES.md)
- AI generates critic reviews (0-5 critics based on grade)
- RevenueRate calculated based on difficulty and grade
- Recipe metadata updated on-chain
- Daily revenue starts accumulating

**US-C4:** As a chef, I want to view my restaurant dashboard so I can track performance.
**Acceptance Criteria:**
- Dashboard shows all owned recipes
- Each recipe displays: name, grade, revenueRate, total revenue
- Overall restaurant stats shown (total recipes, avg grade, lifetime revenue)
- Leaderboard ranking displayed

### 2.3 Player General

**US-P1:** As a player, I want to view my inventory so I know what resources I have.
**Acceptance Criteria:**
- Inventory section lists all owned items
- Categories: Seeds, Crops, Livestock Products, Animals
- Quantities displayed for each item
- STOKEN balance prominently shown

**US-P2:** As a player, I want to see my transaction history so I can audit my actions.
**Acceptance Criteria:**
- History section shows recent transactions
- Events: planted, harvested, purchased, minted, sold
- Timestamps and transaction hashes provided
- Filterable by event type

**US-P3:** As a player, I want smooth onboarding with wallet connection so I can start easily.
**Acceptance Criteria:**
- Landing section explains game concept
- "Connect Wallet" button supports major wallets
- First-time users prompted to register
- Returning users see their farm immediately

### 2.4 Leaderboard

**US-L1:** As a player, I want to view the leaderboard so I can see top chefs.
**Acceptance Criteria:**
- Leaderboard shows top 10 players by total restaurant revenue
- Displays: rank, player address (truncated), total revenue, recipe count
- Updates daily or on-demand
- Player can find their own rank

### 2.5 Marketplace

**US-M1:** As a seller, I want to list items for sale so I can earn STOKEN.
**Acceptance Criteria:**
- Seller selects item and quantity from inventory
- Seller sets fixed price in STOKEN
- Listing created on-chain
- Items locked in marketplace contract

**US-M2:** As a buyer, I want to browse and purchase listed items so I can acquire resources.
**Acceptance Criteria:**
- Marketplace section shows all active listings
- Filterable by item type
- Buyer clicks "Buy" and confirms transaction
- STOKEN transferred to seller
- Items transferred to buyer
- Listing removed if fully purchased

**US-M3:** As a seller, I want to cancel my listings so I can reclaim unsold items.
**Acceptance Criteria:**
- Seller views their active listings
- Seller clicks "Cancel"
- Items returned to seller inventory
- Listing removed from marketplace

### 2.6 Admin Role

**US-A1:** As an admin, I want to update game parameters so I can balance the economy.
**Acceptance Criteria:**
- Admin can update seed configurations (growth time, crop yield)
- Admin can update animal configurations (cooldown, product probabilities)
- Admin can update shop prices
- Admin can update plot unlock costs
- All parameter changes emit events for transparency

---

## 3. System Architecture Overview

### 3.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  React + wagmi + viem + TailwindCSS                         │
│  Single Page Application (minimal decoration)                │
│  - Farm Grid (dynamic based on plotCapacity)                 │
│  - Inventory View                                            │
│  - Restaurant Dashboard                                      │
│  - Marketplace Section                                       │
│  - Leaderboard Section                                       │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─────────────┐
                │             │
                v             v
┌───────────────────────┐  ┌──────────────────────────┐
│   Smart Contracts     │  │   AI Backend Service     │
│   (Foundry)           │  │   (see AI_SERVICES.md)   │
├───────────────────────┤  └──────────────────────────┘
│ Token Layer:          │
│  - ItemsERC1155       │
│  - STOKEN (ERC20)     │
│  - RecipeNFT (ERC721) │
├───────────────────────┤
│ System Logic Layer:   │
│  - GameRegistry       │
│  - PlantSystem        │
│  - LivestockSystem    │
│  - ShopSystem         │
│  - RecipeSystem       │
│  - MarketplaceSystem  │
└───────────────────────┘
```

### 3.2 Token Layer

**ItemsERC1155 (Multi-Token Contract)**

Manages all fungible in-game items using a single contract:

| Token ID | Category | Name | Description |
|----------|----------|------|-------------|
| 1 | Seed | Wheat Seed | Plant to grow wheat (24h) |
| 2 | Seed | Tomato Seed | Plant to grow tomatoes (48h) |
| 3 | Seed | Corn Seed | Plant to grow corn (72h) |
| 4 | Seed | Lettuce Seed | Plant to grow lettuce (12h) |
| 5 | Seed | Carrot Seed | Plant to grow carrots (36h) |
| 10 | Crop | Wheat | Used in baking recipes |
| 11 | Crop | Tomato | Used in sauce recipes |
| 12 | Crop | Corn | Used in various dishes |
| 13 | Crop | Lettuce | Used in salads |
| 14 | Crop | Carrot | Used in stews |
| 20 | Animal | Cow | Produces milk or cheese |
| 21 | Animal | Chicken | Produces eggs or feathers |
| 22 | Animal | Pig | Produces pork or bacon |
| 30 | Product | Milk | Dairy ingredient (common from cow) |
| 31 | Product | Egg | Baking ingredient (common from chicken) |
| 32 | Product | Pork | Meat ingredient (common from pig) |
| 33 | Product | Cheese | Dairy ingredient (rare from cow) |
| 34 | Product | Feather | Crafting ingredient (rare from chicken) |
| 35 | Product | Bacon | Meat ingredient (rare from pig) |

**STOKEN (ERC20)**

In-game currency token:
- Name: "Soil2Sauce Token"
- Symbol: "STOKEN"
- Decimals: 18
- Total Supply: Dynamic (minted on onboarding, burned on purchases)
- Use Cases: Shop purchases, plot unlocking, recipe minting, marketplace trading

**RecipeNFT (ERC721)**

Unique recipe NFTs:
- Each recipe is a unique token
- Metadata stored on-chain (struct)
- No images (text-only metadata)
- Tradeable in marketplace
- Generates daily revenue for owner

### 3.3 System Logic Layer

**GameRegistry**

Central player registry and onboarding:
- Tracks registered players (mapping address => bool)
- Handles new player initialization
- Distributes starter pack (100 STOKEN, 5 wheat seeds, 3 tomato seeds)
- Emits `PlayerRegistered` event
- Note: Plot capacity is managed by PlantSystem

**PlantSystem**

Manages crop growing lifecycle and plot capacity:
- Per-player plot management using frontend-provided plot IDs
- Tracks plot capacity per player (starts at 3, max 9)
- PlantTicket struct per plot:
  ```solidity
  struct PlantTicket {
    uint256 seedId;
    uint256 plantedAt;
    uint256 harvestTime;
    bool exists;
  }
  ```
- Mapping: `mapping(address => uint256) public plotCapacity`
- Mapping: `mapping(address => mapping(bytes32 => PlantTicket)) public plots`
- Plot key: `keccak256(abi.encodePacked(player, plotId))`
- Plant function: accepts plotId from frontend, validates seed inventory, creates ticket
- Harvest function: accepts plotId, validates time elapsed, mints crop, deletes ticket
- Unlock plot function: increments plotCapacity, charges STOKEN
- Config per seed: growthTime, cropId, cropAmount

**LivestockSystem**

Manages animal ownership and probability-based product generation:
- Balance-based system (owns X cows = produces X products per interval)
- Claim cooldown per player per animal type
- Probability-based product generation:
  - Each animal has multiple possible products with probabilities
  - Example: Cow → 95% Milk (id 30), 5% Cheese (id 33)
- Mapping: `mapping(address => mapping(uint256 => uint256)) public lastClaimed`
- Claim function: validates cooldown, rolls probability, mints products, resets timer
- Config per animal: productIds array, probabilities array, cooldownSeconds, productAmount

**ShopSystem**

Fixed-price item shop (MVP):
- Predefined catalog of items with STOKEN prices
- Buy function: burns STOKEN, mints items to buyer
- Config per item: itemId, price, available (bool)
- Admin can update prices and availability
- Future: dynamic pricing, limited stock

**RecipeSystem**

Recipe NFT creation and restaurant simulation:
- Mint function: creates ERC-721 with full metadata struct
- Recipe metadata struct:
  ```solidity
  struct Recipe {
    string name;
    string description;
    uint8 difficulty; // 1-10
    uint256 revenueRate; // STOKEN per day
    string grade; // F, D, C, B, A, S
    string[] critics; // array of critic reviews
    address creator;
    uint256 createdAt;
  }
  ```
- Ingredient rates stored separately:
  `mapping(uint256 => mapping(uint256 => uint256)) recipeIngredients`
- Evaluate function: updates grade, critics, revenueRate (called by admin after AI eval)
- Restaurant revenue accumulation (view function for total revenue)
- Leaderboard calculation (query top N by revenue)

**MarketplaceSystem (Future - Basic MVP)**

Fixed-price item listings:
- List function: locks items, creates listing
- Buy function: transfers STOKEN and items
- Cancel function: returns items to seller
- Listing struct: seller, itemId, amount, price, active

### 3.4 Frontend Layer

**Technology Stack:**
- React 18 (no Next.js)
- wagmi + viem for Web3 integration
- TailwindCSS for minimal styling
- React Query for data fetching
- Zustand for state management

**Single Page Application:**
All functionality on one page with sections:

1. **Header:** Wallet connection, STOKEN balance, player address
2. **Farm Grid:** Dynamic layout based on plotCapacity
   - 3 plots: 1x3 grid
   - 4-6 plots: 2x3 grid
   - 7-9 plots: 3x3 grid
   - Each plot shows: plant status, timer, harvest button, or plant button
   - Frontend assigns plot IDs (e.g., "plot-0" through "plot-8")
3. **Inventory:** List of owned items with balances
4. **Shop:** Browse and purchase seeds/animals
5. **Restaurant:** Recipe management and revenue dashboard
6. **Marketplace:** Browse and trade items
7. **Leaderboard:** Top chefs ranking

**Frontend Plot ID Management:**

```typescript
// Frontend assigns and tracks plot IDs
const plotIds = [
  "plot-0", "plot-1", "plot-2", // Always available
  "plot-3", "plot-4", "plot-5", // Unlockable
  "plot-6", "plot-7", "plot-8"  // Unlockable
];

// When planting, pass plot ID to contract
const handlePlant = async (plotId: string, seedId: number) => {
  await plantSystem.write.plant([plotId, seedId]);
};

// Contract uses keccak256(player, plotId) as storage key
// Frontend can render plots in any visual arrangement
```

**Design Principles:**
- Minimal decoration and styling
- Clean, functional interface
- Clear text labels
- Simple buttons and forms
- Focus on functionality over aesthetics

**Real-time Updates:**
- Poll contract state every 10 seconds for plot timers
- Event-based updates for user actions (plant, harvest, purchase)
- Optimistic UI updates with rollback on failure

---

## 4. Data Models and Interfaces

### 4.1 Token IDs Reference

See section 3.2 for complete token ID table including probability-based products.

### 4.2 Recipe Metadata Schema

**On-Chain (Solidity Struct):**

```solidity
struct Recipe {
  string name;              // "Spicy Tomato Pasta"
  string description;       // "A fiery Italian classic..."
  uint8 difficulty;         // 1 (easy) to 10 (expert)
  uint256 revenueRate;      // STOKEN per day (e.g., 50 * 10^18)
  string grade;             // "F" | "D" | "C" | "B" | "A" | "S"
  string[] critics;         // ["Great flavor!", "Too spicy"]
  address creator;          // Chef's wallet address
  uint256 createdAt;        // Block timestamp
}

// Ingredient rates stored separately:
mapping(uint256 => mapping(uint256 => uint256)) recipeIngredients;
// recipeIngredients[recipeId][itemId] = quantity consumed per day
```

**tokenURI (No Image):**

Returns JSON string:
```json
{
  "name": "Spicy Tomato Pasta",
  "description": "A fiery Italian classic with sun-ripened tomatoes",
  "attributes": [
    { "trait_type": "Difficulty", "value": 7 },
    { "trait_type": "Grade", "value": "A" },
    { "trait_type": "Revenue Rate", "value": "50 STOKEN/day" },
    { "trait_type": "Creator", "value": "0x123..." },
    { "trait_type": "Created", "value": "2025-10-31" }
  ],
  "ingredients": [
    { "name": "Tomato", "quantity": 10 },
    { "name": "Wheat", "quantity": 5 }
  ],
  "critics": [
    "Perfectly balanced heat!",
    "The tomatoes are exquisite.",
    "A modern twist on a classic."
  ]
}
```

### 4.3 PlantTicket Struct

```solidity
struct PlantTicket {
  uint256 seedId;       // Which seed was planted (e.g., 1 for wheat)
  uint256 plantedAt;    // Block timestamp when planted
  uint256 harvestTime;  // plantedAt + growthTime (seconds)
  bool exists;          // True if plot is occupied
}

// Storage using frontend-provided plot ID
mapping(address => mapping(bytes32 => PlantTicket)) public plots;
// Key: keccak256(abi.encodePacked(player, plotId))
```

### 4.4 Seed Configuration

```solidity
struct SeedConfig {
  uint256 seedId;
  uint256 cropId;       // What crop it produces
  uint256 cropAmount;   // How many crops per harvest
  uint256 growthTime;   // Seconds to maturity
  bool active;
}

// Example configs:
// Wheat: { 1, 10, 5, 86400, true } // 24 hours
// Tomato: { 2, 11, 3, 172800, true } // 48 hours

// Admin can update via setSeedConfig()
```

### 4.5 Animal Configuration

```solidity
struct ProductProbability {
  uint256 productId;
  uint256 probability;  // Out of 10000 (basis points)
}

struct AnimalConfig {
  uint256 animalId;
  ProductProbability[] products;  // Array of possible products
  uint256 productAmount;          // How many per claim
  uint256 cooldownSeconds;        // Time between claims
  bool active;
}

// Example configs:
// Cow: { 20, [(30, 9500), (33, 500)], 2, 43200, true }
//   → 95% chance of Milk (id 30), 5% chance of Cheese (id 33)
//   → 2 products per 12h claim

// Chicken: { 21, [(31, 9000), (34, 1000)], 3, 28800, true }
//   → 90% chance of Egg (id 31), 10% chance of Feather (id 34)
//   → 3 products per 8h claim

// Pig: { 22, [(32, 8000), (35, 2000)], 1, 86400, true }
//   → 80% chance of Pork (id 32), 20% chance of Bacon (id 35)
//   → 1 product per 24h claim

// Admin can update via setAnimalConfig()
```

### 4.6 Shop Item Configuration

```solidity
struct ShopItem {
  uint256 itemId;
  uint256 price;    // In STOKEN (with 18 decimals)
  bool available;
}

// Example configs:
// Wheat Seed: { 1, 10 * 10^18, true } // 10 STOKEN
// Cow: { 20, 500 * 10^18, true } // 500 STOKEN

// Admin can update via setShopItem()
```

### 4.7 Plot Unlock Configuration

```solidity
// Stored in PlantSystem
uint256[] public plotUnlockCosts;
// [0, 0, 0, 100e18, 150e18, 200e18, 300e18, 500e18, 800e18]
// Index = plot number, value = cost in STOKEN
// Plots 0-2 free, plots 3-8 require payment

// Admin can update via setPlotUnlockCosts()
```

---

## 5. Smart Contract Specifications

### 5.1 Contract: ItemsERC1155

**Responsibilities:**
- Mint and burn all in-game items (seeds, crops, animals, products)
- Track balances per player per item type
- Enforce role-based minting permissions

**Key Functions:**

```solidity
function mint(address to, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE)
function burn(address from, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE)
function balanceOf(address account, uint256 id) external view returns (uint256)
function balanceOfBatch(address[] accounts, uint256[] ids) external view returns (uint256[])
```

**Events:**

```solidity
event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)
event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)
```

**State Variables:**

```solidity
mapping(uint256 => mapping(address => uint256)) private _balances;
mapping(address => mapping(address => bool)) private _operatorApprovals;
```

**Access Control:**
- `DEFAULT_ADMIN_ROLE`: Can grant/revoke roles
- `MINTER_ROLE`: Can mint/burn items (granted to system contracts)

**Invariants:**
- Balances never negative (uint256)
- Only MINTER_ROLE can create/destroy items

**Failure Modes:**
- Insufficient balance on burn → revert
- Unauthorized mint/burn → revert with access control error

---

### 5.2 Contract: STOKEN (ERC20)

**Responsibilities:**
- Manage in-game currency supply
- Mint rewards and starter funds
- Burn on purchases

**Key Functions:**

```solidity
function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE)
function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE)
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 amount) external returns (bool)
```

**Events:**

```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
event Approval(address indexed owner, address indexed spender, uint256 value)
```

**Access Control:**
- `MINTER_ROLE`: Granted to GameRegistry, RecipeSystem (for revenue)
- System contracts can burn from users with approval

**Invariants:**
- No max supply cap (inflationary)
- Revenue generation creates new tokens
- Shop purchases destroy tokens (deflationary sink)

---

### 5.3 Contract: RecipeNFT (ERC721)

**Responsibilities:**
- Mint unique recipe NFTs
- Store on-chain recipe metadata (no images)
- Generate tokenURI for metadata

**Key Functions:**

```solidity
function mintRecipe(
  address creator,
  string memory name,
  string memory description,
  uint8 difficulty
) external onlyRole(MINTER_ROLE) returns (uint256 tokenId)

function setRecipeEvaluation(
  uint256 tokenId,
  string memory grade,
  string[] memory critics,
  uint256 revenueRate
) external onlyRole(CONFIG_ADMIN_ROLE)

function getRecipe(uint256 tokenId) external view returns (Recipe memory)
function tokenURI(uint256 tokenId) external view returns (string memory)
```

**Events:**

```solidity
event RecipeMinted(uint256 indexed tokenId, address indexed creator, string name)
event RecipeEvaluated(uint256 indexed tokenId, string grade, uint256 revenueRate)
```

**State Variables:**

```solidity
uint256 private _nextTokenId;
mapping(uint256 => Recipe) private _recipes;
mapping(uint256 => mapping(uint256 => uint256)) private _recipeIngredients;
```

**Access Control:**
- `MINTER_ROLE`: RecipeSystem contract
- `CONFIG_ADMIN_ROLE`: Backend service (for evaluation updates)

**Invariants:**
- TokenId increments sequentially
- Creator field immutable after minting
- Grade can be updated by CONFIG_ADMIN_ROLE

---

### 5.4 Contract: GameRegistry

**Responsibilities:**
- Player onboarding (one-time registration)
- Distribute starter pack
- Note: Plot capacity is managed by PlantSystem

**Key Functions:**

```solidity
function registerPlayer() external
function isRegistered(address player) external view returns (bool)
```

**Events:**

```solidity
event PlayerRegistered(address indexed player, uint256 timestamp)
```

**State Variables:**

```solidity
mapping(address => bool) public registered;
uint256 public constant STARTER_STOKEN = 100 * 10**18;

// Starter items configuration
uint256[] public starterItemIds;
uint256[] public starterItemAmounts;
```

**Access Control:**
- Public registration (once per address)
- CONFIG_ADMIN_ROLE can update starter pack contents

**Invariants:**
- Cannot register twice
- Starter pack distributed atomically on registration

**Failure Modes:**
- Already registered → revert

**Admin Functions:**

```solidity
function setStarterPack(
  uint256[] memory itemIds,
  uint256[] memory amounts
) external onlyRole(CONFIG_ADMIN_ROLE)
```

---

### 5.5 Contract: PlantSystem

**Responsibilities:**
- Manage planting and harvesting
- Manage plot capacity per player
- Validate plot capacity and availability
- Enforce growth timers
- Configure seed → crop mappings
- Accept frontend-provided plot IDs

**Key Functions:**

```solidity
function plant(string memory plotId, uint256 seedId) external
function harvest(string memory plotId) external
function getPlot(address player, string memory plotId) external view returns (PlantTicket memory)
function getPlotCapacity(address player) external view returns (uint256)
function unlockNextPlot() external
function initializePlayer(address player) external onlyRole(MINTER_ROLE)
function setSeedConfig(uint256 seedId, SeedConfig memory config) external onlyRole(CONFIG_ADMIN_ROLE)
function setPlotUnlockCosts(uint256[] memory costs) external onlyRole(CONFIG_ADMIN_ROLE)
```

**Events:**

```solidity
event Planted(address indexed player, string plotId, uint256 seedId, uint256 harvestTime)
event Harvested(address indexed player, string plotId, uint256 cropId, uint256 amount)
event PlotUnlocked(address indexed player, uint256 newCapacity, uint256 cost)
event PlayerInitialized(address indexed player, uint256 initialCapacity)
```

**State Variables:**

```solidity
mapping(address => uint256) public plotCapacity;
mapping(address => mapping(bytes32 => PlantTicket)) public plots;
mapping(uint256 => SeedConfig) public seedConfigs;
uint256[] public plotUnlockCosts;
uint256 public constant MAX_PLOT_CAPACITY = 9;
```

**Plot Key Generation:**

```solidity
function _getPlotKey(address player, string memory plotId) private pure returns (bytes32) {
  return keccak256(abi.encodePacked(player, plotId));
}
```

**Access Control:**
- `CONFIG_ADMIN_ROLE`: Can update seed configs and unlock costs
- `MINTER_ROLE`: GameRegistry can call initializePlayer

**Invariants:**
- Plot capacity starts at 3, max 9
- Cannot plant on occupied plot
- Cannot harvest before harvestTime
- Seed consumed on plant, crop created on harvest

**Failure Modes:**
- Plot occupied → revert "Plot already in use"
- Too early to harvest → revert "Crop not ready"
- Insufficient seed balance → revert (from ItemsERC1155.burn)
- Insufficient STOKEN for unlock → revert
- Plot capacity exceeds max → revert

**Admin Functions:**

```solidity
function setSeedConfig(
  uint256 seedId,
  uint256 cropId,
  uint256 cropAmount,
  uint256 growthTime,
  bool active
) external onlyRole(CONFIG_ADMIN_ROLE)

function setPlotUnlockCosts(
  uint256[] memory costs
) external onlyRole(CONFIG_ADMIN_ROLE)
```

---

### 5.6 Contract: LivestockSystem

**Responsibilities:**
- Track livestock ownership (via ItemsERC1155 balances)
- Enforce claim cooldowns per animal type
- Calculate and distribute products based on probability
- Configure animal → product mappings with probabilities

**Key Functions:**

```solidity
function claimProducts(uint256 animalId) external returns (uint256 productId, uint256 amount)
function getNextClaimTime(address player, uint256 animalId) external view returns (uint256)
function setAnimalConfig(
  uint256 animalId,
  ProductProbability[] memory products,
  uint256 productAmount,
  uint256 cooldownSeconds,
  bool active
) external onlyRole(CONFIG_ADMIN_ROLE)
function getAnimalConfig(uint256 animalId) external view returns (AnimalConfig memory)
```

**Events:**

```solidity
event ProductsClaimed(address indexed player, uint256 animalId, uint256 productId, uint256 amount)
event AnimalConfigUpdated(uint256 indexed animalId)
```

**State Variables:**

```solidity
mapping(address => mapping(uint256 => uint256)) public lastClaimed;
mapping(uint256 => AnimalConfig) public animalConfigs;
```

**Probability Rolling:**

```solidity
function _rollProduct(ProductProbability[] memory products) private view returns (uint256) {
  uint256 roll = uint256(keccak256(abi.encodePacked(
    block.timestamp,
    block.prevrandao,
    msg.sender
  ))) % 10000;

  uint256 cumulative = 0;
  for (uint256 i = 0; i < products.length; i++) {
    cumulative += products[i].probability;
    if (roll < cumulative) {
      return products[i].productId;
    }
  }
  revert("Invalid probability config");
}
```

**Access Control:**
- `CONFIG_ADMIN_ROLE`: Can update animal configs

**Invariants:**
- Products = animalBalance * productAmount
- Cooldown enforced per player per animal type
- Must own at least 1 animal to claim
- Probabilities must sum to 10000 (100%)

**Failure Modes:**
- No animals owned → revert "No animals owned"
- Cooldown not elapsed → revert "Cooldown active"
- Invalid probability config → revert

**Admin Functions:**

```solidity
function setAnimalConfig(
  uint256 animalId,
  ProductProbability[] memory products,
  uint256 productAmount,
  uint256 cooldownSeconds,
  bool active
) external onlyRole(CONFIG_ADMIN_ROLE)
```

---

### 5.7 Contract: ShopSystem

**Responsibilities:**
- Sell seeds and animals for STOKEN
- Burn STOKEN payment
- Mint purchased items to buyer
- Allow admin to update prices and availability

**Key Functions:**

```solidity
function buyItem(uint256 itemId, uint256 quantity) external
function getItemPrice(uint256 itemId) external view returns (uint256)
function setShopItem(uint256 itemId, uint256 price, bool available) external onlyRole(CONFIG_ADMIN_ROLE)
function getShopItem(uint256 itemId) external view returns (ShopItem memory)
```

**Events:**

```solidity
event ItemPurchased(address indexed buyer, uint256 itemId, uint256 quantity, uint256 totalCost)
event ShopItemUpdated(uint256 indexed itemId, uint256 price, bool available)
```

**State Variables:**

```solidity
mapping(uint256 => ShopItem) public shopItems;
```

**Access Control:**
- `CONFIG_ADMIN_ROLE`: Can update shop catalog and prices

**Invariants:**
- Total cost = price * quantity
- STOKEN burned atomically with item mint
- Item must be available

**Failure Modes:**
- Item not available → revert "Item not available"
- Insufficient STOKEN → revert (from burn)

**Admin Functions:**

```solidity
function setShopItem(
  uint256 itemId,
  uint256 price,
  bool available
) external onlyRole(CONFIG_ADMIN_ROLE)
```

---

### 5.8 Contract: RecipeSystem

**Responsibilities:**
- Mint recipe NFTs via RecipeNFT contract
- Store recipe metadata on-chain
- Update evaluation results (grade, critics, revenue)
- Calculate restaurant revenue
- Generate leaderboard data
- Allow admin to update recipe mint fee

**Key Functions:**

```solidity
function mintRecipe(
  string memory name,
  string memory description,
  uint8 difficulty,
  uint256[] memory ingredientIds,
  uint256[] memory ingredientAmounts
) external returns (uint256 tokenId)

function evaluateRecipe(
  uint256 tokenId,
  string memory grade,
  string[] memory critics,
  uint256 revenueRate
) external onlyRole(CONFIG_ADMIN_ROLE)

function getRestaurantRevenue(address chef) external view returns (uint256)
function getLeaderboard(uint256 limit) external view returns (address[] memory, uint256[] memory)
function setRecipeMintFee(uint256 fee) external onlyRole(CONFIG_ADMIN_ROLE)
```

**Events:**

```solidity
event RecipeCreated(uint256 indexed tokenId, address indexed creator, uint256 mintFee)
event RecipeEvaluated(uint256 indexed tokenId, string grade, uint256 revenueRate)
event RecipeMintFeeUpdated(uint256 newFee)
```

**State Variables:**

```solidity
uint256 public recipeMintFee;
mapping(address => uint256) public totalRevenue;
```

**Access Control:**
- `CONFIG_ADMIN_ROLE`: AI backend service (to call evaluateRecipe), admin (to update fees)

**Invariants:**
- Creator pays mint fee in STOKEN
- Revenue accumulates daily based on revenueRate
- Only evaluated recipes generate revenue

**Failure Modes:**
- Insufficient STOKEN for mint fee → revert
- Invalid tokenId for evaluation → revert

**Admin Functions:**

```solidity
function setRecipeMintFee(uint256 fee) external onlyRole(CONFIG_ADMIN_ROLE)
```

---

### 5.9 Contract: MarketplaceSystem (Future)

**Responsibilities:**
- List items for sale with fixed price
- Match buyers and sellers
- Transfer STOKEN and items atomically
- Handle listing cancellations

**Key Functions:**

```solidity
function createListing(uint256 itemId, uint256 amount, uint256 pricePerUnit) external returns (uint256 listingId)
function buyListing(uint256 listingId, uint256 amount) external
function cancelListing(uint256 listingId) external
function getActiveListing(uint256 listingId) external view returns (Listing memory)
```

**Events:**

```solidity
event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 itemId, uint256 amount, uint256 price)
event ListingPurchased(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalCost)
event ListingCancelled(uint256 indexed listingId, address indexed seller)
```

**State Variables:**

```solidity
struct Listing {
  address seller;
  uint256 itemId;
  uint256 amount;
  uint256 pricePerUnit;
  bool active;
}

uint256 private _nextListingId;
mapping(uint256 => Listing) public listings;
```

**Invariants:**
- Items locked in contract during active listing
- Atomic swap of STOKEN and items
- Seller cannot withdraw while listed

**Failure Modes:**
- Listing inactive → revert
- Insufficient STOKEN → revert
- Buyer = seller → revert (optional)

---

### 5.10 Role-Based Access Control Summary

Using OpenZeppelin's `AccessControl`:

| Role | Granted To | Permissions |
|------|------------|-------------|
| `DEFAULT_ADMIN_ROLE` | Deployer / Multisig | Grant/revoke all roles, upgrade contracts |
| `MINTER_ROLE` | GameRegistry, PlantSystem, LivestockSystem, ShopSystem, RecipeSystem | Mint/burn ItemsERC1155 and STOKEN |
| `CONFIG_ADMIN_ROLE` | Backend service / Admin EOA | Update seed/animal/shop configs, evaluate recipes, update fees |

**Security Considerations:**
- `DEFAULT_ADMIN_ROLE` should be transferred to multisig post-deployment
- `CONFIG_ADMIN_ROLE` backend service key stored in secure vault
- All role changes emit events for monitoring
- Emergency pause mechanism (optional, via `Pausable`)

---

## 6. AI Services

All AI service specifications have been moved to a separate document: **AI_SERVICES.md**

This includes:
- Recipe Research API
- Recipe Evaluation API
- Marketplace Items API
- Rate limiting strategy
- Caching strategy
- Monitoring and alerts
- Security considerations
- API documentation

---

## 7. Game Economy and Balance

### 7.1 Token Flow Diagram

```
STOKEN Sources (Inflationary):
├─ Player Registration: +100 STOKEN per new player
├─ Recipe Revenue: +X STOKEN/day per recipe (based on grade)
└─ [Future] Quest Rewards, Events

STOKEN Sinks (Deflationary):
├─ Shop Purchases: Seeds (10-30 STOKEN), Animals (200-800 STOKEN)
├─ Plot Unlocking: 100, 150, 200, 300, 500, 800 STOKEN (cumulative ~2k)
├─ Recipe Minting: 50 STOKEN per recipe (configurable by admin)
└─ [Future] Marketplace Fees (2-5%)
```

### 7.2 Shop Pricing (MVP)

| Item | Category | Price (STOKEN) | Growth Time / Cooldown | Output |
|------|----------|----------------|------------------------|--------|
| Wheat Seed | Seed | 10 | 24h | 5 Wheat |
| Tomato Seed | Seed | 15 | 48h | 3 Tomato |
| Corn Seed | Seed | 20 | 72h | 4 Corn |
| Lettuce Seed | Seed | 8 | 12h | 4 Lettuce |
| Carrot Seed | Seed | 12 | 36h | 3 Carrot |
| Cow | Animal | 500 | 12h cooldown | 2 Milk (95%) or Cheese (5%) |
| Chicken | Animal | 200 | 8h cooldown | 3 Eggs (90%) or Feathers (10%) |
| Pig | Animal | 800 | 24h cooldown | 1 Pork (80%) or Bacon (20%) |

**Pricing Rationale:**
- Faster crops cost less (encourage early game activity)
- Animals have high upfront cost but infinite production
- Rare products from animals create exciting moments
- Prices calibrated so 1 plot farming wheat generates ~5 STOKEN/day profit after costs

**Admin can update all prices via ShopSystem.setShopItem()**

### 7.3 Plot Unlock Progression

| Plot # | Cost (STOKEN) | Cumulative Cost | Grid Layout |
|--------|---------------|-----------------|-------------|
| 1-3 | Free (starter) | 0 | 1x3 |
| 4 | 100 | 100 | 2x2 |
| 5 | 150 | 250 | 2x3 |
| 6 | 200 | 450 | 2x3 |
| 7 | 300 | 750 | 3x3 |
| 8 | 500 | 1,250 | 3x3 |
| 9 | 800 | 2,050 | 3x3 (full) |

**Unlock Strategy:**
- Early game: Focus on farming with 3 plots to earn STOKEN
- Mid game: Unlock plots 4-6 to scale production
- Late game: Invest in animals and recipes for passive income

**Admin can update unlock costs via PlantSystem.setPlotUnlockCosts()**

### 7.4 Recipe Revenue Loop

**Ingredient Consumption:**
- Recipes consume ingredients daily based on `ingredientRates`
- Example: "Pasta" requires 5 Wheat + 10 Tomato per day
- If player lacks ingredients, recipe becomes "inactive" (no revenue)

**Revenue Generation:**
- Active recipes generate `revenueRate` STOKEN per day
- Revenue minted automatically (view function shows claimable amount)
- Player claims accumulated revenue anytime

**Example Economy Cycle:**

```
Day 1:
- Plant 3 wheat seeds (cost: 30 STOKEN)
- Harvest after 24h → 15 wheat

Day 2:
- Sell 10 wheat on marketplace for 30 STOKEN
- Plant 3 more wheat seeds

Day 3:
- Research recipe idea (free)
- Mint "Wheat Bread" recipe (cost: 50 STOKEN)

Day 4:
- Recipe evaluated → Grade B, 48 STOKEN/day revenue
- Recipe consumes 5 wheat/day
- Net: +48 revenue, -5 wheat

Day 5-30:
- Farm wheat to feed recipe
- Accumulate ~1,440 STOKEN from recipe (30 days * 48)
- Unlock more plots, buy animals, mint more recipes
```

### 7.5 Balancing Levers

**If STOKEN inflation too high:**
- Increase shop prices (admin)
- Increase plot unlock costs (admin)
- Add marketplace transaction fees
- Reduce recipe revenue rates (admin)

**If STOKEN deflation too high:**
- Decrease shop prices (admin)
- Add STOKEN rewards for milestones
- Increase recipe revenue rates (admin)
- Add daily login bonuses

**If game too grindy:**
- Reduce growth times (admin)
- Increase crop yields (admin)
- Lower plot unlock costs (admin)
- Increase starter STOKEN to 200 (admin)

**Monitoring Metrics:**
- Average STOKEN balance per player
- STOKEN minted vs burned ratio
- Average time to unlock 9th plot
- Recipe mint rate
- Marketplace transaction volume

**All key parameters can be updated by CONFIG_ADMIN_ROLE without contract redeployment**

---

## 8. Testing Strategy

### 8.1 Unit Tests (Foundry)

**ItemsERC1155.t.sol:**
```solidity
function testMint() public
function testMintUnauthorized() public
function testBurn() public
function testBurnInsufficientBalance() public
function testBatchTransfer() public
```

**STOKEN.t.sol:**
```solidity
function testMint() public
function testBurn() public
function testTransfer() public
function testApproveAndTransferFrom() public
function testMintUnauthorized() public
```

**GameRegistry.t.sol:**
```solidity
function testRegisterPlayer() public
function testRegisterPlayerTwice() public
function testStarterPackDistributed() public
function testSetStarterPack() public
function testSetStarterPackUnauthorized() public
```

**PlantSystem.t.sol:**
```solidity
function testInitializePlayer() public
function testPlant() public
function testPlantOccupiedPlot() public
function testPlantInsufficientSeeds() public
function testHarvest() public
function testHarvestTooEarly() public
function testHarvestEmptyPlot() public
function testUnlockPlot() public
function testUnlockPlotInsufficientFunds() public
function testUnlockPlotMaxCapacity() public
function testSetSeedConfig() public
function testSetSeedConfigUnauthorized() public
function testSetPlotUnlockCosts() public
function testPlotKeyGeneration() public // Test keccak256(player, plotId)
function testMultiplePlotIds() public // Test different plot IDs
```

**LivestockSystem.t.sol:**
```solidity
function testClaimProducts() public
function testClaimProductsTooEarly() public
function testClaimProductsNoAnimals() public
function testClaimProductsMultipleAnimals() public
function testProbabilityDistribution() public // Test 95/5 split over many rolls
function testSetAnimalConfig() public
function testSetAnimalConfigUnauthorized() public
function testInvalidProbabilityConfig() public // Probabilities don't sum to 10000
```

**ShopSystem.t.sol:**
```solidity
function testBuyItem() public
function testBuyItemInsufficientFunds() public
function testBuyItemUnavailable() public
function testBuyMultipleItems() public
function testSetShopItem() public
function testSetShopItemUnauthorized() public
```

**RecipeSystem.t.sol:**
```solidity
function testMintRecipe() public
function testMintRecipeInsufficientFee() public
function testEvaluateRecipe() public
function testEvaluateRecipeUnauthorized() public
function testGetRestaurantRevenue() public
function testGetLeaderboard() public
function testSetRecipeMintFee() public
function testSetRecipeMintFeeUnauthorized() public
```

**RecipeNFT.t.sol:**
```solidity
function testMintRecipe() public
function testSetRecipeEvaluation() public
function testSetRecipeEvaluationUnauthorized() public
function testTokenURI() public // Test JSON generation without image
function testGetRecipe() public
```

**MarketplaceSystem.t.sol:**
```solidity
function testCreateListing() public
function testBuyListing() public
function testCancelListing() public
function testBuyInactiveListing() public
function testBuyOwnListing() public
```

**Coverage Target:** > 90% line coverage

---

## 9. Documentation Plan

### 9.1 README.md Structure

```markdown
# Soil2Sauce

> Grow. Create. Earn. The on-chain farm-to-restaurant game.

## Quick Start

### Prerequisites
- Node.js 18+
- Foundry
- MetaMask or similar wallet

### Installation
```bash
git clone ...
cd soil2sauce
forge install
npm install
```

### Run Locally
```bash
# Terminal 1: Start local blockchain
anvil

# Terminal 2: Deploy contracts
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545

# Terminal 3: Start frontend
cd frontend
npm run dev
```

## How to Play

1. **Farm:** Plant seeds in plots (tracked by plot ID), wait for crops to grow, harvest ingredients
2. **Raise Livestock:** Buy animals, claim products with probability-based rewards
3. **Create Recipes:** Use AI to design unique recipes, mint as NFTs (no images)
4. **Run Restaurant:** Earn passive income from your recipe portfolio
5. **Trade:** Buy and sell items on the marketplace

## Architecture

Single page React app connected to Foundry smart contracts.
See PROJECT_PLAN.md for detailed architecture.

## Smart Contracts

- **GameRegistry:** Player onboarding
- **PlantSystem:** Crop growing lifecycle and plot capacity management
- **LivestockSystem:** Animal products with probability rolls
- **ShopSystem:** Purchase seeds and animals (admin-configurable prices)
- **RecipeSystem:** Recipe NFTs and restaurant revenue (admin-configurable fees)
- **ItemsERC1155:** All in-game items
- **STOKEN:** In-game currency

## AI Services

See AI_SERVICES.md for complete AI service specifications.

## Admin Controls

Admins can update:
- Seed configurations (growth time, yield)
- Animal configurations (cooldown, product probabilities)
- Shop prices and availability
- Plot unlock costs
- Recipe mint fees
- Starter pack contents

All updates are on-chain and transparent via events.

## Contributing

See CONTRIBUTING.md

## License

MIT
```

### 9.2 Contract Documentation

**Auto-generated with Foundry:**

```bash
forge doc
```

**NatSpec comments in contracts:**

```solidity
/// @title PlantSystem
/// @notice Manages crop planting, harvesting, and plot capacity
/// @dev Uses frontend-provided plot IDs stored via keccak256(player, plotId)
contract PlantSystem is AccessControl {

  /// @notice Plants a seed in the specified plot
  /// @param plotId The plot identifier from frontend (e.g., "plot-0")
  /// @param seedId The seed token ID to plant
  /// @dev Requires seed ownership, empty plot, plotId within capacity
  function plant(string memory plotId, uint256 seedId) external {
    // ...
  }

  /// @notice Harvests a mature crop from the specified plot
  /// @param plotId The plot identifier to harvest
  /// @dev Requires growth time elapsed and valid PlantTicket
  function harvest(string memory plotId) external {
    // ...
  }

  /// @notice Returns current plot capacity for a player
  /// @param player The player address
  /// @return The number of unlocked plots (3-9)
  function getPlotCapacity(address player) external view returns (uint256) {
    // ...
  }
}
```

**Hosted Documentation:**
- Deploy to GitHub Pages or Vercel
- Include: contract addresses per network, ABI files, integration examples

### 9.3 API Documentation

See AI_SERVICES.md for complete API documentation including:
- OpenAPI/Swagger specs
- Request/response schemas
- Authentication
- Rate limiting
- Error handling

---

**Document Owner:** Technical Program Manager
**Last Updated:** October 31, 2025
**Version:** 2.0
**Status:** Active - Ready for Development
