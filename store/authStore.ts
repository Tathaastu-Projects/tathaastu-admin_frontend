import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email: string, password: string) => {
        // Mock login - bypass authentication
        set({
          isAuthenticated: true,
          user: {
            name: "Admin User",
            email: email,
            role: "admin",
          },
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

