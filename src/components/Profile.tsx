import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: var(--brand);
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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

const ErrorMessage = styled.p`
  color: var(--accent-2);
  font-size: 0.875rem;
  margin: 0;
`;

export function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      setProfile({
        email: user.email || '',
        firstName: user.user_metadata.first_name || '',
        lastName: user.user_metadata.last_name || '',
        username: user.user_metadata.username || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          username: profile.username,
        },
      });

      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading profile...</p>;

  return (
    <Container>
      <Header>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back
        </Button>
        <Title>Edit Profile</Title>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            disabled
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={profile.firstName}
            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={profile.lastName}
            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value.trim() })}
            pattern="^\S*$"
            title="Username cannot contain spaces"
            required
          />
        </FormGroup>

        <SaveButton type="submit" disabled={saving}>
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Changes'}
        </SaveButton>
      </Form>
    </Container>
  );
}