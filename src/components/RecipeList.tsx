import React from 'react';
import styled from '@emotion/styled';
import { Edit, Plus } from 'lucide-react';
import { formatDistanceToNow, format, isThisWeek, isToday } from 'date-fns';
import { Recipe } from '../types/database';
import { useNavigate } from 'react-router-dom';
import { RecipeImage } from './RecipeImage';

const List = styled.div`
  display: grid;
  gap: 1rem;
`;

const ListCTA = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
`;

const RecipeCard = styled.div`
  background-color: var(--surface-light);
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ImageWrapper = styled.div`
  width: 100px;
  flex-shrink: 0;
`;

const RecipeInfo = styled.div`
  flex: 1;
`;

const RecipeName = styled.h3`
  margin: 0;
  color: var(--brand);
  font-size: 1.25rem;
`;

const RecipeDate = styled.p`
  margin: 0.5rem 0 0;
  color: var(--surface-light-text);
  font-size: 0.875rem;
`;

const Button = styled.button`
  background-color: var(--accent-1);
  color: var(--accent-1-text);
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
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

function formatCreationDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return 'Created ' + formatDistanceToNow(date, { addSuffix: true });
  }
  
  if (isThisWeek(date)) {
    return 'Created ' + formatDistanceToNow(date, { addSuffix: true });
  }
  
  return 'Created on ' + format(date, 'MMM d, yyyy');
}

interface RecipeListProps {
  recipes: Recipe[];
}

export function RecipeList({ recipes }: RecipeListProps) {
  const navigate = useNavigate();

  return (
    <div>      
      <List>
        {recipes.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            onClick={() => navigate(`/recipes/${recipe.id}`)}
          >
            <ImageWrapper>
              <RecipeImage
                recipeId={recipe.id}
                recipeImage={recipe.image_url}
                size="small"
                alt={recipe.name}
              />
            </ImageWrapper>
            <RecipeInfo>
              <RecipeName>{recipe.name}</RecipeName>
              <RecipeDate>
                {formatCreationDate(recipe.created_on)}
              </RecipeDate>
            </RecipeInfo>
          </RecipeCard>
        ))}
      </List>
      
      <ListCTA>
        <CreateButton onClick={() => navigate('/recipes/new')}>
          <Plus size={20} />
          Create New Recipe
        </CreateButton>
      </ListCTA>
    </div>
  );
}