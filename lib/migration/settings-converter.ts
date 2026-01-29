/**
 * SCCM to Intune Settings Converter
 * Converts SCCM detection rules, install behaviors, and commands to Intune format
 */

import type {
  SccmDetectionClause,
  SccmFileDetectionClause,
  SccmRegistryDetectionClause,
  SccmMsiDetectionClause,
  SccmScriptDetectionClause,
  SccmDeploymentType,
  SccmApplication,
} from '@/types/sccm';
import type {
  DetectionRule,
  MsiDetectionRule,
  FileDetectionRule,
  RegistryDetectionRule,
  ScriptDetectionRule,
  DetectionOperator,
  FileDetectionType,
  RegistryDetectionType,
} from '@/types/intune';

/**
 * SCCM to Intune path variable mappings
 */
const PATH_VARIABLE_MAPPINGS: Record<string, string> = {
  '%windir%': '%SystemRoot%',
  '%systemroot%': '%SystemRoot%',
  '%programfiles%': '%ProgramFiles%',
  '%programfiles(x86)%': '%ProgramFiles(x86)%',
  '%commonprogramfiles%': '%CommonProgramFiles%',
  '%commonprogramfiles(x86)%': '%CommonProgramFiles(x86)%',
  '%programdata%': '%ProgramData%',
  '%appdata%': '%AppData%',
  '%localappdata%': '%LocalAppData%',
  '%userprofile%': '%UserProfile%',
  '%systemdrive%': '%SystemDrive%',
  '%temp%': '%Temp%',
  '%tmp%': '%Temp%',
};

/**
 * SCCM to Intune operator mappings
 */
const OPERATOR_MAPPINGS: Record<string, DetectionOperator> = {
  'Equals': 'equal',
  'NotEquals': 'notEqual',
  'GreaterThan': 'greaterThan',
  'LessThan': 'lessThan',
  'GreaterEquals': 'greaterThanOrEqual',
  'LessEquals': 'lessThanOrEqual',
};

/**
 * SCCM registry hive to Intune path prefix
 */
const REGISTRY_HIVE_MAPPINGS: Record<string, string> = {
  'ClassesRoot': 'HKEY_CLASSES_ROOT',
  'CurrentConfig': 'HKEY_CURRENT_CONFIG',
  'CurrentUser': 'HKEY_CURRENT_USER',
  'LocalMachine': 'HKEY_LOCAL_MACHINE',
  'Users': 'HKEY_USERS',
};

/**
 * Convert SCCM path to Intune compatible path
 * Handles environment variable substitution
 */
export function convertSccmPathToIntune(path: string): string {
  let result = path;

  // Convert path variables (case-insensitive)
  for (const [sccmVar, intuneVar] of Object.entries(PATH_VARIABLE_MAPPINGS)) {
    const regex = new RegExp(escapeRegExp(sccmVar), 'gi');
    result = result.replace(regex, intuneVar);
  }

  // Normalize path separators
  result = result.replace(/\//g, '\\');

  // Remove trailing backslash unless it's a drive root
  if (result.length > 3 && result.endsWith('\\')) {
    result = result.slice(0, -1);
  }

  return result;
}

/**
 * Convert SCCM operator to Intune operator
 */
export function convertOperator(sccmOperator: string | undefined): DetectionOperator {
  if (!sccmOperator) {
    return 'equal';
  }
  return OPERATOR_MAPPINGS[sccmOperator] || 'equal';
}

/**
 * Convert SCCM MSI detection clause to Intune MSI detection rule
 */
export function convertMsiDetection(clause: SccmMsiDetectionClause): MsiDetectionRule {
  const rule: MsiDetectionRule = {
    type: 'msi',
    productCode: clause.productCode,
  };

  // Add version check if present (when propertyType is ProductVersion, not just Exists)
  if (clause.expectedValue && clause.propertyType !== 'Exists') {
    rule.productVersionOperator = convertOperator(clause.expressionOperator);
    rule.productVersion = clause.expectedValue;
  }

  return rule;
}

/**
 * Convert SCCM file detection clause to Intune file detection rule
 */
export function convertFileDetection(clause: SccmFileDetectionClause): FileDetectionRule {
  const convertedPath = convertSccmPathToIntune(clause.path);

  // Determine detection type
  let detectionType: FileDetectionType = 'exists';
  if (clause.expressionOperator === 'NotExists') {
    detectionType = 'notExists';
  } else if (clause.propertyType) {
    switch (clause.propertyType) {
      case 'Version':
      case 'ProductVersion':
      case 'FileVersion':
        detectionType = 'version';
        break;
      case 'DateModified':
        detectionType = 'dateModified';
        break;
      case 'DateCreated':
        detectionType = 'dateCreated';
        break;
      case 'Size':
        detectionType = 'sizeInMB';
        break;
    }
  }

  const rule: FileDetectionRule = {
    type: 'file',
    path: convertedPath,
    fileOrFolderName: clause.fileName,
    detectionType,
    check32BitOn64System: !clause.is64Bit,
  };

  // Add operator and value if checking version/size
  if (detectionType !== 'exists' && detectionType !== 'notExists') {
    rule.operator = convertOperator(clause.expressionOperator);
    rule.detectionValue = clause.expectedValue;
  }

  return rule;
}

/**
 * Convert SCCM registry detection clause to Intune registry detection rule
 */
export function convertRegistryDetection(clause: SccmRegistryDetectionClause): RegistryDetectionRule {
  // Build full registry path
  const hivePrefix = REGISTRY_HIVE_MAPPINGS[clause.hive] || 'HKEY_LOCAL_MACHINE';
  const fullKeyPath = `${hivePrefix}\\${clause.keyPath}`;

  // Determine detection type
  let detectionType: RegistryDetectionType = 'exists';
  if (clause.expressionOperator === 'NotExists') {
    detectionType = 'notExists';
  } else if (clause.propertyType === 'Value' && clause.expectedValue) {
    // Try to determine the value type based on the expected value
    if (/^\d+$/.test(clause.expectedValue)) {
      detectionType = 'integer';
    } else if (/^\d+\.\d+(\.\d+)*$/.test(clause.expectedValue)) {
      detectionType = 'version';
    } else {
      detectionType = 'string';
    }
  }

  const rule: RegistryDetectionRule = {
    type: 'registry',
    keyPath: fullKeyPath,
    valueName: clause.valueName || undefined,
    detectionType,
    check32BitOn64System: !clause.is64Bit,
  };

  // Add operator and value if not just existence check
  if (detectionType !== 'exists' && detectionType !== 'notExists') {
    rule.operator = convertOperator(clause.expressionOperator);
    rule.detectionValue = clause.expectedValue;
  }

  return rule;
}

/**
 * Convert SCCM script detection clause to Intune script detection rule
 */
export function convertScriptDetection(clause: SccmScriptDetectionClause): ScriptDetectionRule | null {
  // Only PowerShell scripts are supported in Intune
  if (clause.scriptLanguage !== 'PowerShell') {
    console.warn(`Unsupported script language: ${clause.scriptLanguage}. Only PowerShell is supported.`);
    return null;
  }

  // Wrap SCCM script in Intune-compatible format
  // SCCM scripts return boolean, Intune expects exit code 0 for detected
  const intuneScript = wrapSccmScriptForIntune(clause.scriptContent);

  return {
    type: 'script',
    scriptContent: intuneScript,
    enforceSignatureCheck: false,
    runAs32Bit: clause.runAs32Bit ?? false,
  };
}

/**
 * Wrap SCCM PowerShell detection script for Intune compatibility
 * SCCM: Returns $true/$false
 * Intune: Exit 0 = detected, Exit 1 = not detected
 */
export function wrapSccmScriptForIntune(sccmScript: string): string {
  // If the script already contains exit statements, return as-is
  if (/\bexit\s+\d/i.test(sccmScript)) {
    return sccmScript;
  }

  // Wrap the SCCM script to convert boolean result to exit code
  return `# Converted from SCCM detection script
# Original SCCM script returned $true/$false, Intune expects exit code

try {
    # Original SCCM detection logic
    $result = & {
${sccmScript.split('\n').map(line => '        ' + line).join('\n')}
    }

    # Convert SCCM boolean result to Intune exit code
    if ($result -eq $true) {
        exit 0  # Application detected
    } else {
        exit 1  # Application not detected
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1  # Error = not detected
}`;
}

/**
 * Convert a single SCCM detection clause to Intune detection rule
 */
export function convertDetectionClause(clause: SccmDetectionClause): DetectionRule | null {
  switch (clause.type) {
    case 'MSI':
      return convertMsiDetection(clause as SccmMsiDetectionClause);
    case 'File':
      return convertFileDetection(clause as SccmFileDetectionClause);
    case 'Registry':
      return convertRegistryDetection(clause as SccmRegistryDetectionClause);
    case 'Script':
      return convertScriptDetection(clause as SccmScriptDetectionClause);
    default:
      console.warn(`Unknown SCCM detection clause type: ${(clause as { type: string }).type}`);
      return null;
  }
}

/**
 * Convert all SCCM detection clauses to Intune detection rules
 */
export function convertDetectionRules(clauses: SccmDetectionClause[]): DetectionRule[] {
  const rules: DetectionRule[] = [];

  for (const clause of clauses) {
    const converted = convertDetectionClause(clause);
    if (converted) {
      rules.push(converted);
    }
  }

  return rules;
}

/**
 * Map SCCM install behavior to Intune
 * Returns WingetScope values: 'machine' | 'user'
 */
export function mapInstallBehavior(
  sccmBehavior: string | null | undefined
): 'machine' | 'user' {
  if (!sccmBehavior) {
    return 'machine';
  }

  switch (sccmBehavior) {
    case 'InstallForUser':
      return 'user';
    case 'InstallForSystem':
      return 'machine';
    case 'InstallForSystemIfResourceIsDeviceOtherwiseInstallForUser':
      // Default to machine for hybrid scenarios
      return 'machine';
    default:
      return 'machine';
  }
}

/**
 * Map SCCM reboot behavior to Intune
 */
export function mapRebootBehavior(
  sccmBehavior: string | null | undefined
): 'allow' | 'basedOnReturnCode' | 'suppress' | 'force' {
  if (!sccmBehavior) {
    return 'basedOnReturnCode';
  }

  switch (sccmBehavior) {
    case 'NoAction':
      return 'suppress';
    case 'ProgramReboot':
      return 'allow';
    case 'ForceReboot':
      return 'force';
    case 'BasedOnExitCode':
      return 'basedOnReturnCode';
    default:
      return 'basedOnReturnCode';
  }
}

/**
 * Convert SCCM deployment type to Intune-compatible settings
 */
export function convertDeploymentType(dt: SccmDeploymentType): {
  installCommand: string | null;
  uninstallCommand: string | null;
  installBehavior: 'machine' | 'user';
  rebootBehavior: 'allow' | 'basedOnReturnCode' | 'suppress' | 'force';
  detectionRules: DetectionRule[];
  maxRunTimeInMinutes: number;
} {
  return {
    installCommand: dt.installCommand,
    uninstallCommand: dt.uninstallCommand,
    installBehavior: mapInstallBehavior(dt.installBehavior),
    rebootBehavior: mapRebootBehavior(dt.rebootBehavior),
    detectionRules: convertDetectionRules(dt.detectionClauses),
    maxRunTimeInMinutes: dt.maxExecuteTime || 60,
  };
}

/**
 * Convert full SCCM application settings
 */
export function convertSccmAppSettings(app: SccmApplication): {
  displayName: string;
  publisher: string | null;
  version: string | null;
  installCommand: string | null;
  uninstallCommand: string | null;
  installBehavior: 'machine' | 'user';
  rebootBehavior: 'allow' | 'basedOnReturnCode' | 'suppress' | 'force';
  detectionRules: DetectionRule[];
  maxRunTimeInMinutes: number;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Get primary deployment type
  const primaryDT = app.deploymentTypes
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))[0];

  if (!primaryDT) {
    return {
      displayName: app.localizedDisplayName,
      publisher: app.manufacturer,
      version: app.softwareVersion,
      installCommand: null,
      uninstallCommand: null,
      installBehavior: 'machine',
      rebootBehavior: 'basedOnReturnCode',
      detectionRules: [],
      maxRunTimeInMinutes: 60,
      warnings: ['No deployment type found in SCCM application'],
    };
  }

  // Check for unsupported technologies
  if (primaryDT.technology === 'AppV') {
    warnings.push('App-V packages are not supported in Intune. Consider repackaging as Win32.');
  }

  // Convert detection rules
  const detectionRules = convertDetectionRules(primaryDT.detectionClauses);

  if (detectionRules.length === 0 && primaryDT.detectionClauses.length > 0) {
    warnings.push('Some detection rules could not be converted. Manual review recommended.');
  }

  // Check for script detection conversions
  const scriptClauses = primaryDT.detectionClauses.filter(c => c.type === 'Script');
  if (scriptClauses.length > 0) {
    const nonPowerShell = scriptClauses.filter(
      c => (c as SccmScriptDetectionClause).scriptLanguage !== 'PowerShell'
    );
    if (nonPowerShell.length > 0) {
      warnings.push('VBScript/JScript detection scripts must be converted to PowerShell manually.');
    }
  }

  return {
    displayName: app.localizedDisplayName,
    publisher: app.manufacturer,
    version: app.softwareVersion,
    installCommand: primaryDT.installCommand,
    uninstallCommand: primaryDT.uninstallCommand,
    installBehavior: mapInstallBehavior(primaryDT.installBehavior),
    rebootBehavior: mapRebootBehavior(primaryDT.rebootBehavior),
    detectionRules,
    maxRunTimeInMinutes: primaryDT.maxExecuteTime || 60,
    warnings,
  };
}

/**
 * Validate converted detection rules
 */
export function validateDetectionRules(rules: DetectionRule[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rules.length === 0) {
    errors.push('At least one detection rule is required');
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const prefix = `Rule ${i + 1}`;

    switch (rule.type) {
      case 'msi':
        if (!rule.productCode) {
          errors.push(`${prefix}: MSI product code is required`);
        } else if (!/^\{[0-9A-Fa-f-]{36}\}$/.test(rule.productCode)) {
          warnings.push(`${prefix}: MSI product code format may be invalid`);
        }
        break;

      case 'file':
        if (!rule.path) {
          errors.push(`${prefix}: File path is required`);
        }
        if (!rule.fileOrFolderName) {
          errors.push(`${prefix}: File or folder name is required`);
        }
        break;

      case 'registry':
        if (!rule.keyPath) {
          errors.push(`${prefix}: Registry key path is required`);
        }
        break;

      case 'script':
        if (!rule.scriptContent || rule.scriptContent.trim().length === 0) {
          errors.push(`${prefix}: Script content is required`);
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Helper: Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
