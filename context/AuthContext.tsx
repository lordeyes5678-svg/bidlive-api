import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, useGetMe, useLogin, useRegister } from "@workspace/api-client-react";
import { router } from "expo-router";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutateAsync"];
  register: ReturnType<typeof useRegister>["mutateAsync"];
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const tokenRef = { current: null as string | null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    async function init() {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        if (storedToken) {
          tokenRef.current = storedToken;
          setTokenState(storedToken);
        }
      } catch (e) {
        console.error("Failed to restore token", e);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  const setToken = async (newToken: string | null) => {
    tokenRef.current = newToken;
    setTokenState(newToken);
    if (newToken) {
      await AsyncStorage.setItem("auth_token", newToken);
    } else {
      await AsyncStorage.removeItem("auth_token");
    }
  };

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const login = async (...args: Parameters<typeof loginMutation.mutateAsync>) => {
    const res = await loginMutation.mutateAsync(...args);
    await setToken(res.token);
    await refetch();
    return res;
  };

  const registerFn = async (...args: Parameters<typeof registerMutation.mutateAsync>) => {
    const res = await registerMutation.mutateAsync(...args);
    await setToken(res.token);
    await refetch();
    return res;
  };

  const logout = async () => {
    await setToken(null);
    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        token,
        isAuthenticated: !!token && !!user,
        isLoading: isInitializing || (!!token && isUserLoading),
        login,
        register: registerFn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
