# UMA-Based Prediction Market

A decentralized Prediction Market built using the UMA Protocol Optimistic Oracle V3.
The project demonstrates how prediction markets can be created, asserted, disputed, and resolved using UMA’s optimistic oracle design.

This repository contains both:
- Smart contracts built with Foundry
- Frontend application built with Next.js

The system allows users to create markets, mint outcome tokens, assert outcomes, dispute incorrect assertions, and settle markets after oracle resolution.

## Project Overview

- Smart Contract: MyPredictionMarket.sol
- Network: Sepolia Testnet
- Oracle: UMA Optimistic Oracle V3
- Framework: Foundry

This prediction market supports the full UMA oracle lifecycle:
- Create prediction markets
- Mint outcome tokens
- Assert outcomes via UMA Oracle
- Handle disputes
- Settle markets after resolution
- Redeem outcome tokens for collateral

## Prediction Market Lifecycle

The market follows the UMA optimistic oracle workflow:

Create Market
      ↓
Mint Outcome Tokens
      ↓
Assert Outcome
      ↓
Dispute Window Opens
      ↓
(Optional) Dispute Assertion
      ↓
Oracle Resolution
      ↓
Settle Market
      ↓
Redeem Tokens


##Smart Contract Architecture

Core components:
```bash
MyPredictionMarket.sol
│
├─ Market creation
├─ Outcome token minting
├─ Assertion management
├─ Dispute handling
├─ Oracle callbacks
└─ Settlement logic
```
UMA contracts used:
- Finder
- Store
- OptimisticOracleV3

## Running the Frontend

cd prediction-market-frontend
npm install
npm run dev

Open:

http://localhost:3000

## Smart Contract Deployment

Deploy using Foundry:

```bash
forge script script/DeployPredictionMarket.s.sol \
--rpc-url $SEPOLIA_RPC \
--private-key $PRIVATE_KEY \
--broadcast
```

After deployment, update the frontend with the new contract address.

## Environment Setup

Create a .env file in the project root:

SEPOLIA_RPC=your_rpc_url
PRIVATE_KEY=your_wallet_private_key

FINDER=uma_finder_address
OO_V3=optimistic_oracle_v3_address
CURRENCY=bond_token_address

### Install dependencies 👷‍♂️

On Linux and macOS Foundry toolchain can be installed with:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

In case there was a prior version of Foundry installed, it is advised to update it with `foundryup` command.

Other installation methods are documented [here](https://book.getfoundry.sh/getting-started/installation).

Forge manages dependencies using [git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) by default, which
 is also the method used in this repository. To install dependencies, run:

```bash
forge install
```

### Compile the contracts 🏗

Compile the contracts with:

```bash
forge build
```

### Run the tests 🧪

Test the example contracts with:

```bash
forge test
```

## Usage Example

A typical lifecycle of the prediction market:

1. Initialize a market
2. Mint outcome tokens
3. Assert an outcome
4. Wait for oracle resolution
5. Settle and redeem tokens

Example flow:
```bash
// Initialize market
initializeMarket(
  "Yes",
  "No",
  "Will it rain tomorrow?",
  100e18,
  50e18,
  1 days
);

// Mint outcome tokens
createOutcomeTokens(marketId, 100e18);

// Assert outcome
assertMarket(marketId, "Yes");

// After resolution
settleOutcomeTokens(marketId);
```

## Testing

All tests pass successfully.
```bash
forge test
```
Result: 41 / 41 tests passing

Tests cover:
- Market initialization edge cases
- Assertion and dispute flows
- Token minting and settlement
- Oracle callbacks and resolution logic
- Revert conditions and failure paths

## Demo

1. Connect MetaMask to Sepolia
2. Get test ETH from faucet
3. Create market
4. Mint tokens
5. Assert outcome
6. Wait for resolution

## Oracle Sandbox Environment

For testing dispute flows without the production oracle, a sandbox oracle environment can be deployed.

This deploys:
- Finder
- Store
- IdentifierWhitelist
- OptimisticOracleV3
- Mock Oracle
- Mintable ERC20 token

Deploy with:

```bash
forge script script/OracleSandbox.s.sol \
--rpc-url $ETH_RPC_URL \
--private-key $PRIVATE_KEY \
--broadcast
```

The script prints deployed addresses which must be used when deploying the prediction market.

## Repository Structure
```bash
uma-prediction-market
│
├─ src/
│   ├─ MyPredictionMarket.sol
│   └─ MockToken.sol
│
├─ script/
│   ├─ DeployPredictionMarket.s.sol
│   └─ OracleSandbox.s.sol
│
├─ prediction-market-frontend/
│
├─ test/
│
├─ foundry.toml
└─ README.md
```
## Prerequisites

Before starting, make sure you have:

- Node.js (v18+ recommended)
- MetaMask wallet
- Sepolia test ETH
- Foundry installed
- An RPC provider (Alchemy/Infura/Ankr)

## Documentation 📚

Full documentation on how to build, test, deploy and interact with the example contracts in this repository are
 documented [here](https://docs.uma.xyz/developers/optimistic-oracle).

This project uses [Foundry](https://getfoundry.sh). See the [book](https://book.getfoundry.sh/getting-started/installation.html)
 for instructions on how to install and use Foundry.

