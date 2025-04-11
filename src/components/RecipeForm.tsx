import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Recipe } from '../types/database';
import { supabase } from '../lib/supabase';
import { ImageUploader } from './ImageUploader';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--brand);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: var(--surface-light-text);
  font-size: 0.875rem;
`;

const Input = styled.input`
  background-color: var(--surface-light);
  color: var(--surface-light-text);
  border: 1px solid var(--accent-1);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 1rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: var(--brand);
  }
`;

const Textarea = styled.textarea`
  background-color: var(--surface-light);
  color: var(--surface-light-text);
  border: 1px solid var(--accent-1);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 1rem;
  width: 100%;
  min-height: 150px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--brand);
  }
`;

const Button = styled.button`
  background-color: var(--accent-1);
  color: var(--accent-1-text);
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
    background-color: var(--accent-1-light);
  }
`;

const SaveButton = styled(Button)`
  background-color: var(--brand);
  color: var(--brand-text);

  &:hover {
    background-color: var(--brand-light);
  }
`;

const BackButton = styled(Button)`
  background-color: transparent;
  border: 1px solid var(--accent-1);
  
  &:hover {
    background-color: var(--surface-light);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

interface RecipeFormProps {
  onSuccess?: () => void;
}

export function RecipeForm({ onSuccess }: RecipeFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Partial<Recipe>>({
    name: '',
    notes: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRecipe(id);
    }
  }, [id]);

  async function fetchRecipe(recipeId: string) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error) throw error;
      if (data) setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipe');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to create or edit recipes');
      }

      if (id) {
        // Update existing recipe
        const { error } = await supabase
          .from('recipes')
          .update({
            name: recipe.name,
            notes: recipe.notes,
            image_url: recipe.image_url,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Create new recipe
        const { error } = await supabase
          .from('recipes')
          .insert([{
            name: recipe.name,
            notes: recipe.notes,
            user_id: user.id,
            image_url: recipe.image_url,
          }]);

        if (error) throw error;
      }

      if (onSuccess) {
        onSuccess();
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <FormHeader>
        <BackButton onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back
        </BackButton>
        <Title>{id ? 'Edit Recipe' : 'Create New Recipe'}</Title>
      </FormHeader>

      {error && (
        <p style={{ color: 'var(--accent-2)', marginBottom: '1rem' }}>
          Error: {error}
        </p>
      )}

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Recipe Name</Label>
          <Input
            id="name"
            type="text"
            value={recipe.name}
            onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="image">Recipe Image</Label>
          <ImageUploader
            imageUrl={recipe.image_url}
            onImageChange={(url) => setRecipe({ ...recipe, image_url: url })}
            bucketName="recipe-images"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={recipe.notes || ''}
            onChange={(e) => setRecipe({ ...recipe, notes: e.target.value })}
          />
        </FormGroup>

        <ButtonGroup>
          <SaveButton type="submit" disabled={loading}>
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Recipe'}
          </SaveButton>
        </ButtonGroup>
      </Form>
    </div>
  );
}