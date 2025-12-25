// Database types for Supabase
// These types match the schema defined in supabase/schema.sql

export type SubscriptionTier = 'anonymous' | 'free' | 'starter' | 'pro';

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
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          subscription: SubscriptionTier;
          pending_plan: SubscriptionTier | null;
          reset_token: string | null;
          reset_token_expires: string | null;
          profile_image: string | null;
          oauth_provider: string | null;
          github_access_token: string | null;
          created_at: string;
          last_login_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          password_hash: string;
          subscription?: SubscriptionTier;
          pending_plan?: SubscriptionTier | null;
          reset_token?: string | null;
          reset_token_expires?: string | null;
          profile_image?: string | null;
          oauth_provider?: string | null;
          github_access_token?: string | null;
          created_at?: string;
          last_login_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          password_hash?: string;
          subscription?: SubscriptionTier;
          pending_plan?: SubscriptionTier | null;
          reset_token?: string | null;
          reset_token_expires?: string | null;
          profile_image?: string | null;
          oauth_provider?: string | null;
          github_access_token?: string | null;
          created_at?: string;
          last_login_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      scan_history: {
        Row: {
          id: string;
          user_id: string;
          repo_name: string;
          repo_url: string;
          scanned_at: string;
          security_score: number;
          total_findings: number;
          critical_count: number;
          high_count: number;
          medium_count: number;
          low_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          repo_name: string;
          repo_url: string;
          scanned_at?: string;
          security_score: number;
          total_findings?: number;
          critical_count?: number;
          high_count?: number;
          medium_count?: number;
          low_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          repo_name?: string;
          repo_url?: string;
          scanned_at?: string;
          security_score?: number;
          total_findings?: number;
          critical_count?: number;
          high_count?: number;
          medium_count?: number;
          low_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scan_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_scan_counts: {
        Row: {
          id: string;
          user_id: string;
          scan_date: string;
          count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          scan_date?: string;
          count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          scan_date?: string;
          count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "daily_scan_counts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: SubscriptionTier;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type ScanHistory = Database['public']['Tables']['scan_history']['Row'];
export type ScanHistoryInsert = Database['public']['Tables']['scan_history']['Insert'];

export type DailyScanCount = Database['public']['Tables']['daily_scan_counts']['Row'];
