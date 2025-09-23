import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Slider,
  Radio,
  Row,
  Col,
  Space,
  Table,
  Tag,
  Progress,
  Statistic,
  Alert,
  Empty,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  LineChartOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface ModelTrainingStepProps {
  project: any;
  updateProject: (updates: any) => Promise<any>;
}

interface MLModel {
  id: number;
  name: string;
  model_type: string;
  metrics: any;
  created_at: string;
}

const ModelTrainingStep: React.FC<ModelTrainingStepProps> = ({
  project,
  updateProject,
}) => {
  const [testRatio, setTestRatio] = useState(project?.test_ratio ? project.test_ratio * 100 : 20);
  const [cvFolds, setCvFolds] = useState(project?.cv_folds || 3);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const response = await axios.get(`/api/models/projects/${project.id}/models`);
      setModels(response.data);
      if (response.data.length > 0) {
        setSelectedModel(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setModelsLoading(false);
    }
  };

  const handleTrainModel = async () => {
    setLoading(true);
    try {
      // Update project settings first
      await updateProject({
        test_ratio: testRatio / 100,
        cv_folds: cvFolds,
      });

      // Train model
      const response = await axios.post(`/api/models/projects/${project.id}/train-model`, {
        name: `Model ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
        model_type: 'random_forest',
        parameters: {
          n_estimators: 100,
          max_depth: null,
        }
      });

      setModels([response.data, ...models]);
      setSelectedModel(response.data);
      message.success('Model trained successfully!');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to train model');
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value: number | undefined) => {
    return value !== undefined ? value.toFixed(4) : 'N/A';
  };

  const getMetricColor = (metric: string, value: number | undefined) => {
    if (value === undefined) return 'default';
    
    if (metric === 'r2') {
      return value > 0.8 ? 'success' : value > 0.6 ? 'warning' : 'error';
    }
    // For MSE and MAE, lower is better
    return value < 0.1 ? 'success' : value < 0.3 ? 'warning' : 'error';
  };

  const modelColumns = [
    {
      title: 'Model Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{text}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'model_type',
      key: 'model_type',
      render: (text: string) => (
        <Tag color="blue">{text.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'R² Score',
      key: 'r2',
      render: (record: MLModel) => (
        <Tag color={getMetricColor('r2', record.metrics?.test?.r2)}>
          {formatMetric(record.metrics?.test?.r2)}
        </Tag>
      ),
    },
    {
      title: 'MSE',
      key: 'mse',
      render: (record: MLModel) => (
        <Tag color={getMetricColor('mse', record.metrics?.test?.mse)}>
          {formatMetric(record.metrics?.test?.mse)}
        </Tag>
      ),
    },
    {
      title: 'MAE',
      key: 'mae',
      render: (record: MLModel) => (
        <Tag color={getMetricColor('mae', record.metrics?.test?.mae)}>
          {formatMetric(record.metrics?.test?.mae)}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => (
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
          {dayjs(text).format('MMM D, YYYY HH:mm')}
        </Text>
      ),
    },
  ];

  const featureImportanceColumns = [
    {
      title: 'Feature',
      dataIndex: 'feature',
      key: 'feature',
      render: (text: string) => (
        <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{text}</Text>
      ),
    },
    {
      title: 'Importance',
      dataIndex: 'importance',
      key: 'importance',
      render: (value: number) => (
        <Space>
          <Progress 
            percent={Math.round(value * 100)} 
            size="small" 
            strokeColor="#8b5cf6"
            showInfo={false}
            style={{ width: 100 }}
          />
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
            {formatMetric(value)}
          </Text>
        </Space>
      ),
    },
  ];

  const getFeatureImportanceData = () => {
    if (!selectedModel?.metrics?.feature_importance) return [];
    
    return Object.entries(selectedModel.metrics.feature_importance)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([feature, importance]) => ({
        feature,
        importance: importance as number,
        key: feature,
      }));
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div>
        <Title level={3} style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 }}>
          Model Training
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
          Configure training parameters and train your machine learning model
        </Paragraph>
      </div>

      {/* Training Configuration */}
      <Card
        title={
          <Space>
            <ExperimentOutlined style={{ color: '#8b5cf6' }} />
            <span>Training Configuration</span>
          </Space>
        }
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Row gutter={32}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 500 }}>
                  Test Ratio: {testRatio}%
                </Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                  Percentage of data used for testing
                </Text>
              </div>
              <Slider
                min={10}
                max={50}
                step={5}
                value={testRatio}
                onChange={setTestRatio}
                marks={{
                  10: '10%',
                  20: '20%',
                  30: '30%',
                  40: '40%',
                  50: '50%',
                }}
                style={{ marginTop: 16 }}
              />
            </Space>
          </Col>
          
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 500 }}>
                  Cross-Validation Folds
                </Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                  Number of folds for cross-validation
                </Text>
              </div>
              <Radio.Group
                value={cvFolds}
                onChange={(e) => setCvFolds(e.target.value)}
                style={{ marginTop: 16 }}
              >
                <Radio.Button value={3}>3 Folds</Radio.Button>
                <Radio.Button value={5}>5 Folds</Radio.Button>
                <Radio.Button value={10}>10 Folds</Radio.Button>
              </Radio.Group>
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 32 }}>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleTrainModel}
            loading={loading}
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
            {loading ? 'Training Model...' : 'Train Model'}
          </Button>
        </div>
      </Card>

      {/* Models List */}
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#10b981' }} />
            <span>Trained Models</span>
          </Space>
        }
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {modelsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Space direction="vertical">
              <ThunderboltOutlined style={{ fontSize: 48, color: '#8b5cf6' }} />
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading models...</Text>
            </Space>
          </div>
        ) : models.length === 0 ? (
          <Empty
            image={<ExperimentOutlined style={{ fontSize: 64, color: '#6b7280' }} />}
            description={
              <Space direction="vertical">
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  No models trained yet
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
                  Configure your training parameters and train your first model
                </Text>
              </Space>
            }
          />
        ) : (
          <Table
            columns={modelColumns}
            dataSource={models}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedModel ? [selectedModel.id] : [],
              onSelect: (record) => setSelectedModel(record),
            }}
            style={{ background: 'rgba(30, 41, 59, 0.2)' }}
          />
        )}
      </Card>

      {/* Model Details */}
      {selectedModel && (
        <Card
          title={
            <Space>
              <BarChartOutlined style={{ color: '#06b6d4' }} />
              <span>Model Details: {selectedModel.name}</span>
            </Space>
          }
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Row gutter={24}>
            {/* Performance Metrics */}
            <Col xs={24} lg={12}>
              <Card
                title="Performance Metrics"
                size="small"
                style={{
                  background: 'rgba(30, 41, 59, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Train R²</Text>}
                      value={formatMetric(selectedModel.metrics?.train?.r2)}
                      valueStyle={{ color: '#10b981' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Test R²</Text>}
                      value={formatMetric(selectedModel.metrics?.test?.r2)}
                      valueStyle={{ color: '#8b5cf6' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Train MSE</Text>}
                      value={formatMetric(selectedModel.metrics?.train?.mse)}
                      valueStyle={{ color: '#06b6d4' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Test MSE</Text>}
                      value={formatMetric(selectedModel.metrics?.test?.mse)}
                      valueStyle={{ color: '#f59e0b' }}
                    />
                  </Col>
                </Row>

                {selectedModel.metrics?.cv_mean && (
                  <div style={{ marginTop: 16, padding: 16, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8 }}>
                    <Space direction="vertical" size={4}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                        Cross-Validation Results
                      </Text>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                        R² Score: {formatMetric(selectedModel.metrics.cv_mean)} ± {formatMetric(selectedModel.metrics.cv_std)}
                      </Text>
                    </Space>
                  </div>
                )}
              </Card>
            </Col>

            {/* Feature Importance */}
            <Col xs={24} lg={12}>
              {selectedModel.metrics?.feature_importance && (
                <Card
                  title="Top 10 Feature Importance"
                  size="small"
                  style={{
                    background: 'rgba(30, 41, 59, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Table
                    columns={featureImportanceColumns}
                    dataSource={getFeatureImportanceData()}
                    pagination={false}
                    size="small"
                    showHeader={false}
                    style={{ background: 'transparent' }}
                  />
                </Card>
              )}
            </Col>
          </Row>

          {/* Model Information */}
          <div style={{ marginTop: 16 }}>
            <Alert
              message="Model Information"
              description={
                <Space direction="vertical" size={4}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <strong>Model Type:</strong> {selectedModel.model_type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <strong>Training Date:</strong> {dayjs(selectedModel.created_at).format('MMMM D, YYYY [at] HH:mm')}
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <strong>Test Ratio:</strong> {Math.round(testRatio)}% of data used for testing
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <strong>Cross-Validation:</strong> {cvFolds}-fold validation
                  </Text>
                </Space>
              }
              type="info"
              showIcon
              icon={<LineChartOutlined />}
            />
          </div>
        </Card>
      )}

      {/* Success Message */}
      {models.length > 0 && (
        <Alert
          message="🎉 Model Training Complete!"
          description="Your machine learning model has been successfully trained and is ready for use. You can now make predictions or deploy the model."
          type="success"
          showIcon
          action={
            <Button size="small" type="primary">
              Deploy Model
            </Button>
          }
        />
      )}
    </Space>
  );
};

export default ModelTrainingStep;