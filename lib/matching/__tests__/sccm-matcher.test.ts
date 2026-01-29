/**
 * SCCM Matcher Tests
 * Unit tests for SCCM-specific matching logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeSccmAppName,
  extractProductCode,
  isSupportedTechnology,
  getPrimaryDeploymentType,
  isSccmSystemApp,
  filterUserSccmApps,
  sortByMigrationPriority,
  calculateMatchStats,
} from '../sccm-matcher';
import type { SccmApplication, SccmDeploymentType, SccmMsiDetectionClause } from '@/types/sccm';

// ============================================
// Test Factories
// ============================================

function createTestSccmApp(overrides?: Partial<SccmApplication>): SccmApplication {
  return {
    ci_id: 'test-123',
    localizedDisplayName: 'Test Application',
    manufacturer: 'Test Corp',
    softwareVersion: '1.0.0',
    deploymentTypes: [
      {
        name: 'Default',
        technology: 'MSI',
        installCommand: 'msiexec /i test.msi /qn',
        uninstallCommand: 'msiexec /x test.msi /qn',
        installBehavior: 'InstallForSystem',
        rebootBehavior: 'NoAction',
        detectionClauses: [],
      },
    ],
    adminCategories: [],
    isDeployed: true,
    deploymentCount: 10,
    ...overrides,
  };
}

function createTestDeploymentType(
  overrides?: Partial<SccmDeploymentType>
): SccmDeploymentType {
  return {
    name: 'Default',
    technology: 'MSI',
    installCommand: 'msiexec /i test.msi /qn',
    uninstallCommand: 'msiexec /x test.msi /qn',
    installBehavior: 'InstallForSystem',
    rebootBehavior: 'NoAction',
    detectionClauses: [],
    ...overrides,
  };
}

// ============================================
// normalizeSccmAppName Tests
// ============================================

describe('normalizeSccmAppName', () => {
  it('normalizes basic app names', () => {
    expect(normalizeSccmAppName('Google Chrome')).toBe('google chrome');
  });

  it('handles Microsoft 365 variants - converts to canonical name', () => {
    // The enterprise normalizations convert these to "Microsoft 365"
    // Then the base normalizer strips "365" as a version number
    const variants = [
      'Microsoft 365 Apps for enterprise',
      'Microsoft 365 Apps for business',
      'Office 365 ProPlus',
      'Office 365 Business',
    ];

    for (const variant of variants) {
      const normalized = normalizeSccmAppName(variant);
      // Note: "365" gets stripped by base normalizer as a number pattern
      expect(normalized).toBe('microsoft');
    }
  });

  it('handles Adobe Creative Cloud variants', () => {
    const variants = [
      'Adobe Creative Cloud All Apps',
      'Adobe CC',
      'Creative Cloud Desktop',
    ];

    for (const variant of variants) {
      const normalized = normalizeSccmAppName(variant);
      expect(normalized).toBe('adobe creative cloud');
    }
  });

  it('handles Cisco AnyConnect variants', () => {
    const variants = [
      'Cisco AnyConnect Secure Mobility Client',
      'Cisco Secure Client',
      'AnyConnect VPN',
    ];

    for (const variant of variants) {
      const normalized = normalizeSccmAppName(variant);
      expect(normalized).toBe('cisco anyconnect');
    }
  });

  it('handles case insensitivity', () => {
    // "365" gets stripped by base normalizer as a number pattern
    expect(normalizeSccmAppName('MICROSOFT 365 APPS FOR ENTERPRISE'))
      .toBe('microsoft');
  });

  it('handles names with extra whitespace', () => {
    expect(normalizeSccmAppName('  Google   Chrome  ')).toBe('google chrome');
  });
});

// ============================================
// extractProductCode Tests
// ============================================

describe('extractProductCode', () => {
  it('extracts product code from MSI detection clause', () => {
    const app = createTestSccmApp({
      deploymentTypes: [
        createTestDeploymentType({
          detectionClauses: [
            {
              type: 'MSI',
              productCode: '{12345678-1234-1234-1234-123456789ABC}',
              propertyType: 'Exists',
            } as SccmMsiDetectionClause,
          ],
        }),
      ],
    });

    expect(extractProductCode(app)).toBe('{12345678-1234-1234-1234-123456789ABC}');
  });

  it('returns null when no MSI detection clause exists', () => {
    const app = createTestSccmApp({
      deploymentTypes: [
        createTestDeploymentType({
          detectionClauses: [
            {
              type: 'File',
              path: 'C:\\Program Files\\Test',
              fileName: 'test.exe',
            },
          ],
        }),
      ],
    });

    expect(extractProductCode(app)).toBeNull();
  });

  it('returns null when deployment type has no detection clauses', () => {
    const app = createTestSccmApp({
      deploymentTypes: [createTestDeploymentType({ detectionClauses: [] })],
    });

    expect(extractProductCode(app)).toBeNull();
  });

  it('returns first product code when multiple MSI clauses exist', () => {
    const app = createTestSccmApp({
      deploymentTypes: [
        createTestDeploymentType({
          detectionClauses: [
            {
              type: 'MSI',
              productCode: '{FIRST-CODE-1234-1234-123456789ABC}',
              propertyType: 'Exists',
            } as SccmMsiDetectionClause,
            {
              type: 'MSI',
              productCode: '{SECOND-CODE-1234-1234-123456789ABC}',
              propertyType: 'Exists',
            } as SccmMsiDetectionClause,
          ],
        }),
      ],
    });

    expect(extractProductCode(app)).toBe('{FIRST-CODE-1234-1234-123456789ABC}');
  });

  it('handles null deployment types', () => {
    const app = createTestSccmApp({ deploymentTypes: [] });
    expect(extractProductCode(app)).toBeNull();
  });
});

// ============================================
// isSupportedTechnology Tests
// ============================================

describe('isSupportedTechnology', () => {
  it('returns true for MSI', () => {
    expect(isSupportedTechnology('MSI')).toBe(true);
  });

  it('returns true for Script', () => {
    expect(isSupportedTechnology('Script')).toBe(true);
  });

  it('returns true for MSIX', () => {
    expect(isSupportedTechnology('MSIX')).toBe(true);
  });

  it('returns false for AppV (not supported in Intune)', () => {
    expect(isSupportedTechnology('AppV')).toBe(false);
  });

  it('returns false for MacOS', () => {
    expect(isSupportedTechnology('MacOS')).toBe(false);
  });

  it('returns true for WinGetApp', () => {
    expect(isSupportedTechnology('WinGetApp')).toBe(true);
  });

  it('returns true for Unknown (should be evaluated separately)', () => {
    expect(isSupportedTechnology('Unknown')).toBe(true);
  });
});

// ============================================
// getPrimaryDeploymentType Tests
// ============================================

describe('getPrimaryDeploymentType', () => {
  it('returns first deployment type when no priorities set', () => {
    const app = createTestSccmApp({
      deploymentTypes: [
        createTestDeploymentType({ name: 'First' }),
        createTestDeploymentType({ name: 'Second' }),
      ],
    });

    expect(getPrimaryDeploymentType(app)?.name).toBe('First');
  });

  it('returns deployment type with lowest priority', () => {
    const app = createTestSccmApp({
      deploymentTypes: [
        createTestDeploymentType({ name: 'Second', priority: 2 }),
        createTestDeploymentType({ name: 'First', priority: 1 }),
        createTestDeploymentType({ name: 'Third', priority: 3 }),
      ],
    });

    expect(getPrimaryDeploymentType(app)?.name).toBe('First');
  });

  it('returns null when no deployment types exist', () => {
    const app = createTestSccmApp({ deploymentTypes: [] });
    expect(getPrimaryDeploymentType(app)).toBeNull();
  });

  it('handles mixed priority and no-priority deployment types', () => {
    const app = createTestSccmApp({
      deploymentTypes: [
        createTestDeploymentType({ name: 'NoPriority' }),
        createTestDeploymentType({ name: 'LowPriority', priority: 1 }),
      ],
    });

    expect(getPrimaryDeploymentType(app)?.name).toBe('LowPriority');
  });
});

// ============================================
// isSccmSystemApp Tests
// ============================================

describe('isSccmSystemApp', () => {
  it('identifies Visual C++ Redistributable as system app', () => {
    const app = createTestSccmApp({
      localizedDisplayName: 'Microsoft Visual C++ 2019 Redistributable (x64)',
    });
    expect(isSccmSystemApp(app)).toBe(true);
  });

  it('identifies .NET Framework as system app', () => {
    const app = createTestSccmApp({
      localizedDisplayName: 'Microsoft .NET Framework 4.8',
    });
    expect(isSccmSystemApp(app)).toBe(true);
  });

  it('identifies .NET Runtime as system app', () => {
    const app = createTestSccmApp({
      localizedDisplayName: 'Microsoft .NET Runtime 6.0.15',
    });
    expect(isSccmSystemApp(app)).toBe(true);
  });

  it('identifies SCCM client as system app', () => {
    const app = createTestSccmApp({
      localizedDisplayName: 'Configuration Manager Client',
    });
    expect(isSccmSystemApp(app)).toBe(true);
  });

  it('identifies Intune Management Extension as system app', () => {
    const app = createTestSccmApp({
      localizedDisplayName: 'Microsoft Intune Management Extension',
    });
    expect(isSccmSystemApp(app)).toBe(true);
  });

  it('identifies security updates as system app', () => {
    const app = createTestSccmApp({
      localizedDisplayName: 'Security Update for Windows',
    });
    expect(isSccmSystemApp(app)).toBe(true);
  });

  it('returns false for regular applications', () => {
    const app = createTestSccmApp({
      localizedDisplayName: 'Google Chrome',
    });
    expect(isSccmSystemApp(app)).toBe(false);
  });

  it('returns false for Adobe applications', () => {
    const app = createTestSccmApp({
      localizedDisplayName: 'Adobe Acrobat Reader DC',
    });
    expect(isSccmSystemApp(app)).toBe(false);
  });
});

// ============================================
// filterUserSccmApps Tests
// ============================================

describe('filterUserSccmApps', () => {
  it('filters out system apps', () => {
    const apps = [
      createTestSccmApp({ localizedDisplayName: 'Google Chrome' }),
      createTestSccmApp({ localizedDisplayName: 'Microsoft Visual C++ 2019' }),
      createTestSccmApp({ localizedDisplayName: 'Adobe Reader' }),
      createTestSccmApp({ localizedDisplayName: '.NET Framework 4.8' }),
    ];

    const filtered = filterUserSccmApps(apps);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(a => a.localizedDisplayName)).toEqual([
      'Google Chrome',
      'Adobe Reader',
    ]);
  });

  it('returns empty array when all apps are system apps', () => {
    const apps = [
      createTestSccmApp({ localizedDisplayName: 'Microsoft Visual C++' }),
      createTestSccmApp({ localizedDisplayName: '.NET Runtime' }),
    ];

    const filtered = filterUserSccmApps(apps);
    expect(filtered).toHaveLength(0);
  });

  it('returns all apps when none are system apps', () => {
    const apps = [
      createTestSccmApp({ localizedDisplayName: 'Google Chrome' }),
      createTestSccmApp({ localizedDisplayName: 'Mozilla Firefox' }),
    ];

    const filtered = filterUserSccmApps(apps);
    expect(filtered).toHaveLength(2);
  });
});

// ============================================
// sortByMigrationPriority Tests
// ============================================

describe('sortByMigrationPriority', () => {
  it('sorts deployed apps before non-deployed', () => {
    const apps = [
      {
        ...createTestSccmApp({ isDeployed: false }),
        matchResult: { status: 'matched' as const, wingetId: 'A', wingetName: 'A', confidence: 1, partialMatches: [], matchedBy: null },
      },
      {
        ...createTestSccmApp({ isDeployed: true }),
        matchResult: { status: 'matched' as const, wingetId: 'B', wingetName: 'B', confidence: 1, partialMatches: [], matchedBy: null },
      },
    ];

    const sorted = sortByMigrationPriority(apps);
    expect(sorted[0].isDeployed).toBe(true);
    expect(sorted[1].isDeployed).toBe(false);
  });

  it('sorts matched apps before partial matches', () => {
    const apps = [
      {
        ...createTestSccmApp({ isDeployed: true }),
        matchResult: { status: 'partial' as const, wingetId: 'A', wingetName: 'A', confidence: 0.7, partialMatches: [], matchedBy: null },
      },
      {
        ...createTestSccmApp({ isDeployed: true }),
        matchResult: { status: 'matched' as const, wingetId: 'B', wingetName: 'B', confidence: 1, partialMatches: [], matchedBy: null },
      },
    ];

    const sorted = sortByMigrationPriority(apps);
    expect(sorted[0].matchResult.status).toBe('matched');
    expect(sorted[1].matchResult.status).toBe('partial');
  });

  it('sorts by deployment count within same status', () => {
    const apps = [
      {
        ...createTestSccmApp({ isDeployed: true, deploymentCount: 5 }),
        matchResult: { status: 'matched' as const, wingetId: 'A', wingetName: 'A', confidence: 1, partialMatches: [], matchedBy: null },
      },
      {
        ...createTestSccmApp({ isDeployed: true, deploymentCount: 100 }),
        matchResult: { status: 'matched' as const, wingetId: 'B', wingetName: 'B', confidence: 1, partialMatches: [], matchedBy: null },
      },
    ];

    const sorted = sortByMigrationPriority(apps);
    expect(sorted[0].deploymentCount).toBe(100);
    expect(sorted[1].deploymentCount).toBe(5);
  });
});

// ============================================
// calculateMatchStats Tests
// ============================================

describe('calculateMatchStats', () => {
  it('calculates correct stats for mixed results', () => {
    const apps = [
      { matchResult: { status: 'matched' as const, wingetId: 'A', wingetName: 'A', confidence: 1, partialMatches: [], matchedBy: null } },
      { matchResult: { status: 'matched' as const, wingetId: 'B', wingetName: 'B', confidence: 1, partialMatches: [], matchedBy: null } },
      { matchResult: { status: 'partial' as const, wingetId: 'C', wingetName: 'C', confidence: 0.7, partialMatches: [], matchedBy: null } },
      { matchResult: { status: 'unmatched' as const, wingetId: null, wingetName: null, confidence: 0, partialMatches: [], matchedBy: null } },
    ];

    const stats = calculateMatchStats(apps);
    expect(stats).toEqual({
      total: 4,
      matched: 2,
      partial: 1,
      unmatched: 1,
      matchRate: 0.75, // (2 + 1) / 4
    });
  });

  it('returns zero match rate for empty array', () => {
    const stats = calculateMatchStats([]);
    expect(stats).toEqual({
      total: 0,
      matched: 0,
      partial: 0,
      unmatched: 0,
      matchRate: 0,
    });
  });

  it('returns 100% match rate when all matched', () => {
    const apps = [
      { matchResult: { status: 'matched' as const, wingetId: 'A', wingetName: 'A', confidence: 1, partialMatches: [], matchedBy: null } },
      { matchResult: { status: 'matched' as const, wingetId: 'B', wingetName: 'B', confidence: 1, partialMatches: [], matchedBy: null } },
    ];

    const stats = calculateMatchStats(apps);
    expect(stats.matchRate).toBe(1);
  });
});
