import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { StorageManager, UserAuth, ServerConfig } from "../utils/storage";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserAuth | null;
  activeServer: ServerConfig | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserAuth | null>(null);
  const [activeServer, setActiveServer] = useState<ServerConfig | null>(null);

  useEffect(() => {
    refreshAuthState();
  }, []);

  const refreshAuthState = async () => {
    try {
      const userAuth = await StorageManager.getUserAuth();
      const servers = await StorageManager.getServerConfigs();
      const active = servers.find((s) => s.isActive);

      setUser(userAuth);
      setActiveServer(active || null);
      setIsAuthenticated(userAuth.isLoggedIn && servers.length > 0);
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      setIsAuthenticated(false);
      setUser(null);
      setActiveServer(null);
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      if (!activeServer) {
        throw new Error("No active server configured");
      }

      // Simulate API call to the selected server
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demo purposes, accept any non-empty credentials
      if (username.trim() && password.trim()) {
        const userAuth: UserAuth = {
          isLoggedIn: true,
          userId: Date.now().toString(),
          username: username.trim(),
          currentServerId: activeServer.id,
        };

        await StorageManager.saveUserAuth(userAuth);
        await StorageManager.setFirstTimeSetup(false);

        setUser(userAuth);
        setIsAuthenticated(true);
        return true;
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await StorageManager.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    activeServer,
    login,
    logout,
    refreshAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
