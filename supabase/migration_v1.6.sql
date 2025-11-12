-- Migration script for v1.6
-- Run this in Supabase SQL Editor if you have existing data

-- Add new columns to evaluations table
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS predecessor_file_url text,
ADD COLUMN IF NOT EXISTS predecessor_analysis jsonb,
ADD COLUMN IF NOT EXISTS raw_bullets jsonb,
ADD COLUMN IF NOT EXISTS categorized_bullets jsonb,
ADD COLUMN IF NOT EXISTS rater_comments text,
ADD COLUMN IF NOT EXISTS senior_rater_comments text;

-- Drop old status check constraint
ALTER TABLE public.evaluations 
DROP CONSTRAINT IF EXISTS evaluations_status_check;

-- Add new status check constraint with v1.6 statuses
ALTER TABLE public.evaluations 
ADD CONSTRAINT evaluations_status_check 
CHECK (status IN ('draft', 'bullets_draft', 'bullets_categorized', 'rater_complete', 'senior_rater_complete', 'completed'));

-- Create bullet library table if not exists
CREATE TABLE IF NOT EXISTS public.bullet_library (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null check (category in ('Character', 'Presence', 'Intellect', 'Leads', 'Develops', 'Achieves')),
  content text not null,
  tags text[],
  usage_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on user_id and category for bullet library
CREATE INDEX IF NOT EXISTS bullet_library_user_category_idx on public.bullet_library(user_id, category);

-- Enable RLS on bullet library
ALTER TABLE public.bullet_library ENABLE ROW LEVEL SECURITY;

-- Create policies for bullet library (drop if exists first)
DROP POLICY IF EXISTS "Users can view their own bullets" ON public.bullet_library;
DROP POLICY IF EXISTS "Users can create their own bullets" ON public.bullet_library;
DROP POLICY IF EXISTS "Users can update their own bullets" ON public.bullet_library;
DROP POLICY IF EXISTS "Users can delete their own bullets" ON public.bullet_library;

CREATE POLICY "Users can view their own bullets"
  ON public.bullet_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bullets"
  ON public.bullet_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bullets"
  ON public.bullet_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bullets"
  ON public.bullet_library FOR DELETE
  USING (auth.uid() = user_id);

-- Create rater tendencies table if not exists
CREATE TABLE IF NOT EXISTS public.rater_tendencies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  rater_name text,
  mq_count integer default 0,
  hq_count integer default 0,
  qualified_count integer default 0,
  nq_count integer default 0,
  avg_word_count integer,
  tone_profile jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on user_id for rater tendencies
CREATE INDEX IF NOT EXISTS rater_tendencies_user_id_idx on public.rater_tendencies(user_id);

-- Enable RLS on rater tendencies
ALTER TABLE public.rater_tendencies ENABLE ROW LEVEL SECURITY;

-- Create policies for rater tendencies (drop if exists first)
DROP POLICY IF EXISTS "Users can view their own rater tendencies" ON public.rater_tendencies;
DROP POLICY IF EXISTS "Users can create their own rater tendencies" ON public.rater_tendencies;
DROP POLICY IF EXISTS "Users can update their own rater tendencies" ON public.rater_tendencies;
DROP POLICY IF EXISTS "Users can delete their own rater tendencies" ON public.rater_tendencies;

CREATE POLICY "Users can view their own rater tendencies"
  ON public.rater_tendencies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rater tendencies"
  ON public.rater_tendencies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rater tendencies"
  ON public.rater_tendencies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rater tendencies"
  ON public.rater_tendencies FOR DELETE
  USING (auth.uid() = user_id);

-- Verification query
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'evaluations' 
  AND column_name IN ('raw_bullets', 'categorized_bullets', 'predecessor_file_url', 'rater_comments', 'senior_rater_comments')
ORDER BY column_name;

