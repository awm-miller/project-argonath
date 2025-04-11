/*
  # Create transcription system tables

  1. New Tables
    - `transcription_jobs`
      - `id` (uuid, primary key)
      - `status` (text) - pending, processing, completed, failed
      - `source_type` (text) - file, youtube, facebook, twitter
      - `source_url` (text) - URL for social media videos
      - `file_path` (text) - Storage path for uploaded files
      - `result` (jsonb) - Transcription result
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS transcription_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  source_type text NOT NULL,
  source_url text,
  file_path text,
  result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_source_type CHECK (source_type IN ('file', 'youtube', 'facebook', 'twitter')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT has_source CHECK (
    (source_type = 'file' AND file_path IS NOT NULL) OR
    (source_type IN ('youtube', 'facebook', 'twitter') AND source_url IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE transcription_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to transcription jobs"
  ON transcription_jobs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to transcription jobs"
  ON transcription_jobs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_transcription_jobs_updated_at
  BEFORE UPDATE ON transcription_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();