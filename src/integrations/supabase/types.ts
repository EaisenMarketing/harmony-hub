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
      ai_tools: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          instrument_slugs: string[]
          is_active: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          instrument_slugs?: string[]
          is_active?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          instrument_slugs?: string[]
          is_active?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          grade: number | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submission_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          grade?: number | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          grade?: number | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          due_days: number | null
          id: string
          instructions: string | null
          lesson_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          due_days?: number | null
          id?: string
          instructions?: string | null
          lesson_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          due_days?: number | null
          id?: string
          instructions?: string | null
          lesson_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
      certificates: {
        Row: {
          course_id: string
          course_title: string
          created_at: string
          id: string
          issued_at: string
          pdf_url: string | null
          student_name: string
          updated_at: string
          user_id: string
          verification_code: string
        }
        Insert: {
          course_id: string
          course_title: string
          created_at?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          student_name: string
          updated_at?: string
          user_id: string
          verification_code?: string
        }
        Update: {
          course_id?: string
          course_title?: string
          created_at?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          student_name?: string
          updated_at?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_admin_view"
            referencedColumns: ["id"]
          },
        ]
      }
      chord_detections: {
        Row: {
          confidence: number | null
          created_at: string
          detected_chord: string | null
          fingers: string | null
          id: string
          image_path: string
          instrument: string
          notes: string[] | null
          raw_response: Json | null
          suggestions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          detected_chord?: string | null
          fingers?: string | null
          id?: string
          image_path: string
          instrument: string
          notes?: string[] | null
          raw_response?: Json | null
          suggestions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          detected_chord?: string | null
          fingers?: string | null
          id?: string
          image_path?: string
          instrument?: string
          notes?: string[] | null
          raw_response?: Json | null
          suggestions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      class_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          group_id: string
          id: string
          join_url: string | null
          recording_url: string | null
          scheduled_at: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          group_id: string
          id?: string
          join_url?: string | null
          recording_url?: string | null
          scheduled_at: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          group_id?: string
          id?: string
          join_url?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          tag: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          tag?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          tag?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          attachment_paths: string[]
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attachment_paths?: string[]
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attachment_paths?: string[]
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
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
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_admin_view"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_type: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          featured: boolean
          id: string
          individual_price_cents: number | null
          instructor_id: string | null
          instrument: Database["public"]["Enums"]["instrument_type"]
          is_published: boolean | null
          level: Database["public"]["Enums"]["course_level"]
          preview_video_url: string | null
          required_plan: Database["public"]["Enums"]["subscription_plan"] | null
          short_description: string | null
          slug: string | null
          stripe_price_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          featured?: boolean
          id?: string
          individual_price_cents?: number | null
          instructor_id?: string | null
          instrument: Database["public"]["Enums"]["instrument_type"]
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["course_level"]
          preview_video_url?: string | null
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          short_description?: string | null
          slug?: string | null
          stripe_price_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          featured?: boolean
          id?: string
          individual_price_cents?: number | null
          instructor_id?: string | null
          instrument?: Database["public"]["Enums"]["instrument_type"]
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["course_level"]
          preview_video_url?: string | null
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          short_description?: string | null
          slug?: string | null
          stripe_price_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_progressions: {
        Row: {
          chords: string[]
          created_at: string
          description: string | null
          id: string
          instrument: string
          key: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chords?: string[]
          created_at?: string
          description?: string | null
          id?: string
          instrument?: string
          key?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chords?: string[]
          created_at?: string
          description?: string | null
          id?: string
          instrument?: string
          key?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ear_training_sessions: {
        Row: {
          accuracy: number
          category: string
          correct: number
          count: number
          created_at: string
          id: string
          instrument: string | null
          level: string
          per_type: Json
          user_id: string
        }
        Insert: {
          accuracy: number
          category: string
          correct: number
          count: number
          created_at?: string
          id?: string
          instrument?: string | null
          level: string
          per_type?: Json
          user_id: string
        }
        Update: {
          accuracy?: number
          category?: string
          correct?: number
          count?: number
          created_at?: string
          id?: string
          instrument?: string | null
          level?: string
          per_type?: Json
          user_id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          source: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          source?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          source?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_admin_view"
            referencedColumns: ["id"]
          },
        ]
      }
      free_materials: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          instagram_keyword: string | null
          is_active: boolean
          pdf_path: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instagram_keyword?: string | null
          is_active?: boolean
          pdf_path: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instagram_keyword?: string | null
          is_active?: boolean
          pdf_path?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_students: {
        Row: {
          created_at: string
          group_id: string
          id: string
          instrument_slug: string
          joined_at: string
          left_at: string | null
          level_key: string | null
          membership_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          instrument_slug: string
          joined_at?: string
          left_at?: string | null
          level_key?: string | null
          membership_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          instrument_slug?: string
          joined_at?: string
          left_at?: string | null
          level_key?: string | null
          membership_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          base_timezone: string
          capacity: number
          code: string
          created_at: string
          duration_minutes: number
          id: string
          instrument_slug: string
          is_active: boolean
          join_url: string | null
          level_key: string
          name: string
          start_time_utc: string
          teacher_name: string | null
          teacher_user_id: string | null
          trial_slots_limit: number
          updated_at: string
          weekday: number
        }
        Insert: {
          base_timezone?: string
          capacity?: number
          code: string
          created_at?: string
          duration_minutes?: number
          id?: string
          instrument_slug: string
          is_active?: boolean
          join_url?: string | null
          level_key: string
          name: string
          start_time_utc: string
          teacher_name?: string | null
          teacher_user_id?: string | null
          trial_slots_limit?: number
          updated_at?: string
          weekday?: number
        }
        Update: {
          base_timezone?: string
          capacity?: number
          code?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          instrument_slug?: string
          is_active?: boolean
          join_url?: string | null
          level_key?: string
          name?: string
          start_time_utc?: string
          teacher_name?: string | null
          teacher_user_id?: string | null
          trial_slots_limit?: number
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      instructor_activity_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          instructor_id: string
          metadata: Json | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          instructor_id: string
          metadata?: Json | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          instructor_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_activity_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_applications: {
        Row: {
          admin_notes: string | null
          availability: string | null
          bio: string
          created_at: string
          email: string
          full_name: string
          id: string
          instrument: string
          phone: string | null
          presentation_video_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sample_class_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          timezone: string | null
          updated_at: string
          years_experience: number
        }
        Insert: {
          admin_notes?: string | null
          availability?: string | null
          bio: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          instrument: string
          phone?: string | null
          presentation_video_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_class_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          timezone?: string | null
          updated_at?: string
          years_experience?: number
        }
        Update: {
          admin_notes?: string | null
          availability?: string | null
          bio?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          instrument?: string
          phone?: string | null
          presentation_video_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_class_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          timezone?: string | null
          updated_at?: string
          years_experience?: number
        }
        Relationships: []
      }
      instructor_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          created_at: string
          id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          specialization: string | null
          status: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          specialization?: string | null
          status?: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          specialization?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      instructor_students: {
        Row: {
          enrolled_at: string
          id: string
          instructor_id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          status: string
          student_id: string
        }
        Insert: {
          enrolled_at?: string
          id?: string
          instructor_id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          status?: string
          student_id: string
        }
        Update: {
          enrolled_at?: string
          id?: string
          instructor_id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_students_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instrument_change_history: {
        Row: {
          changed_at: string
          from_instrument: string | null
          id: string
          to_instrument: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          from_instrument?: string | null
          id?: string
          to_instrument: string
          user_id: string
        }
        Update: {
          changed_at?: string
          from_instrument?: string | null
          id?: string
          to_instrument?: string
          user_id?: string
        }
        Relationships: []
      }
      instruments: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
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
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_bookmark: boolean
          lesson_id: string
          timestamp_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_bookmark?: boolean
          lesson_id: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_bookmark?: boolean
          lesson_id?: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string | null
          created_at: string
          id: string
          last_position_seconds: number
          lesson_id: string
          updated_at: string
          user_id: string
          watch_count: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          last_position_seconds?: number
          lesson_id: string
          updated_at?: string
          user_id: string
          watch_count?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          last_position_seconds?: number
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watch_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
      levels: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
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
          {
            foreignKeyName: "live_class_registrations_live_class_id_fkey"
            columns: ["live_class_id"]
            isOneToOne: false
            referencedRelation: "live_classes_with_zoom"
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
      material_leads: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          instagram_handle: string | null
          material_id: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          instagram_handle?: string | null
          material_id?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          instagram_handle?: string | null
          material_id?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_leads_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "free_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean
          last4: string | null
          provider: string
          provider_customer_id: string | null
          provider_method_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean
          last4?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_method_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean
          last4?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_method_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_ai_tools: {
        Row: {
          ai_tool_key: string
          created_at: string
          enabled: boolean
          id: string
          plan_key: string
        }
        Insert: {
          ai_tool_key: string
          created_at?: string
          enabled?: boolean
          id?: string
          plan_key: string
        }
        Update: {
          ai_tool_key?: string
          created_at?: string
          enabled?: boolean
          id?: string
          plan_key?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          advanced_content: boolean
          ai_tool_limit: number | null
          allow_practice_submissions: boolean
          allow_teacher_feedback: boolean
          created_at: string
          currency: string
          id: string
          is_active: boolean
          is_popular: boolean
          key: string
          name: string
          price_cents: number
          progress_tier: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          advanced_content?: boolean
          ai_tool_limit?: number | null
          allow_practice_submissions?: boolean
          allow_teacher_feedback?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          key: string
          name: string
          price_cents: number
          progress_tier?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          advanced_content?: boolean
          ai_tool_limit?: number | null
          allow_practice_submissions?: boolean
          allow_teacher_feedback?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          key?: string
          name?: string
          price_cents?: number
          progress_tier?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number
          id: string
          instrument: string
          notes: string | null
          user_id: string
          weekly_goal_minutes: number
        }
        Insert: {
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          instrument?: string
          notes?: string | null
          user_id: string
          weekly_goal_minutes?: number
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          instrument?: string
          notes?: string | null
          user_id?: string
          weekly_goal_minutes?: number
        }
        Relationships: []
      }
      private_lesson_orders: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          instrument_slug: string
          package_type: string
          provider_reference: string | null
          sessions_total: number
          sessions_used: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          instrument_slug: string
          package_type?: string
          provider_reference?: string | null
          sessions_total?: number
          sessions_used?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          instrument_slug?: string
          package_type?: string
          provider_reference?: string | null
          sessions_total?: number
          sessions_used?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          enabled_instruments: string[]
          full_name: string | null
          id: string
          phone: string | null
          preferred_instrument: string | null
          preferred_language: string | null
          primary_instrument: string | null
          subscription_expires_at: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status: string | null
          timezone: string | null
          trial_used: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          enabled_instruments?: string[]
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_instrument?: string | null
          preferred_language?: string | null
          primary_instrument?: string | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          timezone?: string | null
          trial_used?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          enabled_instruments?: string[]
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_instrument?: string | null
          preferred_language?: string | null
          primary_instrument?: string | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          timezone?: string | null
          trial_used?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_songs: {
        Row: {
          artist: string
          chords: string[] | null
          created_at: string
          difficulty: string | null
          id: string
          key: string | null
          progression: Json | null
          similar_songs: string[] | null
          song_title: string
          structure: Json | null
          tempo: string | null
          time_signature: string | null
          tips: string[] | null
          updated_at: string
          user_id: string
          video_id: string | null
          youtube_url: string
        }
        Insert: {
          artist: string
          chords?: string[] | null
          created_at?: string
          difficulty?: string | null
          id?: string
          key?: string | null
          progression?: Json | null
          similar_songs?: string[] | null
          song_title: string
          structure?: Json | null
          tempo?: string | null
          time_signature?: string | null
          tips?: string[] | null
          updated_at?: string
          user_id: string
          video_id?: string | null
          youtube_url: string
        }
        Update: {
          artist?: string
          chords?: string[] | null
          created_at?: string
          difficulty?: string | null
          id?: string
          key?: string | null
          progression?: Json | null
          similar_songs?: string[] | null
          song_title?: string
          structure?: Json | null
          tempo?: string | null
          time_signature?: string | null
          tips?: string[] | null
          updated_at?: string
          user_id?: string
          video_id?: string | null
          youtube_url?: string
        }
        Relationships: []
      }
      score_assignments: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          instructions: string | null
          score_id: string
          status: string
          student_notes: string | null
          student_user_id: string | null
          teacher_account_id: string
          teacher_student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          score_id: string
          status?: string
          student_notes?: string | null
          student_user_id?: string | null
          teacher_account_id: string
          teacher_student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          score_id?: string
          status?: string
          student_notes?: string | null
          student_user_id?: string | null
          teacher_account_id?: string
          teacher_student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_assignments_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_assignments_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_assignments_teacher_student_id_fkey"
            columns: ["teacher_student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          id: string
          instrument: string
          is_public: boolean
          key_signature: string
          level: string | null
          share_code: string
          tempo: number
          time_signature: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          instrument?: string
          is_public?: boolean
          key_signature?: string
          level?: string | null
          share_code?: string
          tempo?: number
          time_signature?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          instrument?: string
          is_public?: boolean
          key_signature?: string
          level?: string | null
          share_code?: string
          tempo?: number
          time_signature?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      song_corrections: {
        Row: {
          corrected_analysis: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
          video_id: string
          youtube_url: string | null
        }
        Insert: {
          corrected_analysis: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
          youtube_url?: string | null
        }
        Update: {
          corrected_analysis?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          instrument_slug: string | null
          metadata: Json
          plan_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          instrument_slug?: string | null
          metadata?: Json
          plan_key?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          instrument_slug?: string | null
          metadata?: Json
          plan_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_accounts: {
        Row: {
          bio: string | null
          contact_email: string | null
          created_at: string
          id: string
          invite_code: string
          notify_class_reminder: boolean
          notify_new_assignment: boolean
          notify_new_class: boolean
          owner_user_id: string
          phone: string | null
          plan: Database["public"]["Enums"]["teacher_plan"]
          primary_instrument: string | null
          seat_limit: number
          status: Database["public"]["Enums"]["teacher_account_status"]
          studio_name: string
          subscription_expires_at: string | null
          trial_ends_at: string
          updated_at: string
          zoom_email: string | null
          zoom_room_url: string | null
        }
        Insert: {
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          notify_class_reminder?: boolean
          notify_new_assignment?: boolean
          notify_new_class?: boolean
          owner_user_id: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["teacher_plan"]
          primary_instrument?: string | null
          seat_limit?: number
          status?: Database["public"]["Enums"]["teacher_account_status"]
          studio_name: string
          subscription_expires_at?: string | null
          trial_ends_at?: string
          updated_at?: string
          zoom_email?: string | null
          zoom_room_url?: string | null
        }
        Update: {
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          notify_class_reminder?: boolean
          notify_new_assignment?: boolean
          notify_new_class?: boolean
          owner_user_id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["teacher_plan"]
          primary_instrument?: string | null
          seat_limit?: number
          status?: Database["public"]["Enums"]["teacher_account_status"]
          studio_name?: string
          subscription_expires_at?: string | null
          trial_ends_at?: string
          updated_at?: string
          zoom_email?: string | null
          zoom_room_url?: string | null
        }
        Relationships: []
      }
      teacher_announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          id: string
          link: string | null
          send_email: boolean
          teacher_account_id: string
          teacher_student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          id?: string
          link?: string | null
          send_email?: boolean
          teacher_account_id: string
          teacher_student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          send_email?: boolean
          teacher_account_id?: string
          teacher_student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_announcements_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_announcements_teacher_student_id_fkey"
            columns: ["teacher_student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          instructions: string | null
          status: string
          student_notes: string | null
          teacher_account_id: string
          teacher_student_id: string
          title: string
          tool_key: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          status?: string
          student_notes?: string | null
          teacher_account_id: string
          teacher_student_id: string
          title: string
          tool_key?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          status?: string
          student_notes?: string | null
          teacher_account_id?: string
          teacher_student_id?: string
          title?: string
          tool_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_student_id_fkey"
            columns: ["teacher_student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_class_registrations: {
        Row: {
          attended: boolean
          id: string
          live_class_id: string
          registered_at: string
          student_user_id: string
          teacher_account_id: string
        }
        Insert: {
          attended?: boolean
          id?: string
          live_class_id: string
          registered_at?: string
          student_user_id: string
          teacher_account_id: string
        }
        Update: {
          attended?: boolean
          id?: string
          live_class_id?: string
          registered_at?: string
          student_user_id?: string
          teacher_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_class_registrations_live_class_id_fkey"
            columns: ["live_class_id"]
            isOneToOne: false
            referencedRelation: "teacher_live_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_class_registrations_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_courses: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          instrument: string | null
          is_published: boolean
          level: string
          sort_order: number
          teacher_account_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instrument?: string | null
          is_published?: boolean
          level?: string
          sort_order?: number
          teacher_account_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instrument?: string | null
          is_published?: boolean
          level?: string
          sort_order?: number
          teacher_account_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_courses_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          last_position_seconds: number
          student_user_id: string
          teacher_account_id: string
          teacher_lesson_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position_seconds?: number
          student_user_id: string
          teacher_account_id: string
          teacher_lesson_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position_seconds?: number
          student_user_id?: string
          teacher_account_id?: string
          teacher_lesson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_lesson_progress_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_lesson_progress_teacher_lesson_id_fkey"
            columns: ["teacher_lesson_id"]
            isOneToOne: false
            referencedRelation: "teacher_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_lessons: {
        Row: {
          attachment_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          sort_order: number
          teacher_account_id: string
          teacher_course_id: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          sort_order?: number
          teacher_account_id: string
          teacher_course_id: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          sort_order?: number
          teacher_account_id?: string
          teacher_course_id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_lessons_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_lessons_teacher_course_id_fkey"
            columns: ["teacher_course_id"]
            isOneToOne: false
            referencedRelation: "teacher_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_live_classes: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instrument: string | null
          is_published: boolean
          join_url: string | null
          level: string | null
          max_attendees: number | null
          meeting_id: string | null
          passcode: string | null
          recording_url: string | null
          scheduled_at: string
          status: string
          teacher_account_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instrument?: string | null
          is_published?: boolean
          join_url?: string | null
          level?: string | null
          max_attendees?: number | null
          meeting_id?: string | null
          passcode?: string | null
          recording_url?: string | null
          scheduled_at: string
          status?: string
          teacher_account_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instrument?: string | null
          is_published?: boolean
          join_url?: string | null
          level?: string | null
          max_attendees?: number | null
          meeting_id?: string | null
          passcode?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          teacher_account_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_live_classes_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          body: string
          created_at: string
          id: string
          image_url: string | null
          instructor_id: string | null
          instrument: Database["public"]["Enums"]["instrument_type"]
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          instrument: Database["public"]["Enums"]["instrument_type"]
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          instrument?: Database["public"]["Enums"]["instrument_type"]
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_students: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          instrument: string | null
          invited_at: string
          joined_at: string | null
          level: string | null
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["teacher_student_status"]
          student_user_id: string | null
          teacher_account_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          instrument?: string | null
          invited_at?: string
          joined_at?: string | null
          level?: string | null
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["teacher_student_status"]
          student_user_id?: string | null
          teacher_account_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          instrument?: string | null
          invited_at?: string
          joined_at?: string | null
          level?: string | null
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["teacher_student_status"]
          student_user_id?: string | null
          teacher_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_students_teacher_account_id_fkey"
            columns: ["teacher_account_id"]
            isOneToOne: false
            referencedRelation: "teacher_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_name: string
          avatar_url: string | null
          created_at: string
          id: string
          is_approved: boolean
          quote: string
          role_or_instrument: string | null
          sort_order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          quote: string
          role_or_instrument?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          quote?: string
          role_or_instrument?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trials: {
        Row: {
          canceled_at: string | null
          converted_at: string | null
          created_at: string
          ends_at: string
          id: string
          instrument_slug: string | null
          plan_key: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          converted_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          instrument_slug?: string | null
          plan_key: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          converted_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          instrument_slug?: string | null
          plan_key?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_instruments: {
        Row: {
          activated_at: string
          created_at: string
          id: string
          instrument_slug: string
          level_key: string | null
          paused_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          id?: string
          instrument_slug: string
          level_key?: string | null
          paused_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          id?: string
          instrument_slug?: string
          level_key?: string | null
          paused_at?: string | null
          status?: string
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
      courses_admin_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string | null
          instrument: Database["public"]["Enums"]["instrument_type"] | null
          is_published: boolean | null
          level: Database["public"]["Enums"]["course_level"] | null
          required_plan: Database["public"]["Enums"]["subscription_plan"] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string | null
          instrument?: Database["public"]["Enums"]["instrument_type"] | null
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["course_level"] | null
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string | null
          instrument?: Database["public"]["Enums"]["instrument_type"] | null
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["course_level"] | null
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      live_classes_with_zoom: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string | null
          instructor_id: string | null
          instrument: Database["public"]["Enums"]["instrument_type"] | null
          is_recorded: boolean | null
          max_attendees: number | null
          recording_url: string | null
          required_plan: Database["public"]["Enums"]["subscription_plan"] | null
          scheduled_at: string | null
          title: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string | null
          instructor_id?: string | null
          instrument?: Database["public"]["Enums"]["instrument_type"] | null
          is_recorded?: boolean | null
          max_attendees?: number | null
          recording_url?: string | null
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          scheduled_at?: string | null
          title?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string | null
          instructor_id?: string | null
          instrument?: Database["public"]["Enums"]["instrument_type"] | null
          is_recorded?: boolean | null
          max_attendees?: number | null
          recording_url?: string | null
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          scheduled_at?: string | null
          title?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      active_instrument: { Args: { _user_id: string }; Returns: string }
      broadcast_notification: {
        Args: {
          _body?: string
          _instrument?: string
          _link?: string
          _title: string
        }
        Returns: number
      }
      can_access_instrument: {
        Args: { _instrument: string; _user_id: string }
        Returns: boolean
      }
      can_start_trial: { Args: { _user_id: string }; Returns: boolean }
      can_use_ai_tool: {
        Args: { _tool_key: string; _user_id: string }
        Returns: boolean
      }
      claim_studio_invite: {
        Args: { _invite_code: string }
        Returns: {
          account_id: string
          joined: boolean
          message: string
          studio_name: string
        }[]
      }
      current_entitlement: {
        Args: { _user_id: string }
        Returns: {
          advanced_content: boolean
          ai_tool_limit: number
          allow_practice_submissions: boolean
          allow_teacher_feedback: boolean
          current_period_end: string
          instrument_slug: string
          is_admin: boolean
          level_key: string
          plan_key: string
          status: string
          trial_days_left: number
          trial_ends_at: string
        }[]
      }
      get_user_instrument: { Args: { _user_id: string }; Returns: string }
      get_user_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      group_seat_counts: {
        Args: { _group_id: string }
        Returns: {
          total: number
          trials: number
        }[]
      }
      has_course_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_instrument_access: {
        Args: { _instrument: string; _user_id: string }
        Returns: boolean
      }
      has_pro_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_student_of_account: { Args: { _account_id: string }; Returns: boolean }
      join_group: {
        Args: { _group_id: string }
        Returns: {
          message: string
          ok: boolean
        }[]
      }
      mark_notifications_read: { Args: { _ids?: string[] }; Returns: number }
      my_studio_account_id: { Args: never; Returns: string }
      my_teacher_account_id: { Args: never; Returns: string }
      owns_teacher_account: { Args: { _account_id: string }; Returns: boolean }
      push_notification: {
        Args: {
          _body?: string
          _link?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      set_active_instrument: {
        Args: { _instrument: string; _level?: string }
        Returns: {
          message: string
          ok: boolean
        }[]
      }
      slugify: { Args: { input: string }; Returns: string }
      start_trial: {
        Args: { _instrument?: string; _plan_key: string }
        Returns: {
          message: string
          ok: boolean
          trial_ends_at: string
        }[]
      }
      studio_status: {
        Args: { _account_id: string }
        Returns: {
          days_left: number
          is_active: boolean
          plan: string
          seat_limit: number
          seats_used: number
          status: string
        }[]
      }
      teacher_seats_used: { Args: { _account_id: string }; Returns: number }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          course_title: string
          id: string
          issued_at: string
          student_name: string
          verification_code: string
        }[]
      }
    }
    Enums: {
      ad_platform: "facebook" | "instagram" | "tiktok" | "google"
      app_role: "admin" | "instructor" | "student"
      application_status: "pending" | "approved" | "rejected"
      campaign_health: "healthy" | "needs_optimization" | "underperforming"
      campaign_status: "active" | "paused" | "completed" | "draft"
      course_level: "beginner" | "intermediate" | "advanced"
      instrument_type: "guitar" | "piano" | "drums" | "banjo"
      lead_status: "new" | "contacted" | "qualified" | "closed" | "lost"
      subscription_plan: "basic" | "standard" | "pro" | "production"
      teacher_account_status: "trial" | "active" | "suspended" | "canceled"
      teacher_plan: "starter" | "pro" | "academy"
      teacher_student_status: "invited" | "active" | "inactive"
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
      application_status: ["pending", "approved", "rejected"],
      campaign_health: ["healthy", "needs_optimization", "underperforming"],
      campaign_status: ["active", "paused", "completed", "draft"],
      course_level: ["beginner", "intermediate", "advanced"],
      instrument_type: ["guitar", "piano", "drums", "banjo"],
      lead_status: ["new", "contacted", "qualified", "closed", "lost"],
      subscription_plan: ["basic", "standard", "pro", "production"],
      teacher_account_status: ["trial", "active", "suspended", "canceled"],
      teacher_plan: ["starter", "pro", "academy"],
      teacher_student_status: ["invited", "active", "inactive"],
    },
  },
} as const
