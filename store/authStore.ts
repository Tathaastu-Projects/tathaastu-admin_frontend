import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AdminUser = {
  id?: string;
  name: string;
  email: string;
  role: string;
  isDefault?: boolean;
};

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSession: (token: string, user: AdminUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      setSession: (token, user) =>
        set({
          isAuthenticated: true,
          token,
          user,
        }),
      login: async (email: string, password: string) => {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(email || "").trim(),
            password: String(password || ""),
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Invalid email or password");
        }
        const user = payload.data?.user || payload.user;
        const token = payload.data?.token || payload.token;
        if (!user || !token) {
          throw new Error("Login response incomplete");
        }
        set({
          isAuthenticated: true,
          token,
          user: {
            id: user.id,
            name: user.name || "Admin",
            email: user.email,
            role: user.role || "admin",
            isDefault: Boolean(user.isDefault),
          },
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          user: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
