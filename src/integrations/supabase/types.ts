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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_conversations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          ai_generated: boolean | null
          campaign_type: string | null
          channel: string | null
          clicked_count: number | null
          created_at: string | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          launched_at: string | null
          message_template: string | null
          name: string
          occasion_trigger: string | null
          opened_count: number | null
          segment_id: string | null
          sent_count: number | null
          status: string | null
          total_recipients: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          campaign_type?: string | null
          channel?: string | null
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          launched_at?: string | null
          message_template?: string | null
          name: string
          occasion_trigger?: string | null
          opened_count?: number | null
          segment_id?: string | null
          sent_count?: number | null
          status?: string | null
          total_recipients?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          campaign_type?: string | null
          channel?: string | null
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          launched_at?: string | null
          message_template?: string | null
          name?: string
          occasion_trigger?: string | null
          opened_count?: number | null
          segment_id?: string | null
          sent_count?: number | null
          status?: string | null
          total_recipients?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          age: number | null
          avg_order_value: number | null
          city: string | null
          created_at: string | null
          days_since_last_order: number | null
          discount_sensitivity: string | null
          email: string | null
          favorite_category: string | null
          gender: string | null
          id: string
          last_order_date: string | null
          last_review_rating: number | null
          loyalty_points: number | null
          loyalty_tier: string | null
          name: string
          order_count: number | null
          persona: string | null
          phone: string | null
          preferred_channel: string | null
          referral_count: number | null
          total_spent: number | null
          try_on_items: string[] | null
        }
        Insert: {
          age?: number | null
          avg_order_value?: number | null
          city?: string | null
          created_at?: string | null
          days_since_last_order?: number | null
          discount_sensitivity?: string | null
          email?: string | null
          favorite_category?: string | null
          gender?: string | null
          id?: string
          last_order_date?: string | null
          last_review_rating?: number | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          name: string
          order_count?: number | null
          persona?: string | null
          phone?: string | null
          preferred_channel?: string | null
          referral_count?: number | null
          total_spent?: number | null
          try_on_items?: string[] | null
        }
        Update: {
          age?: number | null
          avg_order_value?: number | null
          city?: string | null
          created_at?: string | null
          days_since_last_order?: number | null
          discount_sensitivity?: string | null
          email?: string | null
          favorite_category?: string | null
          gender?: string | null
          id?: string
          last_order_date?: string | null
          last_review_rating?: number | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          name?: string
          order_count?: number | null
          persona?: string | null
          phone?: string | null
          preferred_channel?: string | null
          referral_count?: number | null
          total_spent?: number | null
          try_on_items?: string[] | null
        }
        Relationships: []
      }
      loyalty_events: {
        Row: {
          created_at: string | null
          customer_id: string | null
          description: string | null
          event_type: string | null
          id: string
          points_earned: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          event_type?: string | null
          id?: string
          points_earned?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          event_type?: string | null
          id?: string
          points_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          campaign_id: string | null
          channel: string | null
          clicked_at: string | null
          created_at: string | null
          customer_id: string | null
          delivered_at: string | null
          id: string
          opened_at: string | null
          persona_reasoning: string | null
          personalized_content: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel?: string | null
          clicked_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          persona_reasoning?: string | null
          personalized_content?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string | null
          clicked_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          persona_reasoning?: string | null
          personalized_content?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number | null
          category: string | null
          channel: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          items: string | null
          on_sale: boolean | null
          order_date: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          channel?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          items?: string | null
          on_sale?: boolean | null
          order_date?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          channel?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          items?: string | null
          on_sale?: boolean | null
          order_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          campaign_type: string | null
          created_at: string | null
          created_by: string | null
          customer_count: number | null
          description: string | null
          filter_logic: Json | null
          id: string
          name: string
        }
        Insert: {
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_count?: number | null
          description?: string | null
          filter_logic?: Json | null
          id?: string
          name: string
        }
        Update: {
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_count?: number | null
          description?: string | null
          filter_logic?: Json | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
