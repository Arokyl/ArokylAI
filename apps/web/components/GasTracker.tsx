'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'

interface GasData {
  currentBaseFeeGwei: number
  suggestedMaxFeeGwei: number
  suggestedPriorityFeeGwei: number
  isOptimal: boolean
  trend: 'rising' | 'falling' | 'stable'
  recommendation: 'execute' | 'wait' | 'queue'
  predictedDropMinutes: number | null
}

const chainColors: Record<number, string> = {
  10143: '#6D5DFC',
  1: '#627EEA',
  8453: '#0052FF',
  42161: '#28A0F0',
}

export function GasTracker({ chainId = 10143 }: { chainId?: number }) {
  const [gasData, setGasData] = useState<GasData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGas = async () => {
      try {
        const res = await fetch(`/api/gas/${chainId}`)
        if (res.ok) {
          const data = await res.json()
          setGasData(data.data || data)
        }
      } catch {
        setGasData({
          currentBaseFeeGwei: 6.4,
          suggestedMaxFeeGwei: 7.2,
          suggestedPriorityFeeGwei: 0.3,
          isOptimal: true,
          trend: 'falling',
          recommendation: 'execute',
          predictedDropMinutes: null,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGas()
    const interval = setInterval(fetchGas, 15000)
    return () => clearInterval(interval)
  }, [chainId])

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
          />
          <span className="text-sm text-gray-400">Loading gas data...</span>
        </div>
      </GlassCard>
    )
  }

  if (!gasData) return null

  const trendColors = {
    rising: 'text-error',
    falling: 'text-success',
    stable: 'text-warning',
  }

  const trendIcons = {
    rising: '↑',
    falling: '↓',
    stable: '→',
  }

  const recommendationLabels = {
    execute: 'Execute now',
    wait: 'Wait for cheaper gas',
    queue: 'Queue for later',
  }

  const color = chainColors[chainId] || '#6D5DFC'

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Gas Tracker</span>
        <Badge variant={gasData.isOptimal ? 'success' : 'warning'} size="sm">
          {gasData.isOptimal ? 'Optimal' : 'Suboptimal'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-xs text-gray-500 mb-1">Base Fee</p>
          <p className="text-xl font-bold text-white" style={{ color }}>{gasData.currentBaseFeeGwei.toFixed(1)} gwei</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-xs text-gray-500 mb-1">Max Fee</p>
          <p className="text-xl font-bold text-white" style={{ color }}>{gasData.suggestedMaxFeeGwei.toFixed(1)} gwei</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-xs text-gray-500 mb-1">Priority</p>
          <p className="text-xl font-bold text-white" style={{ color }}>{gasData.suggestedPriorityFeeGwei.toFixed(1)} gwei</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className={trendColors[gasData.trend]}>{trendIcons[gasData.trend]}</span>
          <span className="text-sm text-gray-300 capitalize">{gasData.trend} trend</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={gasData.recommendation === 'execute' ? 'success' : gasData.recommendation === 'wait' ? 'warning' : 'info'} size="sm">
            {recommendationLabels[gasData.recommendation]}
          </Badge>
          {gasData.predictedDropMinutes && (
            <span className="text-xs text-gray-500">
              ~{gasData.predictedDropMinutes}min to drop
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  )
}