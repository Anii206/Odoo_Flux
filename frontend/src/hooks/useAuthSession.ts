import { useState, useEffect } from 'react';
import { getMe, getToken, removeToken } from '../api';
import { UserSummary } from '../types';

export function useAuthSession(onNotify?: (text: string, type: 'success' | 'error' | 'info') => void) {
  const [loading, setLoading] = useState<boolean>(() => !!getToken());
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(() => {
    try {
      const saved = localStorage.getItem('brightloop_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = getToken();
    if (token) {
      setLoading(true);
      getMe()
        .then((user: UserSummary) => {
          setCurrentUser(user);
          try {
            localStorage.setItem('brightloop_user', JSON.stringify(user));
          } catch {
            // ignore
          }
        })
        .catch(() => {
          removeToken();
          try {
            localStorage.removeItem('brightloop_user');
          } catch {
            // ignore
          }
          setCurrentUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    removeToken();
    try {
      localStorage.removeItem('brightloop_user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    if (onNotify) onNotify('You have been logged out.', 'info');
  };

  const updateCurrentUser = (user: UserSummary | null) => {
    setCurrentUser(user);
    try {
      if (user) {
        localStorage.setItem('brightloop_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('brightloop_user');
      }
    } catch {
      // ignore
    }
  };

  return { currentUser, setCurrentUser: updateCurrentUser, logout, loading };
}
