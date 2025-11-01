# Soil2Sauce Frontend

React-based frontend for the Soil2Sauce on-chain farming game.

## Features

- **Wallet Connection**: Connect with MetaMask or other injected wallets
- **Player Registration**: One-click registration with starter pack
- **Farm Management**: Plant seeds, watch crops grow, harvest produce
- **Livestock System**: Claim probability-based products from animals
- **Shop**: Purchase seeds and animals with STOKEN
- **Inventory**: View all owned items and STOKEN balance

## Prerequisites

- Node.js 16+
- Anvil (local Ethereum node) running on port 8545
- MetaMask or compatible Web3 wallet

## Installation

```bash
npm install
```

## Configuration

The app is pre-configured to connect to:
- **Network**: Local Anvil (Chain ID: 31337)
- **RPC URL**: http://127.0.0.1:8545

Contract addresses are configured in `src/contracts/addresses.js` and match the deployed contracts on your local Anvil chain.

## Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Start Anvil** (in a separate terminal):
   ```bash
   anvil
   ```

2. **Import Anvil Account to MetaMask**:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d59bf0bb5d8`
   - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

3. **Connect Wallet**:
   - Click "Connect Wallet" button
   - Select MetaMask
   - Approve the connection

4. **Register Player**:
   - Click "Register & Start Farming"
   - Approve the transaction
   - Receive 100 STOKEN and starter seeds

5. **Play the Game**:
   - **Farm**: Plant seeds in plots, wait for growth, harvest crops
   - **Livestock**: Claim products from owned animals
   - **Shop**: Buy more seeds and animals
   - **Inventory**: View your items and balance

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── WalletConnect.jsx      # Wallet connection UI
│   │   ├── PlayerRegistration.jsx # Registration flow
│   │   ├── FarmPlots.jsx          # Farm plot management
│   │   ├── Livestock.jsx          # Animal product claiming
│   │   ├── Shop.jsx               # Item shop
│   │   └── Inventory.jsx          # Item display
│   ├── contracts/
│   │   ├── addresses.js           # Contract addresses & metadata
│   │   └── *.json                 # Contract ABIs
│   ├── App.jsx                    # Main app component
│   ├── App.css                    # Styling
│   ├── main.jsx                   # Entry point with providers
│   └── wagmi.js                   # Wagmi configuration
├── package.json
└── README.md
```

## Game Mechanics

### Farming
- Click empty plot → Select seed → Wait for growth → Harvest
- Growth times: 12h (Lettuce) to 72h (Corn)
- Each harvest yields multiple crops

### Livestock
- Buy animals from shop
- Wait for cooldown period
- Claim products (probability-based):
  - Cow: 95% Milk, 5% Cheese (12h cooldown)
  - Chicken: 90% Egg, 10% Feather (8h cooldown)
  - Pig: 80% Pork, 20% Bacon (24h cooldown)

### Shop
- Buy seeds (8-20 STOKEN)
- Buy animals (200-800 STOKEN)
- All purchases burn STOKEN (deflationary)

## Technologies Used

- **React 18**: UI library
- **Vite**: Build tool
- **Wagmi**: React hooks for Ethereum
- **Viem**: Ethereum library
- **TanStack Query**: Async state management

## Troubleshooting

### "Connect Wallet" button not working
- Ensure MetaMask is installed
- Check that you're on the localhost network (Chain ID: 31337)

### Transactions failing
- Ensure Anvil is running
- Check that you have ETH for gas fees
- Verify contract addresses match deployment

### Items not showing in inventory
- Wait for blockchain confirmation
- Refresh the page
- Check transaction on Anvil

## License

MIT
