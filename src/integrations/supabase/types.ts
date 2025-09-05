export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      account: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      api_configs: {
        Row: {
          auth_config: Json | null
          auth_type: string | null
          body: string | null
          created_at: string
          encrypted_auth_config: string | null
          encrypted_headers: string | null
          headers: Json | null
          id: string
          is_active: boolean | null
          method: string
          name: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: string | null
          body?: string | null
          created_at?: string
          encrypted_auth_config?: string | null
          encrypted_headers?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: string
          name: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          auth_config?: Json | null
          auth_type?: string | null
          body?: string | null
          created_at?: string
          encrypted_auth_config?: string | null
          encrypted_headers?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: string
          name?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      api_executions: {
        Row: {
          api_config_id: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          response_body: string | null
          response_code: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          api_config_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          response_body?: string | null
          response_code?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          api_config_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          response_body?: string | null
          response_code?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_executions_api_config_id_fkey"
            columns: ["api_config_id"]
            isOneToOne: false
            referencedRelation: "api_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_executions_api_config_id_fkey"
            columns: ["api_config_id"]
            isOneToOne: false
            referencedRelation: "api_configs_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversation: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          project_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversation_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversation_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_last_activity"
            referencedColumns: ["project_id"]
          },
        ]
      }
      chat_message: {
        Row: {
          account_id: string
          content: string
          conversation_id: string
          created_at: string | null
          id: number
          meta: Json | null
          role: string
        }
        Insert: {
          account_id: string
          content: string
          conversation_id: string
          created_at?: string | null
          id?: number
          meta?: Json | null
          role: string
        }
        Update: {
          account_id?: string
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: number
          meta?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversation"
            referencedColumns: ["id"]
          },
        ]
      }
      client_connectors: {
        Row: {
          client_id: string
          created_at: string
          id: string
          identifier: string
          source: Database["public"]["Enums"]["connector_source"]
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          identifier: string
          source: Database["public"]["Enums"]["connector_source"]
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          identifier?: string
          source?: Database["public"]["Enums"]["connector_source"]
        }
        Relationships: [
          {
            foreignKeyName: "client_connectors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workflows: {
        Row: {
          client_id: string
          created_at: string
          id: string
          label: string
          workflow_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          label: string
          workflow_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          label?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workflows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      execution: {
        Row: {
          account_id: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: number
          payload: Json | null
          project_id: string | null
          result: Json | null
          started_at: string
          status: string
          user_id: string | null
          workflow_name: string
        }
        Insert: {
          account_id: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: number
          payload?: Json | null
          project_id?: string | null
          result?: Json | null
          started_at?: string
          status: string
          user_id?: string | null
          workflow_name: string
        }
        Update: {
          account_id?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: number
          payload?: Json | null
          project_id?: string | null
          result?: Json | null
          started_at?: string
          status?: string
          user_id?: string | null
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_last_activity"
            referencedColumns: ["project_id"]
          },
        ]
      }
      executions: {
        Row: {
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_bytes: number | null
          node_metrics: Json | null
          output_bytes: number | null
          request_id: string | null
          status: string
          tenant_id: string
          timestamp: string
          trigger_type: string
          workflow_id: string
          workflow_name: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_bytes?: number | null
          node_metrics?: Json | null
          output_bytes?: number | null
          request_id?: string | null
          status: string
          tenant_id: string
          timestamp?: string
          trigger_type: string
          workflow_id: string
          workflow_name: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_bytes?: number | null
          node_metrics?: Json | null
          output_bytes?: number | null
          request_id?: string | null
          status?: string
          tenant_id?: string
          timestamp?: string
          trigger_type?: string
          workflow_id?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          opened_at: string
          resolved_at: string | null
          rule_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          resolved_at?: string | null
          rule_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          resolved_at?: string | null
          rule_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mulchbg: {
        Row: {
          id: number
          message: Json
          "mulch id": Database["public"]["Enums"]["connector_source"] | null
          project_id: string | null
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          "mulch id"?: Database["public"]["Enums"]["connector_source"] | null
          project_id?: string | null
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          "mulch id"?: Database["public"]["Enums"]["connector_source"] | null
          project_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mulchbg_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mulchbg_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_last_activity"
            referencedColumns: ["project_id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          project_id: string | null
          role: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_last_activity"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project: {
        Row: {
          account_id: string
          created_at: string | null
          data_table: string | null
          filter_column: string | null
          filter_type: string | null
          filter_value: string | null
          id: string
          name: string
          text: Database["public"]["Enums"]["connector_source"] | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          data_table?: string | null
          filter_column?: string | null
          filter_type?: string | null
          filter_value?: string | null
          id?: string
          name: string
          text?: Database["public"]["Enums"]["connector_source"] | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          data_table?: string | null
          filter_column?: string | null
          filter_type?: string | null
          filter_value?: string | null
          id?: string
          name?: string
          text?: Database["public"]["Enums"]["connector_source"] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          last_seen: string | null
          name: string
          secret_set: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          last_seen?: string | null
          name: string
          secret_set?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          last_seen?: string | null
          name?: string
          secret_set?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      api_configs_secure: {
        Row: {
          auth_config: Json | null
          auth_type: string | null
          body: string | null
          created_at: string | null
          headers: Json | null
          id: string | null
          is_active: boolean | null
          method: string | null
          name: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          auth_config?: never
          auth_type?: string | null
          body?: string | null
          created_at?: string | null
          headers?: never
          id?: string | null
          is_active?: boolean | null
          method?: string | null
          name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          auth_config?: never
          auth_type?: string | null
          body?: string | null
          created_at?: string | null
          headers?: never
          id?: string | null
          is_active?: boolean | null
          method?: string | null
          name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mv_exec_daily: {
        Row: {
          avg_duration_ms: number | null
          day: string | null
          error_count: number | null
          success_count: number | null
          success_rate: number | null
          total_executions: number | null
        }
        Relationships: []
      }
      v_project_last_activity: {
        Row: {
          account_id: string | null
          last_exec_at: string | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_real_execution: {
        Args: {
          p_duration_ms?: number
          p_error_message?: string
          p_project_id: string
          p_started_at?: string
          p_status: string
          p_workflow_name: string
        }
        Returns: number
      }
      admin_dashboard_kpi: {
        Args: { days_back?: number; p_account: string }
        Returns: {
          avg_duration_ms: number
          last_activity: string
          success_rate: number
          total_exec: number
        }[]
      }
      admin_list_accounts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
        }[]
      }
      admin_list_executions: {
        Args: { p_account: string; p_limit?: number; p_offset?: number }
        Returns: {
          account_id: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: number
          payload: Json | null
          project_id: string | null
          result: Json | null
          started_at: string
          status: string
          user_id: string | null
          workflow_name: string
        }[]
      }
      admin_list_projects: {
        Args: { p_account: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      create_real_project: {
        Args: {
          p_client_name?: string
          p_description?: string
          p_project_name: string
        }
        Returns: string
      }
      current_account_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      decrypt_api_config_data: {
        Args: {
          p_config_id: string
          p_encrypted_auth_config: string
          p_encrypted_headers: string
        }
        Returns: {
          decrypted_auth_config: Json
          decrypted_headers: Json
        }[]
      }
      encrypt_api_config_data: {
        Args: { p_auth_config: Json; p_config_id: string; p_headers: Json }
        Returns: {
          encrypted_auth_config: string
          encrypted_headers: string
        }[]
      }
      get_user_project_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          data_table: string
          filter_column: string
          filter_type: string
          filter_value: string
          project_id: string
          project_name: string
        }[]
      }
      get_user_project_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_tenant: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      rpc_dashboard_kpi: {
        Args: { days_back?: number }
        Returns: {
          avg_duration_ms: number
          last_activity: string
          success_rate: number
          total_exec: number
        }[]
      }
      rpc_list_executions: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          account_id: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: number
          payload: Json | null
          project_id: string | null
          result: Json | null
          started_at: string
          status: string
          user_id: string | null
          workflow_name: string
        }[]
      }
      seed_exec_now: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      user_has_project_access: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      connector_source:
        | "webhook"
        | "chat"
        | "instagram"
        | "whatsapp"
        | "facebook"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      connector_source: [
        "webhook",
        "chat",
        "instagram",
        "whatsapp",
        "facebook",
      ],
    },
  },
} as const
