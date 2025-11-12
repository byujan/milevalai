export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      evaluations: {
        Row: {
          id: string
          user_id: string
          duty_title: string
          evaluation_type: 'NCOER' | 'OER'
          evaluation_subtype: 'Annual' | 'Change of Rater' | 'Relief for Cause'
          rank_level: 'O1-O3' | 'O4-O5' | 'O6' | 'E5' | 'E6-E8' | 'E9'
          status: 'draft' | 'bullets_draft' | 'bullets_categorized' | 'rater_complete' | 'senior_rater_complete' | 'completed'
          predecessor_file_url: string | null
          predecessor_analysis: Json | null
          raw_bullets: Json | null
          categorized_bullets: Json | null
          rater_comments: string | null
          senior_rater_comments: string | null
          bullets: Json | null
          narrative: string | null
          form_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          duty_title: string
          evaluation_type: 'NCOER' | 'OER'
          evaluation_subtype: 'Annual' | 'Change of Rater' | 'Relief for Cause'
          rank_level: 'O1-O3' | 'O4-O5' | 'O6' | 'E5' | 'E6-E8' | 'E9'
          status?: 'draft' | 'bullets_draft' | 'bullets_categorized' | 'rater_complete' | 'senior_rater_complete' | 'completed'
          predecessor_file_url?: string | null
          predecessor_analysis?: Json | null
          raw_bullets?: Json | null
          categorized_bullets?: Json | null
          rater_comments?: string | null
          senior_rater_comments?: string | null
          bullets?: Json | null
          narrative?: string | null
          form_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          duty_title?: string
          evaluation_type?: 'NCOER' | 'OER'
          evaluation_subtype?: 'Annual' | 'Change of Rater' | 'Relief for Cause'
          rank_level?: 'O1-O3' | 'O4-O5' | 'O6' | 'E5' | 'E6-E8' | 'E9'
          status?: 'draft' | 'bullets_draft' | 'bullets_categorized' | 'rater_complete' | 'senior_rater_complete' | 'completed'
          predecessor_file_url?: string | null
          predecessor_analysis?: Json | null
          raw_bullets?: Json | null
          categorized_bullets?: Json | null
          rater_comments?: string | null
          senior_rater_comments?: string | null
          bullets?: Json | null
          narrative?: string | null
          form_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      bullet_library: {
        Row: {
          id: string
          user_id: string
          category: 'Character' | 'Presence' | 'Intellect' | 'Leads' | 'Develops' | 'Achieves'
          content: string
          tags: string[] | null
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: 'Character' | 'Presence' | 'Intellect' | 'Leads' | 'Develops' | 'Achieves'
          content: string
          tags?: string[] | null
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: 'Character' | 'Presence' | 'Intellect' | 'Leads' | 'Develops' | 'Achieves'
          content?: string
          tags?: string[] | null
          usage_count?: number
          created_at?: string
        }
      }
      rater_tendencies: {
        Row: {
          id: string
          user_id: string
          rater_name: string | null
          mq_count: number
          hq_count: number
          qualified_count: number
          nq_count: number
          avg_word_count: number | null
          tone_profile: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rater_name?: string | null
          mq_count?: number
          hq_count?: number
          qualified_count?: number
          nq_count?: number
          avg_word_count?: number | null
          tone_profile?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rater_name?: string | null
          mq_count?: number
          hq_count?: number
          qualified_count?: number
          nq_count?: number
          avg_word_count?: number | null
          tone_profile?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

