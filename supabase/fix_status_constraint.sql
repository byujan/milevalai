-- Fix the status constraint for v1.6
-- Run this in Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE public.evaluations 
DROP CONSTRAINT IF EXISTS evaluations_status_check;

-- Add the new constraint with v1.6 status values
ALTER TABLE public.evaluations 
ADD CONSTRAINT evaluations_status_check 
CHECK (status IN (
  'draft', 
  'bullets_draft', 
  'bullets_categorized', 
  'rater_complete', 
  'senior_rater_complete', 
  'completed'
));

-- Verify it worked
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'evaluations_status_check';

