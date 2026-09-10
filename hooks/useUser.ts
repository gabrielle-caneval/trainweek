'use client';
import { useLocalStorage } from './useStorage';
import type { User } from '@/lib/types';

export function useUser() {
  const [user, setUser, hydrated] = useLocalStorage<User | null>('tw_user', null);
  const isLoggedIn = user !== null;

  const login = (data: User) => setUser(data);
  const logout = () => setUser(null);
  const update = (patch: Partial<User>) => setUser(prev => prev ? { ...prev, ...patch } : prev);

  return { user, isLoggedIn, hydrated, login, logout, update };
}
