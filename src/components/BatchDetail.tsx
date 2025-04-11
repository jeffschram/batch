import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { Save, ArrowLeft, Plus, Minus, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Batch, Ingredient, Step, Recipe } from '../types/database';
import { ImageUploader } from './ImageUploader';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const RecipeInfo = styled.div`
  background-color: var(--surface-light);
  padding: 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  gap: 2rem;
  align-items: flex-start;
`;

const RecipeImage = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 0.375rem;
  border: 2px solid var(--surface-light-text);
`;

const RecipeImagePlaceholder = styled.div`
  width: 120px;
  height: 120px;
  background-color: var(--surface);
  border-radius: 0.375rem;
  border: 2px solid var(--surface-light-text);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--surface-light-text);
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
`;

const RecipeDetails = styled.div`
  flex: 1;
`;

const RecipeTitle = styled.h1`
  color: var(--brand);
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
`;

const RecipeNotes = styled.p`
  color: var(--surface-text);
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h2`
  color: var(--brand);
  margin: 0;
`;

const Date = styled.span`
  color: var(--surface-light-text);
  font-size: 0.875rem;
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

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h3`
  color: var(--brand);
  margin: 0;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ListItem = styled.div`
  background-color: var(--surface-light);
  padding: 1rem;
  border-radius: 0.375rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr auto;
  align-items: start;

  &:focus-within {
    outline: 2px solid var(--brand);
  }
`;

const ItemNumber = styled.div`
  background-color: var(--brand);
  color: var(--brand-text);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  font-weight: bold;
`;

const ItemContent = styled.div`
  flex: 1;
`;

const Input = styled.input`
  background-color: var(--surface);
  color: var(--surface-text);
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
  background-color: var(--surface);
  color: var(--surface-text);
  border: 1px solid var(--accent-1);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 1rem;
  width: 100%;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--brand);
  }
`;

const RemoveButton = styled(Button)`
  background-color: var(--accent-2);
  padding: 0.5rem;

  &:hover {
    background-color: var(--accent-2-light);
  }
`;

const Text = styled.div`
  color: var(--surface-text);
  line-height: 1.5;
`;

const Notes = styled(Text)`
  white-space: pre-wrap;
`;

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

interface BatchDetailProps {
  recipeId: string;
  batchId?: string;
  batchNumber?: number;
  onBack: () => void;
  onSuccess?: () => void;
}

export function BatchDetail({ recipeId, batchId, batchNumber, onBack, onSuccess }: BatchDetailProps) {
  const [isEditing, setIsEditing] = useState(!batchId);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [batch, setBatch] = useState<Partial<Batch>>({
    name: batchId ? '' : `Batch #${batchNumber}`,
    notes: '',
    recipe_id: recipeId,
    batch_number: batchNumber,
    image_url: '',
  });
  const [ingredients, setIngredients] = useState<Partial<Ingredient>[]>([{ description: '' }]);
  const [steps, setSteps] = useState<Partial<Step>[]>([{ description: '' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ingredientRefs = useRef<(HTMLInputElement | null)[]>([]);
  const stepRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    ingredientRefs.current = ingredientRefs.current.slice(0, ingredients.length);
  }, [ingredients.length]);

  useEffect(() => {
    stepRefs.current = stepRefs.current.slice(0, steps.length);
  }, [steps.length]);

  useEffect(() => {
    fetchRecipe();
    if (batchId) {
      fetchBatchDetails();
    } else {
      setLoading(false);
    }
  }, [batchId]);

  async function fetchRecipe() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error) throw error;
      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipe');
    }
  }

  async function fetchBatchDetails() {
    try {
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw batchError;
      setBatch(batchData);

      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('batch_id', batchId)
        .order('id');

      if (ingredientsError) throw ingredientsError;
      setIngredients(ingredientsData || []);

      const { data: stepsData, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('batch_id', batchId)
        .order('step_number');

      if (stepsError) throw stepsError;
      setSteps(stepsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batch details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (batchId) {
        const { error: batchError } = await supabase
          .from('batches')
          .update({
            name: batch.name,
            notes: batch.notes,
            image_url: batch.image_url,
          })
          .eq('id', batchId);

        if (batchError) throw batchError;

        for (const ingredient of ingredients) {
          const { error: ingredientError } = await supabase
            .from('ingredients')
            .update({
              description: ingredient.description,
            })
            .eq('id', ingredient.id);

          if (ingredientError) throw ingredientError;
        }

        for (const step of steps) {
          const { error: stepError } = await supabase
            .from('steps')
            .update({
              description: step.description,
              note: step.note,
            })
            .eq('id', step.id);

          if (stepError) throw stepError;
        }
      } else {
        const { data: newBatch, error: batchError } = await supabase
          .from('batches')
          .insert([{
            recipe_id: recipeId,
            name: batch.name,
            notes: batch.notes,
            batch_number: batchNumber,
            image_url: batch.image_url,
          }])
          .select()
          .single();

        if (batchError) throw batchError;

        if (ingredients.length > 0) {
          const { error: ingredientsError } = await supabase
            .from('ingredients')
            .insert(
              ingredients.map(ingredient => ({
                ...ingredient,
                batch_id: newBatch.id,
              }))
            );

          if (ingredientsError) throw ingredientsError;
        }

        if (steps.length > 0) {
          const { error: stepsError } = await supabase
            .from('steps')
            .insert(
              steps.map((step, index) => ({
                ...step,
                batch_id: newBatch.id,
                step_number: index + 1,
              }))
            );

          if (stepsError) throw stepsError;
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      
      if (batchId) {
        setIsEditing(false);
        fetchBatchDetails();
      } else {
        onBack();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save batch');
    } finally {
      setLoading(false);
    }
  }

  function addIngredient(focusNew = true) {
    const newIngredients = [...ingredients, { description: '' }];
    setIngredients(newIngredients);
    if (focusNew) {
      setTimeout(() => {
        const newIndex = newIngredients.length - 1;
        if (ingredientRefs.current[newIndex]) {
          ingredientRefs.current[newIndex]?.focus();
        }
      }, 0);
    }
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addStep(focusNew = true) {
    const newSteps = [...steps, { description: '' }];
    setSteps(newSteps);
    if (focusNew) {
      setTimeout(() => {
        const newIndex = newSteps.length - 1;
        if (stepRefs.current[newIndex]) {
          stepRefs.current[newIndex]?.focus();
        }
      }, 0);
    }
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function handleIngredientKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  }

  function handleStepKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === steps.length - 1) {
        addStep();
      } else {
        stepRefs.current[index + 1]?.focus();
      }
    }
  }

  if (loading) return <p>Loading batch details...</p>;
  if (error) return <p style={{ color: 'var(--accent-2)' }}>Error: {error}</p>;
  if (!recipe) return <p>Recipe not found</p>;

  return (
    <Container>
      <RecipeInfo>
        {recipe.image_url ? (
          <RecipeImage src={recipe.image_url} alt={recipe.name} />
        ) : (
          <RecipeImagePlaceholder>No image</RecipeImagePlaceholder>
        )}
        <RecipeDetails>
          <RecipeTitle>{recipe.name}</RecipeTitle>
          {recipe.notes && <RecipeNotes>{recipe.notes}</RecipeNotes>}
        </RecipeDetails>
      </RecipeInfo>

      <Header>
        <HeaderLeft>
          <Button onClick={onBack}>
            <ArrowLeft size={20} />
            Back
          </Button>
          <div>
            {isEditing ? (
              <Input
                value={batch.name || ''}
                onChange={(e) => setBatch({ ...batch, name: e.target.value })}
                placeholder="Batch Name"
                required
              />
            ) : (
              <Title>{batch.name}</Title>
            )}
            {batch.created_on && (
              <Date>{format(parseISO(batch.created_on), 'MMM d, yyyy')}</Date>
            )}
          </div>
        </HeaderLeft>
        {isEditing ? (
          <SaveButton onClick={handleSave} disabled={loading}>
            <Save size={20} />
            {loading ? 'Saving...' : (batchId ? 'Save Changes' : 'Create Batch')}
          </SaveButton>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            <Edit size={20} />
            Edit Batch
          </Button>
        )}
      </Header>

      <Section>
        <SectionHeader>
          <SectionTitle>Ingredients</SectionTitle>
          {isEditing && (
            <Button onClick={() => addIngredient()}>
              <Plus size={20} />
              Add Ingredient
            </Button>
          )}
        </SectionHeader>
        <List>
          {ingredients.map((ingredient, index) => (
            <ListItem key={index}>
              {isEditing ? (
                <>
                  <Input
                    ref={el => ingredientRefs.current[index] = el}
                    value={ingredient.description || ''}
                    onChange={(e) => {
                      const newIngredients = [...ingredients];
                      newIngredients[index] = {
                        ...ingredient,
                        description: e.target.value,
                      };
                      setIngredients(newIngredients);
                    }}
                    onKeyDown={(e) => handleIngredientKeyDown(e, index)}
                    placeholder="Enter ingredient (e.g., 2 cups flour)"
                    required
                  />
                  <RemoveButton onClick={() => removeIngredient(index)}>
                    <Minus size={20} />
                  </RemoveButton>
                </>
              ) : (
                <Text>{ingredient.description}</Text>
              )}
            </ListItem>
          ))}
        </List>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Steps</SectionTitle>
          {isEditing && (
            <Button onClick={() => addStep()}>
              <Plus size={20} />
              Add Step
            </Button>
          )}
        </SectionHeader>
        <List>
          {steps.map((step, index) => (
            <ListItem key={index}>
              {isEditing ? (
                <>
                  <Input
                    ref={el => stepRefs.current[index] = el}
                    value={step.description || ''}
                    onChange={(e) => {
                      const newSteps = [...steps];
                      newSteps[index] = {
                        ...step,
                        description: e.target.value,
                      };
                      setSteps(newSteps);
                    }}
                    onKeyDown={(e) => handleStepKeyDown(e, index)}
                    placeholder="Step description"
                    required
                  />
                  <RemoveButton onClick={() => removeStep(index)}>
                    <Minus size={20} />
                  </RemoveButton>
                </>
              ) : (
                <Text>{step.description}</Text>
              )}
            </ListItem>
          ))}
        </List>
      </Section>

      <Section>
        <SectionTitle>Notes</SectionTitle>
        {isEditing ? (
          <Textarea
            value={batch.notes || ''}
            onChange={(e) => setBatch({ ...batch, notes: e.target.value })}
            placeholder="Add any notes about this batch..."
          />
        ) : (
          <Notes>{batch.notes}</Notes>
        )}
      </Section>

      <Section>
        <SectionTitle>Batch Image</SectionTitle>
        {isEditing ? (
          <ImageUploader
            imageUrl={batch.image_url}
            onImageChange={(url) => setBatch({ ...batch, image_url: url })}
            bucketName="batch-images"
          />
        ) : batch.image_url && (
          <ImagePreviewContainer>
            <ImagePreview src={batch.image_url} alt="Batch preview" />
          </ImagePreviewContainer>
        )}
      </Section>
    </Container>
  );
}