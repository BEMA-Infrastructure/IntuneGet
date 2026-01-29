'use client';

import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  XCircle,
  UserCheck,
  SkipForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SccmMatchStatus } from '@/types/sccm';

interface SccmMatchStatusBadgeProps {
  status: SccmMatchStatus;
  confidence?: number | null;
  className?: string;
  showConfidence?: boolean;
}

const statusConfig: Record<
  SccmMatchStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    colors: string;
  }
> = {
  matched: {
    label: 'Matched',
    icon: CheckCircle2,
    colors: 'bg-status-success/10 text-status-success border-status-success/20',
  },
  partial: {
    label: 'Partial',
    icon: AlertCircle,
    colors: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  unmatched: {
    label: 'No Match',
    icon: HelpCircle,
    colors: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    colors: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  manual: {
    label: 'Manual',
    icon: UserCheck,
    colors: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  },
  excluded: {
    label: 'Excluded',
    icon: XCircle,
    colors: 'bg-zinc-600/10 text-zinc-500 border-zinc-600/20',
  },
  skipped: {
    label: 'Skipped',
    icon: SkipForward,
    colors: 'bg-zinc-600/10 text-zinc-500 border-zinc-600/20',
  },
};

export function SccmMatchStatusBadge({
  status,
  confidence,
  className,
  showConfidence = true,
}: SccmMatchStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  // Only show confidence for matched and partial statuses
  const shouldShowConfidence =
    showConfidence &&
    confidence !== null &&
    confidence !== undefined &&
    (status === 'matched' || status === 'partial' || status === 'manual');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.colors,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {shouldShowConfidence && (
        <span className="opacity-70">({Math.round(confidence * 100)}%)</span>
      )}
    </span>
  );
}

/**
 * Get the match status color classes for use in other components
 */
export function getMatchStatusColors(status: SccmMatchStatus): string {
  return statusConfig[status]?.colors || statusConfig.pending.colors;
}

/**
 * Get the match status label
 */
export function getMatchStatusLabel(status: SccmMatchStatus): string {
  return statusConfig[status]?.label || 'Unknown';
}
