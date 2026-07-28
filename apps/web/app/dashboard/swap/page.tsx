'use client'

import { useAccount } from 'wagmi'
import { GlassCard } from '@/components/ui/GlassCard'

export default function SwapPage() {
  const { address, isConnected } = useAccount()

  if (!isConnected) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <GlassCard className="max-w-md w-full mx-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Swap</h1>
          <p className="text-gray-400">Connect your wallet to start swapping tokens with AI-powered routing.</p>
        </GlassCard>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <GlassCard className="max-w-2xl w-full mx-4 p-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Swap Tokens</h1>
        <p className="text-gray-400 mb-6">
          Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <p className="text-gray-500">Swap interface coming soon. Use the command bar below to get started.</p>
      </GlassCard>
    </main>
  )
}
