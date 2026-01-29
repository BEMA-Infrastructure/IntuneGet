/**
 * SCCM (System Center Configuration Manager) Migration Types
 * TypeScript interfaces for SCCM application import and migration to Intune
 */

import type { DetectionRule } from './intune';
import type { MatchStatus, PartialMatch } from './unmanaged';

// ============================================
// SCCM Detection Clause Types
// ============================================

/**
 * Base interface for all SCCM detection clauses
 */
export interface SccmDetectionClauseBase {
  settingLogicalName?: string;
  dataType?: 'String' | 'Integer' | 'Version' | 'Boolean' | 'DateTime';
}

/**
 * File-based detection clause from SCCM
 */
export interface SccmFileDetectionClause extends SccmDetectionClauseBase {
  type: 'File';
  path: string;
  fileName: string;
  is64Bit?: boolean;
  propertyType?: 'DateModified' | 'DateCreated' | 'Version' | 'Size' | 'ProductVersion' | 'FileVersion';
  expressionOperator?: 'Equals' | 'NotEquals' | 'GreaterThan' | 'LessThan' | 'Between' | 'GreaterEquals' | 'LessEquals' | 'BeginsWith' | 'NotBeginsWith' | 'EndsWith' | 'NotEndsWith' | 'Contains' | 'NotContains' | 'Exists' | 'NotExists';
  expectedValue?: string;
  value2?: string; // For 'Between' operator
}

/**
 * Registry-based detection clause from SCCM
 */
export interface SccmRegistryDetectionClause extends SccmDetectionClauseBase {
  type: 'Registry';
  hive: 'ClassesRoot' | 'CurrentConfig' | 'CurrentUser' | 'LocalMachine' | 'Users';
  keyPath: string;
  valueName?: string;
  is64Bit?: boolean;
  propertyType?: 'Value' | 'Exists';
  expressionOperator?: 'Equals' | 'NotEquals' | 'GreaterThan' | 'LessThan' | 'Between' | 'GreaterEquals' | 'LessEquals' | 'BeginsWith' | 'NotBeginsWith' | 'EndsWith' | 'NotEndsWith' | 'Contains' | 'NotContains' | 'Exists' | 'NotExists';
  expectedValue?: string;
}

/**
 * MSI Product Code detection clause from SCCM
 */
export interface SccmMsiDetectionClause extends SccmDetectionClauseBase {
  type: 'MSI';
  productCode: string;
  propertyType?: 'ProductVersion' | 'Exists';
  expressionOperator?: 'Equals' | 'NotEquals' | 'GreaterThan' | 'LessThan' | 'GreaterEquals' | 'LessEquals';
  expectedValue?: string;
}

/**
 * Script-based detection clause from SCCM
 */
export interface SccmScriptDetectionClause extends SccmDetectionClauseBase {
  type: 'Script';
  scriptLanguage: 'PowerShell' | 'VBScript' | 'JScript';
  scriptContent: string;
  runAs32Bit?: boolean;
}

/**
 * Union type for all SCCM detection clauses
 */
export type SccmDetectionClause =
  | SccmFileDetectionClause
  | SccmRegistryDetectionClause
  | SccmMsiDetectionClause
  | SccmScriptDetectionClause;

// ============================================
// SCCM Deployment Type
// ============================================

/**
 * SCCM deployment technology type
 */
export type SccmDeploymentTechnology =
  | 'MSI'           // Windows Installer
  | 'Script'        // Script Installer
  | 'MSIX'          // MSIX/AppX package
  | 'AppV'          // App-V package (not supported in Intune)
  | 'Deeplink'      // Web/Store link
  | 'WinGetApp'     // WinGet application
  | 'MacOS'         // macOS app
  | 'Unknown';

/**
 * SCCM deployment type (how the app is installed)
 */
export interface SccmDeploymentType {
  name: string;
  technology: SccmDeploymentTechnology;
  priority?: number;

  // Installation
  installCommand: string | null;
  uninstallCommand: string | null;
  repairCommand?: string | null;

  // Content
  contentLocation?: string;
  contentId?: string;

  // Detection
  detectionClauses: SccmDetectionClause[];

  // Requirements
  requirementsRules?: SccmRequirement[];

  // Behavior
  installBehavior: 'InstallForUser' | 'InstallForSystem' | 'InstallForSystemIfResourceIsDeviceOtherwiseInstallForUser';
  logonRequirement?: 'OnlyWhenNoUserLoggedOn' | 'OnlyWhenUserLoggedOn' | 'WhereUserLoggedOnOrNot' | 'WhetherOrNotUserLoggedOn';
  requireUserInteraction?: boolean;
  maxExecuteTime?: number; // In minutes
  estimatedExecuteTime?: number; // In minutes

  // Reboot behavior
  rebootBehavior: 'NoAction' | 'ProgramReboot' | 'ForceReboot' | 'BasedOnExitCode';
  allowUserInteraction?: boolean;

  // Return codes
  returnCodes?: SccmReturnCode[];
}

/**
 * SCCM requirement rule
 */
export interface SccmRequirement {
  type: 'OperatingSystem' | 'Memory' | 'DiskSpace' | 'ProcessorSpeed' | 'Language' | 'Custom';
  operator?: string;
  value?: string;
  expressionOperator?: string;
  value2?: string;
}

/**
 * SCCM return code definition
 */
export interface SccmReturnCode {
  returnCode: number;
  name: string;
  rebootRequired: boolean;
  success: boolean;
}

// ============================================
// SCCM Application
// ============================================

/**
 * Core SCCM application interface
 */
export interface SccmApplication {
  // Identifiers
  ci_id: string;  // Configuration Item ID
  modelId?: string;
  modelName?: string;

  // Display information
  localizedDisplayName: string;
  localizedDescription?: string;
  manufacturer: string | null;
  softwareVersion: string | null;

  // Deployment types
  deploymentTypes: SccmDeploymentType[];

  // Categories and tags
  adminCategories: string[];
  userCategories?: string[];
  keywords?: string[];

  // Deployment info
  isDeployed: boolean;
  isEnabled?: boolean;
  isExpired?: boolean;
  isSuperseded?: boolean;
  isSuperseding?: boolean;
  deploymentCount?: number;

  // Distribution
  distributionPointGroupCount?: number;
  hasContentFiles?: boolean;
  contentSize?: number; // In bytes

  // Dependencies and supersedence
  dependencies?: SccmDependency[];
  supersededApps?: string[];
  supersedingApps?: string[];

  // Metadata
  createdBy?: string;
  dateCreated?: string;
  dateLastModified?: string;
  packageId?: string;

  // Icon
  iconBase64?: string;
  iconMimeType?: string;
}

/**
 * SCCM application dependency
 */
export interface SccmDependency {
  dependencyGroupName: string;
  dependentApps: Array<{
    ci_id: string;
    displayName: string;
    autoInstall: boolean;
  }>;
}

// ============================================
// Import Format
// ============================================

/**
 * SCCM export source type
 */
export type SccmExportSource = 'csv' | 'powershell' | 'json';

/**
 * SCCM import file format
 */
export interface SccmImportFormat {
  version: '1.0' | '1.1';
  exportDate: string;
  exportedBy?: string;
  source: SccmExportSource;
  siteCode?: string;
  siteName?: string;
  applications: SccmApplication[];

  // Summary statistics from export
  summary?: {
    totalApps: number;
    deployedApps: number;
    supersededApps: number;
    expiredApps: number;
  };
}

/**
 * CSV import row (flattened structure)
 */
export interface SccmCsvRow {
  CI_ID: string;
  LocalizedDisplayName: string;
  Manufacturer?: string;
  SoftwareVersion?: string;
  IsDeployed?: string; // 'True' or 'False'
  DeploymentCount?: string;
  AdminCategories?: string; // Comma-separated
  InstallCommand?: string;
  UninstallCommand?: string;
  InstallBehavior?: string;
  DetectionType?: string;
  DetectionValue?: string;
  Technology?: string;
  ContentLocation?: string;
  ContentSize?: string;
  DateCreated?: string;
  DateLastModified?: string;
  CreatedBy?: string;
  IsSuperseded?: string;
  IsExpired?: string;
  PackageID?: string;
}

// ============================================
// Migration Status
// ============================================

/**
 * SCCM app match status (extends base MatchStatus with SCCM-specific states)
 */
export type SccmMatchStatus = MatchStatus | 'manual' | 'excluded' | 'skipped';

/**
 * SCCM app migration status
 */
export type SccmMigrationStatus =
  | 'pending'     // Not yet migrated
  | 'queued'      // In migration queue
  | 'migrating'   // Currently being migrated
  | 'completed'   // Successfully migrated
  | 'failed'      // Migration failed
  | 'skipped';    // User chose to skip

/**
 * SCCM migration (represents a batch of apps being migrated from SCCM to Intune)
 */
export interface SccmMigration {
  id: string;
  userId: string;
  tenantId: string;

  // Migration info
  name: string;
  description?: string;

  // Source info
  sourceType: SccmExportSource;
  sourceSiteCode?: string;
  sourceSiteName?: string;
  importedFileName?: string;

  // Statistics
  totalApps: number;
  matchedApps: number;
  partialMatchApps: number;
  unmatchedApps: number;
  excludedApps: number;
  migratedApps: number;
  failedApps: number;

  // Status
  status: 'importing' | 'matching' | 'ready' | 'migrating' | 'completed' | 'error';
  errorMessage?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastMigrationAt?: string;
}

/** @deprecated Use SccmMigration instead */
export type SccmMigrationProject = SccmMigration;

/**
 * SCCM app in migration
 */
export interface SccmAppRecord {
  id: string;
  migrationId: string;
  userId: string;
  tenantId: string;

  // SCCM app info
  sccmCiId: string;
  displayName: string;
  manufacturer: string | null;
  version: string | null;
  technology: SccmDeploymentTechnology;
  isDeployed: boolean;
  deploymentCount: number;

  // Original SCCM data
  sccmAppData: SccmApplication;
  sccmDetectionRules: SccmDetectionClause[];
  sccmInstallCommand: string | null;
  sccmUninstallCommand: string | null;
  sccmInstallBehavior: string | null;

  // Matching
  matchStatus: SccmMatchStatus;
  matchConfidence: number | null;
  matchedWingetId: string | null;
  matchedWingetName: string | null;
  partialMatches: PartialMatch[];
  matchedAt?: string;
  matchedBy?: 'auto' | 'manual' | 'mapping';

  // Migration settings
  preserveDetectionRules: boolean;
  preserveInstallCommands: boolean;
  useWingetDefaults: boolean;
  customSettings?: SccmMigrationSettings;

  // Converted settings (post-processing)
  convertedDetectionRules?: DetectionRule[];
  convertedInstallBehavior?: 'machine' | 'user';

  // Migration status
  migrationStatus: SccmMigrationStatus;
  migrationError?: string;
  intuneAppId?: string;
  migratedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Custom migration settings per app
 */
export interface SccmMigrationSettings {
  overrideInstallCommand?: string;
  overrideUninstallCommand?: string;
  overrideInstallBehavior?: 'machine' | 'user';
  customDetectionRules?: DetectionRule[];
  skipReasons?: string[];
  notes?: string;
}

// ============================================
// SCCM to WinGet Mapping
// ============================================

/**
 * Custom SCCM to WinGet mapping (user-created or community)
 */
export interface SccmWingetMapping {
  id: string;

  // SCCM identifiers (multiple to match different formats)
  sccmDisplayName: string;
  sccmDisplayNameNormalized: string;
  sccmManufacturer?: string;
  sccmCiId?: string;
  sccmProductCode?: string; // MSI product code

  // WinGet target
  wingetPackageId: string;
  wingetPackageName?: string;

  // Metadata
  confidence: number;
  isVerified: boolean;
  usageCount: number;

  // Scope
  createdBy: string | null;
  tenantId: string | null; // null = global mapping

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Migration History & Audit
// ============================================

/**
 * Migration history action type
 */
export type SccmMigrationAction =
  | 'migration_created'
  | 'apps_imported'
  | 'matching_started'
  | 'matching_completed'
  | 'app_matched_auto'
  | 'app_matched_manual'
  | 'app_excluded'
  | 'app_unexcluded'
  | 'migration_started'
  | 'migration_completed'
  | 'migration_failed'
  | 'settings_updated'
  | 'migration_deleted';

/**
 * Migration history entry
 */
export interface SccmMigrationHistory {
  id: string;
  migrationId: string;
  userId: string;
  tenantId: string;

  // Action details
  action: SccmMigrationAction;
  appId?: string;
  appName?: string;

  // Data snapshots
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;

  // Results
  success: boolean;
  errorMessage?: string;
  affectedCount?: number;

  // Timestamp
  createdAt: string;
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * Import apps request
 */
export interface SccmImportRequest {
  migrationName: string;
  migrationDescription?: string;
  fileContent: string; // Base64 encoded or raw JSON/CSV
  fileType: 'csv' | 'json';
  fileName: string;
}

/**
 * Import apps response
 */
export interface SccmImportResponse {
  success: boolean;
  migrationId?: string;
  totalApps?: number;
  validApps?: number;
  skippedApps?: number;
  errors?: Array<{
    row?: number;
    ciId?: string;
    message: string;
  }>;
}

/**
 * Match apps request
 */
export interface SccmMatchRequest {
  migrationId: string;
  appIds?: string[]; // If not provided, match all pending apps
  forceRematch?: boolean;
}

/**
 * Match progress update
 */
export interface SccmMatchProgress {
  migrationId: string;
  total: number;
  processed: number;
  matched: number;
  partial: number;
  unmatched: number;
  currentApp?: string;
  isComplete: boolean;
}

/**
 * Migration preview request
 */
export interface SccmMigrationPreviewRequest {
  migrationId: string;
  appIds: string[];
  options: SccmMigrationOptions;
}

/**
 * Migration options
 */
export interface SccmMigrationOptions {
  preserveDetection: boolean;
  preserveInstallCommands: boolean;
  useWingetDefaults: boolean;
  batchSize: number;
  dryRun: boolean;
}

/**
 * Migration preview item
 */
export interface SccmMigrationPreviewItem {
  appId: string;
  sccmName: string;
  wingetId: string;
  wingetName: string;

  // What will be migrated
  detectionRules: DetectionRule[];
  installCommand: string;
  uninstallCommand: string;
  installBehavior: 'machine' | 'user';

  // Settings source
  detectionSource: 'sccm' | 'winget' | 'hybrid';
  commandSource: 'sccm' | 'winget';

  // Warnings
  warnings: string[];

  // Can migrate?
  canMigrate: boolean;
  blockingReasons?: string[];
}

/**
 * Migration preview response
 */
export interface SccmMigrationPreviewResponse {
  success: boolean;
  migrationId: string;
  totalApps: number;
  migratable: number;
  blocked: number;
  items: SccmMigrationPreviewItem[];
  warnings: string[];
}

/**
 * Migration execute request
 */
export interface SccmMigrationExecuteRequest {
  migrationId: string;
  appIds: string[];
  options: SccmMigrationOptions;
}

/**
 * Migration result
 */
export interface SccmMigrationResult {
  success: boolean;
  migrationId: string;
  totalAttempted: number;
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{
    appId: string;
    sccmName: string;
    success: boolean;
    intuneAppId?: string;
    error?: string;
  }>;
}

/**
 * Migration stats for dashboard
 */
export interface SccmMigrationStats {
  id: string;
  name: string;
  status: SccmMigration['status'];
  totalApps: number;
  matchedApps: number;
  partialMatchApps: number;
  unmatchedApps: number;
  migratedApps: number;
  failedApps: number;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use SccmMigrationStats instead */
export type SccmProjectStats = SccmMigrationStats;

/**
 * Dashboard stats aggregate
 */
export interface SccmDashboardStats {
  totalMigrations: number;
  totalApps: number;
  matchedApps: number;
  migratedApps: number;
  pendingMigration: number;
  failedMigration: number;
  recentMigrations: SccmMigrationStats[];
}
