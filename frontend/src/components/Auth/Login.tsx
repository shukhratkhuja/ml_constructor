import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Layout,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Content } = Layout;

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate('/auth/api/register');
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

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
      <div
        style={{
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

      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}
      >
        <Row justify="center" style={{ width: '100%' }}>
          <Col xs={22} sm={16} md={12} lg={8} xl={6}>
            <Card
              style={{
                background: 'rgba(30, 41, 59, 0.3)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                  <Title
                    level={1}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      margin: '0 0 8px 0',
                      fontSize: '2.5rem',
                      fontWeight: 700,
                    }}
                  >
                    ML Constructor
                  </Title>
                  <Title
                    level={3}
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      margin: '0 0 8px 0',
                      fontWeight: 600,
                    }}
                  >
                    Welcome Back
                  </Title>
                  <Text
                    style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '14px',
                    }}
                  >
                    Sign in to continue to your ML projects
                  </Text>
                </div>

                {/* Login Form */}
                <Form
                  name="login"
                  onFinish={onFinish}
                  size="large"
                  style={{ width: '100%' }}
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter your email!' },
                      { type: 'email', message: 'Please enter a valid email!' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
                      placeholder="Email address"
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        fontSize: '16px',
                        color: 'white',
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Please enter your password!' },
                      { min: 6, message: 'Password must be at least 6 characters!' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
                      placeholder="Password"
                      iconRender={(visible) =>
                        visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                      }
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        fontSize: '16px',
                        color: 'white',
                      }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                      <Link
                        to="#"
                        style={{
                          color: 'rgba(139, 92, 246, 0.8)',
                          textDecoration: 'none',
                          fontSize: '14px',
                        }}
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{
                        height: '56px',
                        borderRadius: '12px',
                        background: loading
                          ? 'rgba(139, 92, 246, 0.5)'
                          : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: 600,
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </Form.Item>
                </Form>

                <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

                {/* Sign Up Link */}
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Don't have an account?{' '}
                    <Link
                      to="/api/auth/register"
                      style={{
                        color: '#8b5cf6',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Sign Up
                    </Link>
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Login;