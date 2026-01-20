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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_conversation_messages: {
        Row: {
          agent_id: string | null
          client_id: string
          content: string
          conversation_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          importance_score: number | null
          metadata: Json | null
          remote_jid: string
          role: string
        }
        Insert: {
          agent_id?: string | null
          client_id: string
          content: string
          conversation_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          importance_score?: number | null
          metadata?: Json | null
          remote_jid: string
          role: string
        }
        Update: {
          agent_id?: string | null
          client_id?: string
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          importance_score?: number | null
          metadata?: Json | null
          remote_jid?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversation_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversation_summaries: {
        Row: {
          agent_id: string | null
          conversation_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          messages_count: number
          summary_text: string
          time_range_end: string
          time_range_start: string
        }
        Insert: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          messages_count: number
          summary_text: string
          time_range_end: string
          time_range_start: string
        }
        Update: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          messages_count?: number
          summary_text?: string
          time_range_end?: string
          time_range_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversation_summaries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversations: {
        Row: {
          agent_id: string | null
          client_id: string
          contact_id: string | null
          created_at: string | null
          id: string
          is_paused: boolean | null
          last_message_at: string | null
          messages: Json | null
          metadata: Json | null
          pause_triggered_by: string | null
          paused_at: string | null
          paused_reason: string | null
          remote_jid: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          client_id: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_paused?: boolean | null
          last_message_at?: string | null
          messages?: Json | null
          metadata?: Json | null
          pause_triggered_by?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          remote_jid: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_paused?: boolean | null
          last_message_at?: string | null
          messages?: Json | null
          metadata?: Json | null
          pause_triggered_by?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          remote_jid?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tool_invocations: {
        Row: {
          agent_id: string
          arguments: Json
          client_id: string
          conversation_id: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          function_name: string
          id: string
          remote_jid: string
          result: Json | null
          success: boolean
        }
        Insert: {
          agent_id: string
          arguments?: Json
          client_id: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          function_name: string
          id?: string
          remote_jid: string
          result?: Json | null
          success?: boolean
        }
        Update: {
          agent_id?: string
          arguments?: Json
          client_id?: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          function_name?: string
          id?: string
          remote_jid?: string
          result?: Json | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_tool_invocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tool_invocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tool_invocations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_usage_logs: {
        Row: {
          agent_id: string | null
          client_id: string
          cost_input: number | null
          cost_output: number | null
          created_at: string | null
          error_message: string | null
          id: string
          model_used: string
          response_time_ms: number | null
          success: boolean | null
          tokens_input: number
          tokens_output: number
          total_cost: number | null
        }
        Insert: {
          agent_id?: string | null
          client_id: string
          cost_input?: number | null
          cost_output?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          model_used: string
          response_time_ms?: number | null
          success?: boolean | null
          tokens_input: number
          tokens_output: number
          total_cost?: number | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string
          cost_input?: number | null
          cost_output?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          model_used?: string
          response_time_ms?: number | null
          success?: boolean | null
          tokens_input?: number
          tokens_output?: number
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_usage_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_usage_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models_config: {
        Row: {
          capabilities: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_tokens: number | null
          model_name: string
          pricing_per_1k_input: number | null
          pricing_per_1k_output: number | null
          provider: string
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          model_name: string
          pricing_per_1k_input?: number | null
          pricing_per_1k_output?: number | null
          provider?: string
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          model_name?: string
          pricing_per_1k_input?: number | null
          pricing_per_1k_output?: number | null
          provider?: string
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      approval_audit_log: {
        Row: {
          approval_criteria_met: Json | null
          approval_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          request_id: string
        }
        Insert: {
          approval_criteria_met?: Json | null
          approval_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          request_id: string
        }
        Update: {
          approval_criteria_met?: Json | null
          approval_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_audit_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "subscription_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_config: {
        Row: {
          api_token: string
          auto_approve_enabled: boolean | null
          auto_approve_max_value: number | null
          auto_approve_plan_whitelist: Json | null
          auto_renew_default: boolean | null
          created_at: string
          default_grace_period_days: number | null
          environment: string
          id: string
          max_payment_retries: number | null
          notification_templates: Json | null
          split_config: Json | null
          updated_at: string
          wallet_id: string | null
          webhook_url: string | null
          whatsapp_instance_id: string | null
          whatsapp_notifications_enabled: boolean | null
        }
        Insert: {
          api_token: string
          auto_approve_enabled?: boolean | null
          auto_approve_max_value?: number | null
          auto_approve_plan_whitelist?: Json | null
          auto_renew_default?: boolean | null
          created_at?: string
          default_grace_period_days?: number | null
          environment?: string
          id?: string
          max_payment_retries?: number | null
          notification_templates?: Json | null
          split_config?: Json | null
          updated_at?: string
          wallet_id?: string | null
          webhook_url?: string | null
          whatsapp_instance_id?: string | null
          whatsapp_notifications_enabled?: boolean | null
        }
        Update: {
          api_token?: string
          auto_approve_enabled?: boolean | null
          auto_approve_max_value?: number | null
          auto_approve_plan_whitelist?: Json | null
          auto_renew_default?: boolean | null
          created_at?: string
          default_grace_period_days?: number | null
          environment?: string
          id?: string
          max_payment_retries?: number | null
          notification_templates?: Json | null
          split_config?: Json | null
          updated_at?: string
          wallet_id?: string | null
          webhook_url?: string | null
          whatsapp_instance_id?: string | null
          whatsapp_notifications_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_config_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_invoices: {
        Row: {
          asaas_payment_id: string | null
          billing_type: string
          client_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          invoice_url: string | null
          metadata: Json | null
          payment_date: string | null
          pix_code: string | null
          pix_qrcode: string | null
          split_data: Json | null
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          asaas_payment_id?: string | null
          billing_type: string
          client_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          invoice_url?: string | null
          metadata?: Json | null
          payment_date?: string | null
          pix_code?: string | null
          pix_qrcode?: string | null
          split_data?: Json | null
          status?: string
          updated_at?: string
          value: number
        }
        Update: {
          asaas_payment_id?: string | null
          billing_type?: string
          client_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          invoice_url?: string | null
          metadata?: Json | null
          payment_date?: string | null
          pix_code?: string | null
          pix_qrcode?: string | null
          split_data?: Json | null
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asaas_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_subscriptions: {
        Row: {
          asaas_subscription_id: string | null
          auto_renew: boolean | null
          auto_suspend_on_failure: boolean | null
          billing_type: string
          client_id: string
          created_at: string
          cycle: string
          description: string | null
          grace_period_days: number | null
          id: string
          last_payment_attempt: string | null
          metadata: Json | null
          next_due_date: string | null
          payment_provider: string | null
          plan_name: string
          retry_count: number | null
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          asaas_subscription_id?: string | null
          auto_renew?: boolean | null
          auto_suspend_on_failure?: boolean | null
          billing_type: string
          client_id: string
          created_at?: string
          cycle: string
          description?: string | null
          grace_period_days?: number | null
          id?: string
          last_payment_attempt?: string | null
          metadata?: Json | null
          next_due_date?: string | null
          payment_provider?: string | null
          plan_name: string
          retry_count?: number | null
          status?: string
          updated_at?: string
          value: number
        }
        Update: {
          asaas_subscription_id?: string | null
          auto_renew?: boolean | null
          auto_suspend_on_failure?: boolean | null
          billing_type?: string
          client_id?: string
          created_at?: string
          cycle?: string
          description?: string | null
          grace_period_days?: number | null
          id?: string
          last_payment_attempt?: string | null
          metadata?: Json | null
          next_due_date?: string | null
          payment_provider?: string | null
          plan_name?: string
          retry_count?: number | null
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asaas_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_webhooks: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          processed: boolean | null
          processed_at: string | null
          subscription_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          subscription_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          subscription_id?: string | null
        }
        Relationships: []
      }
      asaas_whatsapp_notifications: {
        Row: {
          client_id: string
          created_at: string
          error_message: string | null
          id: string
          invoice_id: string | null
          message_text: string
          notification_type: string
          phone_number: string
          sent_at: string | null
          status: string
          subscription_id: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_text: string
          notification_type: string
          phone_number: string
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_text?: string
          notification_type?: string
          phone_number?: string
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_whatsapp_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_whatsapp_notifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "asaas_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_whatsapp_notifications_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "asaas_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      calendar_availability: {
        Row: {
          calendar_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          start_time: string
        }
        Insert: {
          calendar_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_availability_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_bookings: {
        Row: {
          booker_email: string | null
          booker_name: string
          booker_phone: string
          calendar_id: string
          created_at: string
          event_id: string
          id: string
          notes: string | null
        }
        Insert: {
          booker_email?: string | null
          booker_name: string
          booker_phone: string
          calendar_id: string
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          booker_email?: string | null
          booker_name?: string
          booker_phone?: string
          calendar_id?: string
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_bookings_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          calendar_id: string
          client_id: string
          contact_id: string | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          id: string
          location_details: Json | null
          location_type: Database["public"]["Enums"]["location_type"]
          metadata: Json | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          calendar_id: string
          client_id: string
          contact_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          location_details?: Json | null
          location_type?: Database["public"]["Enums"]["location_type"]
          metadata?: Json | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string
          client_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          location_details?: Json | null
          location_type?: Database["public"]["Enums"]["location_type"]
          metadata?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      calendars: {
        Row: {
          booking_settings: Json | null
          client_id: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          notification_settings: Json | null
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          booking_settings?: Json | null
          client_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          notification_settings?: Json | null
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          booking_settings?: Json | null
          client_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          notification_settings?: Json | null
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendars_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_conversions: {
        Row: {
          campaign_source_id: string
          client_id: string
          contact_id: string
          conversion_type: string
          conversion_value: number | null
          converted_at: string | null
          created_at: string | null
          id: string
          new_stage: string
          notes: string | null
          previous_stage: string | null
        }
        Insert: {
          campaign_source_id: string
          client_id: string
          contact_id: string
          conversion_type: string
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          new_stage: string
          notes?: string | null
          previous_stage?: string | null
        }
        Update: {
          campaign_source_id?: string
          client_id?: string
          contact_id?: string
          conversion_type?: string
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          new_stage?: string
          notes?: string | null
          previous_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_conversions_campaign_source_id_fkey"
            columns: ["campaign_source_id"]
            isOneToOne: false
            referencedRelation: "campaign_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_conversions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_conversions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_metrics: {
        Row: {
          avg_response_time_seconds: number | null
          campaign_source_id: string
          client_id: string
          conversion_rate: number | null
          created_at: string | null
          customers: number | null
          date: string
          id: string
          opportunities: number | null
          qualified_leads: number | null
          total_leads: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_seconds?: number | null
          campaign_source_id: string
          client_id: string
          conversion_rate?: number | null
          created_at?: string | null
          customers?: number | null
          date: string
          id?: string
          opportunities?: number | null
          qualified_leads?: number | null
          total_leads?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_seconds?: number | null
          campaign_source_id?: string
          client_id?: string
          conversion_rate?: number | null
          created_at?: string | null
          customers?: number | null
          date?: string
          id?: string
          opportunities?: number | null
          qualified_leads?: number | null
          total_leads?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_source_id_fkey"
            columns: ["campaign_source_id"]
            isOneToOne: false
            referencedRelation: "campaign_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sources: {
        Row: {
          budget: number | null
          campaign_id: string | null
          client_id: string
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          payload_data: Json | null
          platform: string
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          campaign_id?: string | null
          client_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          payload_data?: Json | null
          platform: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          campaign_id?: string | null
          client_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          payload_data?: Json | null
          platform?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sources_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_asaas_integration: {
        Row: {
          asaas_customer_id: string | null
          asaas_wallet_id: string | null
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          notification_phone: string | null
          split_percentage: number | null
          updated_at: string
          whatsapp_notifications_enabled: boolean | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          notification_phone?: string | null
          split_percentage?: number | null
          updated_at?: string
          whatsapp_notifications_enabled?: boolean | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          notification_phone?: string | null
          split_percentage?: number | null
          updated_at?: string
          whatsapp_notifications_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_asaas_integration_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_permissions: {
        Row: {
          client_id: string
          created_at: string
          id: string
          module: Database["public"]["Enums"]["system_module"]
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          module: Database["public"]["Enums"]["system_module"]
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          module?: Database["public"]["Enums"]["system_module"]
        }
        Relationships: [
          {
            foreignKeyName: "client_permissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_plan_history: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_type: Database["public"]["Enums"]["plan_change_type"]
          changed_by: string | null
          changed_by_role: string | null
          client_id: string
          created_at: string
          effective_date: string
          id: string
          is_automatic: boolean
          new_billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          new_plan_id: string | null
          new_price: number | null
          new_resources: Json | null
          notes: string | null
          old_billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          old_plan_id: string | null
          old_price: number | null
          old_resources: Json | null
          reason: string | null
          requires_approval: boolean | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_type: Database["public"]["Enums"]["plan_change_type"]
          changed_by?: string | null
          changed_by_role?: string | null
          client_id: string
          created_at?: string
          effective_date?: string
          id?: string
          is_automatic?: boolean
          new_billing_cycle?:
            | Database["public"]["Enums"]["billing_cycle"]
            | null
          new_plan_id?: string | null
          new_price?: number | null
          new_resources?: Json | null
          notes?: string | null
          old_billing_cycle?:
            | Database["public"]["Enums"]["billing_cycle"]
            | null
          old_plan_id?: string | null
          old_price?: number | null
          old_resources?: Json | null
          reason?: string | null
          requires_approval?: boolean | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_type?: Database["public"]["Enums"]["plan_change_type"]
          changed_by?: string | null
          changed_by_role?: string | null
          client_id?: string
          created_at?: string
          effective_date?: string
          id?: string
          is_automatic?: boolean
          new_billing_cycle?:
            | Database["public"]["Enums"]["billing_cycle"]
            | null
          new_plan_id?: string | null
          new_price?: number | null
          new_resources?: Json | null
          notes?: string | null
          old_billing_cycle?:
            | Database["public"]["Enums"]["billing_cycle"]
            | null
          old_plan_id?: string | null
          old_price?: number | null
          old_resources?: Json | null
          reason?: string | null
          requires_approval?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_plan_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_plan_history_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_plan_history_old_plan_id_fkey"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_code: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_trial: boolean | null
          julia_agent_codes: string[] | null
          max_agents: number
          max_connections: number
          max_julia_agents: number
          max_monthly_contacts: number
          max_team_members: number
          name: string
          next_billing_date: string | null
          plan_expires_at: string | null
          plan_id: string | null
          plan_started_at: string | null
          release_customization: boolean
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          client_code?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          is_trial?: boolean | null
          julia_agent_codes?: string[] | null
          max_agents?: number
          max_connections?: number
          max_julia_agents?: number
          max_monthly_contacts?: number
          max_team_members?: number
          name: string
          next_billing_date?: string | null
          plan_expires_at?: string | null
          plan_id?: string | null
          plan_started_at?: string | null
          release_customization?: boolean
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          client_code?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_trial?: boolean | null
          julia_agent_codes?: string[] | null
          max_agents?: number
          max_connections?: number
          max_julia_agents?: number
          max_monthly_contacts?: number
          max_team_members?: number
          name?: string
          next_billing_date?: string | null
          plan_expires_at?: string | null
          plan_id?: string | null
          plan_started_at?: string | null
          release_customization?: boolean
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_campaign_tracking: {
        Row: {
          campaign_source_id: string
          client_id: string
          contact_id: string
          conversion_stage: string | null
          conversion_value: number | null
          converted_at: string | null
          created_at: string | null
          ctwa_payload: string | null
          ctwa_signals: string | null
          entry_point: string | null
          first_message: string | null
          first_message_at: string | null
          id: string
          metadata: Json | null
          track_id: string | null
          track_source: string | null
        }
        Insert: {
          campaign_source_id: string
          client_id: string
          contact_id: string
          conversion_stage?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          ctwa_payload?: string | null
          ctwa_signals?: string | null
          entry_point?: string | null
          first_message?: string | null
          first_message_at?: string | null
          id?: string
          metadata?: Json | null
          track_id?: string | null
          track_source?: string | null
        }
        Update: {
          campaign_source_id?: string
          client_id?: string
          contact_id?: string
          conversion_stage?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          ctwa_payload?: string | null
          ctwa_signals?: string | null
          entry_point?: string | null
          first_message?: string | null
          first_message_at?: string | null
          id?: string
          metadata?: Json | null
          track_id?: string | null
          track_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_campaign_tracking_campaign_source_id_fkey"
            columns: ["campaign_source_id"]
            isOneToOne: false
            referencedRelation: "campaign_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_campaign_tracking_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_campaign_tracking_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar: string | null
          client_id: string
          created_at: string | null
          id: string
          instance_id: string | null
          is_archived: boolean | null
          is_group: boolean | null
          is_muted: boolean | null
          name: string
          notes: string | null
          notes_updated_at: string | null
          notes_updated_by: string | null
          notes_updated_by_name: string | null
          phone: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_archived?: boolean | null
          is_group?: boolean | null
          is_muted?: boolean | null
          name: string
          notes?: string | null
          notes_updated_at?: string | null
          notes_updated_by?: string | null
          notes_updated_by_name?: string | null
          phone: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_archived?: boolean | null
          is_group?: boolean | null
          is_muted?: boolean | null
          name?: string
          notes?: string | null
          notes_updated_at?: string | null
          notes_updated_by?: string | null
          notes_updated_by_name?: string | null
          phone?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          client_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_boards: {
        Row: {
          client_id: string | null
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_deals: {
        Row: {
          client_id: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          id: string
          pipeline_id: string | null
          position: number
          priority: string | null
          status: string | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pipeline_id?: string | null
          position: number
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pipeline_id?: string | null
          position?: number
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          board_id: string | null
          client_id: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          board_id?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          position: number
          updated_at?: string
        }
        Update: {
          board_id?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "crm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_execution_logs: {
        Row: {
          error_message: string | null
          executed_at: string
          execution_type: string
          id: string
          job_name: string
          result: Json | null
          status: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          execution_type: string
          id?: string
          job_name: string
          result?: Json | null
          status: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          execution_type?: string
          id?: string
          job_name?: string
          result?: Json | null
          status?: string
        }
        Relationships: []
      }
      cron_job_config: {
        Row: {
          created_at: string
          id: string
          interval_minutes: number
          is_active: boolean
          job_name: string
          last_updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          job_name: string
          last_updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          job_name?: string
          last_updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      event_notifications: {
        Row: {
          agent_id: string | null
          created_at: string
          error_message: string | null
          event_id: string
          id: string
          location_data: Json | null
          media_caption: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          media_url: string | null
          message_template: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          trigger_time: unknown
          type: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          error_message?: string | null
          event_id: string
          id?: string
          location_data?: Json | null
          media_caption?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string | null
          message_template: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          trigger_time: unknown
          type?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string
          id?: string
          location_data?: Json | null
          media_caption?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string | null
          message_template?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          trigger_time?: unknown
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_modules: {
        Row: {
          base_quantity: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          has_quantity: boolean | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          max_quantity: number | null
          name: string
          price: number
          price_per_unit: number | null
          quantity_label: string | null
          updated_at: string | null
        }
        Insert: {
          base_quantity?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          has_quantity?: boolean | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          name: string
          price?: number
          price_per_unit?: number | null
          quantity_label?: string | null
          updated_at?: string | null
        }
        Update: {
          base_quantity?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          has_quantity?: boolean | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          name?: string
          price?: number
          price_per_unit?: number | null
          quantity_label?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      followup_configs: {
        Row: {
          agent_id: string
          auto_message: boolean
          client_id: string
          created_at: string
          end_hours: string
          followup_from: number | null
          followup_to: number | null
          id: string
          is_active: boolean
          start_hours: string
          trigger_delay_minutes: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          auto_message?: boolean
          client_id: string
          created_at?: string
          end_hours?: string
          followup_from?: number | null
          followup_to?: number | null
          id?: string
          is_active?: boolean
          start_hours?: string
          trigger_delay_minutes?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          auto_message?: boolean
          client_id?: string
          created_at?: string
          end_hours?: string
          followup_from?: number | null
          followup_to?: number | null
          id?: string
          is_active?: boolean
          start_hours?: string
          trigger_delay_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_configs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_executions: {
        Row: {
          client_id: string
          config_id: string
          conversation_id: string
          created_at: string
          error_message: string | null
          id: string
          is_infinite_loop: boolean
          loop_iteration: number
          message_sent: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          step_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          config_id: string
          conversation_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          is_infinite_loop?: boolean
          loop_iteration?: number
          message_sent?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          config_id?: string
          conversation_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          is_infinite_loop?: boolean
          loop_iteration?: number
          message_sent?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_executions_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "followup_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_executions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_executions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "followup_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_history: {
        Row: {
          client_id: string
          conversation_id: string
          created_at: string
          event_type: string
          execution_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          client_id: string
          conversation_id: string
          created_at?: string
          event_type: string
          execution_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          client_id?: string
          conversation_id?: string
          created_at?: string
          event_type?: string
          execution_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_history_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "followup_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_steps: {
        Row: {
          config_id: string
          created_at: string
          id: string
          message: string | null
          step_order: number
          step_unit: string
          step_value: number
          title: string
          updated_at: string
        }
        Insert: {
          config_id: string
          created_at?: string
          id?: string
          message?: string | null
          step_order: number
          step_unit: string
          step_value: number
          title: string
          updated_at?: string
        }
        Update: {
          config_id?: string
          created_at?: string
          id?: string
          message?: string | null
          step_order?: number
          step_unit?: string
          step_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_steps_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "followup_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_types: {
        Row: {
          badge_color: string | null
          badge_text: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          included_items: string[] | null
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          included_items?: string[] | null
          is_active?: boolean | null
          name: string
          price?: number
        }
        Update: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          included_items?: string[] | null
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      julia_agents: {
        Row: {
          agent_bio: string | null
          agent_code: string
          agent_type: string
          ai_max_tokens: number | null
          ai_model_id: string | null
          ai_temperature: number | null
          auto_summary_threshold: number | null
          client_id: string
          conversation_context: Json | null
          created_at: string
          custom_prompt: string | null
          id: string
          instance_id: string | null
          is_active: boolean
          is_paused_globally: boolean | null
          memory_max_messages: number | null
          memory_retrieval_count: number | null
          name: string
          pause_phrases: string[] | null
          release_customization: boolean | null
          selected_julia_code: string | null
          start_conversation_phrases: Json | null
          system_instructions: string | null
          tools_config: Json | null
          updated_at: string
        }
        Insert: {
          agent_bio?: string | null
          agent_code: string
          agent_type?: string
          ai_max_tokens?: number | null
          ai_model_id?: string | null
          ai_temperature?: number | null
          auto_summary_threshold?: number | null
          client_id: string
          conversation_context?: Json | null
          created_at?: string
          custom_prompt?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean
          is_paused_globally?: boolean | null
          memory_max_messages?: number | null
          memory_retrieval_count?: number | null
          name: string
          pause_phrases?: string[] | null
          release_customization?: boolean | null
          selected_julia_code?: string | null
          start_conversation_phrases?: Json | null
          system_instructions?: string | null
          tools_config?: Json | null
          updated_at?: string
        }
        Update: {
          agent_bio?: string | null
          agent_code?: string
          agent_type?: string
          ai_max_tokens?: number | null
          ai_model_id?: string | null
          ai_temperature?: number | null
          auto_summary_threshold?: number | null
          client_id?: string
          conversation_context?: Json | null
          created_at?: string
          custom_prompt?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean
          is_paused_globally?: boolean | null
          memory_max_messages?: number | null
          memory_retrieval_count?: number | null
          name?: string
          pause_phrases?: string[] | null
          release_customization?: boolean | null
          selected_julia_code?: string | null
          start_conversation_phrases?: Json | null
          system_instructions?: string | null
          tools_config?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "julia_agents_ai_model_id_fkey"
            columns: ["ai_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "julia_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "julia_agents_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      julia_queue_logs: {
        Row: {
          agent_id: string
          chat_id: string
          client_id: string
          cod_agente: string
          contact_id: string | null
          created_at: string
          error_message: string | null
          id: string
          instance_code: string
          json_payload: Json
          message_from_me: boolean
          message_id: string
          message_text: string | null
          message_type: string
          message_url: string | null
          phone_number: string
          rabbitmq_queue_name: string | null
          remote_jid: string
          sent_at: string | null
          sent_to_rabbitmq: boolean
        }
        Insert: {
          agent_id: string
          chat_id: string
          client_id: string
          cod_agente: string
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instance_code: string
          json_payload: Json
          message_from_me?: boolean
          message_id: string
          message_text?: string | null
          message_type?: string
          message_url?: string | null
          phone_number: string
          rabbitmq_queue_name?: string | null
          remote_jid: string
          sent_at?: string | null
          sent_to_rabbitmq?: boolean
        }
        Update: {
          agent_id?: string
          chat_id?: string
          client_id?: string
          cod_agente?: string
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instance_code?: string
          json_payload?: Json
          message_from_me?: boolean
          message_id?: string
          message_text?: string | null
          message_type?: string
          message_url?: string | null
          phone_number?: string
          rabbitmq_queue_name?: string | null
          remote_jid?: string
          sent_at?: string | null
          sent_to_rabbitmq?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "julia_queue_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "julia_queue_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "julia_queue_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          caption: string | null
          client_id: string
          contact_id: string
          created_at: string | null
          file_name: string | null
          from_me: boolean | null
          id: string
          media_url: string | null
          message_id: string | null
          metadata: Json | null
          reply_to: string | null
          status: string | null
          text: string | null
          timestamp: string | null
          type: string | null
        }
        Insert: {
          caption?: string | null
          client_id: string
          contact_id: string
          created_at?: string | null
          file_name?: string | null
          from_me?: boolean | null
          id?: string
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          reply_to?: string | null
          status?: string | null
          text?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Update: {
          caption?: string | null
          client_id?: string
          contact_id?: string
          created_at?: string | null
          file_name?: string | null
          from_me?: boolean | null
          id?: string
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          reply_to?: string | null
          status?: string | null
          text?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      monitor_execution_logs: {
        Row: {
          conversations_processed: number
          created_at: string
          duration_ms: number | null
          error_message: string | null
          executed_at: string
          execution_type: string
          executions_created: number
          id: string
          metadata: Json | null
          success: boolean
        }
        Insert: {
          conversations_processed?: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          execution_type: string
          executions_created?: number
          id?: string
          metadata?: Json | null
          success?: boolean
        }
        Update: {
          conversations_processed?: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          execution_type?: string
          executions_created?: number
          id?: string
          metadata?: Json | null
          success?: boolean
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          client_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          message_content: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          processed_at: string | null
          recipient_phone: string
          retry_count: number | null
          scheduled_for: string | null
          status: string | null
          variables: Json | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message_content: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          processed_at?: string | null
          recipient_phone: string
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          variables?: Json | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message_content?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          processed_at?: string | null
          recipient_phone?: string
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      payment_providers: {
        Row: {
          config: Json | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          supported_payment_methods: Json | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          supported_payment_methods?: Json | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          supported_payment_methods?: Json | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      pre_followup: {
        Row: {
          agent_id: string
          agent_message_content: string | null
          agent_message_id: string | null
          agent_message_sent_at: string
          cancelled_at: string | null
          cancelled_reason: string | null
          client_id: string
          conversation_id: string
          created_at: string
          expires_at: string
          id: string
          metadata: Json | null
          processed_at: string | null
          remote_jid: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_message_content?: string | null
          agent_message_id?: string | null
          agent_message_sent_at?: string
          cancelled_at?: string | null
          cancelled_reason?: string | null
          client_id: string
          conversation_id: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          remote_jid: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_message_content?: string | null
          agent_message_id?: string | null
          agent_message_sent_at?: string
          cancelled_at?: string | null
          cancelled_reason?: string | null
          client_id?: string
          conversation_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          remote_jid?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_followup_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "julia_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_followup_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_followup_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      process_campaigns: {
        Row: {
          batch_size: number
          client_id: string
          completed_at: string | null
          created_at: string
          failed_count: number
          id: string
          interval_between_batches_ms: number
          interval_between_messages_ms: number
          message_template: string
          name: string
          scheduled_start_at: string | null
          sent_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          total_records: number
          updated_at: string
          whatsapp_instance_id: string
        }
        Insert: {
          batch_size?: number
          client_id: string
          completed_at?: string | null
          created_at?: string
          failed_count?: number
          id?: string
          interval_between_batches_ms?: number
          interval_between_messages_ms?: number
          message_template: string
          name: string
          scheduled_start_at?: string | null
          sent_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          total_records?: number
          updated_at?: string
          whatsapp_instance_id: string
        }
        Update: {
          batch_size?: number
          client_id?: string
          completed_at?: string | null
          created_at?: string
          failed_count?: number
          id?: string
          interval_between_batches_ms?: number
          interval_between_messages_ms?: number
          message_template?: string
          name?: string
          scheduled_start_at?: string | null
          sent_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          total_records?: number
          updated_at?: string
          whatsapp_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_campaigns_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      process_records: {
        Row: {
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          message_text: string
          phone_number: string
          process_number: string
          process_status: string
          retry_count: number
          send_status: Database["public"]["Enums"]["record_send_status"]
          sent_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_text: string
          phone_number: string
          process_number: string
          process_status: string
          retry_count?: number
          send_status?: Database["public"]["Enums"]["record_send_status"]
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_text?: string
          phone_number?: string
          process_number?: string
          process_status?: string
          retry_count?: number
          send_status?: Database["public"]["Enums"]["record_send_status"]
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_records_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "process_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payment_history: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          failure_reason: string | null
          id: string
          payment_attempt_date: string | null
          payment_provider: string | null
          payment_status: string
          provider_payment_id: string | null
          retry_number: number | null
          subscription_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payment_attempt_date?: string | null
          payment_provider?: string | null
          payment_status: string
          provider_payment_id?: string | null
          retry_number?: number | null
          subscription_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payment_attempt_date?: string | null
          payment_provider?: string | null
          payment_status?: string
          provider_payment_id?: string | null
          retry_number?: number | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payment_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "asaas_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          custom_cycle_days: number | null
          description: string | null
          display_order: number
          enabled_modules: string[]
          id: string
          is_active: boolean
          is_featured: boolean
          max_agents: number
          max_connections: number
          max_julia_agents: number
          max_monthly_contacts: number
          max_team_members: number
          more_info: string | null
          name: string
          preferred_payment_provider: string | null
          price: number
          release_customization: boolean
          setup_fee: number | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          custom_cycle_days?: number | null
          description?: string | null
          display_order?: number
          enabled_modules?: string[]
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_agents?: number
          max_connections?: number
          max_julia_agents?: number
          max_monthly_contacts?: number
          max_team_members?: number
          more_info?: string | null
          name: string
          preferred_payment_provider?: string | null
          price?: number
          release_customization?: boolean
          setup_fee?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          custom_cycle_days?: number | null
          description?: string | null
          display_order?: number
          enabled_modules?: string[]
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_agents?: number
          max_connections?: number
          max_julia_agents?: number
          max_monthly_contacts?: number
          max_team_members?: number
          more_info?: string | null
          name?: string
          preferred_payment_provider?: string | null
          price?: number
          release_customization?: boolean
          setup_fee?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_preferred_payment_provider_fkey"
            columns: ["preferred_payment_provider"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["name"]
          },
        ]
      }
      subscription_request_tracking: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          request_id: string
          tracking_token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          request_id: string
          tracking_token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          request_id?: string
          tracking_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_request_tracking_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "subscription_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          cpf_cnpj: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_verified: boolean | null
          payment_data: Json | null
          payment_provider: string | null
          plan_id: string
          rejection_reason: string | null
          status: string
          updated_at: string | null
          verification_code: string | null
          verification_expires_at: string | null
          verification_sent_at: string | null
          whatsapp_phone: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          cpf_cnpj: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_verified?: boolean | null
          payment_data?: Json | null
          payment_provider?: string | null
          plan_id: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          verification_code?: string | null
          verification_expires_at?: string | null
          verification_sent_at?: string | null
          whatsapp_phone: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          cpf_cnpj?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          payment_data?: Json | null
          payment_provider?: string | null
          plan_id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          verification_code?: string | null
          verification_expires_at?: string | null
          verification_sent_at?: string | null
          whatsapp_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_modules: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_active: boolean
          label: string
          module_key: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label: string
          module_key: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label?: string
          module_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_notification_logs: {
        Row: {
          client_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message_content: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          read_at: string | null
          recipient_phone: string
          sent_at: string | null
          status: string
          updated_at: string | null
          variables: Json | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_content: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          read_at?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          variables?: Json | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          variables?: Json | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_notification_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notification_logs_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_permissions: {
        Row: {
          created_at: string
          id: string
          module: Database["public"]["Enums"]["system_module"]
          team_member_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: Database["public"]["Enums"]["system_module"]
          team_member_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: Database["public"]["Enums"]["system_module"]
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_permissions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          client_id: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          ticket_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_escalations: {
        Row: {
          created_at: string | null
          escalated_by_id: string
          escalated_by_name: string | null
          escalation_type: string | null
          from_level: string | null
          from_sector_id: string | null
          from_user_id: string | null
          from_user_name: string | null
          id: string
          reason: string | null
          ticket_id: string
          to_level: string | null
          to_sector_id: string | null
          to_user_id: string | null
          to_user_name: string | null
        }
        Insert: {
          created_at?: string | null
          escalated_by_id: string
          escalated_by_name?: string | null
          escalation_type?: string | null
          from_level?: string | null
          from_sector_id?: string | null
          from_user_id?: string | null
          from_user_name?: string | null
          id?: string
          reason?: string | null
          ticket_id: string
          to_level?: string | null
          to_sector_id?: string | null
          to_user_id?: string | null
          to_user_name?: string | null
        }
        Update: {
          created_at?: string | null
          escalated_by_id?: string
          escalated_by_name?: string | null
          escalation_type?: string | null
          from_level?: string | null
          from_sector_id?: string | null
          from_user_id?: string | null
          from_user_name?: string | null
          id?: string
          reason?: string | null
          ticket_id?: string
          to_level?: string | null
          to_sector_id?: string | null
          to_user_id?: string | null
          to_user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_escalations_from_sector_id_fkey"
            columns: ["from_sector_id"]
            isOneToOne: false
            referencedRelation: "ticket_sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_escalations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_escalations_to_sector_id_fkey"
            columns: ["to_sector_id"]
            isOneToOne: false
            referencedRelation: "ticket_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_history: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_notification_templates: {
        Row: {
          count_id: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          notification_type: string
          template_message: string
          updated_at: string | null
        }
        Insert: {
          count_id: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          notification_type: string
          template_message: string
          updated_at?: string | null
        }
        Update: {
          count_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          notification_type?: string
          template_message?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_notifications: {
        Row: {
          channel: string | null
          count_id: string
          created_at: string | null
          error_message: string | null
          id: string
          message: string
          notification_type: string
          recipient_name: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string | null
          ticket_id: string
        }
        Insert: {
          channel?: string | null
          count_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          notification_type: string
          recipient_name?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
          ticket_id: string
        }
        Update: {
          channel?: string | null
          count_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          notification_type?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_sectors: {
        Row: {
          color: string | null
          created_at: string | null
          default_priority: string | null
          helena_count_id: string
          helena_department_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          position: number | null
          sla_hours: number | null
          slug: string
          support_level: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_priority?: string | null
          helena_count_id: string
          helena_department_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          position?: number | null
          sla_hours?: number | null
          slug: string
          support_level?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_priority?: string | null
          helena_count_id?: string
          helena_department_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          position?: number | null
          sla_hours?: number | null
          slug?: string
          support_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_team_members: {
        Row: {
          created_at: string | null
          helena_agent_id: string | null
          helena_count_id: string
          helena_user_id: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          is_supervisor: boolean | null
          phone_number: string | null
          role: string | null
          sector_id: string | null
          support_level: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string | null
          helena_agent_id?: string | null
          helena_count_id: string
          helena_user_id?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          is_supervisor?: boolean | null
          phone_number?: string | null
          role?: string | null
          sector_id?: string | null
          support_level?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string | null
          helena_agent_id?: string | null
          helena_count_id?: string
          helena_user_id?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          is_supervisor?: boolean | null
          phone_number?: string | null
          role?: string | null
          sector_id?: string | null
          support_level?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_team_members_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "ticket_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_at: string | null
          assigned_to_id: string | null
          chat_context: string | null
          cod_agent: string | null
          contact_name: string | null
          created_at: string | null
          created_by_id: string | null
          created_by_name: string | null
          current_level: string | null
          description: string | null
          escalation_count: number | null
          first_response_at: string | null
          helena_contact_id: string | null
          helena_count_id: string
          id: string
          last_customer_message_at: string | null
          priority: string | null
          resolved_at: string | null
          resolved_by_id: string | null
          resolved_by_name: string | null
          sector_id: string | null
          session_id: string | null
          sla_breached: boolean | null
          sla_deadline: string | null
          status: string | null
          tags: string[] | null
          ticket_number: number
          title: string
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_id?: string | null
          chat_context?: string | null
          cod_agent?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          current_level?: string | null
          description?: string | null
          escalation_count?: number | null
          first_response_at?: string | null
          helena_contact_id?: string | null
          helena_count_id: string
          id?: string
          last_customer_message_at?: string | null
          priority?: string | null
          resolved_at?: string | null
          resolved_by_id?: string | null
          resolved_by_name?: string | null
          sector_id?: string | null
          session_id?: string | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: string | null
          tags?: string[] | null
          ticket_number?: number
          title: string
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to_id?: string | null
          chat_context?: string | null
          cod_agent?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          current_level?: string | null
          description?: string | null
          escalation_count?: number | null
          first_response_at?: string | null
          helena_contact_id?: string | null
          helena_count_id?: string
          id?: string
          last_customer_message_at?: string | null
          priority?: string | null
          resolved_at?: string | null
          resolved_by_id?: string | null
          resolved_by_name?: string | null
          sector_id?: string | null
          session_id?: string | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: string | null
          tags?: string[] | null
          ticket_number?: number
          title?: string
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "ticket_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "ticket_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_julia_agents: {
        Row: {
          cod_agent: string
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          user_id: string
        }
        Insert: {
          cod_agent: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          user_id: string
        }
        Update: {
          cod_agent?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          max_notifications_per_day: number | null
          notification_types: string[] | null
          preferred_language: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_notifications_per_day?: number | null
          notification_types?: string[] | null
          preferred_language?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_notifications_per_day?: number | null
          notification_types?: string[] | null
          preferred_language?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          client_id: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          contact_name: string | null
          created_at: string
          created_at_idx: string | null
          error_message: string | null
          event_type: string
          id: string
          instance_token: string | null
          is_from_me: boolean | null
          is_group: boolean | null
          message_type: string | null
          phone: string | null
          processing_status: string
          processing_time_ms: number | null
          provider: string
          remote_jid: string | null
          request_body: Json
          request_headers: Json | null
          resolution_method: string | null
          resolved_client_id: string | null
          resolved_instance_id: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          created_at_idx?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          instance_token?: string | null
          is_from_me?: boolean | null
          is_group?: boolean | null
          message_type?: string | null
          phone?: string | null
          processing_status?: string
          processing_time_ms?: number | null
          provider?: string
          remote_jid?: string | null
          request_body: Json
          request_headers?: Json | null
          resolution_method?: string | null
          resolved_client_id?: string | null
          resolved_instance_id?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          created_at_idx?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          instance_token?: string | null
          is_from_me?: boolean | null
          is_group?: boolean | null
          message_type?: string | null
          phone?: string | null
          processing_status?: string
          processing_time_ms?: number | null
          provider?: string
          remote_jid?: string | null
          request_body?: Json
          request_headers?: Json | null
          resolution_method?: string | null
          resolved_client_id?: string | null
          resolved_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_resolved_client_id_fkey"
            columns: ["resolved_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_resolved_instance_id_fkey"
            columns: ["resolved_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_token: string | null
          api_url: string | null
          client_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          instance_id: string
          instance_name: string
          is_default_notification: boolean | null
          is_notifications: boolean | null
          phone_number: string | null
          profile_name: string | null
          profile_picture_url: string | null
          provider: string
          qr_code: string | null
          status: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          api_token?: string | null
          api_url?: string | null
          client_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          instance_id: string
          instance_name: string
          is_default_notification?: boolean | null
          is_notifications?: boolean | null
          phone_number?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          provider?: string
          qr_code?: string | null
          status?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_token?: string | null
          api_url?: string | null
          client_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          instance_id?: string
          instance_name?: string
          is_default_notification?: boolean | null
          is_notifications?: boolean | null
          phone_number?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          provider?: string
          qr_code?: string | null
          status?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_system_module_enum_value: {
        Args: { new_value: string }
        Returns: undefined
      }
      generate_tracking_token: { Args: never; Returns: string }
      generate_verification_code: { Args: never; Returns: string }
      get_julia_performance_summary: {
        Args: {
          p_agent_id: string
          p_cod_agents: string[]
          p_data_fim: string
          p_data_inicio: string
          p_tipo_agente: string
        }
        Returns: {
          total_assinados: number
          total_contratos: number
          total_em_curso: number
          total_leads: number
        }[]
      }
      get_notification_metrics: {
        Args: { end_date: string; start_date: string }
        Returns: {
          avg_delivery_time: number
          delivery_rate: number
          failure_rate: number
          read_rate: number
          top_errors: Json
          total_delivered: number
          total_failed: number
          total_read: number
          total_sent: number
        }[]
      }
      get_user_client_id: { Args: { user_id: string }; Returns: string }
      get_user_cod_agents: { Args: { p_user_id: string }; Returns: string[] }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_linked_contacts: { Args: { instance_uuid: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_similar_messages: {
        Args: {
          p_conversation_id: string
          p_match_count?: number
          p_query_embedding: string
          p_similarity_threshold?: number
        }
        Returns: {
          content: string
          created_at: string
          id: string
          role: string
          similarity: number
        }[]
      }
      user_has_cod_agent_access: {
        Args: { p_cod_agent: string; p_user_id: string }
        Returns: boolean
      }
      user_has_module_permission: {
        Args: {
          _module: Database["public"]["Enums"]["system_module"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      billing_cycle:
        | "monthly"
        | "quarterly"
        | "semiannual"
        | "annual"
        | "custom"
      campaign_status:
        | "pending"
        | "scheduled"
        | "running"
        | "paused"
        | "completed"
        | "failed"
      event_status: "scheduled" | "confirmed" | "cancelled" | "completed"
      location_type: "physical" | "virtual" | "whatsapp"
      media_type: "text" | "image" | "video" | "location" | "document"
      notification_status: "pending" | "sent" | "failed"
      plan_change_type:
        | "initial"
        | "upgrade"
        | "downgrade"
        | "change"
        | "cancellation"
      record_send_status: "pending" | "sending" | "sent" | "failed"
      system_module:
        | "chat"
        | "contacts"
        | "crm"
        | "connections"
        | "settings"
        | "reports"
        | "clients"
        | "webhook"
        | "team"
        | "help"
        | "dashboard"
        | "agent_julia"
        | "t_dois"
        | "agent_analytics"
        | "agent-analytics"
        | "calendar"
        | "process_campaigns"
        | "billing"
        | "campaigns"
        | "followup"
        | "julia_agents"
        | "julia_performance"
        | "julia_contracts"
      user_role: "admin" | "client" | "team_member"
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
      billing_cycle: ["monthly", "quarterly", "semiannual", "annual", "custom"],
      campaign_status: [
        "pending",
        "scheduled",
        "running",
        "paused",
        "completed",
        "failed",
      ],
      event_status: ["scheduled", "confirmed", "cancelled", "completed"],
      location_type: ["physical", "virtual", "whatsapp"],
      media_type: ["text", "image", "video", "location", "document"],
      notification_status: ["pending", "sent", "failed"],
      plan_change_type: [
        "initial",
        "upgrade",
        "downgrade",
        "change",
        "cancellation",
      ],
      record_send_status: ["pending", "sending", "sent", "failed"],
      system_module: [
        "chat",
        "contacts",
        "crm",
        "connections",
        "settings",
        "reports",
        "clients",
        "webhook",
        "team",
        "help",
        "dashboard",
        "agent_julia",
        "t_dois",
        "agent_analytics",
        "agent-analytics",
        "calendar",
        "process_campaigns",
        "billing",
        "campaigns",
        "followup",
        "julia_agents",
        "julia_performance",
        "julia_contracts",
      ],
      user_role: ["admin", "client", "team_member"],
    },
  },
} as const
