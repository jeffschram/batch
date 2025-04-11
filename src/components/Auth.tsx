import React, { useState } from 'react';
import styled from '@emotion/styled';
import { LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AuthContainer = styled.div`
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: var(--surface-light);
  border-radius: 0.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Title = styled.h2`
  color: var(--brand);
  margin: 0 0 1.5rem;
  text-align: center;
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

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const Button = styled.button`
  background-color: var(--brand);
  color: var(--brand-text);
  border: none;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--brand-light);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: var(--brand);
  cursor: pointer;
  font-size: 0.875rem;
  margin-top: 1rem;
  text-align: center;
  width: 100%;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.p`
  color: var(--accent-2);
  font-size: 0.875rem;
  margin: 0;
  text-align: center;
`;

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Validate username format
        if (username.includes(' ')) {
          throw new Error('Username cannot contain spaces');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              username: username,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Update the user's metadata in the auth.users table
        if (data?.user) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              first_name: firstName,
              last_name: lastName,
              username: username,
            },
          });

          if (updateError) throw updateError;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContainer>
      <Title>{isSignUp ? 'Create Account' : 'Sign In'}</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <InputGroup>
              <Input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </InputGroup>
            <Input
              type="text"
              placeholder="Username (no spaces)"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              pattern="^\S*$"
              title="Username cannot contain spaces"
              required
            />
          </>
        )}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {isSignUp ? (
            <>
              <UserPlus size={20} />
              {loading ? 'Creating Account...' : 'Sign Up'}
            </>
          ) : (
            <>
              <LogIn size={20} />
              {loading ? 'Signing In...' : 'Sign In'}
            </>
          )}
        </Button>
      </Form>

      <ToggleButton onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp
          ? 'Already have an account? Sign In'
          : "Don't have an account? Sign Up"}
      </ToggleButton>
    </AuthContainer>
  );
}