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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      building_assessment: {
        Row: {
          building_floor_count: number | null
          building_structure: string | null
          building_type: string | null
          created_at: string
          fault_line_distance: number | null
          ground_type: string | null
          has_maintenance_reinforcement: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          profile_id: string
          resided_floor: number | null
          updated_at: string | null
        }
        Insert: {
          building_floor_count?: number | null
          building_structure?: string | null
          building_type?: string | null
          created_at?: string
          fault_line_distance?: number | null
          ground_type?: string | null
          has_maintenance_reinforcement?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          profile_id: string
          resided_floor?: number | null
          updated_at?: string | null
        }
        Update: {
          building_floor_count?: number | null
          building_structure?: string | null
          building_type?: string | null
          created_at?: string
          fault_line_distance?: number | null
          ground_type?: string | null
          has_maintenance_reinforcement?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          profile_id?: string
          resided_floor?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_assessment_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      earthquake_comments: {
        Row: {
          comment: string
          created_at: string | null
          earthquake_id: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          profile_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          earthquake_id: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          profile_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          earthquake_id?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquake_comment_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquake_felt_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      earthquake_felt_reports: {
        Row: {
          created_at: string | null
          earthquake_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          earthquake_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          earthquake_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquake_comment_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquake_felt_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      earthquake_stats: {
        Row: {
          id: number
          mag3_plus_last_day: number
          mag3_plus_last_month: number
          mag3_plus_last_week: number
          mag4_plus_last_day: number
          mag4_plus_last_month: number
          mag4_plus_last_week: number
          mag5_plus_last_day: number
          mag5_plus_last_month: number
          mag5_plus_last_week: number
          total_last_day: number
          total_last_month: number
          total_last_week: number
          updated_at: string | null
        }
        Insert: {
          id?: number
          mag3_plus_last_day?: number
          mag3_plus_last_month?: number
          mag3_plus_last_week?: number
          mag4_plus_last_day?: number
          mag4_plus_last_month?: number
          mag4_plus_last_week?: number
          mag5_plus_last_day?: number
          mag5_plus_last_month?: number
          mag5_plus_last_week?: number
          total_last_day?: number
          total_last_month?: number
          total_last_week?: number
          updated_at?: string | null
        }
        Update: {
          id?: number
          mag3_plus_last_day?: number
          mag3_plus_last_month?: number
          mag3_plus_last_week?: number
          mag4_plus_last_day?: number
          mag4_plus_last_month?: number
          mag4_plus_last_week?: number
          mag5_plus_last_day?: number
          mag5_plus_last_month?: number
          mag5_plus_last_week?: number
          total_last_day?: number
          total_last_month?: number
          total_last_week?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      earthquakes: {
        Row: {
          created_at: string | null
          date: string
          depth: number
          faultline: string | null
          id: string
          latitude: number
          longitude: number
          mag: number
          provider: string
          region: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          date: string
          depth: number
          faultline?: string | null
          id?: string
          latitude: number
          longitude: number
          mag: number
          provider: string
          region?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          date?: string
          depth?: number
          faultline?: string | null
          id?: string
          latitude?: number
          longitude?: number
          mag?: number
          provider?: string
          region?: string | null
          title?: string
        }
        Relationships: []
      }
      network_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invitation_code: string
          invited_phone: string | null
          invited_user_id: string | null
          inviter_id: string
          network_id: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_code: string
          invited_phone?: string | null
          invited_user_id?: string | null
          inviter_id: string
          network_id: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_code?: string
          invited_phone?: string | null
          invited_user_id?: string | null
          inviter_id?: string
          network_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_invitations_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      network_members: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          network_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          network_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          network_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_members_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      networks: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          max_members: number | null
          name: string
          network_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name: string
          network_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name?: string
          network_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "networks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          category: string[]
          content: string
          created_at: string
          earthquake_id: string | null
          id: number
          image: string
          snippet: string
          source: string
          title: string
        }
        Insert: {
          category: string[]
          content: string
          created_at?: string
          earthquake_id?: string | null
          id?: number
          image: string
          snippet: string
          source: string
          title: string
        }
        Update: {
          category?: string[]
          content?: string
          created_at?: string
          earthquake_id?: string | null
          id?: number
          image?: string
          snippet?: string
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_earthquake_id_fkey"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquake_comment_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_earthquake_id_fkey"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquake_felt_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_earthquake_id_fkey"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquakes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          auto_renew: boolean | null
          city: string | null
          created_at: string | null
          district: string | null
          emergency_phone: string | null
          has_completed_safety_form: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          safety_score: number | null
          subscription_end_date: string | null
          subscription_plan_id: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          surname: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          address?: string | null
          auto_renew?: boolean | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          emergency_phone?: string | null
          has_completed_safety_form?: boolean | null
          id: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          safety_score?: number | null
          subscription_end_date?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          surname?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          address?: string | null
          auto_renew?: boolean | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          emergency_phone?: string | null
          has_completed_safety_form?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          safety_score?: number | null
          subscription_end_date?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          surname?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string | null
          duration_in_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          billing_period: string
          created_at?: string | null
          duration_in_days: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          duration_in_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
    }
    Views: {
      earthquake_comment_stats: {
        Row: {
          comment_count: number | null
          date: string | null
          id: string | null
          last_comment_at: string | null
          mag: number | null
          title: string | null
        }
        Relationships: []
      }
      earthquake_comments_with_profiles: {
        Row: {
          comment: string | null
          created_at: string | null
          earthquake_id: string | null
          edited_at: string | null
          id: string | null
          is_edited: boolean | null
          name: string | null
          profile_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquake_comment_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquake_felt_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_earthquake"
            columns: ["earthquake_id"]
            isOneToOne: false
            referencedRelation: "earthquakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      earthquake_felt_counts: {
        Row: {
          date: string | null
          depth: number | null
          felt_count: number | null
          id: string | null
          latitude: number | null
          longitude: number | null
          mag: number | null
          provider: string | null
          region: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_network_with_member: {
        Args: { p_description?: string; p_max_members?: number; p_name: string }
        Returns: Json
      }
      join_network_by_code: {
        Args: { p_network_code: string }
        Returns: Json
      }
      leave_network: {
        Args: { p_network_id: string }
        Returns: Json
      }
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
