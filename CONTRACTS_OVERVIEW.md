# Soil2Sauce Smart Contracts Overview

**Version:** 1.0
**Date:** October 31, 2025
**Audience:** Non-technical stakeholders, game designers, product managers

---

## Introduction

This document provides a comprehensive, non-technical overview of all smart contracts in the Soil2Sauce game. It explains what each contract does, why it exists, and how it interacts with other contracts in the system.

### Contract Architecture

The Soil2Sauce smart contract system is organized into three layers:

1. **Token Layer**: Manages all in-game assets (items, currency, recipes)
2. **System Logic Layer**: Implements game mechanics (farming, livestock, shop, recipes, marketplace)
3. **Registry Layer**: Handles player onboarding and registration

---

## Access Control Roles

Before diving into individual contracts, it's important to understand the three security roles used throughout the system:

### 🔑 DEFAULT_ADMIN_ROLE
- **Who Has It**: Deployer initially, then transferred to a multisig wallet
- **What It Controls**: Can grant or revoke all other roles, ultimate authority
- **Use Case**: Emergency interventions, major system changes
- **Security**: Should be held by a multisig wallet requiring multiple signatures

### ⚙️ MINTER_ROLE
- **Who Has It**: System contracts (GameRegistry, PlantSystem, LivestockSystem, ShopSystem, RecipeSystem)
- **What It Controls**: Can create (mint) and destroy (burn) tokens and currency
- **Use Case**: Automated game operations like harvesting crops, purchasing items
- **Security**: Only granted to trusted system contracts, not external addresses

### 🎮 CONFIG_ADMIN_ROLE
- **Who Has It**: Game administrators and the AI backend service
- **What It Controls**: Can update game parameters, prices, configurations
- **Use Case**: Balancing the game economy, updating seed growth times, adjusting shop prices
- **Security**: Held by admin wallet and AI service (for recipe evaluations)

---

## Token Layer Contracts

### 1. ItemsERC1155 - The Universal Item Manager

**Purpose**: This contract manages ALL physical items in the game using a single smart contract. Think of it as a universal inventory system.

**What It Handles**:
- Seeds (Wheat Seed, Tomato Seed, Corn Seed, Lettuce Seed, Carrot Seed)
- Crops (Wheat, Tomato, Corn, Lettuce, Carrot)
- Animals (Cow, Chicken, Pig)
- Animal Products (Milk, Eggs, Pork, Cheese, Feathers, Bacon)

**Why It Exists**:
Instead of creating separate contracts for each item type, this contract efficiently manages all items using unique IDs. This saves gas costs and simplifies the system.

**Key Capabilities**:
- Track how many of each item each player owns
- Create new items when players harvest crops or claim animal products
- Remove items when players consume them or sell them
- Transfer items between players (for marketplace trading)

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant MINTER_ROLE to new contracts
- ⚙️ **MINTER_ROLE**: Required to create or destroy any items
- Players can freely transfer items they own to other players

**Relationships**:
- **Used By**: All system contracts need to mint/burn items
- **PlantSystem**: Burns seeds when planting, mints crops when harvesting
- **LivestockSystem**: Mints animal products when claiming
- **ShopSystem**: Mints items when purchased
- **GameRegistry**: Mints starter items for new players
- **MarketplaceSystem**: Transfers items between buyers and sellers

**Important Note**: This contract does NOT make game decisions. It's purely a ledger that tracks who owns what. Other contracts tell it what to do.

---

### 2. STOKEN - The Game Currency

**Purpose**: This is the in-game money that players use for all transactions.

**What It Handles**:
- Player currency balances
- Creating new currency (inflation)
- Destroying currency (deflation)
- Transfers between players

**Why It Exists**:
Every game needs a currency. STOKEN is used for:
- Buying seeds and animals from the shop
- Unlocking additional farm plots
- Minting new recipes
- Trading in the marketplace
- Paying fees

**Key Capabilities**:
- Mint new tokens when players earn revenue from recipes
- Burn tokens when players make purchases (creates economic sink)
- Standard ERC20 functionality (transfer, approve, transferFrom)

**Economic Model**:
- **No Maximum Supply**: New tokens can always be minted (inflationary)
- **Deflationary Mechanisms**: Tokens are burned when spent in shops
- **Balance**: Recipe revenue creates tokens, shop purchases destroy them

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant MINTER_ROLE
- ⚙️ **MINTER_ROLE**: Can create new tokens or destroy tokens from player balances (with approval)
- Players can freely transfer their own tokens

**Relationships**:
- **GameRegistry**: Mints starter currency for new players (100 STOKEN)
- **ShopSystem**: Burns STOKEN when players buy items
- **PlantSystem**: Burns STOKEN when players unlock plots
- **RecipeSystem**: Burns STOKEN for recipe minting fees, mints STOKEN as recipe revenue
- **MarketplaceSystem**: Transfers STOKEN between traders

**Important Economic Levers**:
Admins can control inflation/deflation by adjusting:
- Shop prices (higher = more burn)
- Plot unlock costs (higher = more burn)
- Recipe revenue rates (higher = more mint)
- Recipe minting fees (higher = more burn)

---

### 3. RecipeNFT - Unique Recipe Ownership

**Purpose**: This contract creates unique, ownable recipe NFTs that represent dishes created by players.

**What It Handles**:
- Unique recipe tokens (each recipe is one-of-a-kind)
- Recipe metadata (name, description, difficulty, grade, critics, ingredients)
- Recipe ownership and transfers
- Recipe evaluations and grades

**Why It Exists**:
Recipes are special - each one is unique and created by a player. Unlike seeds or crops (which are fungible), recipes are non-fungible tokens (NFTs) that can be:
- Owned by one player at a time
- Traded in the marketplace
- Displayed as achievements
- Used to generate daily revenue

**Key Capabilities**:
- Mint new recipe NFTs with full metadata
- Store recipe information on-chain (no images, text only)
- Update recipe grades and critic reviews after AI evaluation
- Generate metadata for viewing recipe details
- Track recipe creator forever

**Recipe Metadata Stored**:
- Name (e.g., "Spicy Tomato Pasta")
- Description (e.g., "A fiery Italian classic...")
- Difficulty (1-10 scale)
- Revenue Rate (STOKEN earned per day)
- Grade (F, D, C, B, A, S tier)
- Critics (array of review quotes)
- Creator (wallet address)
- Creation timestamp
- Ingredient requirements (stored separately)

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant MINTER_ROLE and CONFIG_ADMIN_ROLE
- ⚙️ **MINTER_ROLE**: Only RecipeSystem can mint new recipes
- 🎮 **CONFIG_ADMIN_ROLE**: Can update recipe evaluations (AI backend service)
- Players own and can transfer their recipe NFTs

**Relationships**:
- **RecipeSystem**: Calls this contract to mint new recipes and update evaluations
- **AI Backend**: Provides evaluation data that CONFIG_ADMIN writes on-chain
- **MarketplaceSystem**: Players can trade recipe NFTs

**Unique Feature**: Unlike other game items, recipe NFTs are permanently associated with their creator. Even if sold, the creator field never changes, preserving the chef's legacy.

---

## System Logic Layer Contracts

### 4. GameRegistry - The Player Onboarding Hub

**Purpose**: This is the entry point for all new players. It handles registration and distributes starter resources.

**What It Handles**:
- Player registration (one-time per wallet address)
- Starter pack distribution
- Registration status tracking

**Why It Exists**:
When a new player joins Soil2Sauce, they need:
- To be marked as a registered player
- Starter currency (100 STOKEN)
- Starter seeds to begin farming
- Initial farm plot setup

This contract orchestrates all of that in one transaction.

**Registration Process**:
1. Player clicks "Start Farming" in the frontend
2. GameRegistry checks they haven't registered before
3. Mints 100 STOKEN to player
4. Mints starter items (5 Wheat Seeds, 3 Tomato Seeds) to player
5. Calls PlantSystem to initialize 3 farm plots
6. Marks player as registered
7. Emits PlayerRegistered event

**Starter Pack Contents** (Admin Configurable):
- 100 STOKEN (currency)
- 5 Wheat Seeds (fast-growing starter crop)
- 3 Tomato Seeds (mid-tier starter crop)

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant roles
- ⚙️ **MINTER_ROLE**: Automatically granted to this contract for minting starter items
- 🎮 **CONFIG_ADMIN_ROLE**: Can update starter pack contents
- **Anyone**: Can register themselves (once)

**Relationships**:
- **STOKEN**: Mints starter currency
- **ItemsERC1155**: Mints starter items
- **PlantSystem**: Initializes player's farm plots

**Important Safeguards**:
- Cannot register the same address twice
- Starter pack is distributed atomically (all or nothing)
- If any part fails, the entire registration reverts

**Admin Configuration**:
Admins can update what new players receive by calling `setStarterPack()` to change:
- Which items are given
- How many of each item
- Total STOKEN amount (defined as constant, requires redeployment to change)

---

### 5. PlantSystem - Farming and Plot Management

**Purpose**: This contract manages the entire farming lifecycle: planting seeds, growing crops, harvesting, and unlocking additional farm plots.

**What It Handles**:
- Plot capacity per player (starts at 3, max 9)
- Planting seeds in specific plots
- Growth timers for crops
- Harvesting mature crops
- Plot unlocking (expansion)
- Seed configurations (growth times, yields)

**Why It Exists**:
Farming is the core gameplay loop. Players need to:
- Plant seeds in their plots
- Wait for crops to grow
- Harvest at the right time
- Expand their farm over time

This contract enforces all the rules and timers for this system.

**How Farming Works**:

**Planting**:
1. Player selects a plot (identified by plot ID like "plot-0")
2. Player selects a seed type (e.g., Wheat Seed)
3. PlantSystem checks: Does player own the seed? Is the plot empty? Is plot ID valid for their capacity?
4. Burns one seed from player's inventory
5. Creates a PlantTicket with: seed type, planting timestamp, harvest time
6. Stores PlantTicket using plot ID

**Growing**:
- Time passes automatically (based on blockchain timestamps)
- Each seed has a configured growth time (e.g., Wheat = 24 hours)
- Frontend shows countdown timers by reading blockchain state

**Harvesting**:
1. Player clicks "Harvest" on a mature plot
2. PlantSystem checks: Is there a PlantTicket? Has enough time passed?
3. Mints crop items to player (amount based on seed configuration)
4. Deletes PlantTicket
5. Plot becomes available for replanting

**Plot Expansion**:
- Players start with 3 plots
- Can unlock up to 9 plots total
- Each unlock costs progressively more STOKEN:
  - Plot 4: 100 STOKEN
  - Plot 5: 150 STOKEN
  - Plot 6: 200 STOKEN
  - Plot 7: 300 STOKEN
  - Plot 8: 500 STOKEN
  - Plot 9: 800 STOKEN

**Plot ID System**:
- Frontend assigns plot IDs as strings ("plot-0", "plot-1", etc.)
- Contract stores using `keccak256(playerAddress, plotId)` as key
- This allows frontend complete freedom in how plots are displayed
- Frontend can arrange plots in any grid layout (1x3, 2x3, 3x3)

**Seed Configurations** (Admin Managed):
Each seed type has:
- Growth time in seconds
- Crop ID it produces
- Amount of crops per harvest
- Active/inactive status

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant roles
- ⚙️ **MINTER_ROLE**: Required to burn seeds and mint crops
- 🎮 **CONFIG_ADMIN_ROLE**: Can update seed configurations and plot unlock costs
- **Players**: Can plant, harvest, and unlock plots (if they pay)

**Relationships**:
- **ItemsERC1155**: Burns seeds when planting, mints crops when harvesting
- **STOKEN**: Burns tokens when unlocking plots
- **GameRegistry**: Initializes new players with 3 plot capacity

**Admin Configuration Options**:
Admins can update via CONFIG_ADMIN_ROLE:
- Seed growth times (make farming faster/slower)
- Crop yields (how many crops per harvest)
- Plot unlock costs (make expansion cheaper/expensive)
- Add new seed types or disable existing ones

**Important Rules**:
- Cannot plant on occupied plot
- Cannot harvest before crop is mature
- Cannot unlock beyond 9 plots
- Plot capacity persists even if player runs out of STOKEN

---

### 6. LivestockSystem - Animal Products and Probabilities

**Purpose**: This contract manages animal ownership and product generation with probability-based outcomes.

**What It Handles**:
- Animal product claiming with cooldowns
- Probability-based product generation (common vs rare)
- Claim timers per player per animal type
- Animal configurations (products, probabilities, cooldowns)

**Why It Exists**:
Animals provide a different gameplay loop than farming:
- One-time purchase (no replanting needed)
- Periodic claiming instead of planting/harvesting
- Exciting probability mechanics (will you get rare cheese or common milk?)

**How Livestock Works**:

**Owning Animals**:
- Players buy animals from the shop (stored in ItemsERC1155)
- Owning 1 Cow means you can claim cow products
- Owning 5 Cows means you get 5x products per claim
- Animals are never consumed (infinite production)

**Claiming Products**:
1. Player clicks "Claim" for an animal type (e.g., Cow)
2. LivestockSystem checks: Does player own at least 1? Has cooldown elapsed?
3. Rolls probability to determine which product (Milk 95% or Cheese 5%)
4. Mints product amount × number of animals owned
5. Resets cooldown timer

**Probability System**:
Each animal can produce multiple products with different probabilities:

- **Cow** (12-hour cooldown, 2 products per claim):
  - 95% chance: Milk (common)
  - 5% chance: Cheese (rare)

- **Chicken** (8-hour cooldown, 3 products per claim):
  - 90% chance: Eggs (common)
  - 10% chance: Feathers (rare)

- **Pig** (24-hour cooldown, 1 product per claim):
  - 80% chance: Pork (common)
  - 20% chance: Bacon (rare)

**Probability Mechanics**:
- System generates random number (0-9999) using blockchain data
- Rolls against cumulative probability thresholds
- Example: Cow roll of 9300 → Milk, roll of 9700 → Cheese
- Each claim is independent (like rolling dice each time)

**Cooldown System**:
- Separate cooldown per player per animal type
- Cooldown starts when you claim, not when you buy
- First claim has no cooldown (can claim immediately after purchase)
- Subsequent claims require waiting

**Animal Configurations** (Admin Managed):
Each animal type has:
- Product IDs array (what it can produce)
- Probability array (chances for each product, must sum to 10,000)
- Product amount (how many per claim)
- Cooldown seconds (time between claims)
- Active/inactive status

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant roles
- ⚙️ **MINTER_ROLE**: Required to mint animal products
- 🎮 **CONFIG_ADMIN_ROLE**: Can update animal configurations
- **Players**: Can claim products if they own animals and cooldown elapsed

**Relationships**:
- **ItemsERC1155**: Reads animal balances, mints products
- **ShopSystem**: Where players buy animals
- Players can sell/trade animals via marketplace

**Admin Configuration Options**:
Admins can update via CONFIG_ADMIN_ROLE:
- Product probabilities (make rare items more/less common)
- Cooldown times (faster/slower production)
- Product amounts (how many per claim)
- Add new animals or products
- Disable problematic animals

**Important Rules**:
- Must own at least 1 animal to claim
- Cooldown enforced strictly (cannot claim early)
- Probabilities must total exactly 10,000 (100%)
- Products scale linearly with animal count

**Strategic Implications**:
- Common products: Reliable for recipes and trading
- Rare products: Exciting bonuses, potentially more valuable
- More animals = more total products per claim
- Different cooldowns encourage diverse animal portfolios

---

### 7. ShopSystem - The Item Marketplace

**Purpose**: This contract runs the game's shop where players buy seeds and animals using STOKEN.

**What It Handles**:
- Item catalog with prices
- Purchase transactions
- Item availability toggles
- Price configurations

**Why It Exists**:
Players need a reliable way to acquire:
- Seeds for farming
- Animals for livestock production
- The shop provides fixed prices (no haggling or market volatility in MVP)

**How Shopping Works**:

**Browsing**:
- Frontend reads shop catalog from contract
- Shows item name, price in STOKEN, and availability
- Players can see what they can afford

**Purchasing**:
1. Player selects item and quantity
2. ShopSystem checks: Is item available? Does player have enough STOKEN?
3. Calculates total cost (price × quantity)
4. Burns STOKEN from player's balance (destroys currency)
5. Mints items to player's inventory
6. Emits ItemPurchased event

**Shop Catalog** (Admin Configured):

**Seeds**:
- Wheat Seed: 10 STOKEN
- Tomato Seed: 15 STOKEN
- Corn Seed: 20 STOKEN
- Lettuce Seed: 8 STOKEN
- Carrot Seed: 12 STOKEN

**Animals**:
- Cow: 500 STOKEN
- Chicken: 200 STOKEN
- Pig: 800 STOKEN

**Economic Function**:
- Primary STOKEN sink (deflationary pressure)
- Balances recipe revenue (inflationary pressure)
- Prices calibrated to game progression

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant roles
- ⚙️ **MINTER_ROLE**: Required to burn STOKEN and mint items
- 🎮 **CONFIG_ADMIN_ROLE**: Can update prices and availability
- **Players**: Can purchase any available item if they have STOKEN

**Relationships**:
- **STOKEN**: Burns currency on purchases
- **ItemsERC1155**: Mints purchased items
- Economy depends on this as primary currency sink

**Admin Configuration Options**:
Admins can update via CONFIG_ADMIN_ROLE:
- Item prices (increase/decrease to control economy)
- Item availability (temporarily disable sales)
- Add new items to catalog
- Remove items from catalog

**Important Economic Levers**:
- **Price increases**: Reduce STOKEN supply faster (deflationary)
- **Price decreases**: Encourage more farming, slower deflation
- **Availability toggles**: Control item scarcity for events
- **New items**: Expand gameplay without new contracts

**Future Enhancements** (Post-MVP):
- Limited stock per item
- Dynamic pricing based on demand
- Sales and discounts
- Bulk purchase bonuses
- Seasonal items

---

### 8. RecipeSystem - Restaurant Management

**Purpose**: This contract manages recipe creation, AI evaluation integration, revenue generation, and the leaderboard.

**What It Handles**:
- Recipe NFT minting (via RecipeNFT contract)
- Recipe evaluations from AI
- Restaurant revenue calculation
- Leaderboard ranking
- Recipe minting fees

**Why It Exists**:
This is the "endgame" content where players:
- Create unique recipes as NFTs
- Get AI critiques and grades
- Earn passive income from successful recipes
- Compete on leaderboards for top chef status

**How Recipes Work**:

**Creating a Recipe**:
1. Player uses AI service to research recipe ideas (off-chain)
2. Player selects a recipe design
3. Player calls RecipeSystem to mint
4. Pays minting fee (default: 50 STOKEN, admin configurable)
5. Provides: name, description, difficulty (1-10), ingredients
6. RecipeSystem mints NFT via RecipeNFT contract
7. Recipe enters "pending evaluation" state

**AI Evaluation**:
1. Frontend calls AI backend service (see AI_SERVICES.md)
2. AI analyzes recipe creativity, difficulty, ingredient synergy
3. AI generates grade (F/D/C/B/A/S) and critic reviews
4. AI backend calls RecipeSystem.evaluateRecipe() using CONFIG_ADMIN_ROLE
5. Grade, critics, and revenue rate written on-chain
6. Recipe becomes "active" and starts generating revenue

**Grading System**:
- **S-Tier**: 5 critics, difficulty × 12 STOKEN/day
- **A-Tier**: 4 critics, difficulty × 10 STOKEN/day
- **B-Tier**: 3 critics, difficulty × 8 STOKEN/day
- **C-Tier**: 2 critics, difficulty × 6 STOKEN/day
- **D-Tier**: 1 critic, difficulty × 4 STOKEN/day
- **F-Tier**: 0 critics, difficulty × 2 STOKEN/day

**Revenue Generation**:
- Each evaluated recipe generates STOKEN daily
- Revenue rate based on grade and difficulty
- Revenue accumulates over time (view function calculates claimable amount)
- Players claim when convenient
- Revenue is newly minted STOKEN (inflationary)

**Leaderboard**:
- Ranks players by total restaurant revenue
- Top 10 displayed in frontend
- Updated on-demand (no automated updates to save gas)
- Encourages competition and replayability

**Ingredient Consumption** (Future):
- Recipes can specify ingredient requirements
- Active recipes consume ingredients daily
- If player lacks ingredients, recipe becomes inactive (no revenue)
- Creates gameplay loop: farm → create recipes → farm more to feed recipes

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant roles
- ⚙️ **MINTER_ROLE**: Required to mint recipe NFTs and revenue STOKEN
- 🎮 **CONFIG_ADMIN_ROLE**: Can update recipe evaluations (AI backend), change minting fee
- **Players**: Can mint recipes (pay fee), own recipe NFTs, claim revenue

**Relationships**:
- **RecipeNFT**: Mints and stores recipe data
- **STOKEN**: Burns minting fee, mints revenue
- **AI Backend**: Provides evaluation data via CONFIG_ADMIN
- **ItemsERC1155**: (Future) reads ingredient balances for consumption

**Admin Configuration Options**:
Admins can update via CONFIG_ADMIN_ROLE:
- Recipe minting fee (make recipe creation more/less expensive)
- AI backend can update recipe evaluations
- Can re-evaluate recipes if needed

**Important Economic Balancing**:
- **Minting fee**: Costs 50 STOKEN (deflationary)
- **Revenue generation**: Earns 20-120 STOKEN/day (inflationary)
- **Break-even**: Most recipes pay back minting fee in 1-3 days
- **Long-term**: Recipes become profitable passive income

**Strategic Gameplay**:
- Higher difficulty = higher potential revenue
- Better ingredients = better AI evaluation
- S-tier recipes are prestigious and profitable
- Players can own multiple recipes (diversified portfolio)

---

### 9. MarketplaceSystem - Player Trading (Future)

**Purpose**: This contract enables peer-to-peer trading of items and recipes.

**What It Handles**:
- Item listings (fixed-price sales)
- Purchase transactions
- Listing cancellations
- Escrow of items during listing

**Why It Exists**:
Players need to:
- Sell excess crops or products
- Buy items without shop price limits
- Trade rare animal products (cheese, feathers, bacon)
- Sell recipe NFTs they no longer want

**How Trading Works**:

**Creating a Listing**:
1. Seller selects item and quantity
2. Sets price per unit in STOKEN
3. MarketplaceSystem transfers items from seller to escrow
4. Creates listing with unique ID
5. Listing appears in marketplace UI

**Buying**:
1. Buyer browses active listings
2. Clicks "Buy" on desired listing
3. MarketplaceSystem checks STOKEN balance
4. Transfers STOKEN from buyer to seller
5. Transfers items from escrow to buyer
6. Marks listing as complete (or reduces quantity if partial buy)

**Canceling**:
1. Seller can cancel anytime
2. Items returned from escrow to seller
3. Listing marked inactive

**Access Control**:
- 🔑 **DEFAULT_ADMIN_ROLE**: Can grant roles (if needed)
- **Players**: Can list, buy, and cancel their own listings
- No special roles required for basic trading

**Relationships**:
- **ItemsERC1155**: Holds items in escrow, transfers on purchase
- **RecipeNFT**: Recipes can be listed and traded
- **STOKEN**: Transferred between buyer and seller

**Future Enhancements**:
- Marketplace fees (2-5% to create STOKEN sink)
- Auction system (bidding instead of fixed price)
- Bulk listings
- Trade offers (item for item swaps)

**Economic Impact**:
- Creates secondary market for items
- Price discovery (what are rare products worth?)
- Liquidity for players who need quick STOKEN
- Alternative to shop (potentially cheaper)

---

## Contract Interaction Diagram

Here's how all the contracts work together during common gameplay scenarios:

### Scenario 1: New Player Registration

```
Player → GameRegistry.registerPlayer()
  ├→ STOKEN.mint() [100 STOKEN to player]
  ├→ ItemsERC1155.mint() [5 Wheat Seeds to player]
  ├→ ItemsERC1155.mint() [3 Tomato Seeds to player]
  └→ PlantSystem.initializePlayer() [Set capacity = 3]
```

### Scenario 2: Planting and Harvesting

```
Player → PlantSystem.plant("plot-0", seedId=1)
  ├→ ItemsERC1155.burn() [1 Wheat Seed from player]
  └→ Creates PlantTicket with 24h timer

[Time passes: 24 hours]

Player → PlantSystem.harvest("plot-0")
  ├→ Checks timer elapsed
  ├→ ItemsERC1155.mint() [5 Wheat to player]
  └→ Deletes PlantTicket
```

### Scenario 3: Buying from Shop

```
Player → ShopSystem.buyItem(itemId=20, quantity=1) [Buy 1 Cow]
  ├→ STOKEN.burn() [500 STOKEN from player]
  └→ ItemsERC1155.mint() [1 Cow to player]
```

### Scenario 4: Claiming Animal Products

```
Player → LivestockSystem.claimProducts(animalId=20) [Cow]
  ├→ ItemsERC1155.balanceOf() [Check player owns cows]
  ├→ Check cooldown elapsed
  ├→ Roll probability (95% Milk, 5% Cheese)
  ├→ ItemsERC1155.mint() [2× products to player]
  └→ Reset cooldown timer
```

### Scenario 5: Creating and Evaluating Recipe

```
Player → RecipeSystem.mintRecipe(name, description, difficulty, ingredients)
  ├→ STOKEN.burn() [50 STOKEN fee from player]
  └→ RecipeNFT.mintRecipe() [Create NFT, assign to player]

[AI Evaluation happens off-chain]

AI Backend → RecipeSystem.evaluateRecipe(tokenId, grade, critics, revenueRate)
  └→ RecipeNFT.setRecipeEvaluation() [Update grade, critics, revenue]

[Revenue accumulates over time]

Player → RecipeSystem.claimRevenue()
  └→ STOKEN.mint() [Revenue to player based on days elapsed]
```

### Scenario 6: Unlocking Plot

```
Player → PlantSystem.unlockNextPlot()
  ├→ Check current capacity (e.g., 3)
  ├→ STOKEN.burn() [100 STOKEN for plot 4]
  └→ Increment capacity to 4
```

### Scenario 7: Marketplace Trade

```
Seller → MarketplaceSystem.createListing(itemId, amount, price)
  ├→ ItemsERC1155.transferFrom() [Items to marketplace escrow]
  └→ Create listing record

Buyer → MarketplaceSystem.buyListing(listingId)
  ├→ STOKEN.transferFrom() [Buyer to seller]
  ├→ ItemsERC1155.transfer() [Items from escrow to buyer]
  └→ Mark listing complete
```

---

## Access Control Summary by Contract

| Contract | DEFAULT_ADMIN | MINTER_ROLE | CONFIG_ADMIN | Public |
|----------|---------------|-------------|--------------|--------|
| **ItemsERC1155** | Grant roles | Mint/burn items | - | Transfer owned items |
| **STOKEN** | Grant roles | Mint/burn tokens | - | Transfer, approve |
| **RecipeNFT** | Grant roles | Mint recipes | Update evaluations | Transfer owned NFTs |
| **GameRegistry** | Grant roles | Auto-granted | Update starter pack | Register once |
| **PlantSystem** | Grant roles | Mint/burn via farming | Update seed configs, plot costs | Plant, harvest, unlock |
| **LivestockSystem** | Grant roles | Mint products | Update animal configs | Claim products |
| **ShopSystem** | Grant roles | Mint/burn via purchases | Update shop items, prices | Buy items |
| **RecipeSystem** | Grant roles | Mint recipes, revenue | Update evaluations, fees | Mint recipes, claim revenue |
| **MarketplaceSystem** | Grant roles | - | - | List, buy, cancel |

---

## Security and Safety Features

### Multi-Signature Admin (DEFAULT_ADMIN_ROLE)
- Requires multiple authorized signers to make critical changes
- Protects against single point of failure
- Used for emergency interventions only

### Role Separation
- Game operations (MINTER_ROLE) separated from administration (CONFIG_ADMIN_ROLE)
- System contracts cannot change game rules
- Admins cannot directly mint items (must go through proper contracts)

### Event Emission
- All important actions emit events
- Transparent on-chain history
- External monitoring can detect unusual patterns
- Players can audit all admin changes

### Validation Checks
- Cannot register twice
- Cannot harvest early
- Cannot claim during cooldown
- Cannot plant on occupied plot
- Cannot unlock beyond 9 plots
- Probabilities must sum to 100%

### Economic Safeguards
- Fixed maximum plot capacity (prevents infinite expansion)
- Cooldowns prevent rapid claiming
- Fees create economic sinks
- Separate inflation (revenue) and deflation (fees) mechanisms

### Emergency Pause (Optional)
- Can temporarily halt contract operations if exploit detected
- Allows time to assess and respond to threats
- Requires DEFAULT_ADMIN_ROLE

---

## Admin Responsibilities

### Regular Operations (CONFIG_ADMIN_ROLE)
- Monitor game economy (STOKEN supply, price levels)
- Adjust shop prices if inflation/deflation detected
- Update seed growth times for better pacing
- Modify animal probabilities for balance
- Change plot unlock costs for progression tuning
- Update recipe minting fees
- Approve AI backend evaluations

### Rare Interventions (DEFAULT_ADMIN_ROLE)
- Grant CONFIG_ADMIN_ROLE to new admin addresses
- Revoke compromised admin keys
- Add MINTER_ROLE to new system contracts (if upgraded)
- Emergency pause if critical bug found
- Transfer admin to multisig for increased security

### Never Allowed (Even for Admins)
- Cannot directly mint STOKEN or items to arbitrary addresses
- Cannot change player balances directly
- Cannot delete player registrations
- Cannot modify PlantTickets (crop timers)
- Cannot bypass cooldowns
- Cannot change recipe creators

---

## Economic Balance and Game Health

### Monitoring Metrics

Admins should regularly check:

1. **STOKEN Supply Trends**
   - Total minted vs. total burned
   - Average player balance
   - Inflation/deflation rate

2. **Player Progression**
   - Average time to unlock all 9 plots
   - Percentage reaching endgame (recipes)
   - Recipe creation rate

3. **Marketplace Activity**
   - Trading volume
   - Price levels for rare products
   - Supply/demand imbalances

4. **Engagement Metrics**
   - Daily active users
   - Average session length
   - Retention rates

### Balancing Actions

If inflation too high (STOKEN losing value):
- ✅ Increase shop prices (CONFIG_ADMIN)
- ✅ Increase plot unlock costs (CONFIG_ADMIN)
- ✅ Increase recipe minting fees (CONFIG_ADMIN)
- ✅ Reduce recipe revenue rates (requires re-evaluation)

If deflation too high (STOKEN too scarce):
- ✅ Decrease shop prices (CONFIG_ADMIN)
- ✅ Decrease plot unlock costs (CONFIG_ADMIN)
- ✅ Increase crop yields (CONFIG_ADMIN)
- ✅ Reduce growth times (CONFIG_ADMIN)

If game too grindy (players frustrated):
- ✅ Reduce seed growth times (CONFIG_ADMIN)
- ✅ Increase crop yields (CONFIG_ADMIN)
- ✅ Reduce animal cooldowns (CONFIG_ADMIN)
- ✅ Increase starter pack contents (CONFIG_ADMIN)

If game too easy (no challenge):
- ✅ Increase plot unlock costs (CONFIG_ADMIN)
- ✅ Reduce rare product probabilities (CONFIG_ADMIN)
- ✅ Increase recipe minting fees (CONFIG_ADMIN)

---

## Future Upgrades and Extensibility

### Smart Contract Upgradability

The system is designed to be extended without disrupting existing gameplay:

**Adding New Items**:
- ItemsERC1155 can handle unlimited item IDs
- Just configure new seeds/crops/animals via CONFIG_ADMIN
- No contract redeployment needed

**Adding New Game Mechanics**:
- Deploy new system contract
- Grant it MINTER_ROLE to interact with tokens
- Players can opt-in to new features

**Upgrading Existing Contracts**:
- If using proxy pattern, can upgrade logic
- If not using proxies, can deploy new version and migrate
- Ensure player assets remain safe during migration

### Potential Future Contracts

**QuestSystem**:
- Daily/weekly challenges
- Rewards for completing objectives
- Achievement tracking

**CraftingSystem**:
- Combine ingredients into processed foods
- Multi-step recipes (wheat → flour → bread)
- Unlockable crafting stations

**SeasonalEventSystem**:
- Limited-time crops and animals
- Holiday-themed recipes
- Exclusive NFT rewards

**GuildSystem**:
- Player organizations
- Shared resources and goals
- Cooperative gameplay

**LandOwnershipSystem**:
- Expand beyond 9 plots
- Purchase virtual land parcels as NFTs
- Trade land in marketplace

---

## Conclusion

The Soil2Sauce smart contract system is designed with:

✅ **Clarity**: Each contract has a single, well-defined purpose
✅ **Security**: Multi-layered access control protects player assets
✅ **Flexibility**: Admins can tune the economy without redeployment
✅ **Transparency**: All operations are on-chain and auditable
✅ **Extensibility**: New features can be added without breaking existing gameplay

The three-role access control system ensures:
- **Players** control their own assets
- **System contracts** automate game mechanics trustlessly
- **Admins** can balance the game economy
- **Multisig** protects against malicious admin actions

By separating concerns across multiple contracts, the system remains maintainable, testable, and secure while delivering a rich gameplay experience.

---

**Document Version:** 1.0
**Last Updated:** October 31, 2025
**Maintained By:** Technical Program Manager
