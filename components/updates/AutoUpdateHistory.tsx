'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AutoUpdateHistoryWithPolicy } from '@/types/update-policies';

interface AutoUpdateHistoryProps {
  history: AutoUpdateHistoryWithPolicy[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const statusConfig: Record<
  string,
  {
    icon: typeof Clock;
    color: string;
    bgColor: string;
    label: string;
    animate?: boolean;
  }
> = {
  pending: {
    icon: Clock,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    label: 'Pending',
  },
  packaging: {
    icon: Loader2,
    color: 'text-accent-cyan',
    bgColor: 'bg-accent-cyan/10',
    label: 'Packaging',
    animate: true,
  },
  deploying: {
    icon: Loader2,
    color: 'text-accent-violet',
    bgColor: 'bg-accent-violet/10',
    label: 'Deploying',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-status-success',
    bgColor: 'bg-status-success/10',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-status-error',
    bgColor: 'bg-status-error/10',
    label: 'Failed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-500/10',
    label: 'Cancelled',
  },
};

const updateTypeLabels = {
  patch: 'Patch',
  minor: 'Minor',
  major: 'Major',
};

export function AutoUpdateHistory({
  history,
  isLoading,
  onLoadMore,
  hasMore,
}: AutoUpdateHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading && history.length === 0) {
    return <AutoUpdateHistorySkeleton />;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">No auto-update history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item, index) => {
        const status = statusConfig[item.status];
        const isExpanded = expandedId === item.id;
        const StatusIcon = status.icon;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'glass-dark rounded-lg border border-white/5 overflow-hidden',
              isExpanded && 'border-white/10'
            )}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/2"
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    status.bgColor
                  )}
                >
                  <StatusIcon
                    className={cn(
                      'w-4 h-4',
                      status.color,
                      status.animate && 'animate-spin'
                    )}
                  />
                </div>

                {/* App Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {item.display_name || item.policy.winget_id}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-xs font-medium rounded',
                        item.update_type === 'major'
                          ? 'text-status-warning bg-status-warning/10'
                          : item.update_type === 'minor'
                          ? 'text-accent-cyan bg-accent-cyan/10'
                          : 'text-zinc-400 bg-zinc-500/10'
                      )}
                    >
                      {updateTypeLabels[item.update_type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                    <span className="font-mono">{item.from_version}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-mono">{item.to_version}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Timestamp */}
                <div className="text-right">
                  <span
                    className={cn('text-xs font-medium', status.color)}
                  >
                    {status.label}
                  </span>
                  <p className="text-xs text-zinc-500">
                    {formatDate(item.triggered_at)}
                  </p>
                </div>

                {/* Expand Arrow */}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-white/5">
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Winget ID</span>
                    <p className="text-white font-mono text-xs mt-1">
                      {item.policy.winget_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Tenant</span>
                    <p className="text-white font-mono text-xs mt-1 truncate">
                      {item.policy.tenant_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Triggered</span>
                    <p className="text-white text-xs mt-1">
                      {new Date(item.triggered_at).toLocaleString()}
                    </p>
                  </div>
                  {item.completed_at && (
                    <div>
                      <span className="text-zinc-500">Completed</span>
                      <p className="text-white text-xs mt-1">
                        {new Date(item.completed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {item.error_message && (
                  <div className="mt-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
                    <p className="text-xs text-status-error">
                      {item.error_message}
                    </p>
                  </div>
                )}

                {item.packaging_job_id && (
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-white"
                      asChild
                    >
                      <a
                        href={`/dashboard/uploads?job=${item.packaging_job_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Job Details
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function AutoUpdateHistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="glass-dark rounded-lg border border-white/5 p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="text-right">
              <div className="h-3 w-16 bg-white/10 rounded animate-pulse mb-1" />
              <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}
