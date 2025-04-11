import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { LogOut } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Recipe } from './types/database';
import { RecipeList } from './components/RecipeList';
import { RecipeForm } from './components/RecipeForm';
import { RecipeDetail } from './components/RecipeDetail';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { Logo } from './components/Logo';
import { supabase } from './lib/supabase';
import './styles/global.css';

const Header = styled.header`
  background-color: var(--surface-light);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  color: var(--brand);

  svg {
    height: 36px;
    width: auto;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserButton = styled.button`
  background: none;
  border: none;
  color: var(--surface-text);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  font-weight: 500;

  &:hover {
    background-color: var(--surface);
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: var(--accent-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--surface);
  }
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

function AppContent() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRecipes();
    }
  }, [user]);

  // Refresh recipes when navigating back to the home page
  useEffect(() => {
    if (location.pathname === '/' && user) {
      fetchRecipes();
    }
  }, [location.pathname, user]);

  async function fetchRecipes() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_on', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <Header>
        <LogoSection onClick={() => navigate('/')}>
          <Logo />
        </LogoSection>
        <UserSection>
          <UserButton onClick={() => navigate('/profile')}>
            @{user.user_metadata.username || 'anonymous'}
          </UserButton>
          <LogoutButton onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </LogoutButton>
        </UserSection>
      </Header>
      <Main>
        {loading && <p>Loading recipes...</p>}
        {error && (
          <p style={{ color: 'var(--accent-2)' }}>Error: {error}</p>
        )}
        {!loading && !error && (
          <Routes>
            <Route path="/" element={<RecipeList recipes={recipes} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/recipes/new" element={<RecipeForm onSuccess={fetchRecipes} />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/edit" element={<RecipeForm onSuccess={fetchRecipes} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;