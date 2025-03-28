/*
  # Create mindmaps table for cloud storage

  1. New Tables
    - `mindmaps`
      - `id` (uuid, primary key)
      - `name` (text)
      - `data` (jsonb)
      - `created_at` (timestamp)
      - `creator` (text)
      - `classification` (text)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE mindmaps (
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