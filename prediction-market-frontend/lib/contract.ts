import MyPredictionMarket from "@/abi/MyPredictionMarket.json";

// Sepolia Testnet
export const SEPOLIA_CHAIN_ID = 11155111;

// DEPLOYED CONTRACT
export const CONTRACT_ADDRESS =
  "0x0CB1B314eCE1dCF29D008bB499E49b07f1635101";

// EXACT ABI FROM FOUNDRY
export const CONTRACT_ABI = MyPredictionMarket.abi;

// Etherscan helper
export const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io";

console.log("USING CONTRACT ADDRESS:", CONTRACT_ADDRESS);
