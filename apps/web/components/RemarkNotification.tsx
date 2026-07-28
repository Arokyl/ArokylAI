'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'

interface WalletRemark {
  id: string
  walletAddress: string
  chainId: number
  type: 'profit' | 'loss' | 'analysis' | 'encouragement' | 'advice' | 'info'
  title: string
  body: string
  confidence: number
  triggeredBy: string
  metadata?: Record<string, unknown>
  createdAt: string
  acknowledged: boolean
}

const typeStyles = {
  profit: { bg: 'bg-success/10', border: 'border-success/20', text: 'text-success', icon: '💚' },
  loss: { bg: 'bg-error/10', border: 'border-error/20', text: 'text-error', icon: '📉' },
  analysis: { bg: 'bg-accent/10', border: 'border-accent/20', text: 'text-accent', icon: '🔍' },
  encouragement: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', icon: '✨' },
  advice: { bg: 'bg-warning/10', border: 'border-warning/20', text: 'text-warning', icon: '💡' },
  info: { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white', icon: 'ℹ️' },
}

export function RemarkNotification({ address }: { address: string }) {
  const { address: connectedAddress, isConnected } = useAccount()
  const [remarks, setRemarks] = useState<WalletRemark[]>([])
  const [unacknowledged, setUnacknowledged] = useState<WalletRemark[]>([])
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    if (!isConnected || !connectedAddress) return

    const fetchRemarks = async () => {
      try {
        const res = await fetch(`/api/remarks?address=${connectedAddress}&limit=50`)
        if (res.ok) {
          const data = await res.json()
          if (data.ok && data.data?.remarks) {
            setRemarks(data.data.remarks)
            setUnacknowledged(data.data.remarks.filter((r: WalletRemark) => !r.acknowledged))
          }
        }
      } catch {
        // Ignore
      }
    }

    fetchRemarks()
    const interval = setInterval(fetchRemarks, 30000)
    return () => clearInterval(interval)
  }, [connectedAddress, isConnected])

  if (!isConnected || !address || unacknowledged.length === 0) {
    return null
  }

  const latestRemark = unacknowledged[0]
  const style = typeStyles[latestRemark.type]

  const handleAcknowledge = async (id: string) => {
    try {
      await fetch(`/api/remarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setUnacknowledged(prev => prev.filter(r => r.id !== id))
      setRemarks(prev => prev.map(r => r.id === id ? { ...r, acknowledged: true } : r))
    } catch {
      // Ignore
    }
  }

  return (
    <AnimatePresence>
      {unacknowledged.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 w-96"
        >
          <GlassCard
            className={`p-4 ${style.bg} ${style.border}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${style.text}`}>{latestRemark.title}</h4>
                  <button
                    onClick={() => handleAcknowledge(latestRemark.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Dismiss"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className={`text-sm ${style.text}`}>{latestRemark.body}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="default" size="sm" className={style.text}>
                    {latestRemark.triggeredBy}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(latestRemark.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  )
}