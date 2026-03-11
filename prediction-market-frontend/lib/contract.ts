import MyPredictionMarket from "@/abi/MyPredictionMarket.json";

// Sepolia Testnet
export const SEPOLIA_CHAIN_ID = 11155111;

// DEPLOYED CONTRACT
export const CONTRACT_ADDRESS =
  "0x096E7620c6a3688E08EF6b4ba6F4bf91C459e156";

// EXACT ABI FROM FOUNDRY
export const CONTRACT_ABI = MyPredictionMarket.abi;

// Etherscan helper
export const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io";

console.log("USING CONTRACT ADDRESS:", CONTRACT_ADDRESS);
