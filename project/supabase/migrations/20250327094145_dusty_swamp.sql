/*
  # Add example profiles

  1. Changes
    - Add example profiles with rich content and images
    - Include HTML content for formatted text
*/

INSERT INTO profiles (
  name,
  short_description,
  summary,
  detailed_record,
  image_url,
  tags,
  short_description_html,
  summary_html,
  detailed_record_html
)
VALUES
  (
    'Marie Curie',
    'Polish-French physicist and chemist who conducted pioneering research on radioactivity. First woman to win a Nobel Prize and the only person to win in multiple sciences.',
    'Marie Skłodowska Curie was a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize and the first person to win Nobel Prizes in multiple sciences.',
    'Marie Curie''s achievements included the development of the theory of "radioactivity" (a term she coined), techniques for isolating radioactive isotopes, and the discovery of two elements, polonium and radium. Under her direction, the world''s first studies into the treatment of neoplasms were conducted using radioactive isotopes.',
    'https://images.unsplash.com/photo-1580191947416-62d35a55e71d?w=800&auto=format&fit=crop&q=60',
    ARRAY['scientist', 'nobel-prize', 'physics', 'chemistry'],
    'Polish-French physicist and chemist who conducted pioneering research on radioactivity. First woman to win a Nobel Prize and the only person to win in multiple sciences.',
    'Marie Skłodowska Curie was a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize and the first person to win Nobel Prizes in multiple sciences.',
    'Marie Curie''s achievements included the development of the theory of "radioactivity" (a term she coined), techniques for isolating radioactive isotopes, and the discovery of two elements, polonium and radium. Under her direction, the world''s first studies into the treatment of neoplasms were conducted using radioactive isotopes.'
  ),
  (
    'Albert Einstein',
    'Theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics. His work is also known for its influence on the philosophy of science.',
    'Albert Einstein was a German-born theoretical physicist, widely acknowledged to be one of the greatest and most influential physicists of all time. He is best known for developing the theory of relativity, but he also made important contributions to the development of the theory of quantum mechanics.',
    'Einstein''s scientific publications include more than 300 scientific papers and 150 non-scientific works. His intellectual achievements and originality made the word "Einstein" synonymous with "genius". The photoelectric effect paper, which gave rise to quantum theory, earned him the Nobel Prize in Physics in 1921.',
    'https://images.unsplash.com/photo-1621779055172-f76300369350?w=800&auto=format&fit=crop&q=60',
    ARRAY['scientist', 'nobel-prize', 'physics', 'relativity'],
    'Theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics. His work is also known for its influence on the philosophy of science.',
    'Albert Einstein was a German-born theoretical physicist, widely acknowledged to be one of the greatest and most influential physicists of all time. He is best known for developing the theory of relativity, but he also made important contributions to the development of the theory of quantum mechanics.',
    'Einstein''s scientific publications include more than 300 scientific papers and 150 non-scientific works. His intellectual achievements and originality made the word "Einstein" synonymous with "genius". The photoelectric effect paper, which gave rise to quantum theory, earned him the Nobel Prize in Physics in 1921.'
  ),
  (
    'Ada Lovelace',
    'English mathematician and writer, chiefly known for her work on Charles Babbage''s proposed mechanical general-purpose computer, the Analytical Engine.',
    'Augusta Ada King, Countess of Lovelace was an English mathematician and writer, chiefly known for her work on Charles Babbage''s proposed mechanical general-purpose computer, the Analytical Engine.',
    'Ada Lovelace is often regarded as the first computer programmer, as she was the first to publish an algorithm intended to be executed by a machine. She was the first to recognize that the machine had applications beyond pure calculation, and to have published the first algorithm intended to be carried out by such a machine.',
    'https://images.unsplash.com/photo-1599687267812-35c05ff70ee9?w=800&auto=format&fit=crop&q=60',
    ARRAY['computer-science', 'mathematics', 'pioneer'],
    'English mathematician and writer, chiefly known for her work on Charles Babbage''s proposed mechanical general-purpose computer, the Analytical Engine.',
    'Augusta Ada King, Countess of Lovelace was an English mathematician and writer, chiefly known for her work on Charles Babbage''s proposed mechanical general-purpose computer, the Analytical Engine.',
    'Ada Lovelace is often regarded as the first computer programmer, as she was the first to publish an algorithm intended to be executed by a machine. She was the first to recognize that the machine had applications beyond pure calculation, and to have published the first algorithm intended to be carried out by such a machine.'
  );