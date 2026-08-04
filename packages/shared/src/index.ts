// ─── Chain configs ───────────────────────────────────────────────────────────

export const CHAIN_IDS = {
  MONAD: 10143,
  ARC: 13371,
  ETHEREUM: 1,
  BASE: 8453,
  ARBITRUM: 42161,
} as const

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS]

export const CHAIN_NAMES: Record<ChainId, string> = {
  [CHAIN_IDS.MONAD]: 'Monad',
  [CHAIN_IDS.ARC]: 'Arc',
  [CHAIN_IDS.ETHEREUM]: 'Ethereum',
  [CHAIN_IDS.BASE]: 'Base',
  [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
}

// ─── Token types ─────────────────────────────────────────────────────────────

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: ChainId
  logoURI?: string
}

export interface TokenBalance extends Token {
  balance: string        // raw bigint as string
  balanceFormatted: string
  balanceUsd: number
}

// ─── Quote types ─────────────────────────────────────────────────────────────

export type Aggregator = 'oneinch' | 'zerox' | 'odos' | 'direct'

export interface RouteStep {
  protocol: string
  tokenIn: string
  tokenOut: string
  share: number          // percentage of trade going through this step
}

export interface AggregatedQuote {
  aggregator: Aggregator
  amountIn?: string       // bigint as string
  tokenIn?: string
  tokenOut?: string
  amountOut: string      // bigint as string
  amountOutFormatted: string
  priceImpact: number
  gasEstimate: string    // bigint as string
  gasEstimateUsd: number
  route: RouteStep[]
  calldata?: string
  to?: string
  value?: string
  effectiveRate: number  // amountOut in USD minus gas cost
}

// ─── Gas types ───────────────────────────────────────────────────────────────

export type GasRecommendation = 'execute' | 'wait' | 'queue'
export type GasTrend = 'rising' | 'falling' | 'stable'

export interface GasAssessment {
  currentBaseFeeGwei: number
  suggestedMaxFeeGwei: number
  suggestedPriorityFeeGwei: number
  isOptimal: boolean
  trend: GasTrend
  recommendation: GasRecommendation
  predictedDropMinutes: number | null
}

// ─── AI / Agent types ────────────────────────────────────────────────────────

export type AmountType = 'exact' | 'percentage' | 'all'
export type Urgency = 'low' | 'medium' | 'high'

export interface SwapCondition {
  type: 'maxGas' | 'minPrice' | 'time'
  value: number
  unit?: string
}

export interface SwapIntent {
  tokenIn: string        // symbol or address
  tokenOut: string
  amountIn: string
  amountType: AmountType
  urgency: Urgency
  conditions: SwapCondition[]
  raw: string            // original command
}

export interface ExecutionPlan {
  intent: SwapIntent
  quote: AggregatedQuote
  gasAssessment: GasAssessment
  shouldExecuteNow: boolean
  estimatedOutput: string
  warnings: string[]
  unsignedTx?: UnsignedTransaction
}

export type SubAgentId =
  | 'analyst'
  | 'marketScout'
  | 'walletStrategist'
  | 'tradeScout'
  | 'slippageWatcher'
  | 'transactionMonitor'
  | 'problemSolver'
  | 'agentAuditor'

export type SubAgentDepth = 'off' | 'light' | 'standard' | 'deep'

export interface SubAgentFinding {
  title: string
  detail: string
  severity: 'info' | 'warning' | 'critical'
  confidence: number
  source?: string
}

export interface SubAgentRun {
  id: SubAgentId
  name: string
  depth: SubAgentDepth
  goal: string
  status: 'skipped' | 'completed' | 'failed'
  confidence: number
  findings: SubAgentFinding[]
  nextActions: string[]
}

export interface OrchestrationPlan {
  mode: 'observe' | 'advise' | 'plan' | 'monitor'
  depth: SubAgentDepth
  selectedAgents: SubAgentId[]
  reason: string
  runs: SubAgentRun[]
}

export interface ChatAgentResponse {
  reply: string
  plan?: ExecutionPlan
  orchestration?: OrchestrationPlan
  usage?: {
    iterations: number
    cumulativeCostUsd: number
    cumulativeTokens: { input: number; output: number }
  }
}

export interface UnsignedTransaction {
  to: string
  data: string
  value: string
  gasLimit: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  chainId: number
  amountIn?: string
  approvalTarget?: string
  aggregatorTarget?: string
  tokenIn?: string
  tokenOut?: string
}

// ─── Order types ─────────────────────────────────────────────────────────────

export type OrderStatus = 'active' | 'executed' | 'cancelled' | 'expired'

export interface ConditionalOrder {
  id: string
  userId: string
  chainId: ChainId
  tokenIn: string
  tokenOut: string
  amountIn: string
  condition: SwapCondition
  status: OrderStatus
  expiresAt: string
  originalCommand: string
  createdAt: string
}

// ─── Trade history ────────────────────────────────────────────────────────────

export type TradeStatus = 'pending' | 'confirmed' | 'failed'

export interface Trade {
  id: string
  txHash: string
  chainId: ChainId
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  aggregator: Aggregator
  gasPaidGwei: number
  priceImpact: number
  status: TradeStatus
  executedAt: string
  aiIntent?: string
}

// ─── Custodial wallet types ──────────────────────────────────────────

export interface ManagedWallet {
  address: string
  chainId: ChainId
  executionProxyAddress: string
  delegateAddress?: string
  baseBalanceToken?: string
  isManaged: boolean
  addedAt: string
}

export interface WalletRemark {
  id: string
  walletAddress: string
  chainId: ChainId
  type: 'profit' | 'loss' | 'analysis' | 'encouragement' | 'advice' | 'info'
  title: string
  body: string
  confidence: number
  triggeredBy: string      // event that triggered the remark
  metadata?: Record<string, unknown>
  createdAt: string
  acknowledged: boolean
}

export interface WalletActivityEvent {
  id: string
  walletAddress: string
  chainId: ChainId
  type: 'swap' | 'transfer' | 'approval' | 'order_created' | 'order_executed' | 'balance_change'
  tokenIn?: string
  tokenOut?: string
  amountIn?: string
  amountOut?: string
  priceImpact?: number
  profitLossUsd?: number
  txHash?: string
  timestamp: string
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface Portfolio {
  address: string
  chainId: ChainId
  tokens: TokenBalance[]
  totalUsdValue: number
  updatedAt: string
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  ok: boolean
}

// ─── RPC Clients ───────────────────────────────────────────────────────────────

import { createPublicClient, http, defineChain, type Chain, isAddress } from 'viem'
import { mainnet, base, arbitrum } from 'viem/chains'

export type RpcClient = ReturnType<typeof createPublicClient>

export const monad = defineChain({
  id: 10143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
})

type ChainClient = ReturnType<typeof createPublicClient>

function buildClient(chain: Chain, urls: Array<string | undefined>): ChainClient | undefined {
  const validUrls = urls.filter(Boolean) as string[]
  if (validUrls.length === 0) return undefined

  const primaryClient = createPublicClient({ chain, transport: http(validUrls[0]) })
  const fallbackClients = validUrls.slice(1).map((url) => createPublicClient({ chain, transport: http(url) }))

  if (fallbackClients.length === 0) return primaryClient

  return new Proxy(primaryClient, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value

      return async (...args: unknown[]) => {
        try {
          return await (value as (...args: unknown[]) => Promise<unknown>)(...args)
        } catch {
          for (const fallback of fallbackClients) {
            const fallbackValue = Reflect.get(fallback, prop)
            if (typeof fallbackValue !== 'function') continue
            try {
              return await (fallbackValue as (...args: unknown[]) => Promise<unknown>)(...args)
            } catch {
              // try next fallback
            }
          }
          throw value(...args)
        }
      }
    },
  }) as unknown as ChainClient
}

type LazyClientMap = {
  [chainId: number]: ChainClient | undefined
}

let lazyRpcClients: LazyClientMap | undefined
function getLazyClients(): LazyClientMap {
  if (!lazyRpcClients) {
    lazyRpcClients = {
      [monad.id]: buildClient(monad, [
        process.env.MONAD_RPC || '',
        process.env.MONAD_RPC_FALLBACK || '',
      ]),
      [mainnet.id]: buildClient(mainnet, [
        process.env.NEXT_PUBLIC_ETH_RPC || process.env.ETH_RPC || '',
        process.env.NEXT_PUBLIC_ETH_RPC_FALLBACK || process.env.ETH_RPC_FALLBACK || '',
      ]),
      [base.id]: buildClient(base, [
        process.env.NEXT_PUBLIC_BASE_RPC || process.env.BASE_RPC || '',
        process.env.NEXT_PUBLIC_BASE_RPC_FALLBACK || process.env.BASE_RPC_FALLBACK || '',
      ]),
      [arbitrum.id]: buildClient(arbitrum, [
        process.env.NEXT_PUBLIC_ARB_RPC || process.env.ARB_RPC || '',
        process.env.NEXT_PUBLIC_ARB_RPC_FALLBACK || process.env.ARB_RPC_FALLBACK || '',
      ]),
    }
  }
  return lazyRpcClients
}

export const rpcClients = new Proxy({} as LazyClientMap, {
  get(_, chainId) {
    return getLazyClients()[chainId as unknown as number]
  },
  set() {
    throw new Error('rpcClients map is read-only')
  },
  has(_, chainId) {
    return chainId in getLazyClients()
  },
  ownKeys() {
    return Object.keys(getLazyClients())
  },
  getOwnPropertyDescriptor() {
    return undefined
  },
})

export function isNativeToken(value?: string): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  if (normalized === '0x' || normalized === '') return false
  if (['eth', 'mon', 'native', '0x0000000000000000000000000000000000000000'].includes(normalized)) return true
  return isAddress(normalized) && normalized === '0x0000000000000000000000000000000000000000'
}

export function getClient(chainId: number): ChainClient {
  const client = getLazyClients()[chainId]
  if (!client) throw new Error(`Unsupported chainId: ${chainId}`)
  return client
}


// ─── Smart Contract ABIs ───────────────────────────────────────────────────────

export const ExecutionProxyAbi = [
  {
    type: 'function',
    name: 'executeSwap',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'aggregatorTarget', type: 'address' },
      { name: 'aggregatorCalldata', type: 'bytes' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'setApprovedTarget',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setFeeBps',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'newFeeBps', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setFeeVault',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'newVault', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'feeVault',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'feeBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approvedTargets',
    stateMutability: 'view',
    inputs: [
      { name: 'target', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export const AutomationRegistryAbi = [
  {
    type: 'function',
    name: 'createOrder',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'maxGasPrice', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'aggregatorTarget', type: 'address' },
      { name: 'aggregatorCalldata', type: 'bytes' },
    ],
    outputs: [{ name: 'orderId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'executeOrder',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'orderId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'cancelOrder',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'orderId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'orders',
    stateMutability: 'view',
    inputs: [
      { name: 'orderId', type: 'uint256' },
    ],
    outputs: [
      { name: 'user', type: 'address' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'maxGasPrice', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'active', type: 'bool' },
      { name: 'aggregatorTarget', type: 'address' },
      { name: 'aggregatorCalldata', type: 'bytes' },
    ],
  },
  {
    type: 'function',
    name: 'getUserOrders',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: '', type: 'uint256[]' },
    ],
  },
  {
    type: 'function',
    name: 'executionProxy',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'keepers',
    stateMutability: 'view',
    inputs: [
      { name: 'keeper', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'OrderCreated',
    inputs: [
      { name: 'orderId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'tokenOut', type: 'address', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'OrderExecuted',
    inputs: [
      { name: 'orderId', type: 'uint256', indexed: true },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'OrderCancelled',
    inputs: [
      { name: 'orderId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'KeeperUpdated',
    inputs: [
      { name: 'keeper', type: 'address', indexed: true },
      { name: 'allowed', type: 'bool', indexed: false },
    ],
  },
] as const

export const ERC20Abi = [
] as const

