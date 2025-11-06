# Frontend Merge Plan

## Current Situation

The frontend has duplicate files in both JavaScript (.js/.jsx) and TypeScript (.ts/.tsx) formats, creating confusion and inconsistency.

### Duplicate Files Identified

#### Root Level (`src/`)
- `App.jsx` vs `App.tsx` ❌
- `main.jsx` vs `main.tsx` ❌
- `wagmi.js` vs `wagmi.ts` ❌

#### Components (`src/components/`)
- `FarmPlots.jsx` (old farming UI) vs `FarmGrid.tsx` (new farming UI) ⚠️
- `Inventory.jsx` vs `Inventory.tsx` ❌
- `PlayerRegistration.jsx` vs `PlayerRegistration.tsx` ❌
- `Shop.jsx` (old) - No .tsx equivalent, needs integration ⚠️
- `Livestock.jsx` (old) - No .tsx equivalent, needs integration ⚠️
- Supporting files: `PlotItem.jsx`, `SeedOption.jsx`, `InventoryItem.jsx`, `WalletConnect.jsx`

#### Contexts
- `EventProvider.jsx` (complex event system for farming contracts)
- `RefreshContext.tsx` (simple refresh system for recipe features)

### Current Architecture

**App.jsx (Old - Farming Only):**
- Simple vertical layout
- Components: WalletConnect, PlayerRegistration, Inventory, FarmPlots, Livestock, Shop
- Uses EventProvider for real-time contract event updates
- Uses localhost Hardhat chain only
- No recipe features

**App.tsx (New - Recipe Features):**
- Sidebar navigation layout
- Includes ALL farming components PLUS recipe components
- Components include:
  - Farming: FarmGrid, SeedMarket, Inventory, MakeSeed, CropMarket, AnimalMarket, Stable
  - Recipes: RecipeResearch, RecipeEvaluation, RecipeSubmission, MyRecipes
  - Restaurant: Restaurant, BackKitchen
  - Community: Leaderboard, PlayerRegistration
- Uses RefreshContext
- Supports both localhost and Base Sepolia chains
- Has sidebar but missing CSS for layout

## Problems

1. **Entry Point Confusion**: `main.jsx` loads `App.jsx`, but newer code is in `main.tsx` and `App.tsx`
2. **Missing Features**: Recipe features in `App.tsx` are not visible because `main.jsx` is the entry point
3. **Duplicate Logic**: Two different PlayerRegistration, Inventory implementations
4. **Missing Providers**: `App.tsx` doesn't use EventProvider (needed for farming events)
5. **Missing CSS**: Sidebar layout in `App.tsx` has no styling
6. **Feature Fragmentation**: Farming in App.jsx, Recipes in App.tsx - they should be together

## Solution Plan

### Phase 1: Prepare TypeScript App (App.tsx)

**Goal**: Make App.tsx the complete, unified application

**Actions**:
1. ✅ Keep `App.tsx` as the main app (it has the sidebar layout with all features)
2. ✅ Merge providers: Add EventProvider to App.tsx's provider hierarchy
3. ✅ Add missing CSS for sidebar layout to `App.css`
4. ✅ Ensure all sections are visible and working

### Phase 2: Update Entry Point (main.tsx)

**Goal**: Make main.tsx the proper entry point

**Actions**:
1. ✅ Keep `main.tsx` and ensure it imports from TypeScript files
2. ✅ Add EventProvider to the provider hierarchy in main.tsx
3. ✅ Ensure it uses `config` from `wagmi.ts` (not wagmi.js)

### Phase 3: Clean Up Duplicate Files

**Goal**: Remove old JavaScript files to avoid confusion

**Files to DELETE**:
- `src/App.jsx` (replaced by App.tsx)
- `src/main.jsx` (replaced by main.tsx)
- `src/wagmi.js` (replaced by wagmi.ts)
- `src/components/Inventory.jsx` (have Inventory.tsx)
- `src/components/PlayerRegistration.jsx` (have PlayerRegistration.tsx)
- `src/components/FarmPlots.jsx` (using FarmGrid.tsx instead)
- `src/components/PlotItem.jsx` (not needed with FarmGrid.tsx)
- `src/components/SeedOption.jsx` (functionality in other components)
- `src/components/InventoryItem.jsx` (functionality in Inventory.tsx)
- `src/components/WalletConnect.jsx` (using wagmi's useConnect directly)
- `src/components/Shop.jsx` (functionality split into markets)
- `src/components/Livestock.jsx` (using Stable.tsx instead)

**Note**: EventProvider.jsx will be **converted to TypeScript** (not deleted) because it's needed for farming features.

### Phase 4: Convert EventProvider to TypeScript

**Goal**: Convert EventProvider.jsx to EventProvider.tsx for consistency

**Actions**:
1. ✅ Create `src/contexts/EventProvider.tsx` with proper TypeScript types
2. ✅ Keep all event listening logic
3. ✅ Update imports in main.tsx

### Phase 5: Update Configuration

**Goal**: Ensure all imports point to TypeScript files

**Actions**:
1. ✅ Verify `index.html` points to `src/main.tsx` (not main.jsx)
2. ✅ Update any import paths that reference .jsx to .tsx
3. ✅ Ensure vite.config.ts is properly configured

### Phase 6: Final Testing

**Actions**:
1. ✅ Build the project: `npm run build`
2. ✅ Run dev server: `npm run dev`
3. ✅ Test all features:
   - Wallet connection (both MetaMask and Injected)
   - Profile/Registration
   - Farming features (plant, harvest)
   - Seed market
   - Inventory
   - Make seed
   - Crop market
   - Animal market
   - Stable
   - Recipe research
   - Recipe evaluation
   - Recipe submission
   - My recipes
   - Restaurant
   - Back kitchen
   - Leaderboard
4. ✅ Test network switching (localhost vs Base Sepolia)
5. ✅ Verify sidebar navigation works
6. ✅ Verify all CSS is properly applied

## Expected Result

After merge:
- **Single entry point**: `main.tsx`
- **Single app**: `App.tsx` with sidebar navigation
- **All features visible**: Farming, Animals, Recipes, Restaurant, Leaderboard
- **Both networks supported**: localhost (Hardhat) for farming, Base Sepolia for recipes
- **Consistent codebase**: All TypeScript, no .jsx files
- **Proper event handling**: EventProvider for real-time farming updates
- **Clean architecture**: All providers properly nested

## File Structure After Merge

```
src/
├── main.tsx ✅ (entry point)
├── App.tsx ✅ (main app with sidebar)
├── App.css ✅ (includes sidebar styles)
├── wagmi.ts ✅ (config for both chains)
├── walletClient.ts ✅
├── RefreshContext.tsx ✅
├── contexts/
│   └── EventProvider.tsx ✅ (converted from .jsx)
└── components/
    ├── FarmGrid.tsx ✅
    ├── SeedMarket.tsx ✅
    ├── Inventory.tsx ✅
    ├── MakeSeed.tsx ✅
    ├── CropMarket.tsx ✅
    ├── AnimalMarket.tsx ✅
    ├── Stable.tsx ✅
    ├── Restaurant.tsx ✅
    ├── BackKitchen.tsx ✅
    ├── PlayerRegistration.tsx ✅
    ├── RecipeResearch.tsx ✅
    ├── RecipeEvaluation.tsx ✅
    ├── RecipeSubmission.tsx ✅
    ├── MyRecipes.tsx ✅
    └── Leaderboard.tsx ✅
```

## Risk Assessment

**Low Risk**:
- Deleting duplicate .jsx files (backups exist in git)
- Adding CSS (doesn't break existing code)
- Converting EventProvider to TS (straightforward type addition)

**Medium Risk**:
- Merging providers (need to ensure correct nesting)
- Testing all features (time-consuming but necessary)

**Mitigation**:
- Git commit before starting changes
- Test incrementally after each phase
- Keep dev server running to catch errors immediately
