/**
 * Supabase Database Types
 * Generated types for database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          microsoft_access_token: string | null;
          microsoft_refresh_token: string | null;
          token_expires_at: string | null;
          intune_tenant_id: string | null;
          tenant_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          microsoft_access_token?: string | null;
          microsoft_refresh_token?: string | null;
          token_expires_at?: string | null;
          intune_tenant_id?: string | null;
          tenant_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          microsoft_access_token?: string | null;
          microsoft_refresh_token?: string | null;
          token_expires_at?: string | null;
          intune_tenant_id?: string | null;
          tenant_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_metadata: {
        Row: {
          id: string;
          winget_id: string;
          display_name: string | null;
          publisher: string | null;
          category: string | null;
          detection_rules: Json | null;
          detection_script: string | null;
          install_command_override: string | null;
          uninstall_command_override: string | null;
          install_behavior: string;
          tested_version: string | null;
          known_issues: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          winget_id: string;
          display_name?: string | null;
          publisher?: string | null;
          category?: string | null;
          detection_rules?: Json | null;
          detection_script?: string | null;
          install_command_override?: string | null;
          uninstall_command_override?: string | null;
          install_behavior?: string;
          tested_version?: string | null;
          known_issues?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          winget_id?: string;
          display_name?: string | null;
          publisher?: string | null;
          category?: string | null;
          detection_rules?: Json | null;
          detection_script?: string | null;
          install_command_override?: string | null;
          uninstall_command_override?: string | null;
          install_behavior?: string;
          tested_version?: string | null;
          known_issues?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staged_packages: {
        Row: {
          id: string;
          user_id: string;
          winget_id: string;
          display_name: string;
          publisher: string;
          version: string;
          architecture: string | null;
          install_scope: string | null;
          installer_type: string | null;
          installer_url: string;
          installer_sha256: string;
          intunewin_url: string | null;
          intunewin_size_bytes: number | null;
          detection_rules: Json | null;
          install_command: string;
          uninstall_command: string;
          status: string;
          error_message: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          winget_id: string;
          display_name: string;
          publisher: string;
          version: string;
          architecture?: string | null;
          install_scope?: string | null;
          installer_type?: string | null;
          installer_url: string;
          installer_sha256: string;
          intunewin_url?: string | null;
          intunewin_size_bytes?: number | null;
          detection_rules?: Json | null;
          install_command: string;
          uninstall_command: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          winget_id?: string;
          display_name?: string;
          publisher?: string;
          version?: string;
          architecture?: string | null;
          install_scope?: string | null;
          installer_type?: string | null;
          installer_url?: string;
          installer_sha256?: string;
          intunewin_url?: string | null;
          intunewin_size_bytes?: number | null;
          detection_rules?: Json | null;
          install_command?: string;
          uninstall_command?: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      upload_jobs: {
        Row: {
          id: string;
          user_id: string;
          staged_package_id: string;
          intune_app_id: string | null;
          intune_app_url: string | null;
          assigned_groups: Json | null;
          status: string;
          progress_percent: number;
          current_step: string | null;
          error_message: string | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          staged_package_id: string;
          intune_app_id?: string | null;
          intune_app_url?: string | null;
          assigned_groups?: Json | null;
          status?: string;
          progress_percent?: number;
          current_step?: string | null;
          error_message?: string | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          staged_package_id?: string;
          intune_app_id?: string | null;
          intune_app_url?: string | null;
          assigned_groups?: Json | null;
          status?: string;
          progress_percent?: number;
          current_step?: string | null;
          error_message?: string | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      packaging_jobs: {
        Row: {
          id: string;
          user_id: string;
          user_email: string | null;
          tenant_id: string | null;
          winget_id: string;
          version: string;
          display_name: string;
          publisher: string | null;
          architecture: string | null;
          installer_type: string;
          installer_url: string;
          installer_sha256: string | null;
          install_command: string | null;
          uninstall_command: string | null;
          install_scope: string | null;
          silent_switches: string | null;
          detection_rules: Json | null;
          package_config: Json | null;
          github_run_id: string | null;
          github_run_url: string | null;
          intunewin_url: string | null;
          intunewin_size_bytes: number | null;
          unencrypted_content_size: number | null;
          encryption_info: Json | null;
          intune_app_id: string | null;
          intune_app_url: string | null;
          status: string;
          status_message: string | null;
          progress_percent: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
          packaging_started_at: string | null;
          packaging_completed_at: string | null;
          upload_started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          is_auto_update: boolean;
          auto_update_policy_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email?: string | null;
          tenant_id?: string | null;
          winget_id: string;
          version: string;
          display_name: string;
          publisher?: string | null;
          architecture?: string | null;
          installer_type: string;
          installer_url: string;
          installer_sha256?: string | null;
          install_command?: string | null;
          uninstall_command?: string | null;
          install_scope?: string | null;
          silent_switches?: string | null;
          detection_rules?: Json | null;
          package_config?: Json | null;
          github_run_id?: string | null;
          github_run_url?: string | null;
          intunewin_url?: string | null;
          intunewin_size_bytes?: number | null;
          unencrypted_content_size?: number | null;
          encryption_info?: Json | null;
          intune_app_id?: string | null;
          intune_app_url?: string | null;
          status?: string;
          status_message?: string | null;
          progress_percent?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          packaging_started_at?: string | null;
          packaging_completed_at?: string | null;
          upload_started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          is_auto_update?: boolean;
          auto_update_policy_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_email?: string | null;
          tenant_id?: string | null;
          winget_id?: string;
          version?: string;
          display_name?: string;
          publisher?: string | null;
          architecture?: string | null;
          installer_type?: string;
          installer_url?: string;
          installer_sha256?: string | null;
          install_command?: string | null;
          uninstall_command?: string | null;
          install_scope?: string | null;
          silent_switches?: string | null;
          detection_rules?: Json | null;
          package_config?: Json | null;
          github_run_id?: string | null;
          github_run_url?: string | null;
          intunewin_url?: string | null;
          intunewin_size_bytes?: number | null;
          unencrypted_content_size?: number | null;
          encryption_info?: Json | null;
          intune_app_id?: string | null;
          intune_app_url?: string | null;
          status?: string;
          status_message?: string | null;
          progress_percent?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          packaging_started_at?: string | null;
          packaging_completed_at?: string | null;
          upload_started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          is_auto_update?: boolean;
          auto_update_policy_id?: string | null;
        };
      };
      upload_history: {
        Row: {
          id: string;
          packaging_job_id: string | null;
          user_id: string;
          winget_id: string;
          version: string;
          display_name: string;
          publisher: string | null;
          intune_app_id: string;
          intune_app_url: string | null;
          intune_tenant_id: string | null;
          deployed_at: string;
        };
        Insert: {
          id?: string;
          packaging_job_id?: string | null;
          user_id: string;
          winget_id: string;
          version: string;
          display_name: string;
          publisher?: string | null;
          intune_app_id: string;
          intune_app_url?: string | null;
          intune_tenant_id?: string | null;
          deployed_at?: string;
        };
        Update: {
          id?: string;
          packaging_job_id?: string | null;
          user_id?: string;
          winget_id?: string;
          version?: string;
          display_name?: string;
          publisher?: string | null;
          intune_app_id?: string;
          intune_app_url?: string | null;
          intune_tenant_id?: string | null;
          deployed_at?: string;
        };
      };
      tenant_consent: {
        Row: {
          id: string;
          tenant_id: string;
          tenant_name: string | null;
          consented_by_user_id: string;
          consented_by_email: string | null;
          consent_granted_at: string;
          service_principal_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          tenant_name?: string | null;
          consented_by_user_id: string;
          consented_by_email?: string | null;
          consent_granted_at?: string;
          service_principal_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          tenant_name?: string | null;
          consented_by_user_id?: string;
          consented_by_email?: string | null;
          consent_granted_at?: string;
          service_principal_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      msp_organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          primary_tenant_id: string;
          created_by_user_id: string;
          created_by_email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          primary_tenant_id: string;
          created_by_user_id: string;
          created_by_email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          primary_tenant_id?: string;
          created_by_user_id?: string;
          created_by_email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      msp_managed_tenants: {
        Row: {
          id: string;
          msp_organization_id: string;
          tenant_id: string | null;
          tenant_name: string | null;
          display_name: string;
          consent_status: 'pending' | 'granted' | 'revoked';
          consent_granted_at: string | null;
          consented_by_email: string | null;
          added_by_user_id: string;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          msp_organization_id: string;
          tenant_id?: string | null;
          tenant_name?: string | null;
          display_name: string;
          consent_status?: 'pending' | 'granted' | 'revoked';
          consent_granted_at?: string | null;
          consented_by_email?: string | null;
          added_by_user_id: string;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          msp_organization_id?: string;
          tenant_id?: string | null;
          tenant_name?: string | null;
          display_name?: string;
          consent_status?: 'pending' | 'granted' | 'revoked';
          consent_granted_at?: string | null;
          consented_by_email?: string | null;
          added_by_user_id?: string;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      msp_user_memberships: {
        Row: {
          id: string;
          msp_organization_id: string;
          user_id: string;
          user_email: string;
          user_name: string | null;
          user_tenant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          msp_organization_id: string;
          user_id: string;
          user_email: string;
          user_name?: string | null;
          user_tenant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          msp_organization_id?: string;
          user_id?: string;
          user_email?: string;
          user_name?: string | null;
          user_tenant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_enabled: boolean;
          email_frequency: 'immediate' | 'daily' | 'weekly';
          email_address: string | null;
          notify_critical_only: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_enabled?: boolean;
          email_frequency?: 'immediate' | 'daily' | 'weekly';
          email_address?: string | null;
          notify_critical_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_enabled?: boolean;
          email_frequency?: 'immediate' | 'daily' | 'weekly';
          email_address?: string | null;
          notify_critical_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      webhook_configurations: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          webhook_type: 'slack' | 'teams' | 'discord' | 'custom';
          secret: string | null;
          headers: Record<string, string>;
          is_enabled: boolean;
          failure_count: number;
          last_failure_at: string | null;
          last_success_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          url: string;
          webhook_type: 'slack' | 'teams' | 'discord' | 'custom';
          secret?: string | null;
          headers?: Record<string, string>;
          is_enabled?: boolean;
          failure_count?: number;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          url?: string;
          webhook_type?: 'slack' | 'teams' | 'discord' | 'custom';
          secret?: string | null;
          headers?: Record<string, string>;
          is_enabled?: boolean;
          failure_count?: number;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_history: {
        Row: {
          id: string;
          user_id: string;
          channel: 'email' | 'webhook';
          webhook_id: string | null;
          payload: Record<string, unknown>;
          status: 'pending' | 'sent' | 'failed';
          error_message: string | null;
          apps_notified: number;
          created_at: string;
          sent_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel: 'email' | 'webhook';
          webhook_id?: string | null;
          payload: Record<string, unknown>;
          status?: 'pending' | 'sent' | 'failed';
          error_message?: string | null;
          apps_notified?: number;
          created_at?: string;
          sent_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel?: 'email' | 'webhook';
          webhook_id?: string | null;
          payload?: Record<string, unknown>;
          status?: 'pending' | 'sent' | 'failed';
          error_message?: string | null;
          apps_notified?: number;
          created_at?: string;
          sent_at?: string | null;
          updated_at?: string;
        };
      };
      update_check_results: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          winget_id: string;
          intune_app_id: string;
          display_name: string;
          current_version: string;
          latest_version: string;
          is_critical: boolean;
          notified_at: string | null;
          dismissed_at: string | null;
          detected_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          winget_id: string;
          intune_app_id: string;
          display_name: string;
          current_version: string;
          latest_version: string;
          is_critical?: boolean;
          notified_at?: string | null;
          dismissed_at?: string | null;
          detected_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          winget_id?: string;
          intune_app_id?: string;
          display_name?: string;
          current_version?: string;
          latest_version?: string;
          is_critical?: boolean;
          notified_at?: string | null;
          dismissed_at?: string | null;
          detected_at?: string;
          updated_at?: string;
        };
      };
      app_update_policies: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          winget_id: string;
          policy_type: 'auto_update' | 'notify' | 'ignore' | 'pin_version';
          pinned_version: string | null;
          deployment_config: Json | null;
          original_upload_history_id: string | null;
          last_auto_update_at: string | null;
          last_auto_update_version: string | null;
          is_enabled: boolean;
          consecutive_failures: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          winget_id: string;
          policy_type?: 'auto_update' | 'notify' | 'ignore' | 'pin_version';
          pinned_version?: string | null;
          deployment_config?: Json | null;
          original_upload_history_id?: string | null;
          last_auto_update_at?: string | null;
          last_auto_update_version?: string | null;
          is_enabled?: boolean;
          consecutive_failures?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          winget_id?: string;
          policy_type?: 'auto_update' | 'notify' | 'ignore' | 'pin_version';
          pinned_version?: string | null;
          deployment_config?: Json | null;
          original_upload_history_id?: string | null;
          last_auto_update_at?: string | null;
          last_auto_update_version?: string | null;
          is_enabled?: boolean;
          consecutive_failures?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      auto_update_history: {
        Row: {
          id: string;
          policy_id: string;
          packaging_job_id: string | null;
          from_version: string;
          to_version: string;
          update_type: 'patch' | 'minor' | 'major';
          status: 'pending' | 'packaging' | 'deploying' | 'completed' | 'failed' | 'cancelled';
          error_message: string | null;
          triggered_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          policy_id: string;
          packaging_job_id?: string | null;
          from_version: string;
          to_version: string;
          update_type: 'patch' | 'minor' | 'major';
          status?: 'pending' | 'packaging' | 'deploying' | 'completed' | 'failed' | 'cancelled';
          error_message?: string | null;
          triggered_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          policy_id?: string;
          packaging_job_id?: string | null;
          from_version?: string;
          to_version?: string;
          update_type?: 'patch' | 'minor' | 'major';
          status?: 'pending' | 'packaging' | 'deploying' | 'completed' | 'failed' | 'cancelled';
          error_message?: string | null;
          triggered_at?: string;
          completed_at?: string | null;
        };
      };
    };
    Views: {
      msp_organization_stats: {
        Row: {
          organization_id: string;
          organization_name: string;
          slug: string;
          is_active: boolean;
          total_tenants: number;
          active_tenants: number;
          pending_tenants: number;
          total_members: number;
          total_jobs: number;
          completed_jobs: number;
          created_at: string;
          updated_at: string;
        };
      };
      notification_stats: {
        Row: {
          user_id: string;
          email_enabled: boolean;
          email_frequency: 'immediate' | 'daily' | 'weekly';
          notify_critical_only: boolean;
          active_webhooks: number;
          pending_updates: number;
          pending_critical_updates: number;
          notifications_sent_30d: number;
          created_at: string;
          updated_at: string;
        };
      };
      update_policy_stats: {
        Row: {
          user_id: string;
          tenant_id: string;
          total_policies: number;
          auto_update_enabled: number;
          notify_only: number;
          ignored: number;
          pinned: number;
          successful_updates_30d: number;
          failed_updates_30d: number;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
