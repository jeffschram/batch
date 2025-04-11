import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Plus, Minus, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ingredient, Step } from '../types/database';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  min-height: 100px;
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

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
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
  display: grid;
  gap: 1rem;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  background-color: var(--surface-light);
  padding: 1rem;
  border-radius: 0.375rem;
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

const RemoveButton = styled(Button)`
  background-color: var(--accent-2);
  padding: 0.5rem;

  &:hover {
    background-color: var(--accent-2-light);
  }
`;

const IngredientInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 0.5rem;
`;

interface BatchFormProps {
  recipeId: string;
  batchNumber: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BatchForm({ recipeId, batchNumber, onSuccess, onCancel }: BatchFormProps) {
  const [name, setName] = useState(`Batch #${batchNumber}`);
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<Partial<Ingredient>[]>([{ ingredient_name: '' }]);
  const [steps, setSteps] = useState<Partial<Step>[]>([{ description: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addIngredient() {
    setIngredients([...ingredients, { ingredient_name: '' }]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string | number) {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  }

  function addStep() {
    setSteps([...steps, { description: '' }]);
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, field: keyof Step, value: string | number) {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create batch
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .insert([{
          recipe_id: recipeId,
          name,
          notes,
          batch_number: batchNumber,
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Create ingredients
      if (ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('ingredients')
          .insert(
            ingredients.map((ingredient) => ({
              ...ingredient,
              batch_id: batch.id,
            }))
          );

        if (ingredientsError) throw ingredientsError;
      }

      // Create steps
      if (steps.length > 0) {
        const { error: stepsError } = await supabase
          .from('steps')
          .insert(
            steps.map((step, index) => ({
              ...step,
              batch_id: batch.id,
              step_number: index + 1,
            }))
          );

        if (stepsError) throw stepsError;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <p style={{ color: 'var(--accent-2)' }}>Error: {error}</p>
      )}

      <FormGroup>
        <Label htmlFor="name">Batch Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </FormGroup>

      <Section>
        <SectionHeader>
          <SectionTitle>Ingredients</SectionTitle>
          <Button type="button" onClick={addIngredient}>
            <Plus size={20} />
            Add Ingredient
          </Button>
        </SectionHeader>

        <List>
          {ingredients.map((ingredient, index) => (
            <ListItem key={index}>
              <IngredientInputs>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={ingredient.amount || ''}
                  onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value))}
                  step="0.01"
                />
                <Input
                  placeholder="Unit"
                  value={ingredient.unit || ''}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                />
                <Input
                  placeholder="Ingredient name"
                  value={ingredient.ingredient_name}
                  onChange={(e) => updateIngredient(index, 'ingredient_name', e.target.value)}
                  required
                />
              </IngredientInputs>
              <RemoveButton type="button" onClick={() => removeIngredient(index)}>
                <Minus size={20} />
              </RemoveButton>
            </ListItem>
          ))}
        </List>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Steps</SectionTitle>
          <Button type="button" onClick={addStep}>
            <Plus size={20} />
            Add Step
          </Button>
        </SectionHeader>

        <List>
          {steps.map((step, index) => (
            <ListItem key={index}>
              <ItemNumber>{index + 1}</ItemNumber>
              <Input
                placeholder="Step description"
                value={step.description}
                onChange={(e) => updateStep(index, 'description', e.target.value)}
                required
              />
              <RemoveButton type="button" onClick={() => removeStep(index)}>
                <Minus size={20} />
              </RemoveButton>
            </ListItem>
          ))}
        </List>
      </Section>

      <FormGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes about this batch..."
        />
      </FormGroup>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <SaveButton type="submit" disabled={loading}>
          <Save size={20} />
          {loading ? 'Creating Batch...' : 'Create Batch'}
        </SaveButton>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}