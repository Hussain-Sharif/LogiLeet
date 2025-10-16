import { create } from 'zustand';

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
  setAuth: (payload: { user: User; accessToken: string }) => void;
  clearAuth: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: ({ user, accessToken }) => {
    localStorage.setItem('accessToken', accessToken);
    set({ user, accessToken });
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null });
  }
}));
