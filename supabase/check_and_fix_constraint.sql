-- Step 1: Check what constraint currently exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.evaluations'::regclass 
  AND conname LIKE '%status%';

-- Step 2: Drop ALL status-related constraints (in case there are multiple)
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.evaluations'::regclass 
        AND conname = 'evaluations_status_check'
    ) THEN
        ALTER TABLE public.evaluations DROP CONSTRAINT evaluations_status_check;
    END IF;
END $$;

-- Step 3: Add the correct v1.6 constraint
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

-- Step 4: Verify it was created correctly
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.evaluations'::regclass 
  AND conname = 'evaluations_status_check';

