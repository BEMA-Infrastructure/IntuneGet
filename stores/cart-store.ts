/**
 * Cart Store
 * Zustand store for managing the upload cart
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/upload';
import type { NormalizedInstaller, WingetScope } from '@/types/winget';
import type { PSADTConfig } from '@/types/psadt';
import { DEFAULT_PSADT_CONFIG } from '@/types/psadt';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  autoOpenOnAdd: boolean;
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  addItemSilent: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  setAutoOpenOnAdd: (enabled: boolean) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  isInCart: (wingetId: string, version: string, architecture: string) => boolean;
  getItemCount: () => number;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      autoOpenOnAdd: true,

      addItem: (item) => {
        const id = `${item.wingetId}-${item.version}-${item.architecture}-${Date.now()}`;
        const shouldOpenCart = get().autoOpenOnAdd;
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id,
              addedAt: new Date().toISOString(),
            },
          ],
          isOpen: shouldOpenCart,
        }));
      },

      addItemSilent: (item) => {
        const id = `${item.wingetId}-${item.version}-${item.architecture}-${Date.now()}`;
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id,
              addedAt: new Date().toISOString(),
            },
          ],
          // Don't open cart - used for bulk operations
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      setAutoOpenOnAdd: (enabled) => {
        set({ autoOpenOnAdd: enabled });
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      isInCart: (wingetId, version, architecture) => {
        return get().items.some(
          (item) =>
            item.wingetId === wingetId &&
            item.version === version &&
            item.architecture === architecture
        );
      },

      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'intuneget-cart',
      partialize: (state) => ({
        items: state.items,
        autoOpenOnAdd: state.autoOpenOnAdd,
      }),
    }
  )
);

// Helper function to create a cart item from package and installer data
export function createCartItem(
  wingetId: string,
  displayName: string,
  publisher: string,
  version: string,
  installer: NormalizedInstaller,
  installScope: WingetScope = 'machine',
  psadtConfig?: Partial<PSADTConfig>
): Omit<CartItem, 'id' | 'addedAt'> {
  // Import detection rule generator
  const { generateDetectionRules, generateInstallCommand, generateUninstallCommand } = require('@/lib/detection-rules');

  // Pass wingetId and version for registry marker detection (most reliable for EXE installers)
  const detectionRules = generateDetectionRules(installer, displayName, wingetId, version);

  return {
    wingetId,
    displayName,
    publisher,
    version,
    architecture: installer.architecture,
    installScope,
    installerType: installer.type,
    installerUrl: installer.url,
    installerSha256: installer.sha256,
    installCommand: generateInstallCommand(installer, installScope),
    uninstallCommand: generateUninstallCommand(installer, displayName),
    detectionRules,
    psadtConfig: {
      ...DEFAULT_PSADT_CONFIG,
      detectionRules,
      ...psadtConfig,
    },
  };
}
