import React, { useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ImagePreviewContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 300px;
  margin-top: 0.5rem;
`;

const ImagePreview = styled.img`
  width: 100%;
  height: auto;
  border-radius: 0.375rem;
  border: 2px solid var(--accent-1);
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background-color: var(--accent-2);
  color: var(--accent-2-text);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--accent-2-light);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  background-color: var(--accent-3);
  color: var(--accent-3-text);
  border: none;
  border-radius: 0.375rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--accent-3-light);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: var(--accent-2);
  font-size: 0.875rem;
  margin: 0.5rem 0;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--accent-3-text);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

interface ImageUploaderProps {
  imageUrl?: string;
  onImageChange: (url: string) => void;
  bucketName: string;
}

export function ImageUploader({ imageUrl, onImageChange, bucketName }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageUpload(file: File) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const timestamp = Math.floor(Date.now());
      const fileName = `${timestamp}.${fileExt}`;
      // Include user ID in the folder path to comply with RLS policies
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to upload image');
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setUploading(true);
    setImageFile(file);

    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Please select a valid image file (JPEG, PNG, or GIF)');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const url = await handleImageUpload(file);
      onImageChange(url);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setError(null);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <FileInput
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
      />
      
      {!imageFile && !imageUrl && (
        <UploadButton
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <LoadingSpinner />
          ) : (
            <>
              <Upload size={20} />
              Upload Image
            </>
          )}
        </UploadButton>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {(imageFile || imageUrl) && (
        <ImagePreviewContainer>
          <ImagePreview
            src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
            alt="Image preview"
          />
          <RemoveImageButton onClick={handleRemoveImage} type="button">
            <X size={16} />
          </RemoveImageButton>
        </ImagePreviewContainer>
      )}
    </div>
  );
}