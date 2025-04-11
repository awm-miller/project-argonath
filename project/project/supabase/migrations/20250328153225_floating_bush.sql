/*
  # Update mindmaps table and policies

  1. Changes
    - Drop existing policies first to avoid conflicts
    - Update table if it exists
    - Recreate policies
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read their own mindmaps" ON mindmaps;
  DROP POLICY IF EXISTS "Users can insert their own mindmaps" ON mindmaps;
  DROP POLICY IF EXISTS "Users can update their own mindmaps" ON mindmaps;
  DROP POLICY IF EXISTS "Users can delete their own mindmaps" ON mindmaps;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS mindmaps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  creator text,
  classification text
);

-- Enable RLS
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own mindmaps"
  ON mindmaps
  FOR SELECT
  TO authenticated
  USING (creator = auth.uid()::text);

CREATE POLICY "Users can insert their own mindmaps"
  ON mindmaps
  FOR INSERT
  TO authenticated
  WITH CHECK (creator = auth.uid()::text);

CREATE POLICY "Users can update their own mindmaps"
  ON mindmaps
  FOR UPDATE
  TO authenticated
  USING (creator = auth.uid()::text)
  WITH CHECK (creator = auth.uid()::text);

CREATE POLICY "Users can delete their own mindmaps"
  ON mindmaps
  FOR DELETE
  TO authenticated
  USING (creator = auth.uid()::text);