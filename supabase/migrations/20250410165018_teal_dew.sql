/*
  # Add batch number column to batches table

  1. Changes
    - Add `batch_number` column to `batches` table
      - Type: integer
      - Not nullable
      - Default value: 1
    - Add index on (recipe_id, batch_number) for efficient querying

  2. Notes
    - The batch_number column is used to track the sequence of batches for each recipe
    - The index helps optimize queries that filter or sort by batch number within a recipe
*/

-- Add batch_number column
ALTER TABLE batches 
ADD COLUMN batch_number integer NOT NULL DEFAULT 1;

-- Add index for efficient querying
CREATE INDEX batches_recipe_id_batch_number_idx 
ON batches (recipe_id, batch_number);