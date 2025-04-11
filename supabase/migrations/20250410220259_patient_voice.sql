/*
  # Add batch images and update recipe images

  1. Changes
    - Add image_url column to batches table
    - Create function to update recipe image when batch image is added
    - Add trigger to automatically update recipe image

  2. Notes
    - Recipe image will be updated when a batch with an image is created/updated
    - Only updates if the batch is the most recent one for that recipe
*/

-- Add image_url column to batches
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS image_url text;

-- Create function to update recipe image
CREATE OR REPLACE FUNCTION update_recipe_image()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if there's an image_url
  IF NEW.image_url IS NOT NULL THEN
    -- Check if this is the most recent batch
    IF NOT EXISTS (
      SELECT 1 
      FROM batches 
      WHERE recipe_id = NEW.recipe_id 
      AND created_on > NEW.created_on
    ) THEN
      -- Update the recipe's image_url
      UPDATE recipes 
      SET image_url = NEW.image_url 
      WHERE id = NEW.recipe_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update recipe image
DROP TRIGGER IF EXISTS update_recipe_image_trigger ON batches;
CREATE TRIGGER update_recipe_image_trigger
  AFTER INSERT OR UPDATE OF image_url ON batches
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_image();