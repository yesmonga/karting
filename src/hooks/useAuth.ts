import { useState, useEffect } from 'react';

// Mock User type to maintain compatibility
export interface User {
  id: string;
  email?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const loading = false;

  useEffect(() => {
    // Navigateur "anonyme" par défaut
    setUser({ id: 'anonymous' });
  }, []);

  const signUp = async () => {
    return { error: null };
  };

  const signIn = async () => {
    return { error: null };
  };

  const signOut = async () => {
    return { error: null };
  };

  return {
    user,
    session: null,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
