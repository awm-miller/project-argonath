/*
  # Fix profile connections

  1. Changes
    - Drop and recreate connections column with proper UUID array type
    - Update example profiles with correct UUID connections
    - Add validation function for UUID arrays
*/

-- First drop the existing connections column
ALTER TABLE profiles 
DROP COLUMN IF EXISTS connections;

-- Recreate connections column with proper UUID type
ALTER TABLE profiles 
ADD COLUMN connections uuid[] DEFAULT '{}';

-- Create a function to validate UUID arrays
CREATE OR REPLACE FUNCTION validate_uuid_array(arr uuid[])
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN arr IS NULL OR array_length(arr, 1) IS NULL OR (
    SELECT bool_and(val IS NOT NULL)
    FROM unnest(arr) AS val
  );
END;
$$;

-- Add constraint to ensure valid UUIDs
ALTER TABLE profiles
ADD CONSTRAINT valid_connections
CHECK (validate_uuid_array(connections));

-- Update example profiles with connections using a DO block
DO $$
DECLARE
  einstein_id uuid;
  curie_id uuid;
  lovelace_id uuid;
BEGIN
  -- Get profile IDs
  SELECT id INTO einstein_id FROM profiles WHERE name = 'Albert Einstein' LIMIT 1;
  SELECT id INTO curie_id FROM profiles WHERE name = 'Marie Curie' LIMIT 1;
  SELECT id INTO lovelace_id FROM profiles WHERE name = 'Ada Lovelace' LIMIT 1;

  -- Update connections using actual UUIDs
  IF einstein_id IS NOT NULL AND curie_id IS NOT NULL AND lovelace_id IS NOT NULL THEN
    UPDATE profiles 
    SET connections = ARRAY[lovelace_id, curie_id]::uuid[]
    WHERE id = einstein_id;

    UPDATE profiles 
    SET connections = ARRAY[einstein_id, lovelace_id]::uuid[]
    WHERE id = curie_id;

    UPDATE profiles 
    SET connections = ARRAY[einstein_id, curie_id]::uuid[]
    WHERE id = lovelace_id;
  END IF;
END;
$$;