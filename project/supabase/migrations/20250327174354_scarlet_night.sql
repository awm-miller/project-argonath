/*
  # Add lawyered fields to profiles

  1. Changes
    - Add lawyered fields for each section
    - Update example profiles
*/

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS short_description_lawyered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS summary_lawyered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS detailed_record_lawyered boolean DEFAULT false;

-- Update example profiles
UPDATE profiles
SET 
  short_description_lawyered = false,
  summary_lawyered = false,
  detailed_record_lawyered = false;