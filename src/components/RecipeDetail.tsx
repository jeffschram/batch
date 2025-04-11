import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Edit, Plus, ChevronRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Recipe, Batch } from '../types/database';
import { BatchDetail } from './BatchDetail';
import { RecipeImage } from './RecipeImage';
import { supabase } from '../lib/supabase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 2rem;
`;

const ImageContainer = styled.div`
  flex-shrink: 0;
  width: 300px;
`;

const Info = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  color: var(--brand);
  margin: 0 0 1rem;
  font-size: 2rem;
`;

const Notes = styled.p`
  color: var(--surface-text);
  margin: 0 0 1.5rem;
  line-height: 1.6;
  white-space: pre-wrap;
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

const CreateButton = styled(Button)`
  background-color: var(--brand);
  color: var(--brand-text);

  &:hover {
    background-color: var(--brand-light);
  }
`;

const BatchesSection = styled.div`
  margin-top: 2rem;
`;

const BatchesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const BatchesTitle = styled.h2`
  color: var(--brand);
  margin: 0;
`;

const BatchList = styled.div`
  display: grid;
  gap: 1rem;
`;

const BatchCard = styled.div`
  background-color: var(--surface-light);
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    transform: translateX(4px);
  }
`;

const BatchInfo = styled.div`
  flex: 1;
`;

const BatchTitle = styled.h3`
  color: var(--brand);
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
`;

const BatchDate = styled.p`
  color: var(--surface-light-text);
  font-size: 0.875rem;
  margin: 0;
`;

export function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRecipe(id);
      fetchBatches(id);
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
      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipe');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBatches(recipeId: string) {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('created_on', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  }

  function handleCreateBatch() {
    setIsCreatingBatch(true);
  }

  function handleBatchSuccess() {
    if (id) {
      fetchBatches(id);
    }
  }

  if (loading) return <p>Loading recipe...</p>;
  if (error) return <p style={{ color: 'var(--accent-2)' }}>Error: {error}</p>;
  if (!recipe) return <p>Recipe not found</p>;

  if (selectedBatchId) {
    return (
      <BatchDetail
        recipeId={recipe.id}
        batchId={selectedBatchId}
        onBack={() => setSelectedBatchId(null)}
        onSuccess={handleBatchSuccess}
      />
    );
  }

  if (isCreatingBatch) {
    return (
      <BatchDetail
        recipeId={recipe.id}
        batchNumber={batches.length + 1}
        onBack={() => setIsCreatingBatch(false)}
        onSuccess={handleBatchSuccess}
      />
    );
  }

  return (
    <Container>
      <Header>
        <ImageContainer>
          <RecipeImage
            recipeId={recipe.id}
            recipeImage={recipe.image_url}
            alt={recipe.name}
            showSource
          />
        </ImageContainer>
        <Info>
          <Title>{recipe.name}</Title>
          {recipe.notes && <Notes>{recipe.notes}</Notes>}
          <Button onClick={() => navigate(`/recipes/${recipe.id}/edit`)}>
            <Edit size={20} />
            Edit Recipe
          </Button>
        </Info>
      </Header>

      <BatchesSection>
        <BatchesHeader>
          <BatchesTitle>Batches</BatchesTitle>
          <CreateButton onClick={handleCreateBatch}>
            <Plus size={20} />
            Create New Batch
          </CreateButton>
        </BatchesHeader>

        <BatchList>
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
            >
              <BatchInfo>
                <BatchTitle>{batch.name}</BatchTitle>
                <BatchDate>
                  {format(new Date(batch.created_on), 'MMM d, yyyy')}
                </BatchDate>
              </BatchInfo>
              <ChevronRight size={24} color="var(--brand)" />
            </BatchCard>
          ))}
          {batches.length === 0 && (
            <p style={{ color: 'var(--surface-light-text)' }}>
              No batches yet. Create your first batch to start tracking your recipe iterations!
            </p>
          )}
        </BatchList>
      </BatchesSection>
    </Container>
  );
}