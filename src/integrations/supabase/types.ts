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
      advisor_application_details: {
        Row: {
          application_id: string | null
          availability_schedule: Json | null
          challenge_preference: string
          created_at: string
          experience_level: string
          expertise: string[]
          id: string
          linkedin: string
          public_profile_consent: boolean | null
          timezone: string
        }
        Insert: {
          application_id?: string | null
          availability_schedule?: Json | null
          challenge_preference: string
          created_at?: string
          experience_level: string
          expertise: string[]
          id?: string
          linkedin: string
          public_profile_consent?: boolean | null
          timezone: string
        }
        Update: {
          application_id?: string | null
          availability_schedule?: Json | null
          challenge_preference?: string
          created_at?: string
          experience_level?: string
          expertise?: string[]
          id?: string
          linkedin?: string
          public_profile_consent?: boolean | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_application_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "base_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_founder_assignments: {
        Row: {
          advisor_id: string | null
          assigned_at: string
          assigned_by: string | null
          avg_rating: number | null
          completed_at: string | null
          completed_sessions: number | null
          created_at: string
          deleted_at: string | null
          founder_id: string | null
          id: string
          match_score: number | null
          notes: string | null
          status: string
          total_sessions: number | null
          updated_at: string
        }
        Insert: {
          advisor_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          avg_rating?: number | null
          completed_at?: string | null
          completed_sessions?: number | null
          created_at?: string
          deleted_at?: string | null
          founder_id?: string | null
          id?: string
          match_score?: number | null
          notes?: string | null
          status?: string
          total_sessions?: number | null
          updated_at?: string
        }
        Update: {
          advisor_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          avg_rating?: number | null
          completed_at?: string | null
          completed_sessions?: number | null
          created_at?: string
          deleted_at?: string | null
          founder_id?: string | null
          id?: string
          match_score?: number | null
          notes?: string | null
          status?: string
          total_sessions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_founder_assignments_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_founder_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_founder_assignments_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      base_applications: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          location: string
          name: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          location: string
          name: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          location?: string
          name?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_application_details: {
        Row: {
          application_id: string | null
          availability_schedule: Json | null
          case_study_consent: boolean | null
          challenge: string
          created_at: string
          id: string
          sector: string
          stage: string
          startup_name: string
          video_link: string | null
          website: string | null
          win_definition: string
        }
        Insert: {
          application_id?: string | null
          availability_schedule?: Json | null
          case_study_consent?: boolean | null
          challenge: string
          created_at?: string
          id?: string
          sector: string
          stage: string
          startup_name: string
          video_link?: string | null
          website?: string | null
          win_definition: string
        }
        Update: {
          application_id?: string | null
          availability_schedule?: Json | null
          case_study_consent?: boolean | null
          challenge?: string
          created_at?: string
          id?: string
          sector?: string
          stage?: string
          startup_name?: string
          video_link?: string | null
          website?: string | null
          win_definition?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_application_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "base_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          assignment_id: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          founder_id: string | null
          id: string
          milestone_count: number | null
          milestones_completed: number | null
          priority: string | null
          progress_percentage: number | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignment_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          founder_id?: string | null
          id?: string
          milestone_count?: number | null
          milestones_completed?: number | null
          priority?: string | null
          progress_percentage?: number | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          founder_id?: string | null
          id?: string
          milestone_count?: number | null
          milestones_completed?: number | null
          priority?: string | null
          progress_percentage?: number | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "advisor_founder_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_access: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          resource_id: string | null
          revoked_at: string | null
          user_id: string | null
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          resource_id?: string | null
          revoked_at?: string | null
          user_id?: string | null
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          resource_id?: string | null
          revoked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          access_level: string
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          download_count: number | null
          file_path: string | null
          file_url: string | null
          id: string
          is_featured: boolean | null
          shared_by: string | null
          title: string
          type: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          access_level?: string
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          download_count?: number | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          shared_by?: string | null
          title: string
          type: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          access_level?: string
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          download_count?: number | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          shared_by?: string | null
          title?: string
          type?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          advisor_rating: number | null
          ai_processing_status: string | null
          ai_summary: string | null
          assignment_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          duration_minutes: number | null
          founder_rating: number | null
          id: string
          meeting_link: string | null
          notes: string | null
          recording_consent: Json | null
          recording_url: string | null
          rescheduled_from: string | null
          scheduled_at: string
          status: string
          title: string
          transcript_url: string | null
          updated_at: string
        }
        Insert: {
          advisor_rating?: number | null
          ai_processing_status?: string | null
          ai_summary?: string | null
          assignment_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          founder_rating?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          recording_consent?: Json | null
          recording_url?: string | null
          rescheduled_from?: string | null
          scheduled_at: string
          status?: string
          title: string
          transcript_url?: string | null
          updated_at?: string
        }
        Update: {
          advisor_rating?: number | null
          ai_processing_status?: string | null
          ai_summary?: string | null
          assignment_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          founder_rating?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          recording_consent?: Json | null
          recording_url?: string | null
          rescheduled_from?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          transcript_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "advisor_founder_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_availability: {
        Row: {
          created_at: string
          day_of_week: number
          deleted_at: string | null
          effective_date: string | null
          end_time: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          start_time: string
          timezone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          deleted_at?: string | null
          effective_date?: string | null
          end_time: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          start_time: string
          timezone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          deleted_at?: string | null
          effective_date?: string | null
          end_time?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          profile_data: Json
          profile_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          profile_data: Json
          profile_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          profile_data?: Json
          profile_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          last_active_at: string | null
          profile_completed: boolean
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          last_active_at?: string | null
          profile_completed?: boolean
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          last_active_at?: string | null
          profile_completed?: boolean
          role?: string
          status?: string
          updated_at?: string
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
