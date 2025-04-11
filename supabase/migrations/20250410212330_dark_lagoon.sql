/*
  # Update ingredients table structure

  1. Changes
    - Remove amount and unit columns
    - Rename ingredient_name to description for consistency
  
  2. Data Migration
    - Combine existing amount, unit, and ingredient_name into description
*/

DO $$ 
BEGIN
  -- First, combine the existing columns into the new description
  UPDATE ingredients 
  SET ingredient_name = CONCAT(
    COALESCE(amount::text, ''),
    CASE 
      WHEN amount IS NOT NULL AND unit IS NOT NULL THEN ' '
      ELSE ''
    END,
    COALESCE(unit, ''),
    CASE 
      WHEN (amount IS NOT NULL OR unit IS NOT NULL) AND ingredient_name IS NOT NULL THEN ' '
      ELSE ''
    END,
    ingredient_name
  );

  -- Then drop the columns we no longer need
  ALTER TABLE ingredients 
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS unit;

  -- Finally rename ingredient_name to description
  ALTER TABLE ingredients 
  RENAME COLUMN ingredient_name TO description;
END $$;