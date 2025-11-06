# Frontend Merge Plan - REVISED
## Single Page Layout with All Features

## User Requirement

**Keep the original design**: Single page with all sections visible at once (no sidebar, no tabs)
- Everything appears on one scrollable page
- All features stacked vertically
- Add recipe features to the existing layout
- Use TypeScript for consistency

## Current Design to Preserve (from App.jsx)

```
┌─────────────────────────────┐
│   Header + Wallet Connect   │
├─────────────────────────────┤
│   Player Registration       │
├─────────────────────────────┤
│   Inventory                 │
├─────────────────────────────┤
│   Farm Plots                │
├─────────────────────────────┤
│   Livestock                 │
├─────────────────────────────┤
│   Shop                      │
├─────────────────────────────┤
│   Footer                    │
└─────────────────────────────┘
```

## Target Design (All on One Page)

```
┌─────────────────────────────┐
│   Header + Wallet Connect   │
├─────────────────────────────┤
│   Player Registration       │
├─────────────────────────────┤
│   🌾 FARMING SECTION        │
│   ├─ Inventory              │
│   ├─ Farm Plots             │
│   ├─ Seed Market            │
│   ├─ Make Seed              │
│   ├─ Crop Market            │
├─────────────────────────────┤
│   🐄 ANIMALS SECTION        │
│   ├─ Stable                 │
│   ├─ Animal Market          │
├─────────────────────────────┤
│   🍳 RECIPES SECTION        │
│   ├─ Recipe Research        │
│   ├─ Recipe Evaluation      │
│   ├─ Recipe Submission      │
│   ├─ My Recipes             │
├─────────────────────────────┤
│   🍽️ RESTAURANT SECTION     │
│   ├─ Restaurant             │
│   ├─ Back Kitchen           │
├─────────────────────────────┤
│   🏆 COMMUNITY SECTION      │
│   ├─ Leaderboard            │
├─────────────────────────────┤
│   Footer                    │
└─────────────────────────────┘
```

## Revised Solution Plan

### Phase 1: Create New Unified App.tsx

**Goal**: Rebuild App.tsx to match App.jsx's single-page layout but with ALL features

**Actions**:
1. ✅ Start with App.jsx structure (vertical sections)
2. ✅ Convert to TypeScript
3. ✅ Keep the same CSS classes (.game-section, .game-container)
4. ✅ Add all components in sections:
   - Farming: FarmGrid, SeedMarket, Inventory, MakeSeed, CropMarket
   - Animals: Stable, AnimalMarket
   - Recipes: RecipeResearch, RecipeEvaluation, RecipeSubmission, MyRecipes
   - Restaurant: Restaurant, BackKitchen
   - Community: Leaderboard
5. ✅ Use wallet connection from wagmi hooks (not WalletConnect component)
6. ✅ Keep EventProvider integration
7. ✅ Add section dividers/headers for organization

### Phase 2: Update Entry Point

**Goal**: Ensure main.tsx loads the new unified App.tsx

**Actions**:
1. ✅ Update main.tsx to:
   - Import App from './App' (TypeScript version)
   - Include both EventProvider and RefreshProvider
   - Use wagmi.ts config

### Phase 3: Clean Up Old Files

**Goal**: Remove duplicate JavaScript files

**Files to DELETE**:
- `src/App.jsx` (replaced by new unified App.tsx)
- `src/main.jsx` (using main.tsx)
- `src/wagmi.js` (using wagmi.ts)
- `src/components/FarmPlots.jsx` (using FarmGrid.tsx)
- `src/components/PlotItem.jsx` (part of FarmGrid)
- `src/components/Inventory.jsx` (using Inventory.tsx)
- `src/components/PlayerRegistration.jsx` (using PlayerRegistration.tsx)
- `src/components/SeedOption.jsx` (integrated)
- `src/components/InventoryItem.jsx` (integrated)
- `src/components/WalletConnect.jsx` (using wagmi hooks directly)
- `src/components/Shop.jsx` (split into markets)
- `src/components/Livestock.jsx` (using Stable.tsx)

### Phase 4: Convert EventProvider to TypeScript

**Goal**: Make EventProvider.tsx for type safety

**Actions**:
1. ✅ Convert EventProvider.jsx to EventProvider.tsx
2. ✅ Add proper TypeScript types
3. ✅ Keep all event listening functionality

### Phase 5: Update Styling

**Goal**: Ensure single-page layout looks good with all sections

**Actions**:
1. ✅ Keep existing App.css styling
2. ✅ Add section headers/dividers styling
3. ✅ Ensure proper spacing between sections
4. ✅ Remove sidebar CSS (not needed)
5. ✅ Add visual separators for different feature groups

### Phase 6: Handle Network Switching

**Goal**: Show appropriate warnings for network-specific features

**Actions**:
1. ✅ Farming features: Work on localhost (Hardhat)
2. ✅ Recipe features: Show banner if not on Base Sepolia
3. ✅ Allow all features to display regardless of network
4. ✅ Add network indicator in header

### Phase 7: Testing

**Actions**:
1. ✅ Build: `npm run build`
2. ✅ Run: `npm run dev`
3. ✅ Verify all sections visible on one page
4. ✅ Test each feature individually
5. ✅ Test scrolling through all sections
6. ✅ Test on both networks (localhost & Base Sepolia)

## Key Design Principles

1. **Single Scrollable Page**: No navigation, no tabs - everything visible
2. **Vertical Layout**: Sections stack top to bottom
3. **Visual Grouping**: Use section headers to organize features
4. **Preserve Simplicity**: Keep the clean, straightforward UI from App.jsx
5. **Add All Features**: Include farming, animals, recipes, restaurant, community

## App.tsx Structure (Pseudo-code)

```tsx
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🌾 Soil2Sauce</h1>
        <div>Network: {chain?.name}</div>
        <WalletConnection />
      </header>

      {!isConnected ? (
        <ConnectPrompt />
      ) : (
        <div className="game-container">
          {/* Player Profile */}
          <section className="game-section">
            <PlayerRegistration />
          </section>

          {/* === FARMING === */}
          <h2 className="section-divider">🌾 Farming</h2>

          <section className="game-section">
            <Inventory />
          </section>

          <section className="game-section">
            <FarmGrid />
          </section>

          <section className="game-section">
            <SeedMarket />
          </section>

          <section className="game-section">
            <MakeSeed />
          </section>

          <section className="game-section">
            <CropMarket />
          </section>

          {/* === ANIMALS === */}
          <h2 className="section-divider">🐄 Animals</h2>

          <section className="game-section">
            <Stable />
          </section>

          <section className="game-section">
            <AnimalMarket />
          </section>

          {/* === RECIPES === */}
          <h2 className="section-divider">🍳 Recipes</h2>

          <section className="game-section">
            <RecipeResearch />
          </section>

          <section className="game-section">
            <RecipeEvaluation />
          </section>

          <section className="game-section">
            <RecipeSubmission />
          </section>

          <section className="game-section">
            <MyRecipes />
          </section>

          {/* === RESTAURANT === */}
          <h2 className="section-divider">🍽️ Restaurant</h2>

          <section className="game-section">
            <Restaurant />
          </section>

          <section className="game-section">
            <BackKitchen />
          </section>

          {/* === COMMUNITY === */}
          <h2 className="section-divider">🏆 Community</h2>

          <section className="game-section">
            <Leaderboard />
          </section>
        </div>
      )}

      <footer className="app-footer">
        <p>Built on Ethereum</p>
      </footer>
    </div>
  );
}
```

## CSS Changes Needed

Add to App.css:
```css
.section-divider {
  text-align: center;
  font-size: 2rem;
  color: #2d3748;
  margin: 48px 0 24px 0;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Expected Result

- ✅ Single scrollable page with all features
- ✅ Clean vertical layout (no sidebar)
- ✅ All farming features visible
- ✅ All recipe features visible
- ✅ All restaurant features visible
- ✅ Community/leaderboard visible
- ✅ TypeScript consistency
- ✅ Network warnings where appropriate
- ✅ Simple, user-friendly design
