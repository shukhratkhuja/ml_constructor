import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProjectDetail from './components/Project/ProjectDetail';

const { darkAlgorithm } = theme;

const antdTheme = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: '#8b5cf6',
    colorBgBase: '#0f1419',
    colorBgContainer: 'rgba(30, 41, 59, 0.5)',
    colorText: 'rgba(255, 255, 255, 0.9)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorBgElevated: 'rgba(30, 41, 59, 0.8)',
  },
  components: {
    Layout: {
      bodyBg: '#0f1419',
      headerBg: 'rgba(30, 41, 59, 0.3)',
    },
    Card: {
      colorBgContainer: 'rgba(30, 41, 59, 0.3)',
    },
    Button: {
      colorPrimary: '#8b5cf6',
      colorPrimaryHover: '#a855f7',
      borderRadius: 8,
    },
    Input: {
      colorBgContainer: 'rgba(30, 41, 59, 0.5)',
      colorBorder: 'rgba(255, 255, 255, 0.2)',
    },
    Select: {
      colorBgContainer: 'rgba(30, 41, 59, 0.5)',
      colorBorder: 'rgba(255, 255, 255, 0.2)',
    },
    Table: {
      colorBgContainer: 'rgba(30, 41, 59, 0.3)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
    },
    Modal: {
      contentBg: 'rgba(30, 41, 59, 0.9)',
    },
  },
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/api/auth/login" />;
}

function MainApp() {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <AuthProvider>
          <Router>
            <Routes>
              <Route 
                path="/api//auth/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/api/auth/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />

              <Route 
                path="/projects/:projectId" 
                element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Router>
        </AuthProvider>
      </App>
    </ConfigProvider>
  );
}

export default MainApp;