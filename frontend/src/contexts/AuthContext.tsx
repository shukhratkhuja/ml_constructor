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
      // Since api baseURL is '/api', endpoint is '/auth/me' which becomes '/api/auth/me'
      const response = await api.get('/auth/me');
      setUser(response.data);
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
      
      // Since api baseURL is '/api', endpoint is '/auth/login' which becomes '/api/auth/login'
      const response = await api.post('/auth/login', { 
        email: email.trim(), 
        password: password.trim() 
      });
      
      const { access_token } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      
      // Save token
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Set token for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Fetch user data
      await fetchUser();
      
      message.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = 'Incorrect email or password';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later';
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
      
      // Since api baseURL is '/api', endpoint is '/auth/register' which becomes '/api/auth/register'
      const response = await api.post('/auth/register', { 
        email: email.trim(), 
        password: password.trim() 
      });
      
      message.success('Registration successful!');
      
      // Auto login after registration
      await login(email, password);
    } catch (error: any) {
      console.error('Register error:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 400) {
        errorMessage = 'Email already registered';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.message && error.message !== 'Login failed') {
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
    message.success('Logged out successfully');
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