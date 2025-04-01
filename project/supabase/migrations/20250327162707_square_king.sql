/*
  # Create storage bucket and policies for transcriptions

  1. Changes
    - Create private storage bucket for transcriptions
    - Enable RLS on storage objects
    - Add policies for authenticated users to:
      - Upload files
      - Read files
      - Delete files
*/

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('transcriptions', 'transcriptions', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the transcriptions bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'transcriptions');

CREATE POLICY "Allow authenticated users to read files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'transcriptions');

CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'transcriptions');