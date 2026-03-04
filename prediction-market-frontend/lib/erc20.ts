import { Contract } from "ethers";

/**
 * Standard ERC20 ABI
 */
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",

  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",

  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

/**
 * Get ERC20 contract instance
 */
export function getERC20Contract(
  tokenAddress: string,
  signerOrProvider: any
) {
  return new Contract(tokenAddress.trim(), ERC20_ABI, signerOrProvider);
}