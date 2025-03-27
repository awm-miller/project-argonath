/*
  # Create profiles database

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `name` (text, indexed for search)
      - `short_description` (text, 2-sentence descriptor)
      - `summary` (text, paragraph summary)
      - `detailed_record` (text, full document)
      - `created_at` (timestamp)
      - `search_vector` (tsvector, for full-text search across all text fields)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for:
      - Anyone can read profiles
      - Only authenticated users can create/update profiles
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_description text NOT NULL,
  summary text NOT NULL,
  detailed_record text NOT NULL,
  created_at timestamptz DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(detailed_record, '')), 'D')
  ) STORED
);

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS profiles_search_idx ON profiles USING gin(search_vector);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (true);