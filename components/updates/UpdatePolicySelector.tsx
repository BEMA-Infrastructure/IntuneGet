'use client';

import { useState } from 'react';
import {
  RefreshCw,
  Bell,
  BellOff,
  Pin,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { UpdatePolicyType } from '@/types/update-policies';

interface UpdatePolicySelectorProps {
  currentPolicy?: UpdatePolicyType | null;
  onPolicyChange: (policyType: UpdatePolicyType) => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'default';
  showLabel?: boolean;
}

const policyOptions: {
  type: UpdatePolicyType;
  label: string;
  description: string;
  icon: typeof RefreshCw;
  color: string;
}[] = [
  {
    type: 'auto_update',
    label: 'Auto-update',
    description: 'Automatically deploy updates',
    icon: RefreshCw,
    color: 'text-status-success',
  },
  {
    type: 'notify',
    label: 'Notify only',
    description: 'Get notified about updates',
    icon: Bell,
    color: 'text-accent-cyan',
  },
  {
    type: 'ignore',
    label: 'Ignore',
    description: 'Skip all updates',
    icon: BellOff,
    color: 'text-zinc-500',
  },
  {
    type: 'pin_version',
    label: 'Pin version',
    description: 'Stay on current version',
    icon: Pin,
    color: 'text-status-warning',
  },
];

export function UpdatePolicySelector({
  currentPolicy,
  onPolicyChange,
  disabled = false,
  size = 'default',
  showLabel = true,
}: UpdatePolicySelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedOption = policyOptions.find((o) => o.type === currentPolicy) || policyOptions[1];

  const handleSelect = async (policyType: UpdatePolicyType) => {
    if (policyType === currentPolicy) return;

    setIsUpdating(true);
    try {
      await onPolicyChange(policyType);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled || isUpdating}
          className={cn(
            'text-zinc-300 hover:text-white hover:bg-white/5',
            size === 'sm' && 'h-8 px-2 text-sm'
          )}
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <selectedOption.icon
                className={cn('w-4 h-4', selectedOption.color, showLabel && 'mr-2')}
              />
              {showLabel && selectedOption.label}
              <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-bg-elevated border-white/10"
      >
        {policyOptions.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => handleSelect(option.type)}
            className={cn(
              'flex items-start gap-3 p-3 cursor-pointer',
              'hover:bg-white/5 focus:bg-white/5'
            )}
          >
            <option.icon className={cn('w-4 h-4 mt-0.5', option.color)} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {option.label}
                </span>
                {option.type === currentPolicy && (
                  <Check className="w-4 h-4 text-status-success" />
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {option.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
