import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Typography,
  Button,
  Row,
  Col,
  Avatar,
  Dropdown,
  Space,
  Modal,
  Form,
  Input,
  FloatButton,
  Empty,
  Tag,
  message,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  UserOutlined,
  LogoutOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  FunctionOutlined,
  LineChartOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import api from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  source_type?: string;
  date_column?: string;
  value_column?: string;
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      message.error('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (values: { name: string; description?: string }) => {
    setCreating(true);
    try {
      const response = await api.post('/api/projects', values);
      setProjects([response.data, ...projects]);
      setModalVisible(false);
      form.resetFields();
      message.success('Project created successfully!');
    } catch (error) {
      message.error('Failed to create project');
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await api.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
      message.success('Project deleted successfully!');
    } catch (error) {
      message.error('Failed to delete project');
      console.error('Error deleting project:', error);
    }
  };

  const getProjectIcon = (project: Project, index: number) => {
    const icons = [ExperimentOutlined, DatabaseOutlined, FunctionOutlined, LineChartOutlined];
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];
    const IconComponent = icons[index % icons.length];
    return { IconComponent, color: colors[index % colors.length] };
  };

  const getProjectStatus = (project: Project) => {
    if (!project.source_type) return { status: 'Not Started', color: '#6b7280' };
    if (!project.date_column || !project.value_column) return { status: 'Data Loading', color: '#f59e0b' };
    return { status: 'In Progress', color: '#10b981' };
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => message.info('Profile feature coming soon'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  const projectMenuItems = (project: Project) => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => message.info('Edit feature coming soon'),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      onClick: () => {
        Modal.confirm({
          title: 'Delete Project',
          content: 'Are you sure you want to delete this project? This action cannot be undone.',
          okText: 'Delete',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => handleDeleteProject(project.id),
        });
      },
    },
  ];

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
      <div
        style={{
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
      <Header
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Title
          level={3}
          style={{
            margin: 0,
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontWeight: 700,
          }}
        >
          ML Constructor
        </Title>

        <Space size="middle">
          <div style={{ textAlign: 'right' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.9)', display: 'block' }}>
              Welcome back,
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
              {user?.email}
            </Text>
          </div>
          
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Avatar
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                cursor: 'pointer',
              }}
              size="large"
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Space>
      </Header>

      {/* Main Content */}
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <Title
            level={1}
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            Your ML Projects
          </Title>
          <Paragraph
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '16px',
              marginBottom: 0,
            }}
          >
            Build, train, and deploy machine learning models with ease
          </Paragraph>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Spin size="large" />
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginTop: 16 }}>
              Loading projects...
            </Text>
          </div>
        ) : projects.length === 0 ? (
          <Card
            style={{
              background: 'rgba(30, 41, 59, 0.3)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              padding: '48px 24px',
            }}
          >
            <Empty
              image={
                <ExperimentOutlined
                  style={{
                    fontSize: 64,
                    color: '#8b5cf6',
                    marginBottom: 16,
                  }}
                />
              }
              description={
                <div>
                  <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 }}>
                    No projects yet
                  </Title>
                  <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 24 }}>
                    Create your first machine learning project to get started with time series analysis and feature engineering
                  </Paragraph>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setModalVisible(true)}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                      border: 'none',
                      borderRadius: '12px',
                      height: '48px',
                      paddingLeft: '24px',
                      paddingRight: '24px',
                      fontSize: '16px',
                    }}
                  >
                    Create Your First Project
                  </Button>
                </div>
              }
            />
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {projects.map((project, index) => {
              const { IconComponent, color } = getProjectIcon(project, index);
              const { status, color: statusColor } = getProjectStatus(project);

              return (
                <Col xs={24} sm={12} lg={8} key={project.id}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.3)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px ${color}33`;
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.3)';
                    }}
                    actions={[
                      <Dropdown
                        key="more"
                        menu={{ items: projectMenuItems(project) }}
                        placement="bottomRight"
                        trigger={['click']}
                      >
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                        />
                      </Dropdown>,
                    ]}
                  >
                    <Meta
                      avatar={
                        <Avatar
                          style={{
                            background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                            width: 48,
                            height: 48,
                          }}
                          icon={<IconComponent style={{ fontSize: 24 }} />}
                        />
                      }
                      title={
                        <div>
                          <Title
                            level={5}
                            style={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              margin: '0 0 4px 0',
                            }}
                          >
                            {project.name}
                          </Title>
                          <Tag color={statusColor} style={{ fontSize: '10px' }}>
                            {status}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph
                            style={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              margin: '8px 0 16px 0',
                              minHeight: '40px',
                            }}
                            ellipsis={{ rows: 2 }}
                          >
                            {project.description || 'No description provided'}
                          </Paragraph>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              Updated {dayjs(project.updated_at).format('MMM D, YYYY')}
                            </Text>
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: color,
                                boxShadow: `0 0 10px ${color}66`,
                              }}
                            />
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Content>

      {/* Floating Action Button */}
      {projects.length > 0 && (
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          style={{
            backgroundColor: '#8b5cf6',
            boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)',
          }}
          onClick={() => setModalVisible(true)}
        />
      )}

      {/* Create Project Modal */}
      <Modal
        title={
          <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
            Create New Project
          </Title>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        styles={{
          body: { backgroundColor: 'rgba(30, 41, 59, 0.9)' },
          header: { backgroundColor: 'rgba(30, 41, 59, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
        }}
        style={{
          top: '20vh',
        }}
      >
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 24 }}>
          Start building your next machine learning model
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
        >
          <Form.Item
            name="name"
            label={<Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Project Name</Text>}
            rules={[
              { required: true, message: 'Please enter project name!' },
              { min: 2, message: 'Project name must be at least 2 characters!' },
            ]}
          >
            <Input
              placeholder="Enter project name"
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
              }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Description (Optional)</Text>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter project description"
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Dashboard;