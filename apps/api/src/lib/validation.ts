import { isAddress } from 'viem'

/**
 * Validates and normalizes an Ethereum address
 * @throws Error if address is invalid
 */
export function validateAddress(address: unknown): string {
  if (typeof address !== 'string') {
    throw new Error('Address must be a string')
  }

  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address format')
  }

  return address.toLowerCase()
}

/**
 * Validates a chain ID
 * @throws Error if chainId is invalid
 */
export function validateChainId(chainId: unknown): void {
  const SUPPORTED_CHAINS = new Set([10143, 13371, 1, 8453, 42161])
  if (typeof chainId !== 'number' || !SUPPORTED_CHAINS.has(chainId)) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported: ${Array.from(SUPPORTED_CHAINS).join(', ')}`)
  }
}
