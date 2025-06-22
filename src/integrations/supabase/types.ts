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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          object_id: string | null
          object_type: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          object_id?: string | null
          object_type?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          object_id?: string | null
          object_type?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "active_applications"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_users"
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
            referencedRelation: "active_users"
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
      application_review_logs: {
        Row: {
          action: string
          application_id: string | null
          comments: string | null
          created_at: string
          id: string
          new_status: string | null
          previous_status: string | null
          review_criteria: Json | null
          reviewer_id: string | null
        }
        Insert: {
          action: string
          application_id?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          review_criteria?: Json | null
          reviewer_id?: string | null
        }
        Update: {
          action?: string
          application_id?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          review_criteria?: Json | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_review_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "active_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_review_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "base_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_review_logs_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_review_logs_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_logs: {
        Row: {
          action: string
          actor_id: string | null
          assignment_id: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          assignment_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          assignment_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "active_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "advisor_founder_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_rules: {
        Row: {
          badge_level: string
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          rule_type: string
          threshold_value: number
        }
        Insert: {
          badge_level: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          rule_type: string
          threshold_value: number
        }
        Update: {
          badge_level?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          rule_type?: string
          threshold_value?: number
        }
        Relationships: []
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
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_application_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "base_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          goal_id: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          progress_change: number | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          goal_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          progress_change?: number | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          goal_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          progress_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "active_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
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
            referencedRelation: "active_assignments"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_users"
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
            referencedRelation: "active_users"
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
      notification_deliveries: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          notification_id: string | null
          provider: string | null
          provider_message_id: string | null
          retry_count: number | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "active_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          channel: string | null
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
          channel?: string | null
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
          channel?: string | null
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
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          settings: Json | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_resources"
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
            referencedRelation: "active_users"
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
            referencedRelation: "active_users"
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
      session_analysis: {
        Row: {
          action_items: string[] | null
          ai_model: string
          confidence_score: number | null
          created_at: string
          discussion_themes: Json | null
          error_message: string | null
          id: string
          key_insights: string | null
          next_session_suggestions: string | null
          processing_duration_ms: number | null
          processing_status: string | null
          recommendations: string[] | null
          sentiment_score: number | null
          session_id: string | null
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          action_items?: string[] | null
          ai_model: string
          confidence_score?: number | null
          created_at?: string
          discussion_themes?: Json | null
          error_message?: string | null
          id?: string
          key_insights?: string | null
          next_session_suggestions?: string | null
          processing_duration_ms?: number | null
          processing_status?: string | null
          recommendations?: string[] | null
          sentiment_score?: number | null
          session_id?: string | null
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          action_items?: string[] | null
          ai_model?: string
          confidence_score?: number | null
          created_at?: string
          discussion_themes?: Json | null
          error_message?: string | null
          id?: string
          key_insights?: string | null
          next_session_suggestions?: string | null
          processing_duration_ms?: number | null
          processing_status?: string | null
          recommendations?: string[] | null
          sentiment_score?: number | null
          session_id?: string | null
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_analysis_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "active_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_analysis_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          advisor_feedback_text: string | null
          advisor_private_notes: string | null
          advisor_rating: number | null
          ai_processing_status: string | null
          ai_summary: string | null
          assignment_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          duration_minutes: number | null
          feedback_tags: string[] | null
          founder_feedback_text: string | null
          founder_private_notes: string | null
          founder_rating: number | null
          id: string
          is_recurring: boolean | null
          meeting_link: string | null
          notes: string | null
          parent_series_id: string | null
          recording_consent: Json | null
          recording_url: string | null
          recurrence_pattern: Json | null
          rescheduled_from: string | null
          scheduled_at: string
          status: string
          title: string
          transcript_url: string | null
          updated_at: string
          what_could_improve: string | null
          what_went_well: string | null
        }
        Insert: {
          advisor_feedback_text?: string | null
          advisor_private_notes?: string | null
          advisor_rating?: number | null
          ai_processing_status?: string | null
          ai_summary?: string | null
          assignment_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          feedback_tags?: string[] | null
          founder_feedback_text?: string | null
          founder_private_notes?: string | null
          founder_rating?: number | null
          id?: string
          is_recurring?: boolean | null
          meeting_link?: string | null
          notes?: string | null
          parent_series_id?: string | null
          recording_consent?: Json | null
          recording_url?: string | null
          recurrence_pattern?: Json | null
          rescheduled_from?: string | null
          scheduled_at: string
          status?: string
          title: string
          transcript_url?: string | null
          updated_at?: string
          what_could_improve?: string | null
          what_went_well?: string | null
        }
        Update: {
          advisor_feedback_text?: string | null
          advisor_private_notes?: string | null
          advisor_rating?: number | null
          ai_processing_status?: string | null
          ai_summary?: string | null
          assignment_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          feedback_tags?: string[] | null
          founder_feedback_text?: string | null
          founder_private_notes?: string | null
          founder_rating?: number | null
          id?: string
          is_recurring?: boolean | null
          meeting_link?: string | null
          notes?: string | null
          parent_series_id?: string | null
          recording_consent?: Json | null
          recording_url?: string | null
          recurrence_pattern?: Json | null
          rescheduled_from?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          transcript_url?: string | null
          updated_at?: string
          what_could_improve?: string | null
          what_went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "active_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "advisor_founder_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_parent_series_id_fkey"
            columns: ["parent_series_id"]
            isOneToOne: false
            referencedRelation: "active_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_parent_series_id_fkey"
            columns: ["parent_series_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "active_sessions"
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
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          event_category: string
          event_type: string
          id: string
          properties: Json | null
          timestamp: string
          user_id: string | null
          value: number | null
        }
        Insert: {
          event_category: string
          event_type: string
          id?: string
          properties?: Json | null
          timestamp?: string
          user_id?: string | null
          value?: number | null
        }
        Update: {
          event_category?: string
          event_type?: string
          id?: string
          properties?: Json | null
          timestamp?: string
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_user_id_fkey"
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
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          profile_completed?: boolean
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_applications: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string | null
          location: string | null
          name: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      active_assignments: {
        Row: {
          advisor_id: string | null
          assigned_at: string | null
          assigned_by: string | null
          avg_rating: number | null
          completed_at: string | null
          completed_sessions: number | null
          created_at: string | null
          deleted_at: string | null
          founder_id: string | null
          id: string | null
          match_score: number | null
          notes: string | null
          status: string | null
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          advisor_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          avg_rating?: number | null
          completed_at?: string | null
          completed_sessions?: number | null
          created_at?: string | null
          deleted_at?: string | null
          founder_id?: string | null
          id?: string | null
          match_score?: number | null
          notes?: string | null
          status?: string | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          avg_rating?: number | null
          completed_at?: string | null
          completed_sessions?: number | null
          created_at?: string | null
          deleted_at?: string | null
          founder_id?: string | null
          id?: string | null
          match_score?: number | null
          notes?: string | null
          status?: string | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_founder_assignments_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_users"
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
            referencedRelation: "active_users"
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
      active_goals: {
        Row: {
          assignment_id: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          founder_id: string | null
          id: string | null
          milestone_count: number | null
          milestones_completed: number | null
          priority: string | null
          progress_percentage: number | null
          status: string | null
          target_date: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          founder_id?: string | null
          id?: string | null
          milestone_count?: number | null
          milestones_completed?: number | null
          priority?: string | null
          progress_percentage?: number | null
          status?: string | null
          target_date?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          founder_id?: string | null
          id?: string | null
          milestone_count?: number | null
          milestones_completed?: number | null
          priority?: string | null
          progress_percentage?: number | null
          status?: string | null
          target_date?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "active_assignments"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_users"
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
            referencedRelation: "active_users"
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
      active_notifications: {
        Row: {
          action_url: string | null
          channel: string | null
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string | null
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          priority: string | null
          read_at: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          channel?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          channel?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      active_resources: {
        Row: {
          access_level: string | null
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          download_count: number | null
          file_path: string | null
          file_url: string | null
          id: string | null
          is_featured: boolean | null
          shared_by: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          access_level?: string | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number | null
          file_path?: string | null
          file_url?: string | null
          id?: string | null
          is_featured?: boolean | null
          shared_by?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          access_level?: string | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number | null
          file_path?: string | null
          file_url?: string | null
          id?: string | null
          is_featured?: boolean | null
          shared_by?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
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
            referencedRelation: "active_users"
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
      active_sessions: {
        Row: {
          advisor_feedback_text: string | null
          advisor_private_notes: string | null
          advisor_rating: number | null
          ai_processing_status: string | null
          ai_summary: string | null
          assignment_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          duration_minutes: number | null
          feedback_tags: string[] | null
          founder_feedback_text: string | null
          founder_private_notes: string | null
          founder_rating: number | null
          id: string | null
          is_recurring: boolean | null
          meeting_link: string | null
          notes: string | null
          parent_series_id: string | null
          recording_consent: Json | null
          recording_url: string | null
          recurrence_pattern: Json | null
          rescheduled_from: string | null
          scheduled_at: string | null
          status: string | null
          title: string | null
          transcript_url: string | null
          updated_at: string | null
          what_could_improve: string | null
          what_went_well: string | null
        }
        Insert: {
          advisor_feedback_text?: string | null
          advisor_private_notes?: string | null
          advisor_rating?: number | null
          ai_processing_status?: string | null
          ai_summary?: string | null
          assignment_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          feedback_tags?: string[] | null
          founder_feedback_text?: string | null
          founder_private_notes?: string | null
          founder_rating?: number | null
          id?: string | null
          is_recurring?: boolean | null
          meeting_link?: string | null
          notes?: string | null
          parent_series_id?: string | null
          recording_consent?: Json | null
          recording_url?: string | null
          recurrence_pattern?: Json | null
          rescheduled_from?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string | null
          transcript_url?: string | null
          updated_at?: string | null
          what_could_improve?: string | null
          what_went_well?: string | null
        }
        Update: {
          advisor_feedback_text?: string | null
          advisor_private_notes?: string | null
          advisor_rating?: number | null
          ai_processing_status?: string | null
          ai_summary?: string | null
          assignment_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          feedback_tags?: string[] | null
          founder_feedback_text?: string | null
          founder_private_notes?: string | null
          founder_rating?: number | null
          id?: string | null
          is_recurring?: boolean | null
          meeting_link?: string | null
          notes?: string | null
          parent_series_id?: string | null
          recording_consent?: Json | null
          recording_url?: string | null
          recurrence_pattern?: Json | null
          rescheduled_from?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string | null
          transcript_url?: string | null
          updated_at?: string | null
          what_could_improve?: string | null
          what_went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "active_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "advisor_founder_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_parent_series_id_fkey"
            columns: ["parent_series_id"]
            isOneToOne: false
            referencedRelation: "active_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_parent_series_id_fkey"
            columns: ["parent_series_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "active_sessions"
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
      active_users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string | null
          last_active_at: string | null
          organization_id: string | null
          profile_completed: boolean | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          last_active_at?: string | null
          organization_id?: string | null
          profile_completed?: boolean | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          last_active_at?: string | null
          organization_id?: string | null
          profile_completed?: boolean | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_user_badge_level: {
        Args: { p_user_id: string }
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
