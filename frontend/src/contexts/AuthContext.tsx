import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import api from '../config/axios';

interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      // API endpoint to'g'ri yo'li
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      console.log('User fetched successfully:', response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email });
      
      // API endpoint to'g'ri yo'li - backend da /api/auth/login bor
      const response = await api.post('/api/auth/login', { 
        email: email.trim(), 
        password: password.trim() 
      });
      
      console.log('Login response:', response.data);
      
      const { access_token } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      
      // Token ni saqlash
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Keyingi requestlar uchun token o'rnatish
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // User ma'lumotlarini olish
      await fetchUser();
      
      message.success('Muvaffaqiyatli kirildi!');
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Kirish amalga oshmadi';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = 'Email yoki parol noto\'g\'ri';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server xatosi. Keyinroq urinib ko\'ring';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting register with:', { email });
      
      // API endpoint to'g'ri yo'li - backend da /api/auth/register bor
      const response = await api.post('/api/auth/register', { 
        email: email.trim(), 
        password: password.trim() 
      });
      
      console.log('Register response:', response.data);
      
      message.success('Ro\'yxatdan o\'tish muvaffaqiyatli!');
      
      // Ro'yxatdan o'tgandan keyin avtomatik kirish
      await login(email, password);
    } catch (error: any) {
      console.error('Register error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Ro\'yxatdan o\'tish amalga oshmadi';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 400) {
        errorMessage = 'Bu email allaqachon ro\'yxatdan o\'tgan';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server xatosi. Keyinroq urinib ko\'ring';
      } else if (error.message && error.message !== 'Kirish amalga oshmadi') {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    message.success('Muvaffaqiyatli chiqildi');
    console.log('User logged out');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}