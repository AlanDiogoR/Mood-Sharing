import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {User, LoginCredentials, RegisterData} from '../types';
import {authService} from '../services/authService';
import {storage} from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await storage.getUserData();
      const isAuth = await authService.isAuthenticated();

      if (isAuth && storedUser) {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          await storage.clearAll();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      await storage.clearAll();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authContext.tsx:59',message:'login function called',data:{email:credentials.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authContext.tsx:63',message:'login response in context',data:{success:response.success,hasData:!!response.data,error:response.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Erro ao fazer login');
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authContext.tsx:68',message:'login error caught',data:{errorMessage:error?.message,errorType:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Erro ao registrar');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        await storage.setUserData(response.data);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
