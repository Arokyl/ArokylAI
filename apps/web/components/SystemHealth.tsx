'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

interface HealthMetric {
  label: string;
  value: string;
  status: 'healthy' | 'degraded' | 'down';
  description: string;
}

const metrics: HealthMetric[] = [
  { label: 'API', value: 'Online', status: 'healthy', description: 'Backend responding normally' },
  { label: 'Agent', value: 'Active', status: 'healthy', description: 'AI agent service running' },
  {
    label: 'Contracts',
    value: 'Deployed',
    status: 'healthy',
    description: 'ExecutionProxy on Monad testnet',
  },
  {
    label: 'RPC',
    value: 'Connected',
    status: 'healthy',
    description: 'Monad RPC endpoint responsive',
  },
  { label: 'Redis', value: 'Connected', status: 'healthy', description: 'Cache layer operational' },
  {
    label: 'Database',
    value: 'Connected',
    status: 'healthy',
    description: 'PostgreSQL via Supabase',
  },
];

const statusStyles: Record<HealthMetric['status'], 'text-success' | 'text-warning' | 'text-error'> =
  {
    healthy: 'text-success',
    degraded: 'text-warning',
    down: 'text-error',
  };

const statusBadges: Record<HealthMetric['status'], 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
};

export function SystemHealth() {
  return (
    <GlassCard className="p-4">
      <h3 className="font-semibold text-white mb-4">System Health</h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-400">{metric.label}</span>
              <Badge variant={statusBadges[metric.status]} size="sm">
                {metric.value}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">{metric.description}</p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
