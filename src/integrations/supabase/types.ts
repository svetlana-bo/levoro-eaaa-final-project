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
      blog_posts: {
        Row: {
          author_name: string | null
          category: string | null
          content_blocks: Json | null
          created_at: string
          excerpt: string | null
          id: string
          introduction: string | null
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          scheduled_publish_at: string | null
          show_toc: boolean
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content_blocks?: Json | null
          created_at?: string
          excerpt?: string | null
          id?: string
          introduction?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          show_toc?: boolean
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content_blocks?: Json | null
          created_at?: string
          excerpt?: string | null
          id?: string
          introduction?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          show_toc?: boolean
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bundle_courses: {
        Row: {
          bundle_id: string
          course_id: string
          created_at: string
          id: string
        }
        Insert: {
          bundle_id: string
          course_id: string
          created_at?: string
          id?: string
        }
        Update: {
          bundle_id?: string
          course_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_courses_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string
          description: string | null
          display_id: number
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          page_content: string | null
          price_eur: number
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_id?: never
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_content?: string | null
          price_eur?: number
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_id?: never
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_content?: string | null
          price_eur?: number
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      consent_log: {
        Row: {
          accepted_at: string
          consent_type: string
          id: string
          ip_country: string | null
          method: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          consent_type: string
          id?: string
          ip_country?: string | null
          method?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          consent_type?: string
          id?: string
          ip_country?: string | null
          method?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_user_id: string | null
          body: string
          created_at: string
          direction: string
          id: string
          resend_message_id: string | null
          sender_email: string
          sender_name: string
          thread_id: string
        }
        Insert: {
          admin_user_id?: string | null
          body?: string
          created_at?: string
          direction: string
          id?: string
          resend_message_id?: string | null
          sender_email?: string
          sender_name?: string
          thread_id: string
        }
        Update: {
          admin_user_id?: string | null
          body?: string
          created_at?: string
          direction?: string
          id?: string
          resend_message_id?: string | null
          sender_email?: string
          sender_name?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "contact_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_threads: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_read: boolean
          last_message_at: string
          metadata: Json
          sender_email: string
          sender_name: string
          source_page: string
          subject: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          last_message_at?: string
          metadata?: Json
          sender_email: string
          sender_name?: string
          source_page: string
          subject?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          last_message_at?: string
          metadata?: Json
          sender_email?: string
          sender_name?: string
          source_page?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "contact_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          category_id: string
          course_id: string
          id: string
        }
        Insert: {
          category_id: string
          course_id: string
          id?: string
        }
        Update: {
          category_id?: string
          course_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_categories_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          review_date: string | null
          review_text: string
          reviewer_name: string | null
          source: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating: number
          review_date?: string | null
          review_text?: string
          reviewer_name?: string | null
          source?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          review_date?: string | null
          review_text?: string
          reviewer_name?: string | null
          source?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_subcategories: {
        Row: {
          course_id: string
          id: string
          subcategory_id: string
        }
        Insert: {
          course_id: string
          id?: string
          subcategory_id: string
        }
        Update: {
          course_id?: string
          id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_subcategories_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_type: string
          certificate_enabled: boolean
          course_details: Json | null
          created_at: string
          description: string | null
          display_id: number
          id: string
          instructor_id: string
          is_free: boolean
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          owner_company_id: string | null
          owner_id: string | null
          owner_type: string
          preview_video_url: string | null
          price_eur: number
          scheduled_publish_at: string | null
          status: Database["public"]["Enums"]["course_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_type?: string
          certificate_enabled?: boolean
          course_details?: Json | null
          created_at?: string
          description?: string | null
          display_id?: never
          id?: string
          instructor_id: string
          is_free?: boolean
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          owner_company_id?: string | null
          owner_id?: string | null
          owner_type?: string
          preview_video_url?: string | null
          price_eur?: number
          scheduled_publish_at?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_type?: string
          certificate_enabled?: boolean
          course_details?: Json | null
          created_at?: string
          description?: string | null
          display_id?: never
          id?: string
          instructor_id?: string
          is_free?: boolean
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          owner_company_id?: string | null
          owner_id?: string | null
          owner_type?: string
          preview_video_url?: string | null
          price_eur?: number
          scheduled_publish_at?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_owner_company_id_fkey"
            columns: ["owner_company_id"]
            isOneToOne: false
            referencedRelation: "v_b2b_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_prices: {
        Row: {
          created_at: string
          currency_code: string
          id: string
          plan_id: string
          price: number
        }
        Insert: {
          created_at?: string
          currency_code: string
          id?: string
          plan_id: string
          price: number
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          plan_id?: string
          price?: number
        }
        Relationships: []
      }
      custom_hotspot_icons: {
        Row: {
          created_at: string
          icon_url: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon_url: string
          id?: string
          name?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon_url?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          email_type: string
          event_type: string
          id: string
          metadata: Json | null
          recipient_email: string
          template_id: string | null
          template_name: string
        }
        Insert: {
          created_at?: string
          email_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          template_id?: string | null
          template_name?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          template_id?: string | null
          template_name?: string
        }
        Relationships: []
      }
      email_flow_connections: {
        Row: {
          created_at: string
          flow_id: string
          id: string
          label: string | null
          source_node_id: string
          target_node_id: string
        }
        Insert: {
          created_at?: string
          flow_id: string
          id?: string
          label?: string | null
          source_node_id: string
          target_node_id: string
        }
        Update: {
          created_at?: string
          flow_id?: string
          id?: string
          label?: string | null
          source_node_id?: string
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_flow_connections_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "email_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_flow_connections_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "email_flow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_flow_connections_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "email_flow_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_flow_nodes: {
        Row: {
          config: Json
          created_at: string
          flow_id: string
          id: string
          position_x: number
          position_y: number
          type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          flow_id: string
          id?: string
          position_x?: number
          position_y?: number
          type?: string
        }
        Update: {
          config?: Json
          created_at?: string
          flow_id?: string
          id?: string
          position_x?: number
          position_y?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_flow_nodes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "email_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      email_flow_runs: {
        Row: {
          created_at: string
          flow_id: string
          flow_node_id: string
          id: string
          recipient_email: string
          resend_message_id: string | null
          status: string
          wait_until: string | null
        }
        Insert: {
          created_at?: string
          flow_id: string
          flow_node_id: string
          id?: string
          recipient_email: string
          resend_message_id?: string | null
          status?: string
          wait_until?: string | null
        }
        Update: {
          created_at?: string
          flow_id?: string
          flow_node_id?: string
          id?: string
          recipient_email?: string
          resend_message_id?: string | null
          status?: string
          wait_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_flow_runs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "email_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_flow_runs_flow_node_id_fkey"
            columns: ["flow_node_id"]
            isOneToOne: false
            referencedRelation: "email_flow_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_flows: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          recipient_data: Json
          recipient_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          recipient_data?: Json
          recipient_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          recipient_data?: Json
          recipient_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string
          id: string
          invite_body: string
          invite_footer_config: Json
          invite_header_config: Json
          invite_heading: string
          invite_preheader: string
          invite_subject: string
          reset_body: string
          reset_footer_config: Json
          reset_header_config: Json
          reset_heading: string
          reset_preheader: string
          reset_subject: string
          sender_email: string
          sender_name: string
          updated_at: string
          verify_body: string | null
          verify_footer_config: Json | null
          verify_header_config: Json | null
          verify_heading: string | null
          verify_preheader: string | null
          verify_subject: string | null
          welcome_body: string
          welcome_footer_config: Json
          welcome_header_config: Json
          welcome_heading: string
          welcome_preheader: string
          welcome_subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_body?: string
          invite_footer_config?: Json
          invite_header_config?: Json
          invite_heading?: string
          invite_preheader?: string
          invite_subject?: string
          reset_body?: string
          reset_footer_config?: Json
          reset_header_config?: Json
          reset_heading?: string
          reset_preheader?: string
          reset_subject?: string
          sender_email?: string
          sender_name?: string
          updated_at?: string
          verify_body?: string | null
          verify_footer_config?: Json | null
          verify_header_config?: Json | null
          verify_heading?: string | null
          verify_preheader?: string | null
          verify_subject?: string | null
          welcome_body?: string
          welcome_footer_config?: Json
          welcome_header_config?: Json
          welcome_heading?: string
          welcome_preheader?: string
          welcome_subject?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_body?: string
          invite_footer_config?: Json
          invite_header_config?: Json
          invite_heading?: string
          invite_preheader?: string
          invite_subject?: string
          reset_body?: string
          reset_footer_config?: Json
          reset_header_config?: Json
          reset_heading?: string
          reset_preheader?: string
          reset_subject?: string
          sender_email?: string
          sender_name?: string
          updated_at?: string
          verify_body?: string | null
          verify_footer_config?: Json | null
          verify_header_config?: Json | null
          verify_heading?: string | null
          verify_preheader?: string | null
          verify_subject?: string | null
          welcome_body?: string
          welcome_footer_config?: Json
          welcome_header_config?: Json
          welcome_heading?: string
          welcome_preheader?: string
          welcome_subject?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorite_colors: {
        Row: {
          created_at: string
          hex_value: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          hex_value: string
          id?: string
          name?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          hex_value?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      instructor_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      instructor_companies: {
        Row: {
          bio: string | null
          country: string | null
          created_at: string
          display_id: number
          id: string
          linkedin_url: string | null
          logo_url: string | null
          name: string
          slug: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          country?: string | null
          created_at?: string
          display_id?: number
          id?: string
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          slug?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          country?: string | null
          created_at?: string
          display_id?: number
          id?: string
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          slug?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      instructor_company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          member_role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          member_role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          member_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "instructor_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_expertise: {
        Row: {
          category_id: string
          created_at: string
          instructor_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          instructor_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          instructor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_expertise_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "instructor_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_articles: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          custom_key: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type?: string
          created_at?: string
          custom_key?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          custom_key?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          lesson_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          lesson_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_files_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
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
          audio_url: string | null
          content: string | null
          content_blocks: Json | null
          course_id: string
          created_at: string
          exercises: Json | null
          id: string
          module_id: string | null
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          content_blocks?: Json | null
          course_id: string
          created_at?: string
          exercises?: Json | null
          id?: string
          module_id?: string | null
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          content_blocks?: Json | null
          course_id?: string
          created_at?: string
          exercises?: Json | null
          id?: string
          module_id?: string | null
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_email_sends: {
        Row: {
          click_url: string | null
          clicked_at: string | null
          created_at: string
          flow_id: string | null
          flow_node_id: string | null
          id: string
          is_clicked: boolean
          is_opened: boolean
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_user_id: string | null
          resend_message_id: string | null
          status: string
          template_id: string | null
          template_name: string
        }
        Insert: {
          click_url?: string | null
          clicked_at?: string | null
          created_at?: string
          flow_id?: string | null
          flow_node_id?: string | null
          id?: string
          is_clicked?: boolean
          is_opened?: boolean
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_user_id?: string | null
          resend_message_id?: string | null
          status?: string
          template_id?: string | null
          template_name?: string
        }
        Update: {
          click_url?: string | null
          clicked_at?: string | null
          created_at?: string
          flow_id?: string | null
          flow_node_id?: string | null
          id?: string
          is_clicked?: boolean
          is_opened?: boolean
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_user_id?: string | null
          resend_message_id?: string | null
          status?: string
          template_id?: string | null
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_email_sends_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "email_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_email_sends_flow_node_id_fkey"
            columns: ["flow_node_id"]
            isOneToOne: false
            referencedRelation: "email_flow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketing_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_emails: {
        Row: {
          body: string
          body_blocks: Json
          buttons: Json
          created_at: string
          footer_config: Json
          group_id: string | null
          header_config: Json
          header_text: string
          id: string
          preheader: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          body_blocks?: Json
          buttons?: Json
          created_at?: string
          footer_config?: Json
          group_id?: string | null
          header_config?: Json
          header_text?: string
          id?: string
          preheader?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          body_blocks?: Json
          buttons?: Json
          created_at?: string
          footer_config?: Json
          group_id?: string | null
          header_config?: Json
          header_text?: string
          id?: string
          preheader?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_emails_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "email_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          badge: string | null
          billing_period: string
          created_at: string
          discount_ends_at: string | null
          features: string[]
          id: string
          is_featured: boolean
          months: number
          original_price_eur: number
          price_eur: number
          sort_order: number
          title: string
          trial_days: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          billing_period: string
          created_at?: string
          discount_ends_at?: string | null
          features?: string[]
          id: string
          is_featured?: boolean
          months?: number
          original_price_eur: number
          price_eur: number
          sort_order?: number
          title: string
          trial_days?: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          billing_period?: string
          created_at?: string
          discount_ends_at?: string | null
          features?: string[]
          id?: string
          is_featured?: boolean
          months?: number
          original_price_eur?: number
          price_eur?: number
          sort_order?: number
          title?: string
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          unsubscribe_source: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          unsubscribe_source?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          unsubscribe_source?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      popups: {
        Row: {
          bg_color: string
          bg_image_url: string | null
          button_color: string
          button_text: string
          button_text_color: string
          created_at: string
          delay_seconds: number
          description: string
          heading: string
          id: string
          image_url: string | null
          input_border_color: string
          is_active: boolean
          promo_content_html: string | null
          promo_link_url: string | null
          target_pages: string[]
          text_color: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          bg_image_url?: string | null
          button_color?: string
          button_text?: string
          button_text_color?: string
          created_at?: string
          delay_seconds?: number
          description?: string
          heading?: string
          id?: string
          image_url?: string | null
          input_border_color?: string
          is_active?: boolean
          promo_content_html?: string | null
          promo_link_url?: string | null
          target_pages?: string[]
          text_color?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          bg_image_url?: string | null
          button_color?: string
          button_text?: string
          button_text_color?: string
          created_at?: string
          delay_seconds?: number
          description?: string
          heading?: string
          id?: string
          image_url?: string | null
          input_border_color?: string
          is_active?: boolean
          promo_content_html?: string | null
          promo_link_url?: string | null
          target_pages?: string[]
          text_color?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_id: string | null
          company_name: string | null
          country: string | null
          department: string | null
          display_id: number
          first_name: string | null
          id: string
          instructor_type: Database["public"]["Enums"]["instructor_type"] | null
          invite_sent: boolean
          last_login: string | null
          last_name: string | null
          linkedin_url: string | null
          status: "active" | "invited" | "disabled"
          subscription_end_date: string | null
          subscription_plan_name: string | null
          subscription_start_date: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          user_created_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          company_name?: string | null
          country?: string | null
          department?: string | null
          display_id?: never
          first_name?: string | null
          id: string
          instructor_type?:
            | Database["public"]["Enums"]["instructor_type"]
            | null
          invite_sent?: boolean
          last_login?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          status?: "active" | "invited" | "disabled"
          subscription_end_date?: string | null
          subscription_plan_name?: string | null
          subscription_start_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          user_created_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          company_name?: string | null
          country?: string | null
          department?: string | null
          display_id?: never
          first_name?: string | null
          id?: string
          instructor_type?:
            | Database["public"]["Enums"]["instructor_type"]
            | null
          invite_sent?: boolean
          last_login?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          status?: "active" | "invited" | "disabled"
          subscription_end_date?: string | null
          subscription_plan_name?: string | null
          subscription_start_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          user_created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_b2b_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          bg_color: string
          content_html: string
          created_at: string
          id: string
          is_active: boolean
          target_pages: string[]
          text_color: string
          type: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          content_html?: string
          created_at?: string
          id?: string
          is_active?: boolean
          target_pages?: string[]
          text_color?: string
          type?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          content_html?: string
          created_at?: string
          id?: string
          is_active?: boolean
          target_pages?: string[]
          text_color?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommended_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sort_order: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "recommended_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_queries: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          sql_query: string
          system_key: string | null
          target_page: string | null
          title: string
          updated_at: string
          visualization_config: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          sql_query?: string
          system_key?: string | null
          target_page?: string | null
          title?: string
          updated_at?: string
          visualization_config?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          sql_query?: string
          system_key?: string | null
          target_page?: string | null
          title?: string
          updated_at?: string
          visualization_config?: Json | null
        }
        Relationships: []
      }
      site_images: {
        Row: {
          alt_text: string
          id: string
          image_key: string
          updated_at: string
          value: string
        }
        Insert: {
          alt_text?: string
          id?: string
          image_key: string
          updated_at?: string
          value?: string
        }
        Update: {
          alt_text?: string
          id?: string
          image_key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content: string
          id: string
          meta_description: string | null
          meta_title: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id: string
          meta_description?: string | null
          meta_title?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lesson_id: string | null
          note_content: string
          selected_text: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          note_content?: string
          selected_text?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          note_content?: string
          selected_text?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_eur: number | null
          amount_paid: number
          course_id: string | null
          created_at: string
          currency_code: string | null
          display_id: number
          exchange_rate_eur: number | null
          id: string
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          subscription_tier: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount_eur?: number | null
          amount_paid?: number
          course_id?: string | null
          created_at?: string
          currency_code?: string | null
          display_id?: number
          exchange_rate_eur?: number | null
          id?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount_eur?: number | null
          amount_paid?: number
          course_id?: string | null
          created_at?: string
          currency_code?: string | null
          display_id?: number
          exchange_rate_eur?: number | null
          id?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_b2b_members"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      instructor_public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          category_ids: string[] | null
          category_names: string[] | null
          company_name: string | null
          country: string | null
          first_name: string | null
          id: string | null
          instructor_type: Database["public"]["Enums"]["instructor_type"] | null
          last_name: string | null
          linkedin_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          category_ids?: never
          category_names?: never
          company_name?: string | null
          country?: string | null
          first_name?: string | null
          id?: string | null
          instructor_type?:
            | Database["public"]["Enums"]["instructor_type"]
            | null
          last_name?: string | null
          linkedin_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          category_ids?: never
          category_names?: never
          company_name?: string | null
          country?: string | null
          first_name?: string | null
          id?: string | null
          instructor_type?:
            | Database["public"]["Enums"]["instructor_type"]
            | null
          last_name?: string | null
          linkedin_url?: string | null
        }
        Relationships: []
      }
      v_b2b_audit_feed: {
        Row: {
          action: string | null
          actor_name: string | null
          actor_user_id: string | null
          company_id: string | null
          id: string | null
          occurred_at: string | null
          target_resource_id: string | null
          target_type: string | null
        }
        Relationships: []
      }
      v_b2b_companies: {
        Row: {
          billing_status: string | null
          created_at: string | null
          domain: string | null
          id: string | null
          license_expires_at: string | null
          license_status: string | null
          name: string | null
          notes: string | null
          primary_contact_email: string | null
          seat_count: number | null
          seats_used: number | null
          tier: string | null
        }
        Insert: {
          billing_status?: never
          created_at?: string | null
          domain?: string | null
          id?: string | null
          license_expires_at?: string | null
          license_status?: never
          name?: string | null
          notes?: string | null
          primary_contact_email?: string | null
          seat_count?: number | null
          seats_used?: number | null
          tier?: never
        }
        Update: {
          billing_status?: never
          created_at?: string | null
          domain?: string | null
          id?: string | null
          license_expires_at?: string | null
          license_status?: never
          name?: string | null
          notes?: string | null
          primary_contact_email?: string | null
          seat_count?: number | null
          seats_used?: number | null
          tier?: never
        }
        Relationships: []
      }
      v_b2b_enrolments: {
        Row: {
          assigned_at: string | null
          company_id: string | null
          course_id: string | null
          course_title: string | null
          due_date: string | null
          id: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_b2b_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_b2b_members: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          department: string | null
          first_name: string | null
          full_name: string | null
          last_active_at: string | null
          last_name: string | null
          role: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_b2b_companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_course_lesson_outline: {
        Args: { _course_id: string }
        Returns: {
          id: string
          module_id: string
          order_index: number
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member_of_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "student"
        | "instructor"
        | "admin"
        | "webadmin"
        | "company_admin"
        | "company_student"
      course_status: "draft" | "pending_review" | "published"
      instructor_type: "individual" | "company" | "company_member"
      subscription_status: "active" | "inactive" | "cancelled" | "expired"
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
      app_role: [
        "student",
        "instructor",
        "admin",
        "webadmin",
        "company_admin",
        "company_student",
      ],
      course_status: ["draft", "pending_review", "published"],
      instructor_type: ["individual", "company", "company_member"],
      subscription_status: ["active", "inactive", "cancelled", "expired"],
    },
  },
} as const
