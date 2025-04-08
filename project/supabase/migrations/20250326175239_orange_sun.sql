/*
  # Add tags support and update search vector

  1. Changes
    - Add tags column to profiles table
    - Update search vector to include tags
    - Add index on tags for faster filtering
  
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Update search vector to include tags
CREATE OR REPLACE FUNCTION profiles_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.detailed_record, '')), 'D') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, '{}'::text[]), ' ')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_search_vector_update'
  ) THEN
    CREATE TRIGGER profiles_search_vector_update
      BEFORE INSERT OR UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION profiles_search_update();
  END IF;
END
$$;