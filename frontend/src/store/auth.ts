import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'admin' | 'driver' | 'customer';

interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (payload: { user: User; accessToken: string }) => void;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isInitialized: false,
      
      setAuth: ({ user, accessToken }) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isInitialized: true });
      },
      
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isInitialized: true });
      },
      
      initAuth: () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // You'll need to verify the token with backend or decode it
          set({ accessToken: token, isInitialized: true });
        } else {
          set({ isInitialized: true });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken 
      })
    }
  )
);
