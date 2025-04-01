/*
  # Add citations and iframe support

  1. Changes
    - Add citations array to store source URLs
    - Add iframe_url field for Google Docs embedding
    - Update example profiles with citations
*/

-- Add new columns for citations and iframe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS citations jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS iframe_url text;

-- Update example profiles with citations
UPDATE profiles
SET citations = ARRAY[
  '[{"ref": 1, "text": "Nobel Prize Organization - Marie Curie Facts", "url": "https://www.nobelprize.org/prizes/physics/1903/marie-curie/facts/"}]'::jsonb,
  '[{"ref": 2, "text": "Smithsonian Magazine - Marie Curie: The Pioneer, the Scientist, the Feminist", "url": "https://www.smithsonianmag.com/science-nature/marie-curie-pioneer-scientist-feminist-180975626/"}]'::jsonb
]
WHERE name = 'Marie Curie';

UPDATE profiles
SET citations = ARRAY[
  '[{"ref": 1, "text": "Nobel Prize Organization - Albert Einstein Facts", "url": "https://www.nobelprize.org/prizes/physics/1921/einstein/facts/"}]'::jsonb,
  '[{"ref": 2, "text": "Einstein Papers Project", "url": "https://www.einstein.caltech.edu/"}]'::jsonb
]
WHERE name = 'Albert Einstein';

UPDATE profiles
SET citations = ARRAY[
  '[{"ref": 1, "text": "Computer History Museum - Ada Lovelace", "url": "https://computerhistory.org/profile/ada-lovelace/"}]'::jsonb,
  '[{"ref": 2, "text": "Scientific American - Ada Lovelace: The First Computer Programmer", "url": "https://www.scientificamerican.com/article/ada-lovelace-the-first-computer-programmer/"}]'::jsonb
]
WHERE name = 'Ada Lovelace';