/*
  # Update mindmaps table policies for shared access

  1. Changes
    - Drop existing policies that restrict access to creator only
    - Create new policies that allow all authenticated users to view all mindmaps
    - Maintain creator-only restrictions for insert/update/delete
    - Preserve existing data
*/

-- Drop existing policies
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

-- Create new policies
CREATE POLICY "Users can read all mindmaps"
  ON mindmaps
  FOR SELECT
  TO authenticated
  USING (true);

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