'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

interface Trade {
  id: string;
  txHash: string;
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  aggregator: string;
  gasPaidGwei: number;
  priceImpact: number;
  status: 'pending' | 'confirmed' | 'failed';
  executedAt: string;
  aiIntent?: string;
}

const statusStyles: Record<Trade['status'], 'success' | 'warning' | 'error'> = {
  confirmed: 'success',
  pending: 'warning',
  failed: 'error',
};

const statusLabels = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  failed: 'Failed',
};

export function TradeHistory() {
  const { address, isConnected } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setTrades([]);
      setLoading(false);
      return;
    }

    const fetchTrades = async () => {
      try {
        const res = await fetch(`/api/history?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setTrades(data.data || []);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-gray-400">Connect your wallet to view trade history</p>
      </GlassCard>
    );
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading history...</span>
        </div>
      </GlassCard>
    );
  }

  if (trades.length === 0) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-gray-400 mb-4">No trades recorded yet</p>
        <p className="text-xs text-gray-500">Start trading to see your history here</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <h3 className="font-semibold text-white mb-4">Recent Trades</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {trades.map((trade) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {trade.tokenIn} → {trade.tokenOut}
                </span>
                <Badge variant="accent" size="sm">
                  {trade.aggregator}
                </Badge>
              </div>
              <Badge variant={statusStyles[trade.status]} size="sm">
                {statusLabels[trade.status]}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Sent</p>
                <p className="text-white font-medium">
                  {trade.amountIn} {trade.tokenIn}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Received</p>
                <p className="text-white font-medium">
                  {trade.amountOut} {trade.tokenOut}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Gas</p>
                <p className="text-white font-medium">{trade.gasPaidGwei.toFixed(1)} gwei</p>
              </div>
              <div>
                <p className="text-gray-500">Impact</p>
                <p className="text-white font-medium">{trade.priceImpact.toFixed(2)}%</p>
              </div>
            </div>
            {trade.aiIntent && (
              <p className="text-xs text-gray-400 mt-2 italic">&ldquo;{trade.aiIntent}&rdquo;</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {new Date(trade.executedAt).toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
