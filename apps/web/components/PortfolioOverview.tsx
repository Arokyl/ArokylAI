'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'

interface TokenBalance {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
  balance: string
  balanceFormatted: string
  balanceUsd: number
  logoURI?: string
}

interface Portfolio {
  address: string
  chainId: number
  tokens: TokenBalance[]
  totalUsdValue: number
  updatedAt: string
}

export function PortfolioOverview({ chainId = 10143 }: { chainId?: number }) {
  const { address, isConnected } = useAccount()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConnected || !address) {
      setPortfolio(null)
      setLoading(false)
      return
    }

    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`/api/portfolio?address=${address}&chainId=${chainId}`)
        if (res.ok) {
          const data = await res.json()
          setPortfolio(data.data)
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
    const interval = setInterval(fetchPortfolio, 60000)
    return () => clearInterval(interval)
  }, [address, chainId, isConnected])

  if (!isConnected) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-gray-400">Connect your wallet to view portfolio</p>
      </GlassCard>
    )
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading portfolio...</span>
        </div>
      </GlassCard>
    )
  }

  if (!portfolio || portfolio.tokens.length === 0) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-gray-400">No tokens found on this network</p>
      </GlassCard>
    )
  }

  const topTokens = portfolio.tokens.slice(0, 5)

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Portfolio</h3>
        <Badge variant="accent" size="sm">
          ${portfolio.totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Badge>
      </div>

      <div className="space-y-3">
        {topTokens.map((token) => (
          <motion.div
            key={token.address}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                {token.symbol.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{token.symbol}</p>
                <p className="text-xs text-gray-500">{token.balanceFormatted} {token.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">${token.balanceUsd.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                {portfolio.totalUsdValue > 0
                  ? `${((token.balanceUsd / portfolio.totalUsdValue) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </motion.div>
        ))}

        {portfolio.tokens.length > 5 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            +{portfolio.tokens.length - 5} more tokens
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Updated: {new Date(portfolio.updatedAt).toLocaleTimeString()}
      </p>
    </GlassCard>
  )
}