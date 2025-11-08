# Recipe NFT Minting Architecture Plan

## Overview

Backend handles all blockchain interactions using a private key with GRADER_ROLE. Hash-based integrity verification ensures AI evaluation results cannot be tampered with between evaluation and minting.

## Current Problem

- Frontend calls `requestRecipe` but NFT never gets minted
- Off-chain services can't re-evaluate because event lacks `instruction` data
- No coordination between evaluation and minting

## New Flow

### Phase 1: Evaluation (No Blockchain)

1. User submits ingredients + instructions
2. Frontend → Backend: `POST /api/evaluate-recipe`
   - Params: `{ instruction, ingredients, walletAddress }`
3. Backend:
   - Calls OpenAI for evaluation
   - Uploads metadata to IPFS
   - Generates nonce (UUID, stored server-side)
   - Computes hash: `keccak256(walletAddress + evaluation + timestamp + nonce)`
4. Backend → Frontend: `{ dishDescription, grade, revenueRate, critics, metadataURI, hash, timestamp }`
5. Frontend displays evaluation results + hash (read-only)

### Phase 2: Minting

1. User clicks "Submit to Blockchain"
2. Frontend → Contract: `requestRecipe(dishDescription, ingredients)`
   - User's wallet signs transaction
   - User becomes the chef/owner
   - Returns recipeId from event
3. Frontend extracts recipeId from transaction receipt
4. Frontend → Backend: `POST /api/mint-recipe`
   - Params: `{ recipeId, walletAddress, dishDescription, ingredients, grade, revenueRate, critics, metadataURI, hash, timestamp }`
5. Backend:
   - Recomputes hash and verifies match
   - Calls `finalizeRecipe(recipeId, dishDescription, grade, revenueRate, critics, metadataURI)` using GRADER_ROLE wallet
   - NFT minted to user's wallet
6. Backend → Frontend: `{ success, recipeId, txHash }`
7. Frontend shows success with NFT details

## Implementation Changes

### Backend

#### New Dependencies (`backend/package.json`)
```json
{
  "dependencies": {
    "viem": "^2.38.0"
  }
}
```

#### New Environment Variables (`backend/.env`)
```bash
GRADER_PRIVATE_KEY=0x...
RECIPE_CONTRACT_ADDRESS=0xA5d01289948Efe9E8c9a9B9D04C73C280De35ee1
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/...
BASE_CHAIN_ID=84532
```

#### New Files

**`backend/src/services/blockchain.ts`**
- Initialize viem public/wallet clients
- `requestRecipe(dishDescription, ingredients)` → returns recipeId
- `finalizeRecipe(recipeId, dishDescription, grade, revenueRate, critics, metadataURI)` → returns txHash

**`backend/src/services/hashService.ts`**
- In-memory Map to store nonces: `Map<hash, {nonce, timestamp, data}>`
- `generateNonce()` → UUID
- `computeHash(walletAddress, evaluation, timestamp, nonce)` → keccak256 hash
- `verifyHash(hash, providedData)` → boolean (also checks expiry + invalidates nonce)

**`backend/src/handlers/mintRecipe.ts`**
- Verify hash
- Call blockchain service to mint
- Return recipeId + txHash

#### Modified Files

**`backend/src/handlers/evaluateRecipe.ts`**
- Add `walletAddress` to request params
- After AI evaluation, generate nonce and compute hash
- Store nonce in hashService
- Return hash + timestamp in response

**`backend/src/server.ts`**
- Add route: `app.post('/api/mint-recipe', mintRecipeHandler)`

### Frontend

#### Modified Files

**`frontend/src/components/RecipeSubmission.tsx`**
- Add `hash` and `timestamp` to `AIEvaluationResult` interface
- Pass `address` (walletAddress) to `/api/evaluate-recipe`
- Display hash in evaluation results (cosmetic, read-only)
- Remove `useWriteContract` hooks (no direct blockchain calls)
- Change "Mint as NFT" button to call `/api/mint-recipe` endpoint
- Handle response with recipeId + txHash

### Smart Contract

**No changes needed** - Current contract already supports this flow.

### Cleanup

**Architecture Simplification**
- Direct backend blockchain integration eliminates complexity

## Security Features

### Hash Integrity
- Prevents tampering with grade, revenueRate, critics, metadataURI
- Binds evaluation to specific wallet address
- Frontend cannot forge valid hash (nonce is server-side only)

### Hash System
- Hash is deterministic based on evaluation data + timestamp
- Same inputs always produce same hash
- Simpler implementation without server-side state
- Hash acts as integrity check to prevent tampering
- Timestamp included in hash ensures uniqueness per evaluation

## Testing Checklist

- [x] Backend can connect to Base Sepolia RPC
- [x] GRADER_ROLE wallet has sufficient ETH for gas
- [x] GRADER_ROLE granted to backend wallet
- [x] Evaluate recipe returns hash + timestamp
- [x] Hash verification succeeds with correct data
- [ ] Frontend calls requestRecipe (user becomes chef)
- [ ] Frontend extracts recipeId from transaction
- [ ] Backend receives recipeId and finalizes
- [ ] NFT mints to correct wallet address (user, not backend)
- [ ] TokenURI returns correct IPFS metadata
- [ ] Frontend displays hash correctly
- [ ] Frontend handles mint success/failure properly

## Migration Steps

1. Install viem in backend: `cd backend && npm install viem`
2. Add environment variables to `backend/.env`
3. Implement blockchain service
4. Implement hash service with nonce management
5. Update evaluate endpoint to generate hash
6. Create mint endpoint
7. Update frontend to use new flow
8. Grant GRADER_ROLE to backend wallet
9. Test end-to-end
10. Deploy

## Success Criteria

✅ User evaluates recipe and sees AI results + hash
✅ User clicks submit once to mint NFT
✅ Backend verifies hash before minting
✅ NFT appears in user's wallet
✅ Hash cannot be reused
✅ Tampered data is rejected

---

**Version:** 1.0
**Date:** 2025-11-07
