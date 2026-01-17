export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// Form Types - Per DA Pam 623-3
// ============================================

export type EvaluationType = 'NCOER' | 'OER';
export type EvaluationSubtype = 'Annual' | 'Change of Rater' | 'Relief for Cause' | 'Complete the Record' | 'Senior Rater Option' | '60 Day Option';
export type RankLevel = 'O1-O3' | 'O4-O5' | 'O6' | 'E5' | 'E6-E8' | 'E9';
export type Component = 'RA' | 'USAR' | 'ARNG';
export type StatusCode = 'AD' | 'AGR' | 'TPU' | 'IMA' | 'IRR' | 'MOB';
export type BulletCategory = 'Character' | 'Presence' | 'Intellect' | 'Leads' | 'Develops' | 'Achieves';

// Performance ratings
export type OERPerformanceRating = 'EXCELS' | 'PROFICIENT' | 'CAPABLE' | 'UNSATISFACTORY';
export type OERPotentialRating = 'MOST QUALIFIED' | 'HIGHLY QUALIFIED' | 'QUALIFIED' | 'NOT QUALIFIED';
export type NCOERPerformanceRating = 'FAR EXCEEDED STANDARD' | 'EXCEEDED STANDARD' | 'MET STANDARD' | 'DID NOT MEET STANDARD';
export type NCOERMetStandard = 'MET STANDARD' | 'DID NOT MEET STANDARD';

// ============================================
// Rating Chain Interfaces
// ============================================

export interface RatingOfficial {
  name: string;           // Last, First MI
  dodid?: string;         // 10-digit DOD ID
  rank: string;
  pmos_branch?: string;   // PMOS for NCO, Branch/AOC for Officer
  position: string;
  organization?: string;
  email: string;          // .gov or .mil
  phone?: string;
  signature_date?: string; // YYYYMMDD
}

export interface RaterInfo extends RatingOfficial {
  support_form_received?: boolean;
  num_rated_in_grade?: number;  // "I currently rate X in this grade"
}

export interface SeniorRaterInfo extends RatingOfficial {
  num_senior_rated_in_grade?: number;  // "I currently senior rate X in this grade"
  is_profile_owner?: boolean;
}

export interface SupplementaryReviewer extends RatingOfficial {
  comments_enclosed?: boolean;
}

// ============================================
// Part I - Administrative Data
// ============================================

export interface RatedPersonnel {
  name: string;              // Last, First MI
  dodid: string;             // 10-digit DOD ID (no SSN)
  rank: string;
  date_of_rank: string;      // YYYYMMDD
  pmos_aoc: string;          // PMOS for NCO, AOC for Officer
  branch?: string;           // For officers
  component: Component;
  status_code: StatusCode;
  unit_org_station: string;  // Full unit/org/station/ZIP/APO/Major Command
  uic: string;               // 6-character alphanumeric
  email: string;             // .gov or .mil
}

export interface PeriodCovered {
  from_date: string;         // YYYYMMDD
  thru_date: string;         // YYYYMMDD
  rated_months: number;      // Auto-calculated
  nonrated_codes?: string[]; // Per Table 2-25
}

export interface ReasonForSubmission {
  code: string;              // Per Table 2-24
  description: string;
}

// ============================================
// Part II - Authentication / Rating Chain
// ============================================

export interface RatingChain {
  rater: RaterInfo;
  intermediate_rater?: RatingOfficial;  // Required for some OERs
  senior_rater: SeniorRaterInfo;
  supplementary_reviewer?: SupplementaryReviewer;  // Required when SR not Army
}

// ============================================
// Part III - Duty Description
// ============================================

export interface DutyDescription {
  principal_duty_title: string;
  duty_mosc?: string;              // For NCOERs
  position_aoc_branch?: string;    // For OERs
  significant_duties: string;      // Free text
  areas_of_emphasis?: string;      // For NCOERs
  appointed_duties?: string;       // UPL, SHARP, CFL, etc.
  counseling_dates: {
    initial: string;               // YYYYMMDD
    quarterly?: string[];          // Array of YYYYMMDD dates
  };
}

// ============================================
// Part IV - Fitness / Physical Data
// ============================================

export interface FitnessData {
  acft_status: 'Pass' | 'Fail' | 'Profile' | 'Exempt';
  acft_date?: string;              // YYYYMMDD - must be within period covered
  height?: string;                 // inches
  weight?: string;                 // pounds
  within_standard: boolean;
  body_fat_required?: boolean;     // DA 5500/5501
  profile_info?: string;           // If on profile
}

// ============================================
// Part IV - Rater Assessment
// ============================================

export interface OERRaterAssessment {
  // Character through Achieves narratives (for OER)
  character?: string;
  presence?: string;
  intellect?: string;
  leads?: string;
  develops?: string;
  achieves?: string;

  // Overall performance box check
  performance_rating: OERPerformanceRating;

  // Narrative comments
  comments: string;

  // For Field Grade OER (67-10-2)
  broadening_assignments?: string;
  operational_assignments?: string;
}

export interface NCOERRaterAssessment {
  // Met/Did Not Meet for each attribute (SGT uses this)
  character: { met_standard: boolean; comments: string };
  presence: { met_standard: boolean; comments: string };
  intellect: { met_standard: boolean; comments: string };
  leads: { met_standard: boolean; comments: string };
  develops: { met_standard: boolean; comments: string };
  achieves: { met_standard: boolean; comments: string };

  // For SSG-MSG (2166-9-2), uses 4-level rating per attribute
  character_rating?: NCOERPerformanceRating;
  presence_rating?: NCOERPerformanceRating;
  intellect_rating?: NCOERPerformanceRating;
  leads_rating?: NCOERPerformanceRating;
  develops_rating?: NCOERPerformanceRating;
  achieves_rating?: NCOERPerformanceRating;

  // Overall performance
  overall_performance: 'MET STANDARD' | 'DID NOT MEET STANDARD';
  overall_comments: string;
}

// ============================================
// Part V - Intermediate Rater (OER only)
// ============================================

export interface IntermediateRaterAssessment {
  comments: string;
}

// ============================================
// Part V/VI - Senior Rater Assessment
// ============================================

export interface SeniorRaterAssessment {
  // Potential rating
  potential_rating: OERPotentialRating;  // Also used for NCOER

  // The FOUR required elements per MilEvalAI Flow
  enumeration: string;          // e.g., "#1 of 16; top 5%"
  promotion: string;            // e.g., "Promote immediately"
  school_recommendation: string; // e.g., "ILE resident", "ALC", "SLC"
  potential_next_assignment: string;  // e.g., "Company Command", "BN staff"

  // Full narrative combining all elements
  comments: string;

  // Future assignments (OER requires 3, NCOER requires 2 successive + 1 broadening)
  successive_assignments?: string[];
  broadening_assignment?: string;
}

// ============================================
// Complete Form Data Structure
// ============================================

export interface EvaluationFormData {
  // Part I - Administrative
  rated_personnel: RatedPersonnel;
  period_covered: PeriodCovered;
  reason_for_submission: ReasonForSubmission;
  num_enclosures?: number;

  // Part II - Rating Chain
  rating_chain: RatingChain;

  // Part III - Duty Description
  duty_description: DutyDescription;

  // Part IV - Fitness
  fitness: FitnessData;

  // Part IV - Rater Assessment (type depends on eval type)
  rater_assessment?: OERRaterAssessment | NCOERRaterAssessment;

  // Part V - Intermediate Rater (OER only)
  intermediate_rater_assessment?: IntermediateRaterAssessment;

  // Part V/VI - Senior Rater Assessment
  senior_rater_assessment?: SeniorRaterAssessment;

  // Referred report handling
  is_referred?: boolean;
  referred_comments_attached?: boolean;

  // MSAF date
  msaf_date?: string;
}

// ============================================
// Categorized Bullet Structure
// ============================================

export interface CategorizedBullet {
  id: string;
  original: string;
  enhanced: string;
  category: BulletCategory;
  confidence: number;
  selected: boolean;  // Whether user has approved this bullet
}

// ============================================
// Validation Result
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  reference?: string;  // DA Pam reference
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================
// Database Interface
// ============================================

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

