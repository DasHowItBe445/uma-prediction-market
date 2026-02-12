import { Contract } from "ethers";

/**
 * Minimal ERC20 ABI
 */
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

/**
 * Get ERC20 contract instance
 */
export function getERC20Contract(
  tokenAddress: string,
  signerOrProvider: any
) {
  return new Contract(tokenAddress, ERC20_ABI, signerOrProvider);
}
