import MyPredictionMarket from "@/abi/MyPredictionMarket.json";

// Sepolia Testnet
export const SEPOLIA_CHAIN_ID = 11155111;

// DEPLOYED CONTRACT
export const CONTRACT_ADDRESS =
  "0xe7377A9D8cAf330d0A55b29EEF6a5697f9639579";

// EXACT ABI FROM FOUNDRY
export const CONTRACT_ABI = MyPredictionMarket.abi;

// Etherscan helper
export const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io";

console.log("USING CONTRACT ADDRESS:", CONTRACT_ADDRESS);
