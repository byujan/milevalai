-- ============================================
-- MilEvalAI Database Setup
-- ============================================
-- This SQL script sets up all required tables, types, and Row Level Security policies
-- Run this in your Supabase SQL Editor

-- ============================================
-- Create Tables
-- ============================================

-- Evaluations Table
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duty_title TEXT NOT NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('NCOER', 'OER')),
  evaluation_subtype TEXT NOT NULL CHECK (evaluation_subtype IN ('Annual', 'Change of Rater', 'Relief for Cause', 'Complete the Record', 'Senior Rater Option', '60 Day Option')),
  rank_level TEXT NOT NULL CHECK (rank_level IN ('O1-O3', 'O4-O5', 'O6', 'E5', 'E6-E8', 'E9')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'bullets_draft', 'bullets_categorized', 'rater_complete', 'senior_rater_complete', 'completed')),
  predecessor_file_url TEXT,
  predecessor_analysis JSONB,
  raw_bullets JSONB,
  categorized_bullets JSONB,
  rater_comments TEXT,
  senior_rater_comments TEXT,
  bullets JSONB,
  narrative TEXT,
  form_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bullet Library Table
CREATE TABLE IF NOT EXISTS public.bullet_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Character', 'Presence', 'Intellect', 'Leads', 'Develops', 'Achieves')),
  content TEXT NOT NULL,
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rater Tendencies Table
CREATE TABLE IF NOT EXISTS public.rater_tendencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rater_name TEXT,
  mq_count INTEGER DEFAULT 0,
  hq_count INTEGER DEFAULT 0,
  qualified_count INTEGER DEFAULT 0,
  nq_count INTEGER DEFAULT 0,
  avg_word_count NUMERIC,
  tone_profile JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON public.evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON public.evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON public.evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bullet_library_user_id ON public.bullet_library(user_id);
CREATE INDEX IF NOT EXISTS idx_bullet_library_category ON public.bullet_library(category);
CREATE INDEX IF NOT EXISTS idx_rater_tendencies_user_id ON public.rater_tendencies(user_id);

-- ============================================
-- Create Updated_at Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Create Triggers
-- ============================================

DROP TRIGGER IF EXISTS set_evaluations_updated_at ON public.evaluations;
CREATE TRIGGER set_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_rater_tendencies_updated_at ON public.rater_tendencies;
CREATE TRIGGER set_rater_tendencies_updated_at
  BEFORE UPDATE ON public.rater_tendencies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bullet_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rater_tendencies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop Existing Policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Users can view their own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can insert their own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can update their own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can delete their own evaluations" ON public.evaluations;

DROP POLICY IF EXISTS "Users can view their own bullets" ON public.bullet_library;
DROP POLICY IF EXISTS "Users can insert their own bullets" ON public.bullet_library;
DROP POLICY IF EXISTS "Users can update their own bullets" ON public.bullet_library;
DROP POLICY IF EXISTS "Users can delete their own bullets" ON public.bullet_library;

DROP POLICY IF EXISTS "Users can view their own rater tendencies" ON public.rater_tendencies;
DROP POLICY IF EXISTS "Users can insert their own rater tendencies" ON public.rater_tendencies;
DROP POLICY IF EXISTS "Users can update their own rater tendencies" ON public.rater_tendencies;
DROP POLICY IF EXISTS "Users can delete their own rater tendencies" ON public.rater_tendencies;

-- ============================================
-- Create RLS Policies for Evaluations
-- ============================================

CREATE POLICY "Users can view their own evaluations"
  ON public.evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evaluations"
  ON public.evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations"
  ON public.evaluations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evaluations"
  ON public.evaluations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Create RLS Policies for Bullet Library
-- ============================================

CREATE POLICY "Users can view their own bullets"
  ON public.bullet_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bullets"
  ON public.bullet_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bullets"
  ON public.bullet_library FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bullets"
  ON public.bullet_library FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Create RLS Policies for Rater Tendencies
-- ============================================

CREATE POLICY "Users can view their own rater tendencies"
  ON public.rater_tendencies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rater tendencies"
  ON public.rater_tendencies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rater tendencies"
  ON public.rater_tendencies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rater tendencies"
  ON public.rater_tendencies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Grant Permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.evaluations TO authenticated;
GRANT ALL ON public.bullet_library TO authenticated;
GRANT ALL ON public.rater_tendencies TO authenticated;
