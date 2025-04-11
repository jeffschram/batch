import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { supabase } from '../lib/supabase';

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Image = styled.img<{ $size?: 'small' | 'large' }>`
  width: 100%;
  height: ${props => props.$size === 'small' ? '100px' : '300px'};
  object-fit: cover;
  border-radius: 0.5rem;
  border: 2px solid var(--surface-light-text);
`;

const ImagePlaceholder = styled.div<{ $size?: 'small' | 'large' }>`
  width: 100%;
  height: ${props => props.$size === 'small' ? '100px' : '300px'};
  background-color: var(--surface-light);
  border-radius: 0.5rem;
  border: 2px solid var(--surface-light-text);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--surface-light-text);
  font-size: 0.875rem;
`;

const ImageSource = styled.div`
  color: var(--surface-light-text);
  font-size: 0.75rem;
  margin-top: 0.5rem;
  text-align: center;
  font-style: italic;
`;

interface RecipeImageProps {
  recipeId: string;
  recipeImage?: string;
  size?: 'small' | 'large';
  showSource?: boolean;
  alt: string;
}

export function RecipeImage({ recipeId, recipeImage, size = 'large', showSource = false, alt }: RecipeImageProps) {
  const [displayImage, setDisplayImage] = useState(recipeImage);
  const [imageSource, setImageSource] = useState<'recipe' | 'batch'>('recipe');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestBatchImage();
  }, [recipeId, recipeImage]);

  async function fetchLatestBatchImage() {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('image_url')
        .eq('recipe_id', recipeId)
        .not('image_url', 'is', null)
        .order('created_on', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching batch image:', error);
        return;
      }

      if (data && data.length > 0 && data[0].image_url) {
        setDisplayImage(data[0].image_url);
        setImageSource('batch');
      } else if (recipeImage) {
        setDisplayImage(recipeImage);
        setImageSource('recipe');
      } else {
        setDisplayImage(undefined);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <ImagePlaceholder $size={size}>Loading...</ImagePlaceholder>;
  }

  return (
    <ImageContainer>
      {displayImage ? (
        <>
          <Image src={displayImage} alt={alt} $size={size} />
          {showSource && (
            <ImageSource>
              {imageSource === 'batch' ? 'Latest batch image' : 'Recipe image'}
            </ImageSource>
          )}
        </>
      ) : (
        <ImagePlaceholder $size={size}>No image</ImagePlaceholder>
      )}
    </ImageContainer>
  );
}