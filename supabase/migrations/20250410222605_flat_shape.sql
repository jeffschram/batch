/*
  # Create storage buckets for images

  1. New Storage Buckets
    - `recipe-images`: For storing recipe cover images
    - `batch-images`: For storing batch-specific images
  
  2. Security
    - Enable public access for viewing images
    - Restrict upload/delete operations to authenticated users
    - Users can only modify their own images
*/

-- Create the recipe-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create the batch-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('batch-images', 'batch-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for recipe-images bucket
CREATE POLICY "Public can view recipe images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Set up security policies for batch-images bucket
CREATE POLICY "Public can view batch images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'batch-images');

CREATE POLICY "Authenticated users can upload batch images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'batch-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own batch images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'batch-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'batch-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own batch images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'batch-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);