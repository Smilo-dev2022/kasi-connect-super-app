import React from "react";
import { authService, AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  startSignup: (phone: string, name: string) => Promise<{ phone: string; maskedDestination: string }>;
  startLogin: (phone: string) => Promise<{ phone: string; maskedDestination: string }>;
  resendOtp: () => Promise<{ phone: string; maskedDestination: string }>;
  verifyOtp: (code: string) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setUser(authService.getCurrentUser());
    setLoading(false);
    const onStorage = () => setUser(authService.getCurrentUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    startSignup: async (phone, name) => authService.startSignup(phone, name),
    startLogin: async (phone) => authService.startLogin(phone),
    resendOtp: async () => authService.resendOtp(),
    verifyOtp: async (code) => {
      const verified = await authService.verifyOtp(code);
      setUser(verified);
      return verified;
    },
    logout: () => {
      authService.logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

