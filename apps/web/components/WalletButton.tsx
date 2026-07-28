'use client'

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'

const chainNames: Record<number, { name: string; color: string }> = {
  10143: { name: 'Monad', color: '#6D5DFC' },
  13371: { name: 'Arc', color: '#FF6B9D' },
  1: { name: 'Ethereum', color: '#627EEA' },
  8453: { name: 'Base', color: '#0052FF' },
  42161: { name: 'Arbitrum', color: '#28A0F0' },
}

export function WalletButton() {
  const { address, isConnected, isConnecting } = useAccount()
  const chainId = useChainId()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
  const chainInfo = chainNames[chainId] || { name: `Chain ${chainId}`, color: '#6D5DFC' }

  if (!isConnected) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-[0_4px_16px_rgba(109,93,252,0.3)] transition-all hover:shadow-[0_8px_24px_rgba(109,93,252,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </motion.button>
    )
  }

  return (
    <GlassCard className="p-2">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${chainInfo.color} 0%, ${chainInfo.color}dd 100%)` }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white">
            <path d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6S10.314 1 7 1zm0 11C4.239 12 2 9.761 2 7S4.239 2 7 2s5 2.239 5 5-2.239 5-5 5z" fill="currentColor" />
            <path d="M7 3.5C5.567 3.5 4.5 4.567 4.5 6s1.067 2.5 2.5 2.5 2.5-1.067 2.5-2.5S8.433 3.5 7 3.5z" fill="white" />
          </svg>
        </motion.div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{shortAddress}</span>
          <span className="text-xs text-gray-500">{chainInfo.name}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => disconnect()}
          className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
        >
          Disconnect
        </motion.button>
      </div>
    </GlassCard>
  )
}