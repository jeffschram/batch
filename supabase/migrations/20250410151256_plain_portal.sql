/*
  # Add image support to recipes

  1. Changes
    - Add `image_url` column to recipes table
    - Create storage bucket for recipe images
    - Add storage policy for authenticated users

  2. Security
    - Enable public access to recipe images bucket
    - Add policy for authenticated users to upload images
*/

-- Add image_url column to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url text;

-- Create a bucket for recipe images if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('recipe-images', 'recipe-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

-- Allow authenticated users to update their images
CREATE POLICY "Allow authenticated users to update their images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');

-- Allow public access to recipe images
CREATE POLICY "Allow public to view recipe images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'recipe-images');