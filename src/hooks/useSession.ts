'use client';

import { useSessionStore } from '@/src/lib/sessionStore';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function useSession() {
  const { user, isAuthenticated, logout, updateLastActivity } = useSessionStore();
  const router = useRouter();

  const logoutUser = async () => {
    logout();
    await signOut();
    router.push('/login');
  };

  // Call this when you need to extend the session (e.g., after important actions)
  const extendSession = () => {
    updateLastActivity();
  };

  return {
    user,
    isAuthenticated,
    logout: logoutUser,
    extendSession,
  };
}