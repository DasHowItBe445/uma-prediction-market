import abiFile from "@/abi/MyPredictionMarket.json";

// Sepolia Testnet
export const SEPOLIA_CHAIN_ID = 11155111;

// ✅ DEPLOYED CONTRACT
export const CONTRACT_ADDRESS =
  "0xf9168C61523cD2151e4830185419247EE8fdB249";

// ✅ EXACT ABI FROM FOUNDRY
export const CONTRACT_ABI = abiFile.abi;

// Etherscan helper
export const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io";

console.log("🔥 USING CONTRACT ADDRESS:", CONTRACT_ADDRESS);
