import abiFile from "@/abi/MyPredictionMarket.json";

// Sepolia Testnet
export const SEPOLIA_CHAIN_ID = 11155111;

// DEPLOYED CONTRACT
export const CONTRACT_ADDRESS =
  "0xE73cA20a101a81c3CdC4Fd6d67c7f6989953d6b9";

// EXACT ABI FROM FOUNDRY
export const CONTRACT_ABI = abiFile.abi;

// Etherscan helper
export const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io";

console.log("USING CONTRACT ADDRESS:", CONTRACT_ADDRESS);
