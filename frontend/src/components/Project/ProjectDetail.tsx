import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
} from '@mui/material';
import { ArrowBack, DataUsage, Tune, AutoAwesome, ModelTraining } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import DataLoadingStep from './steps/DataLoadingStep';
import ColumnMappingStep from './steps/ColumnMappingStep';
import FeatureGenerationStep from './steps/FeatureGenerationStep';
import ModelTrainingStep from './steps/ModelTrainingStep';

interface Project {
  id: number;
  name: string;
  description: string;
  source_type?: string;
  date_column?: string;
  value_column?: string;
  product_column?: string;
  test_ratio?: number;
  cv_folds?: number;
}

const steps = [
  { 
    label: 'Data Loading', 
    icon: DataUsage,
    description: 'Upload files or connect to database',
    color: '#8b5cf6'
  },
  { 
    label: 'Column Mapping', 
    icon: Tune,
    description: 'Map your data columns',
    color: '#06b6d4'
  },
  { 
    label: 'Feature Generation', 
    icon: AutoAwesome,
    description: 'Create time series features',
    color: '#f59e0b'
  },
  { 
    label: 'Model Training', 
    icon: ModelTraining,
    description: 'Train your ML model',
    color: '#10b981'
  },
];

const ModernProjectDetail: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}`);
      setProject(response.data);
      
      // Determine current step and completed steps based on project data
      const completed: number[] = [];
      let current = 0;
      
      if (response.data.source_type) {
        completed.push(0);
        current = 1;
        if (response.data.date_column && response.data.value_column) {
          completed.push(1);
          current = 2;
          if (response.data.date_features || response.data.numerical_features) {
            completed.push(2);
            current = 3;
          }
        }
      }
      
      setCompletedSteps(completed);
      setActiveStep(current);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (updates: Partial<Project>) => {
    try {
      const response = await axios.put(`/api/projects/${projectId}`, updates);
      setProject(response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setCompletedSteps((prev) => [...prev, activeStep]);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <DataLoadingStep
            project={project}
            onDataLoaded={(info) => {
              setDataInfo(info);
              handleNext();
            }}
            updateProject={updateProject}
          />
        );
      case 1:
        return (
          <ColumnMappingStep
            project={project}
            dataInfo={dataInfo}
            onMappingComplete={handleNext}
            updateProject={updateProject}
          />
        );
      case 2:
        return (
          <FeatureGenerationStep
            project={project}
            onFeaturesGenerated={handleNext}
            updateProject={updateProject}
          />
        );
      case 3:
        return (
          <ModelTrainingStep
            project={project}
            updateProject={updateProject}
          />
        );
      default:
        return null;
    }
  };

  const getStepProgress = () => {
    return (completedSteps.length / steps.length) * 100;
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading project...</Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Project not found</Typography>
      </Box>
    );
  }

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
          top: '15%',
          right: '8%',
          width: 180,
          height: 180,
          background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
          borderRadius: '50%',
          opacity: 0.05,
          filter: 'blur(50px)',
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
            maxWidth: 1200,
            mx: 'auto',
          }}
        >
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mr: 2,
              '&:hover': {
                color: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              },
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              {project.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {project.description || 'Machine Learning Pipeline'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              Progress:
            </Typography>
            <Box sx={{ width: 100 }}>
              <LinearProgress
                variant="determinate"
                value={getStepProgress()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              {Math.round(getStepProgress())}%
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Sidebar with Steps */}
          <Box sx={{ width: 300 }}>
            <Card
              sx={{
                background: 'rgba(30, 41, 59, 0.3)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                p: 3,
                position: 'sticky',
                top: 100,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                Pipeline Steps
              </Typography>

              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index === activeStep;
                const isCompleted = completedSteps.includes(index);
                const isClickable = index <= Math.max(...completedSteps, activeStep);

                return (
                  <Box
                    key={index}
                    onClick={() => isClickable && handleStepClick(index)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      mb: 2,
                      borderRadius: '12px',
                      cursor: isClickable ? 'pointer' : 'default',
                      background: isActive 
                        ? 'rgba(139, 92, 246, 0.1)' 
                        : isCompleted 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'transparent',
                      border: isActive 
                        ? '1px solid rgba(139, 92, 246, 0.3)' 
                        : '1px solid transparent',
                      transition: 'all 0.3s ease',
                      opacity: isClickable ? 1 : 0.5,
                      '&:hover': isClickable ? {
                        background: isActive 
                          ? 'rgba(139, 92, 246, 0.15)' 
                          : 'rgba(255, 255, 255, 0.05)',
                      } : {},
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: isCompleted
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : isActive
                          ? 'linear-gradient(135deg, #8b5cf6, #a855f7)'
                          : 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <IconComponent 
                        sx={{ 
                          color: 'white', 
                          fontSize: 20 
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: isActive ? 600 : 500,
                        }}
                      >
                        {step.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '12px',
                        }}
                      >
                        {step.description}
                      </Typography>
                    </Box>

                    {isCompleted && (
                      <Chip
                        label="Done"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          fontSize: '10px',
                          height: 20,
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Card>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ flexGrow: 1 }}>
            <Card
              sx={{
                background: 'rgba(30, 41, 59, 0.3)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                p: 4,
                minHeight: 600,
              }}
            >
              {renderStepContent(activeStep)}
              
              {/* Navigation Buttons */}
              {activeStep < steps.length - 1 && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      textTransform: 'none',
                      px: 3,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                      '&:disabled': {
                        color: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    Back
                  </Button>
                </Box>
              )}
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ModernProjectDetail;