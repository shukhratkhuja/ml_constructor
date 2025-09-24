import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Typography,
  Steps,
  Button,
  Progress,
  Row,
  Col,
  Space,
  message,
  Spin,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  SettingOutlined,
  FunctionOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import api from '../../config/axios';

import DataLoadingStep from './steps/DataLoadingStep';
import ColumnMappingStep from './steps/ColumnMappingStep';
import FeatureGenerationStep from './steps/FeatureGenerationStep';
import ModelTrainingStep from './steps/ModelTrainingStep';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Step } = Steps;

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
    title: 'Data Loading', 
    icon: DatabaseOutlined,
    description: 'Upload files or connect to database',
    color: '#8b5cf6'
  },
  { 
    title: 'Column Mapping', 
    icon: SettingOutlined,
    description: 'Map your data columns',
    color: '#06b6d4'
  },
  { 
    title: 'Feature Generation', 
    icon: FunctionOutlined,
    description: 'Create time series features',
    color: '#f59e0b'
  },
  { 
    title: 'Model Training', 
    icon: ExperimentOutlined,
    description: 'Train your ML model',
    color: '#10b981'
  },
];

const ProjectDetail: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    if (!projectId) return;
    
    try {
      const response = await api.get(`/api/projects/${projectId}`);
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
      setCurrentStep(current);
    } catch (error) {
      message.error('Failed to fetch project');
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (updates: Partial<Project>) => {
    if (!projectId) return;
    
    try {
      const response = await api.put(`/api/projects/${projectId}`, updates);
      setProject(response.data);
      return response.data;
    } catch (error) {
      message.error('Failed to update project');
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const handleNext = () => {
    setCurrentStep((prevStep) => prevStep + 1);
    setCompletedSteps((prev) => [...prev, currentStep]);
  };

  const handleStepClick = (step: number) => {
    const maxAllowed = Math.max(...completedSteps, currentStep);
    if (step <= maxAllowed) {
      setCurrentStep(step);
    }
  };

  const renderStepContent = (step: number) => {
    if (!project) return null;

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

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'finish';
    if (stepIndex === currentStep) return 'process';
    return 'wait';
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Space direction="vertical" size="middle" align="center">
            <Spin size="large" />
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading project...</Text>
          </Space>
        </Content>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Project not found</Text>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
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
      <Header
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Space size="middle" style={{ width: '100%' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/dashboard')}
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Back
          </Button>
          
          <div style={{ flex: 1 }}>
            <Title
              level={4}
              style={{
                margin: '0 0 4px 0',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              {project.name}
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
              {project.description || 'Machine Learning Pipeline'}
            </Text>
          </div>

          <Space align="center">
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Progress:
            </Text>
            <Progress
              type="circle"
              size={60}
              percent={Math.round(getStepProgress())}
              strokeColor={{
                '0%': '#8b5cf6',
                '100%': '#06b6d4',
              }}
              strokeWidth={8}
              format={(percent) => `${percent}%`}
            />
          </Space>
        </Space>
      </Header>

      <Layout>
        {/* Sidebar with Steps */}
        <Sider
          width={320}
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ padding: '24px' }}>
            <Title
              level={5}
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '24px',
              }}
            >
              Pipeline Steps
            </Title>

            <Steps
              direction="vertical"
              current={currentStep}
              style={{ maxWidth: '100%' }}
            >
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index === currentStep;
                const isCompleted = completedSteps.includes(index);
                const isClickable = index <= Math.max(...completedSteps, currentStep);

                return (
                  <Step
                    key={index}
                    title={
                      <Text
                        style={{
                          color: isActive ? '#8b5cf6' : isCompleted ? '#10b981' : 'rgba(255, 255, 255, 0.9)',
                          fontWeight: isActive ? 600 : 500,
                          cursor: isClickable ? 'pointer' : 'default',
                        }}
                        onClick={() => isClickable && handleStepClick(index)}
                      >
                        {step.title}
                      </Text>
                    }
                    description={
                      <Text
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '12px',
                        }}
                      >
                        {step.description}
                      </Text>
                    }
                    status={getStepStatus(index)}
                    icon={
                      isCompleted ? (
                        <CheckCircleOutlined style={{ color: '#10b981' }} />
                      ) : isActive ? (
                        <LoadingOutlined style={{ color: '#8b5cf6' }} />
                      ) : (
                        <IconComponent style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      )
                    }
                  />
                );
              })}
            </Steps>
          </div>
        </Sider>

        {/* Main Content Area */}
        <Content style={{ padding: '24px', overflow: 'auto' }}>
          <Card
            style={{
              background: 'rgba(30, 41, 59, 0.3)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              minHeight: 600,
            }}
            bodyStyle={{ padding: '32px' }}
          >
            {renderStepContent(currentStep)}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProjectDetail;