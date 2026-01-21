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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_spend: {
        Row: {
          campaign_id: string
          clicks: number
          created_at: string
          date: string
          id: string
          impressions: number
          leads_count: number
          spend_amount: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number
          created_at?: string
          date: string
          id?: string
          impressions?: number
          leads_count?: number
          spend_amount?: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number
          created_at?: string
          date?: string
          id?: string
          impressions?: number
          leads_count?: number
          spend_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_spend_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          action_label: string | null
          campaign_id: string | null
          created_at: string
          id: string
          is_applied: boolean | null
          is_dismissed: boolean | null
          message: string
          priority: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_applied?: boolean | null
          is_dismissed?: boolean | null
          message: string
          priority?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_applied?: boolean | null
          is_dismissed?: boolean | null
          message?: string
          priority?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          cost_per_lead: number | null
          created_at: string
          daily_budget: number
          health: Database["public"]["Enums"]["campaign_health"]
          id: string
          leads_count: number
          name: string
          platform: Database["public"]["Enums"]["ad_platform"]
          status: Database["public"]["Enums"]["campaign_status"]
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_lead?: number | null
          created_at?: string
          daily_budget?: number
          health?: Database["public"]["Enums"]["campaign_health"]
          id?: string
          leads_count?: number
          name: string
          platform: Database["public"]["Enums"]["ad_platform"]
          status?: Database["public"]["Enums"]["campaign_status"]
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_lead?: number | null
          created_at?: string
          daily_budget?: number
          health?: Database["public"]["Enums"]["campaign_health"]
          id?: string
          leads_count?: number
          name?: string
          platform?: Database["public"]["Enums"]["ad_platform"]
          status?: Database["public"]["Enums"]["campaign_status"]
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          is_published: boolean | null
          level: Database["public"]["Enums"]["course_level"]
          required_plan: Database["public"]["Enums"]["subscription_plan"] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["course_level"]
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["course_level"]
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          campaign_id: string | null
          created_at: string
          email: string | null
          estimated_value: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["ad_platform"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source: Database["public"]["Enums"]["ad_platform"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["ad_platform"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free_preview: boolean | null
          module_id: string
          sort_order: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id: string
          sort_order?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id?: string
          sort_order?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_class_registrations: {
        Row: {
          attended: boolean | null
          id: string
          live_class_id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          id?: string
          live_class_id: string
          registered_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          id?: string
          live_class_id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_class_registrations_live_class_id_fkey"
            columns: ["live_class_id"]
            isOneToOne: false
            referencedRelation: "live_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      live_classes: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string | null
          instrument: Database["public"]["Enums"]["instrument_type"] | null
          is_recorded: boolean | null
          max_attendees: number | null
          recording_url: string | null
          required_plan: Database["public"]["Enums"]["subscription_plan"] | null
          scheduled_at: string
          title: string
          zoom_join_url: string | null
          zoom_meeting_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          instrument?: Database["public"]["Enums"]["instrument_type"] | null
          is_recorded?: boolean | null
          max_attendees?: number | null
          recording_url?: string | null
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          scheduled_at: string
          title: string
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          instrument?: Database["public"]["Enums"]["instrument_type"] | null
          is_recorded?: boolean | null
          max_attendees?: number | null
          recording_url?: string | null
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          scheduled_at?: string
          title?: string
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string | null
          subscription_expires_at: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          last_watched_at: string | null
          lesson_id: string
          progress_percent: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          last_watched_at?: string | null
          lesson_id: string
          progress_percent?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          last_watched_at?: string | null
          lesson_id?: string
          progress_percent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      get_user_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_platform: "facebook" | "instagram" | "tiktok" | "google"
      app_role: "admin" | "instructor" | "student"
      campaign_health: "healthy" | "needs_optimization" | "underperforming"
      campaign_status: "active" | "paused" | "completed" | "draft"
      course_level: "beginner" | "intermediate" | "advanced"
      instrument_type: "guitar" | "piano" | "drums" | "banjo"
      lead_status: "new" | "contacted" | "qualified" | "closed" | "lost"
      subscription_plan: "basic" | "standard" | "pro"
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
      ad_platform: ["facebook", "instagram", "tiktok", "google"],
      app_role: ["admin", "instructor", "student"],
      campaign_health: ["healthy", "needs_optimization", "underperforming"],
      campaign_status: ["active", "paused", "completed", "draft"],
      course_level: ["beginner", "intermediate", "advanced"],
      instrument_type: ["guitar", "piano", "drums", "banjo"],
      lead_status: ["new", "contacted", "qualified", "closed", "lost"],
      subscription_plan: ["basic", "standard", "pro"],
    },
  },
} as const
