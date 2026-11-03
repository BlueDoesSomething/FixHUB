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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      application_events: {
        Row: {
          actor_id: string
          application_id: string
          created_at: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          actor_id: string
          application_id: string
          created_at?: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          actor_id?: string
          application_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "technician_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string
          created_at: string
          full_name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string
          created_at?: string
          full_name: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          full_name?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repair_photos: {
        Row: {
          content_type: string
          created_at: string
          file_name: string
          file_size: number
          id: string
          position: number
          repair_id: string
          storage_path: string
        }
        Insert: {
          content_type: string
          created_at?: string
          file_name: string
          file_size: number
          id?: string
          position?: number
          repair_id: string
          storage_path: string
        }
        Update: {
          content_type?: string
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          position?: number
          repair_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_photos_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repair_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_requests: {
        Row: {
          brand: string
          cancellation_reason: string | null
          created_at: string
          customer_id: string
          device: string
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          model: string
          problem: string
          reference: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["repair_status"]
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          cancellation_reason?: string | null
          created_at?: string
          customer_id: string
          device: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          model: string
          problem: string
          reference?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["repair_status"]
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          cancellation_reason?: string | null
          created_at?: string
          customer_id?: string
          device?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          model?: string
          problem?: string
          reference?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["repair_status"]
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_requests_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technician_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          comment: string
          created_at: string
          id: string
          review_id: string
          technician_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          review_id: string
          technician_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          review_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          customer_id: string
          id: string
          rating: number
          repair_id: string
          technician_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          repair_id: string
          technician_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          repair_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repair_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technician_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_applications: {
        Row: {
          applicant_id: string
          brands: string[]
          city: string
          contact_number: string
          coverage_area: string
          created_at: string
          email: string
          experience_description: string
          feedback: string | null
          full_name: string
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          specializations: string[]
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          working_days: string[]
          working_hours: string
          years_experience: number
        }
        Insert: {
          applicant_id: string
          brands: string[]
          city: string
          contact_number: string
          coverage_area: string
          created_at?: string
          email: string
          experience_description: string
          feedback?: string | null
          full_name: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          specializations: string[]
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          working_days: string[]
          working_hours: string
          years_experience: number
        }
        Update: {
          applicant_id?: string
          brands?: string[]
          city?: string
          contact_number?: string
          coverage_area?: string
          created_at?: string
          email?: string
          experience_description?: string
          feedback?: string | null
          full_name?: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          specializations?: string[]
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          working_days?: string[]
          working_hours?: string
          years_experience?: number
        }
        Relationships: []
      }
      technician_profiles: {
        Row: {
          application_id: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "technician_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_repair_request: {
        Args: { p_repair_id: string }
        Returns: undefined
      }
      admin_approve_application: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      admin_reject_application: {
        Args: { p_application_id: string; p_note: string }
        Returns: undefined
      }
      admin_request_info: {
        Args: { p_application_id: string; p_note: string }
        Returns: undefined
      }
      admin_start_review: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      advance_repair_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["repair_status"]
          p_repair_id: string
        }
        Returns: undefined
      }
      cancel_my_repair_request: {
        Args: { p_reason?: string; p_repair_id: string }
        Returns: undefined
      }
      create_my_repair_request: {
        Args: {
          p_brand: string
          p_device: string
          p_latitude?: number
          p_location: string
          p_longitude?: number
          p_model: string
          p_problem: string
          p_service_type: Database["public"]["Enums"]["service_type"]
        }
        Returns: string
      }
      get_my_account: {
        Args: never
        Returns: {
          city: string
          created_at: string
          full_name: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_technician: { Args: never; Returns: boolean }
      list_available_repairs: {
        Args: never
        Returns: {
          brand: string
          created_at: string
          device: string
          id: string
          latitude: number
          location: string
          longitude: number
          model: string
          problem: string
          reference: string
          service_type: Database["public"]["Enums"]["service_type"]
        }[]
      }
      list_my_repair_requests: {
        Args: never
        Returns: {
          brand: string
          created_at: string
          device: string
          id: string
          location: string
          model: string
          problem: string
          reference: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["repair_status"]
          technician_id: string
          updated_at: string
        }[]
      }
      submit_my_application: {
        Args: {
          p_brands: string[]
          p_city: string
          p_contact_number: string
          p_coverage_area: string
          p_experience_description: string
          p_full_name: string
          p_service_type: Database["public"]["Enums"]["service_type"]
          p_specializations: string[]
          p_working_days: string[]
          p_working_hours: string
          p_years_experience: number
        }
        Returns: string
      }
      technician_review_summary: {
        Args: { p_technician_profile_id: string }
        Returns: {
          average_rating: number
          total_reviews: number
        }[]
      }
    }
    Enums: {
      app_role: "client" | "technician" | "admin"
      application_status:
        | "pending"
        | "under_review"
        | "needs_information"
        | "approved"
        | "rejected"
      repair_status:
        | "pending"
        | "accepted"
        | "en_route"
        | "arrived"
        | "in_progress"
        | "completed"
        | "cancelled"
      service_type: "home" | "dropoff" | "both"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["client", "technician", "admin"],
      application_status: [
        "pending",
        "under_review",
        "needs_information",
        "approved",
        "rejected",
      ],
      repair_status: [
        "pending",
        "accepted",
        "en_route",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
      ],
      service_type: ["home", "dropoff", "both"],
    },
  },
} as const
