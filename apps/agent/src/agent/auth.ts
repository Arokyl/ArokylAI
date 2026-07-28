import { verifyMessage } from 'viem'

export interface AuthMessage {
  address: string
  nonce: string
  timestamp: number
}

export class AuthError extends Error {
  statusCode = 401
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

const MESSAGE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function parseAuthMessage(raw: string): AuthMessage {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new AuthError('Malformed authentication message; expected JSON {address, nonce, timestamp}')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new AuthError('Malformed authentication message')
  }

  const { address, nonce, timestamp } = parsed as Record<string, unknown>
  if (typeof address !== 'string' || typeof nonce !== 'string' || typeof timestamp !== 'number') {
    throw new AuthError('Authentication message must include string "address", string "nonce", and numeric "timestamp"')
  }

  return { address, nonce, timestamp }
}

export async function verifyWalletAuth(address: string, authMessage?: string, authSignature?: string): Promise<string> {
  if (!authMessage || !authSignature) {
    throw new AuthError('Missing authentication headers: authMessage and authSignature required')
  }

  const message = parseAuthMessage(authMessage)

  if (message.address.toLowerCase() !== address.toLowerCase()) {
    throw new AuthError('Address in message does not match walletContext address')
  }

  const skew = Math.abs(Date.now() - message.timestamp)
  if (skew > MESSAGE_TTL_MS) {
    throw new AuthError('Authentication message expired (older than 5 minutes)')
  }

  let isValid = false
  try {
    isValid = await verifyMessage({
      address: message.address as `0x${string}`,
      message: authMessage,
      signature: authSignature as `0x${string}`,
    })
  } catch (error) {
    throw new AuthError(`Signature verification failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  }

  if (!isValid) {
    throw new AuthError('Invalid signature')
  }

  return message.address.toLowerCase()
}
