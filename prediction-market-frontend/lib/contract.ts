  import abiFile from "@/abi/MyPredictionMarket.json";

// Sepolia Testnet
export const SEPOLIA_CHAIN_ID = 31337;

// DEPLOYED CONTRACT
export const CONTRACT_ADDRESS =
  "0x0B306BF915C4d645ff596e518fAf3F9669b97016";

// EXACT ABI FROM FOUNDRY
export const CONTRACT_ABI = abiFile.abi;

// Etherscan helper
export const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io";

console.log("USING CONTRACT ADDRESS:", CONTRACT_ADDRESS);
