import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Fab,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { 
  Add, 
  MoreVert, 
  Timeline, 
  Storage, 
  AutoAwesome,
  Person,
  Logout,
  Analytics
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const ModernDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await axios.post('/api/projects', {
        name: newProjectName,
        description: newProjectDescription,
      });
      
      setProjects([...projects, response.data]);
      setCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProjectIcon = (index: number) => {
    const icons = [Timeline, Storage, AutoAwesome, Analytics];
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];
    const IconComponent = icons[index % icons.length];
    return { IconComponent, color: colors[index % colors.length] };
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: 200,
          height: 200,
          background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
          borderRadius: '50%',
          opacity: 0.05,
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: 150,
          height: 150,
          background: 'linear-gradient(45deg, #06b6d4, #0891b2)',
          borderRadius: '50%',
          opacity: 0.05,
          filter: 'blur(40px)',
        }}
      />

      {/* Header */}
      <Box
        sx={{
          background: 'rgba(30, 41, 59, 0.3)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          px: 4,
          py: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 1200,
            mx: 'auto',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            ML Constructor
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Welcome back,
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {user?.email}
              </Typography>
          </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 700,
              mb: 2,
            }}
          >
            Your ML Projects
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 400,
            }}
          >
            Build, train, and deploy machine learning models with ease
          </Typography>
        </Box>

        {/* Projects Grid */}
        {loading ? (
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', py: 8 }}>
            Loading projects...
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {projects.map((project, index) => {
              const { IconComponent, color } = getProjectIcon(index);
              return (
                <Grid item xs={12} sm={6} lg={4} key={project.id}>
                  <Card
                    onClick={() => navigate(`/projects/${project.id}`)}
                    sx={{
                      background: 'rgba(30, 41, 59, 0.3)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px ${color}33`,
                        background: 'rgba(30, 41, 59, 0.5)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                          }}
                        >
                          <IconComponent sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <IconButton
                          size="small"
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.5)',
                            ml: 'auto',
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        {project.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          mb: 3,
                          minHeight: '40px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {project.description || 'No description provided'}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          Updated {formatDate(project.updated_at)}
                        </Typography>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}66`,
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}

            {/* Empty State */}
            {projects.length === 0 && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'rgba(139, 92, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <Timeline sx={{ fontSize: 48, color: '#8b5cf6' }} />
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    No projects yet
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      mb: 4,
                      maxWidth: 400,
                      mx: 'auto',
                    }}
                  >
                    Create your first machine learning project to get started with time series analysis and feature engineering
                  </Typography>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                        boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
                      },
                    }}
                  >
                    Create Your First Project
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      {/* Floating Action Button */}
      {projects.length > 0 && (
        <Fab
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            '&:hover': {
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)',
            },
          }}
        >
          <Add sx={{ color: 'white' }} />
        </Fab>
      )}

      {/* Create Project Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
          },
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600,
              mb: 1,
            }}
          >
            Create New Project
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              mb: 4,
            }}
          >
            Start building your next machine learning model
          </Typography>

          <TextField
            fullWidth
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '& fieldset': { border: 'none' },
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
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
              },
            }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '& fieldset': { border: 'none' },
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
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            disabled={!newProjectName.trim()}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              color: 'white',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '8px',
              ml: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              },
              '&:disabled': {
                background: 'rgba(139, 92, 246, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModernDashboard;
            
            <Avatar
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                cursor: 'pointer',
                width: 48,
                height: 48,
              }}
            >
              <Person />
            </Avatar>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              sx={{
                '& .MuiPaper-root': {
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                },
              }}
            >
              <MenuItem onClick={logout} sx={{ color: 'white' }}>
                <Logout sx={{ mr: 1, fontSize: 20 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>