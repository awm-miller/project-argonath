/*
  # Fix profile connections to use UUIDs

  1. Changes
    - Add connections array to profiles table
    - Create function to find mentioned profiles
    - Update example profiles with proper UUID connections
*/

-- Add connections array to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS connections uuid[] DEFAULT '{}';

-- Function to find profiles mentioned in text
CREATE OR REPLACE FUNCTION find_mentioned_profiles(search_text text)
RETURNS TABLE (
  profile_id uuid,
  relevance float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    ts_rank(p.search_vector, to_tsquery('english', regexp_replace(p.name, '\s+', ' & ', 'g'))) as relevance
  FROM profiles p
  WHERE 
    search_text ILIKE '%' || p.name || '%'
  ORDER BY relevance DESC;
END;
$$;

-- Update example profiles with connections using a DO block to handle UUIDs
DO $$
DECLARE
  einstein_id uuid;
  curie_id uuid;
  lovelace_id uuid;
BEGIN
  -- Get profile IDs
  SELECT id INTO einstein_id FROM profiles WHERE name = 'Albert Einstein';
  SELECT id INTO curie_id FROM profiles WHERE name = 'Marie Curie';
  SELECT id INTO lovelace_id FROM profiles WHERE name = 'Ada Lovelace';

  -- Update connections using actual UUIDs
  UPDATE profiles 
  SET connections = ARRAY[lovelace_id, curie_id]
  WHERE id = einstein_id;

  UPDATE profiles 
  SET connections = ARRAY[einstein_id, lovelace_id]
  WHERE id = curie_id;

  UPDATE profiles 
  SET connections = ARRAY[einstein_id, curie_id]
  WHERE id = lovelace_id;
END;
$$;