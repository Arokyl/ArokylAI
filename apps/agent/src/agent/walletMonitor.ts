import type { WalletActivityEvent, ManagedWallet } from '@somnia-agent/shared'
import { getClient } from '@somnia-agent/shared'

interface WalletSnapshot {
  balanceUsd: number
  tokens: Record<string, number>
  timestamp: number
}

export class WalletMonitor {
  private snapshots = new Map<string, WalletSnapshot>()
  private listeners = new Set<(event: WalletActivityEvent) => void>()
  private intervalId: NodeJS.Timeout | null = null
  private readonly pollIntervalMs: number

  constructor(pollIntervalMs = 30_000) {
    this.pollIntervalMs = pollIntervalMs
  }

  start() {
    if (this.intervalId) return
    this.intervalId = setInterval(() => {
      void this.pollAll()
    }, this.pollIntervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  onActivity(callback: (event: WalletActivityEvent) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private async pollAll() {
    for (const [walletId, wallet] of this.getManagedWallets()) {
      try {
        const event = await this.detectActivity(wallet)
        if (event) {
          for (const listener of this.listeners) {
            listener(event)
          }
        }
      } catch {
        // ignore individual wallet poll failures
      }
    }
  }

  private async detectActivity(wallet: ManagedWallet): Promise<WalletActivityEvent | null> {
    const client = (getClient as any)(wallet.chainId)
    if (!client) return null

    const currentBalance = await client.getBalance({
      address: wallet.address as `0x${string}`,
    })
    const currentBalanceUsd = parseFloat(formatEther(currentBalance)) * this.getNativePrice(wallet.chainId)

    const previous = this.snapshots.get(wallet.address)
    this.snapshots.set(wallet.address, {
      balanceUsd: currentBalanceUsd,
      tokens: {},
      timestamp: Date.now(),
    })

    if (!previous) return null

    const change = currentBalanceUsd - previous.balanceUsd
    if (Math.abs(change) < 0.01) return null

    return {
      id: `${wallet.address}:${Date.now()}`,
      walletAddress: wallet.address,
      chainId: wallet.chainId,
      type: change >= 0 ? 'balance_change' : 'balance_change',
      amountIn: change >= 0 ? undefined : undefined,
      amountOut: undefined,
      profitLossUsd: change,
      txHash: undefined,
      timestamp: new Date().toISOString(),
    }
  }

  getManagedWallets(): Map<string, ManagedWallet> {
    const wallets = new Map<string, ManagedWallet>()
    const envWallets = process.env.MANAGED_WALLETS
    if (!envWallets) return wallets

    try {
      const parsed = JSON.parse(envWallets)
      for (const w of parsed) {
        wallets.set(w.address, w)
      }
    } catch {
      // ignore parse errors
    }
    return wallets
  }

  private getNativePrice(chainId: number): number {
    const envKey = `NATIVE_PRICE_CHAIN_${chainId}`
    const envVal = Number(process.env[envKey])
    if (Number.isFinite(envVal) && envVal > 0) return envVal

    const defaults: Record<number, number> = {
      10143: 0.25,
      13371: 0.25,
      1: 3200,
      8453: 3200,
      42161: 0.85,
    }
    return defaults[chainId] ?? 0.25
  }

  analyzeProfitLoss(event: WalletActivityEvent): { type: 'profit' | 'loss' | 'neutral'; remark: string; confidence: number } {
    if (event.profitLossUsd === undefined) {
      return { type: 'neutral', remark: 'Wallet activity detected. Monitoring for P&L changes.', confidence: 0.5 }
    }

    const pl = event.profitLossUsd

    if (pl > 10) {
      return {
        type: 'profit',
        remark: `Nice win! Your managed wallet gained $${pl.toFixed(2)}. The trade is paying off — stay disciplined and let the strategy run.`,
        confidence: 0.9,
      }
    }

    if (pl > 1) {
      return {
        type: 'profit',
        remark: `Small gain of $${pl.toFixed(2)}. Accumulating nicely. Consider compounding into the next opportunity.`,
        confidence: 0.85,
      }
    }

    if (pl > 0) {
      return {
        type: 'profit',
        remark: `微盈利 detected ($${pl.toFixed(2)}). Every small win builds momentum. Keep monitoring for the next setup.`,
        confidence: 0.8,
      }
    }

    if (pl < -50) {
      return {
        type: 'loss',
        remark: `Significant loss of $${Math.abs(pl).toFixed(2)} detected. Let's analyze what happened — check the entry timing, slippage, and whether the market moved against the position. Consider reducing size on the next trade.`,
        confidence: 0.9,
      }
    }

    if (pl < -5) {
      return {
        type: 'loss',
        remark: `Loss of $${Math.abs(pl).toFixed(2)} recorded. This is within normal trading variance. Review the trade thesis — was the entry aligned with the plan? If the strategy is sound, a single loss doesn't change the outlook.`,
        confidence: 0.85,
      }
    }

    if (pl < 0) {
      return {
        type: 'loss',
        remark: `Small loss of $${Math.abs(pl).toFixed(2)}. This is normal trading noise. Use it as a learning data point — check if slippage or gas ate into the expected output.`,
        confidence: 0.8,
      }
    }

    return {
      type: 'neutral',
      remark: `Wallet balance changed by $${pl.toFixed(2)}. Keeping an eye on the trend.`,
      confidence: 0.7,
    }
  }
}

function formatEther(value: bigint): string {
  const str = value.toString()
  const padding = '0'.repeat(18 + 1 - str.length)
  const padded = padding + str
  const integerPart = padded.slice(0, padded.length - 18) || '0'
  const fractionalPart = padded.slice(padded.length - 18)
  const trimmed = fractionalPart.replace(/0+$/, '') || '0'
  return `${integerPart}.${trimmed}`
}