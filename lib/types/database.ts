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
          status: 'draft' | 'bullets_complete' | 'narrative_complete' | 'completed'
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
          status?: 'draft' | 'bullets_complete' | 'narrative_complete' | 'completed'
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
          status?: 'draft' | 'bullets_complete' | 'narrative_complete' | 'completed'
          bullets?: Json | null
          narrative?: string | null
          form_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

