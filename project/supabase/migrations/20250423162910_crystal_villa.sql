/*
  # Create reverberate_jobs table

  1. New Tables
    - `reverberate_jobs`
      - `id` (uuid, primary key)
      - `status` (text) - pending, processing, completed, failed
      - `message` (text)
      - `result_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

CREATE TABLE reverberate_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  message text,
  result_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Enable RLS
ALTER TABLE reverberate_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own jobs"
  ON reverberate_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_reverberate_jobs_updated_at
  BEFORE UPDATE ON reverberate_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();