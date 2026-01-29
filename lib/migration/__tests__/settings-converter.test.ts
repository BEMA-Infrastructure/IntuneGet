/**
 * Settings Converter Tests
 * Unit tests for SCCM to Intune settings conversion
 */

import { describe, it, expect } from 'vitest';
import {
  convertSccmPathToIntune,
  convertOperator,
  convertMsiDetection,
  convertFileDetection,
  convertRegistryDetection,
  convertScriptDetection,
  convertDetectionClause,
  convertDetectionRules,
  mapInstallBehavior,
  mapRebootBehavior,
  wrapSccmScriptForIntune,
  validateDetectionRules,
  convertDeploymentType,
} from '../settings-converter';
import type {
  SccmMsiDetectionClause,
  SccmFileDetectionClause,
  SccmRegistryDetectionClause,
  SccmScriptDetectionClause,
  SccmDeploymentType,
} from '@/types/sccm';

// ============================================
// convertSccmPathToIntune Tests
// ============================================

describe('convertSccmPathToIntune', () => {
  it('converts %windir% to %SystemRoot%', () => {
    expect(convertSccmPathToIntune('%windir%\\System32\\test.exe'))
      .toBe('%SystemRoot%\\System32\\test.exe');
  });

  it('converts %systemroot% (case insensitive) to %SystemRoot%', () => {
    expect(convertSccmPathToIntune('%SYSTEMROOT%\\test.exe'))
      .toBe('%SystemRoot%\\test.exe');
  });

  it('converts %programfiles% to %ProgramFiles%', () => {
    expect(convertSccmPathToIntune('%programfiles%\\MyApp\\app.exe'))
      .toBe('%ProgramFiles%\\MyApp\\app.exe');
  });

  it('converts %programfiles(x86)% to %ProgramFiles(x86)%', () => {
    expect(convertSccmPathToIntune('%programfiles(x86)%\\MyApp\\app.exe'))
      .toBe('%ProgramFiles(x86)%\\MyApp\\app.exe');
  });

  it('converts %programdata% to %ProgramData%', () => {
    expect(convertSccmPathToIntune('%programdata%\\MyApp\\config.xml'))
      .toBe('%ProgramData%\\MyApp\\config.xml');
  });

  it('converts %appdata% to %AppData%', () => {
    expect(convertSccmPathToIntune('%appdata%\\MyApp\\settings.json'))
      .toBe('%AppData%\\MyApp\\settings.json');
  });

  it('converts %localappdata% to %LocalAppData%', () => {
    expect(convertSccmPathToIntune('%localappdata%\\MyApp'))
      .toBe('%LocalAppData%\\MyApp');
  });

  it('converts %temp% and %tmp% to %Temp%', () => {
    expect(convertSccmPathToIntune('%temp%\\installer.log'))
      .toBe('%Temp%\\installer.log');
    expect(convertSccmPathToIntune('%tmp%\\temp.txt'))
      .toBe('%Temp%\\temp.txt');
  });

  it('converts forward slashes to backslashes', () => {
    expect(convertSccmPathToIntune('C:/Program Files/MyApp/app.exe'))
      .toBe('C:\\Program Files\\MyApp\\app.exe');
  });

  it('removes trailing backslash except for drive root', () => {
    expect(convertSccmPathToIntune('C:\\Program Files\\MyApp\\'))
      .toBe('C:\\Program Files\\MyApp');
    expect(convertSccmPathToIntune('C:\\')).toBe('C:\\');
  });

  it('handles multiple variable conversions in one path', () => {
    expect(convertSccmPathToIntune('%windir%\\..\\%programfiles%\\test'))
      .toBe('%SystemRoot%\\..\\%ProgramFiles%\\test');
  });

  it('passes through paths without variables unchanged', () => {
    expect(convertSccmPathToIntune('C:\\Program Files\\Test'))
      .toBe('C:\\Program Files\\Test');
  });
});

// ============================================
// convertOperator Tests
// ============================================

describe('convertOperator', () => {
  it('converts Equals to equal', () => {
    expect(convertOperator('Equals')).toBe('equal');
  });

  it('converts NotEquals to notEqual', () => {
    expect(convertOperator('NotEquals')).toBe('notEqual');
  });

  it('converts GreaterThan to greaterThan', () => {
    expect(convertOperator('GreaterThan')).toBe('greaterThan');
  });

  it('converts LessThan to lessThan', () => {
    expect(convertOperator('LessThan')).toBe('lessThan');
  });

  it('converts GreaterEquals to greaterThanOrEqual', () => {
    expect(convertOperator('GreaterEquals')).toBe('greaterThanOrEqual');
  });

  it('converts LessEquals to lessThanOrEqual', () => {
    expect(convertOperator('LessEquals')).toBe('lessThanOrEqual');
  });

  it('defaults to equal for undefined', () => {
    expect(convertOperator(undefined)).toBe('equal');
  });

  it('defaults to equal for unknown operator', () => {
    expect(convertOperator('UnknownOperator')).toBe('equal');
  });
});

// ============================================
// convertMsiDetection Tests
// ============================================

describe('convertMsiDetection', () => {
  it('converts basic MSI detection with product code only', () => {
    const clause: SccmMsiDetectionClause = {
      type: 'MSI',
      productCode: '{12345678-1234-1234-1234-123456789ABC}',
      propertyType: 'Exists',
    };

    const result = convertMsiDetection(clause);
    expect(result).toEqual({
      type: 'msi',
      productCode: '{12345678-1234-1234-1234-123456789ABC}',
    });
  });

  it('includes version check when propertyType is not Exists', () => {
    const clause: SccmMsiDetectionClause = {
      type: 'MSI',
      productCode: '{12345678-1234-1234-1234-123456789ABC}',
      propertyType: 'ProductVersion',
      expressionOperator: 'GreaterEquals',
      expectedValue: '2.0.0',
    };

    const result = convertMsiDetection(clause);
    expect(result).toEqual({
      type: 'msi',
      productCode: '{12345678-1234-1234-1234-123456789ABC}',
      productVersionOperator: 'greaterThanOrEqual',
      productVersion: '2.0.0',
    });
  });
});

// ============================================
// convertFileDetection Tests
// ============================================

describe('convertFileDetection', () => {
  it('converts basic file existence check', () => {
    const clause: SccmFileDetectionClause = {
      type: 'File',
      path: '%programfiles%\\MyApp',
      fileName: 'app.exe',
      expressionOperator: 'Exists',
    };

    const result = convertFileDetection(clause);
    expect(result).toEqual({
      type: 'file',
      path: '%ProgramFiles%\\MyApp',
      fileOrFolderName: 'app.exe',
      detectionType: 'exists',
      check32BitOn64System: true, // Default when is64Bit is not set
    });
  });

  it('converts file version check', () => {
    const clause: SccmFileDetectionClause = {
      type: 'File',
      path: 'C:\\Program Files\\MyApp',
      fileName: 'app.exe',
      propertyType: 'Version',
      expressionOperator: 'GreaterEquals',
      expectedValue: '1.0.0',
      is64Bit: true,
    };

    const result = convertFileDetection(clause);
    expect(result).toEqual({
      type: 'file',
      path: 'C:\\Program Files\\MyApp',
      fileOrFolderName: 'app.exe',
      detectionType: 'version',
      check32BitOn64System: false,
      operator: 'greaterThanOrEqual',
      detectionValue: '1.0.0',
    });
  });

  it('handles NotExists operator', () => {
    const clause: SccmFileDetectionClause = {
      type: 'File',
      path: 'C:\\Temp',
      fileName: 'oldfile.txt',
      expressionOperator: 'NotExists',
    };

    const result = convertFileDetection(clause);
    expect(result.detectionType).toBe('notExists');
  });

  it('converts date modified property type', () => {
    const clause: SccmFileDetectionClause = {
      type: 'File',
      path: 'C:\\Data',
      fileName: 'config.xml',
      propertyType: 'DateModified',
      expressionOperator: 'GreaterThan',
      expectedValue: '2024-01-01',
    };

    const result = convertFileDetection(clause);
    expect(result.detectionType).toBe('dateModified');
    expect(result.operator).toBe('greaterThan');
  });

  it('converts size property type', () => {
    const clause: SccmFileDetectionClause = {
      type: 'File',
      path: 'C:\\Logs',
      fileName: 'app.log',
      propertyType: 'Size',
      expressionOperator: 'LessThan',
      expectedValue: '100',
    };

    const result = convertFileDetection(clause);
    expect(result.detectionType).toBe('sizeInMB');
    expect(result.operator).toBe('lessThan');
  });
});

// ============================================
// convertRegistryDetection Tests
// ============================================

describe('convertRegistryDetection', () => {
  it('converts basic registry key existence check', () => {
    const clause: SccmRegistryDetectionClause = {
      type: 'Registry',
      hive: 'LocalMachine',
      keyPath: 'SOFTWARE\\MyApp',
      propertyType: 'Exists',
    };

    const result = convertRegistryDetection(clause);
    expect(result).toEqual({
      type: 'registry',
      keyPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\MyApp',
      valueName: undefined,
      detectionType: 'exists',
      check32BitOn64System: true,
    });
  });

  it('converts registry value check with string', () => {
    const clause: SccmRegistryDetectionClause = {
      type: 'Registry',
      hive: 'LocalMachine',
      keyPath: 'SOFTWARE\\MyApp',
      valueName: 'Version',
      propertyType: 'Value',
      expressionOperator: 'Equals',
      expectedValue: '1.0.0',
      is64Bit: true,
    };

    const result = convertRegistryDetection(clause);
    expect(result).toEqual({
      type: 'registry',
      keyPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\MyApp',
      valueName: 'Version',
      detectionType: 'version',
      check32BitOn64System: false,
      operator: 'equal',
      detectionValue: '1.0.0',
    });
  });

  it('detects integer value type', () => {
    const clause: SccmRegistryDetectionClause = {
      type: 'Registry',
      hive: 'LocalMachine',
      keyPath: 'SOFTWARE\\MyApp',
      valueName: 'InstallCount',
      propertyType: 'Value',
      expressionOperator: 'GreaterThan',
      expectedValue: '5',
    };

    const result = convertRegistryDetection(clause);
    expect(result.detectionType).toBe('integer');
  });

  it('converts different registry hives', () => {
    const hives = [
      { hive: 'CurrentUser' as const, expected: 'HKEY_CURRENT_USER' },
      { hive: 'ClassesRoot' as const, expected: 'HKEY_CLASSES_ROOT' },
      { hive: 'Users' as const, expected: 'HKEY_USERS' },
      { hive: 'CurrentConfig' as const, expected: 'HKEY_CURRENT_CONFIG' },
    ];

    for (const { hive, expected } of hives) {
      const clause: SccmRegistryDetectionClause = {
        type: 'Registry',
        hive,
        keyPath: 'Test',
        propertyType: 'Exists',
      };

      const result = convertRegistryDetection(clause);
      expect(result.keyPath).toBe(`${expected}\\Test`);
    }
  });
});

// ============================================
// convertScriptDetection Tests
// ============================================

describe('convertScriptDetection', () => {
  it('converts PowerShell script', () => {
    const clause: SccmScriptDetectionClause = {
      type: 'Script',
      scriptLanguage: 'PowerShell',
      scriptContent: 'Test-Path "C:\\MyApp\\app.exe"',
    };

    const result = convertScriptDetection(clause);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('script');
    expect(result?.enforceSignatureCheck).toBe(false);
    expect(result?.scriptContent).toContain('Test-Path');
  });

  it('returns null for VBScript', () => {
    const clause: SccmScriptDetectionClause = {
      type: 'Script',
      scriptLanguage: 'VBScript',
      scriptContent: 'WScript.Echo "test"',
    };

    const result = convertScriptDetection(clause);
    expect(result).toBeNull();
  });

  it('returns null for JScript', () => {
    const clause: SccmScriptDetectionClause = {
      type: 'Script',
      scriptLanguage: 'JScript',
      scriptContent: 'alert("test")',
    };

    const result = convertScriptDetection(clause);
    expect(result).toBeNull();
  });

  it('sets runAs32Bit from clause', () => {
    const clause: SccmScriptDetectionClause = {
      type: 'Script',
      scriptLanguage: 'PowerShell',
      scriptContent: '$true',
      runAs32Bit: true,
    };

    const result = convertScriptDetection(clause);
    expect(result?.runAs32Bit).toBe(true);
  });
});

// ============================================
// wrapSccmScriptForIntune Tests
// ============================================

describe('wrapSccmScriptForIntune', () => {
  it('wraps simple boolean return script', () => {
    const script = 'Test-Path "C:\\MyApp\\app.exe"';
    const wrapped = wrapSccmScriptForIntune(script);

    expect(wrapped).toContain('# Converted from SCCM');
    expect(wrapped).toContain('exit 0  # Application detected');
    expect(wrapped).toContain('exit 1  # Application not detected');
    expect(wrapped).toContain(script);
  });

  it('does not wrap script that already has exit statements', () => {
    const script = 'if (Test-Path "C:\\app") { exit 0 } else { exit 1 }';
    const wrapped = wrapSccmScriptForIntune(script);

    expect(wrapped).toBe(script);
  });
});

// ============================================
// convertDetectionClause Tests
// ============================================

describe('convertDetectionClause', () => {
  it('converts MSI clause', () => {
    const clause: SccmMsiDetectionClause = {
      type: 'MSI',
      productCode: '{TEST-CODE}',
      propertyType: 'Exists',
    };

    const result = convertDetectionClause(clause);
    expect(result?.type).toBe('msi');
  });

  it('converts File clause', () => {
    const clause: SccmFileDetectionClause = {
      type: 'File',
      path: 'C:\\Test',
      fileName: 'test.exe',
    };

    const result = convertDetectionClause(clause);
    expect(result?.type).toBe('file');
  });

  it('converts Registry clause', () => {
    const clause: SccmRegistryDetectionClause = {
      type: 'Registry',
      hive: 'LocalMachine',
      keyPath: 'SOFTWARE\\Test',
      propertyType: 'Exists',
    };

    const result = convertDetectionClause(clause);
    expect(result?.type).toBe('registry');
  });

  it('converts Script clause', () => {
    const clause: SccmScriptDetectionClause = {
      type: 'Script',
      scriptLanguage: 'PowerShell',
      scriptContent: '$true',
    };

    const result = convertDetectionClause(clause);
    expect(result?.type).toBe('script');
  });

  it('returns null for unknown clause type', () => {
    const clause = { type: 'Unknown' } as unknown as SccmMsiDetectionClause;
    const result = convertDetectionClause(clause);
    expect(result).toBeNull();
  });
});

// ============================================
// convertDetectionRules Tests
// ============================================

describe('convertDetectionRules', () => {
  it('converts multiple clauses', () => {
    const clauses = [
      {
        type: 'MSI' as const,
        productCode: '{TEST-1}',
        propertyType: 'Exists' as const,
      },
      {
        type: 'File' as const,
        path: 'C:\\Test',
        fileName: 'test.exe',
      },
    ];

    const result = convertDetectionRules(clauses);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('msi');
    expect(result[1].type).toBe('file');
  });

  it('filters out unconvertible clauses', () => {
    const clauses = [
      {
        type: 'MSI' as const,
        productCode: '{TEST-1}',
        propertyType: 'Exists' as const,
      },
      {
        type: 'Script' as const,
        scriptLanguage: 'VBScript' as const,
        scriptContent: 'test',
      },
    ];

    const result = convertDetectionRules(clauses);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    const result = convertDetectionRules([]);
    expect(result).toHaveLength(0);
  });
});

// ============================================
// mapInstallBehavior Tests
// ============================================

describe('mapInstallBehavior', () => {
  it('maps InstallForUser to user', () => {
    expect(mapInstallBehavior('InstallForUser')).toBe('user');
  });

  it('maps InstallForSystem to machine', () => {
    expect(mapInstallBehavior('InstallForSystem')).toBe('machine');
  });

  it('maps hybrid behavior to machine', () => {
    expect(
      mapInstallBehavior('InstallForSystemIfResourceIsDeviceOtherwiseInstallForUser')
    ).toBe('machine');
  });

  it('defaults to machine for null', () => {
    expect(mapInstallBehavior(null)).toBe('machine');
  });

  it('defaults to machine for undefined', () => {
    expect(mapInstallBehavior(undefined)).toBe('machine');
  });

  it('defaults to machine for unknown value', () => {
    expect(mapInstallBehavior('UnknownBehavior')).toBe('machine');
  });
});

// ============================================
// mapRebootBehavior Tests
// ============================================

describe('mapRebootBehavior', () => {
  it('maps NoAction to suppress', () => {
    expect(mapRebootBehavior('NoAction')).toBe('suppress');
  });

  it('maps ProgramReboot to allow', () => {
    expect(mapRebootBehavior('ProgramReboot')).toBe('allow');
  });

  it('maps ForceReboot to force', () => {
    expect(mapRebootBehavior('ForceReboot')).toBe('force');
  });

  it('maps BasedOnExitCode to basedOnReturnCode', () => {
    expect(mapRebootBehavior('BasedOnExitCode')).toBe('basedOnReturnCode');
  });

  it('defaults to basedOnReturnCode for null', () => {
    expect(mapRebootBehavior(null)).toBe('basedOnReturnCode');
  });

  it('defaults to basedOnReturnCode for undefined', () => {
    expect(mapRebootBehavior(undefined)).toBe('basedOnReturnCode');
  });
});

// ============================================
// validateDetectionRules Tests
// ============================================

describe('validateDetectionRules', () => {
  it('returns invalid for empty rules', () => {
    const result = validateDetectionRules([]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one detection rule is required');
  });

  it('validates MSI rule product code format', () => {
    const rules = [
      {
        type: 'msi' as const,
        productCode: 'invalid-format',
      },
    ];

    const result = validateDetectionRules(rules);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('format may be invalid');
  });

  it('validates MSI rule has product code', () => {
    const rules = [
      {
        type: 'msi' as const,
        productCode: '',
      },
    ];

    const result = validateDetectionRules(rules);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('product code is required');
  });

  it('validates file rule has path', () => {
    const rules = [
      {
        type: 'file' as const,
        path: '',
        fileOrFolderName: 'test.exe',
        detectionType: 'exists' as const,
        check32BitOn64System: false,
      },
    ];

    const result = validateDetectionRules(rules);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('File path is required');
  });

  it('validates file rule has filename', () => {
    const rules = [
      {
        type: 'file' as const,
        path: 'C:\\Test',
        fileOrFolderName: '',
        detectionType: 'exists' as const,
        check32BitOn64System: false,
      },
    ];

    const result = validateDetectionRules(rules);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('File or folder name is required');
  });

  it('validates registry rule has key path', () => {
    const rules = [
      {
        type: 'registry' as const,
        keyPath: '',
        detectionType: 'exists' as const,
        check32BitOn64System: false,
      },
    ];

    const result = validateDetectionRules(rules);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Registry key path is required');
  });

  it('validates script rule has content', () => {
    const rules = [
      {
        type: 'script' as const,
        scriptContent: '',
        enforceSignatureCheck: false,
        runAs32Bit: false,
      },
    ];

    const result = validateDetectionRules(rules);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Script content is required');
  });

  it('returns valid for correct MSI rule', () => {
    const rules = [
      {
        type: 'msi' as const,
        productCode: '{12345678-1234-1234-1234-123456789ABC}',
      },
    ];

    const result = validateDetectionRules(rules);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================
// convertDeploymentType Tests
// ============================================

describe('convertDeploymentType', () => {
  it('converts full deployment type with all fields', () => {
    const dt: SccmDeploymentType = {
      name: 'Test DT',
      technology: 'MSI',
      installCommand: 'msiexec /i test.msi /qn',
      uninstallCommand: 'msiexec /x test.msi /qn',
      installBehavior: 'InstallForSystem',
      rebootBehavior: 'NoAction',
      maxExecuteTime: 120,
      detectionClauses: [
        {
          type: 'MSI',
          productCode: '{TEST-CODE}',
          propertyType: 'Exists',
        },
      ],
    };

    const result = convertDeploymentType(dt);
    expect(result).toEqual({
      installCommand: 'msiexec /i test.msi /qn',
      uninstallCommand: 'msiexec /x test.msi /qn',
      installBehavior: 'machine',
      rebootBehavior: 'suppress',
      maxRunTimeInMinutes: 120,
      detectionRules: [
        {
          type: 'msi',
          productCode: '{TEST-CODE}',
        },
      ],
    });
  });

  it('uses default max runtime when not specified', () => {
    const dt: SccmDeploymentType = {
      name: 'Test',
      technology: 'Script',
      installCommand: null,
      uninstallCommand: null,
      installBehavior: 'InstallForUser',
      rebootBehavior: 'BasedOnExitCode',
      detectionClauses: [],
    };

    const result = convertDeploymentType(dt);
    expect(result.maxRunTimeInMinutes).toBe(60);
  });
});
