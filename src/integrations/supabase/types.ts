export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: {
          container_type: string
          created_at: string
          expiry_date: string
          id: string
          prepared_by: string
          prepared_date: string
          product: string
          restaurant_id: string | null
          status: string
          status_updated_at: string | null
        }
        Insert: {
          container_type?: string
          created_at?: string
          expiry_date: string
          id: string
          prepared_by: string
          prepared_date: string
          product: string
          restaurant_id?: string | null
          status?: string
          status_updated_at?: string | null
        }
        Update: {
          container_type?: string
          created_at?: string
          expiry_date?: string
          id?: string
          prepared_by?: string
          prepared_date?: string
          product?: string
          restaurant_id?: string | null
          status?: string
          status_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status: {
        Row: {
          jobid: number | null
          jobname: string | null
          last_run: string | null
          next_run: string | null
          schedule: string | null
          status: string | null
        }
        Insert: {
          jobid?: number | null
          jobname?: string | null
          last_run?: string | null
          next_run?: string | null
          schedule?: string | null
          status?: string | null
        }
        Update: {
          jobid?: number | null
          jobname?: string | null
          last_run?: string | null
          next_run?: string | null
          schedule?: string | null
          status?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          restaurant_id: string
          timestamp: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          restaurant_id: string
          timestamp?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          restaurant_id?: string
          timestamp?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      prep_watch_settings: {
        Row: {
          check_hour: number
          check_minute: number
          check_period: string | null
          created_at: string
          food_type: string
          frequency: string
          id: string
          minimum_count: number
          notify_email: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          check_hour: number
          check_minute: number
          check_period?: string | null
          created_at?: string
          food_type: string
          frequency: string
          id?: string
          minimum_count: number
          notify_email: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          check_hour?: number
          check_minute?: number
          check_period?: string | null
          created_at?: string
          food_type?: string
          frequency?: string
          id?: string
          minimum_count?: number
          notify_email?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prep_watch_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      restaurant_food_types: {
        Row: {
          created_at: string
          food_types: string[]
          id: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          food_types?: string[]
          id?: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          food_types?: string[]
          id?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_food_types_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          restaurant_id: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          restaurant_id: string
          role: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          restaurant_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_invitations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_settings: {
        Row: {
          container_types: string[]
          created_at: string
          id: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          container_types?: string[]
          created_at?: string
          id?: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          container_types?: string[]
          created_at?: string
          id?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
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
      user_preferences: {
        Row: {
          created_at: string
          default_restaurant_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_restaurant_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_restaurant_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_default_restaurant_id_fkey"
            columns: ["default_restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_restaurant_admin: {
        Args: { restaurant_id: string; user_id?: string }
        Returns: boolean
      }
      check_prep_watch_rules: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_restaurant_membership: {
        Args: { restaurant_id: string; user_id?: string }
        Returns: boolean
      }
      check_restaurant_membership_for_insert: {
        Args: { p_restaurant_id: string }
        Returns: boolean
      }
      check_user_membership: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      create_restaurant_with_admin: {
        Args: { restaurant_name: string }
        Returns: string
      }
      create_staff_user_for_restaurant: {
        Args: { p_email: string; p_restaurant_name: string }
        Returns: string
      }
      get_member_restaurants: {
        Args: { p_user_id?: string }
        Returns: string[]
      }
      get_user_restaurant_ids: {
        Args: { user_id?: string }
        Returns: string[]
      }
      get_user_restaurant_ids_for_notifications: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_user_restaurant_ids_for_rls: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      is_admin_of_restaurant: {
        Args: { p_restaurant_id: string }
        Returns: boolean
      }
      is_member_of_restaurant: {
        Args: { restaurant_id: string; user_id?: string }
        Returns: boolean
      }
      is_restaurant_admin: {
        Args: { restaurant_id: string; user_id?: string }
        Returns: boolean
      }
      process_invitation: {
        Args: { invitation_token: string; password?: string }
        Returns: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
