import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff, Email } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const ModernLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: 200,
          height: 200,
          background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
          borderRadius: '50%',
          opacity: 0.1,
          filter: 'blur(40px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: 150,
          height: 150,
          background: 'linear-gradient(45deg, #06b6d4, #0891b2)',
          borderRadius: '50%',
          opacity: 0.1,
          filter: 'blur(30px)',
        }}
      />

      {/* Main login card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          padding: 4,
          borderRadius: '24px',
          background: 'rgba(30, 41, 59, 0.3)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              mb: 1,
            }}
          >
            ML Constructor
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600,
              mb: 1,
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Sign in to continue to your ML projects
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              borderRadius: '12px',
            }}
          >
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #8b5cf6',
                  boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
                padding: '16px 14px',
                fontSize: '16px',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
              },
            }}
          />

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #8b5cf6',
                  boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
                padding: '16px 14px',
                fontSize: '16px',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
              },
            }}
          />

          {/* Forgot password link */}
          <Box sx={{ textAlign: 'right', mb: 4 }}>
            <Link
              href="#"
              sx={{
                color: 'rgba(139, 92, 246, 0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                '&:hover': {
                  color: '#8b5cf6',
                  textDecoration: 'underline',
                },
              }}
            >
              Forgot Password?
            </Link>
          </Box>

          {/* Sign In Button */}
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              height: '56px',
              borderRadius: '12px',
              background: loading 
                ? 'rgba(139, 92, 246, 0.5)' 
                : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'none',
              mb: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          {/* Sign Up Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: '#8b5cf6',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ModernLogin;