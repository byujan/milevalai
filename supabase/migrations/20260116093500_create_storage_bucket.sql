-- ============================================
-- Create Storage Bucket for Evaluation Files
-- ============================================

-- Create the evaluations bucket (public for easy file access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('evaluations', 'evaluations', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for Evaluations Bucket
-- ============================================

-- Allow authenticated users to upload files
-- Files are organized by evaluation ID: {evaluationId}/{timestamp}_{filename}
CREATE POLICY "Authenticated users can upload evaluation files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evaluations');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read evaluation files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evaluations');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update evaluation files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'evaluations')
WITH CHECK (bucket_id = 'evaluations');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete evaluation files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'evaluations');

-- Allow public read access for file URLs
-- This enables getPublicUrl() to work properly
CREATE POLICY "Public can read evaluation files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'evaluations');
