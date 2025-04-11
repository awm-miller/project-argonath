/*
  # Enhance profiles with connections

  1. Changes
    - Add connections array to store related profile IDs
    - Add function to find suggested profiles based on text analysis
    - Update example profiles with connections

  2. Security
    - Maintain existing RLS policies
*/

-- Add connections array to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS connections text[] DEFAULT '{}';

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

-- Update example profiles with connections
UPDATE profiles 
SET connections = ARRAY['ada-lovelace', 'marie-curie']
WHERE name = 'Albert Einstein';

UPDATE profiles 
SET connections = ARRAY['albert-einstein', 'ada-lovelace']
WHERE name = 'Marie Curie';

UPDATE profiles 
SET connections = ARRAY['albert-einstein', 'marie-curie']
WHERE name = 'Ada Lovelace';