'use client';

import { useState } from 'react';
import {
  X,
  Settings,
  Terminal,
  ChevronRight,
  Check,
  Loader2,
  Plus,
  Trash2,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AssignmentConfig } from '@/components/AssignmentConfig';
import type { CartItem, PackageAssignment } from '@/types/upload';
import type { PSADTConfig, ProcessToClose, RestartBehavior } from '@/types/psadt';
import type { WingetScope } from '@/types/winget';
import { useCartStore } from '@/stores/cart-store';

interface CartItemConfigProps {
  item: CartItem;
  onClose: () => void;
}

type ConfigSection = 'behavior' | 'assignment' | 'advanced';

export function CartItemConfig({ item, onClose }: CartItemConfigProps) {
  const updateItem = useCartStore((state) => state.updateItem);

  // Local state for editing
  const [selectedScope, setSelectedScope] = useState<WingetScope>(item.installScope);
  const [config, setConfig] = useState<PSADTConfig>(() => ({
    ...item.psadtConfig,
  }));
  const [assignments, setAssignments] = useState<PackageAssignment[]>(
    item.assignments || []
  );
  const [installCommand, setInstallCommand] = useState(item.installCommand);
  const [uninstallCommand, setUninstallCommand] = useState(item.uninstallCommand);

  // UI state
  const [expandedSection, setExpandedSection] = useState<ConfigSection | null>('behavior');
  const [isSaving, setIsSaving] = useState(false);

  const updateConfig = (updates: Partial<PSADTConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const addProcess = () => {
    setConfig((prev) => ({
      ...prev,
      processesToClose: [
        ...prev.processesToClose,
        { name: '', description: '' },
      ],
    }));
  };

  const removeProcess = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      processesToClose: prev.processesToClose.filter((_, i) => i !== index),
    }));
  };

  const updateProcess = (index: number, updates: Partial<ProcessToClose>) => {
    setConfig((prev) => ({
      ...prev,
      processesToClose: prev.processesToClose.map((p, i) =>
        i === index ? { ...p, ...updates } : p
      ),
    }));
  };

  const toggleSection = (section: ConfigSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateItem(item.id, {
        installScope: selectedScope,
        psadtConfig: config,
        assignments: assignments.length > 0 ? assignments : undefined,
        installCommand,
        uninstallCommand,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-bg-elevated to-bg-surface flex items-center justify-center flex-shrink-0 border border-white/5">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Configuration</h2>
                <p className="text-slate-400 text-sm">{item.displayName}</p>
                <p className="text-slate-600 text-xs font-mono mt-1">{item.wingetId}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Read-only info */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Version</span>
                  <p className="text-white font-medium">v{item.version}</p>
                </div>
                <div>
                  <span className="text-slate-500">Architecture</span>
                  <p className="text-white font-medium">{item.architecture}</p>
                </div>
                <div>
                  <span className="text-slate-500">Installer Type</span>
                  <p className="text-white font-medium uppercase">{item.installerType}</p>
                </div>
                <div>
                  <span className="text-slate-500">Publisher</span>
                  <p className="text-white font-medium">{item.publisher}</p>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-3">
                Version and architecture cannot be changed. Remove and re-add the app to select different options.
              </p>
            </div>

            {/* Install Scope */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Install Scope</label>
              <div className="flex gap-2">
                {(['machine', 'user'] as WingetScope[]).map((scope) => {
                  const label = scope === 'machine' ? 'Per-Machine' : 'Per-User';
                  return (
                    <button
                      key={scope}
                      onClick={() => setSelectedScope(scope)}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                        selectedScope === scope
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-white hover:border-slate-600'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Deployment Configuration
              </h3>

              {/* Installation Behavior */}
              <ConfigSection
                title="Installation Behavior"
                icon={<Settings className="w-4 h-4" />}
                expanded={expandedSection === 'behavior'}
                onToggle={() => toggleSection('behavior')}
              >
                <div className="space-y-4">
                  {/* Processes to Close */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Processes to close before install
                      </label>
                      <button
                        onClick={addProcess}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {config.processesToClose.length === 0 ? (
                        <p className="text-slate-500 text-sm italic">No processes configured</p>
                      ) : (
                        config.processesToClose.map((process, index) => (
                          <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={process.name}
                              onChange={(e) => updateProcess(index, { name: e.target.value })}
                              placeholder="Process name (e.g., chrome)"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                            />
                            <input
                              type="text"
                              value={process.description}
                              onChange={(e) => updateProcess(index, { description: e.target.value })}
                              placeholder="Display name"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                            />
                            <button
                              onClick={() => removeProcess(index)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Show Close Prompt Toggle */}
                  <div className="space-y-3">
                    <ToggleOption
                      label="Show close prompt to users"
                      description="When enabled, users see a countdown dialog if the app is running"
                      checked={config.showClosePrompt || false}
                      onChange={(checked) => updateConfig({ showClosePrompt: checked })}
                    />

                    {/* Countdown Duration - only show when close prompt is enabled */}
                    {config.showClosePrompt && (
                      <div className="ml-6 border-l-2 border-slate-700 pl-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Countdown duration (seconds)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="10"
                            max="300"
                            step="10"
                            value={config.closeCountdown || 60}
                            onChange={(e) => updateConfig({ closeCountdown: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                          <span className="text-white text-sm font-mono w-12 text-right">
                            {config.closeCountdown || 60}s
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Allow Deferral Toggle */}
                    <ToggleOption
                      label="Allow users to defer the update"
                      description="Let users postpone the installation"
                      checked={config.allowDefer}
                      onChange={(checked) => updateConfig({ allowDefer: checked })}
                    />

                    {/* Number of Deferrals - only show when deferral is enabled */}
                    {config.allowDefer && (
                      <div className="ml-6 border-l-2 border-slate-700 pl-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Maximum deferrals allowed
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={config.deferTimes || 3}
                          onChange={(e) => updateConfig({ deferTimes: parseInt(e.target.value) || 3 })}
                          className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Restart Behavior */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Restart behavior
                    </label>
                    <select
                      value={config.restartBehavior}
                      onChange={(e) => updateConfig({ restartBehavior: e.target.value as RestartBehavior })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    >
                      <option value="Suppress">Suppress restart (recommended)</option>
                      <option value="Prompt">Prompt user to restart</option>
                      <option value="Force">Force restart</option>
                    </select>
                  </div>
                </div>
              </ConfigSection>

              {/* Assignment Configuration */}
              <ConfigSection
                title="Assignment Configuration"
                icon={<Target className="w-4 h-4" />}
                expanded={expandedSection === 'assignment'}
                onToggle={() => toggleSection('assignment')}
              >
                <AssignmentConfig
                  assignments={assignments}
                  onChange={setAssignments}
                />
              </ConfigSection>

              {/* Advanced */}
              <ConfigSection
                title="Advanced Options"
                icon={<Terminal className="w-4 h-4" />}
                expanded={expandedSection === 'advanced'}
                onToggle={() => toggleSection('advanced')}
              >
                <div className="space-y-4">
                  {/* Custom Install Command */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Install command override
                    </label>
                    <input
                      type="text"
                      value={installCommand}
                      onChange={(e) => setInstallCommand(e.target.value)}
                      placeholder="Leave empty to use default"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono"
                    />
                    <p className="text-slate-500 text-xs mt-1">Override the auto-generated install command</p>
                  </div>

                  {/* Custom Uninstall Command */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Uninstall command override
                    </label>
                    <input
                      type="text"
                      value={uninstallCommand}
                      onChange={(e) => setUninstallCommand(e.target.value)}
                      placeholder="Leave empty to use default"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono"
                    />
                    <p className="text-slate-500 text-xs mt-1">Override the auto-generated uninstall command</p>
                  </div>
                </div>
              </ConfigSection>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-800 p-4 bg-slate-900/95">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-white/5 hover:border-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

interface ConfigSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ConfigSection({ title, icon, expanded, onToggle, children }: ConfigSectionProps) {
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-white">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <ChevronRight className={cn('w-4 h-4 text-slate-400 transition-transform', expanded && 'rotate-90')} />
      </button>
      {expanded && <div className="p-4 bg-slate-900/50">{children}</div>}
    </div>
  );
}

interface ToggleOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="pt-0.5">
        <div
          className={cn(
            'w-10 h-6 rounded-full transition-colors relative',
            checked ? 'bg-blue-600' : 'bg-slate-700'
          )}
          onClick={() => onChange(!checked)}
        >
          <div
            className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              checked ? 'translate-x-5' : 'translate-x-1'
            )}
          />
        </div>
      </div>
      <div>
        <span className="text-white text-sm font-medium">{label}</span>
        <p className="text-slate-500 text-xs">{description}</p>
      </div>
    </label>
  );
}
