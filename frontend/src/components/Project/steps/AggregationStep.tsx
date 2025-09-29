import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Select,
  Radio,
  Space,
  Table,
  Tag,
  Alert,
  Statistic,
  Row,
  Col,
  Divider,
  message,
  Spin,
} from 'antd';
import {
  CheckCircleOutlined,
  CalendarOutlined,
  BarChartOutlined,
  FunctionOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import api from '../../../config/axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface AggregationStepProps {
  project: any;
  onComplete: () => void;
  updateProject: (updates: any) => Promise<any>;
}

const AggregationStep: React.FC<AggregationStepProps> = ({
  project,
  onComplete,
  updateProject,
}) => {
  const [loading, setLoading] = useState(false);
  const [aggregationPeriod, setAggregationPeriod] = useState<string>('daily_to_monthly');
  const [mainValueAggregation, setMainValueAggregation] = useState<string>('sum');
  const [aggregatedData, setAggregatedData] = useState<any>(null);
  const [aggregationOptions, setAggregationOptions] = useState<any>({});

  useEffect(() => {
    fetchAggregationOptions();
    fetchExistingAggregation();
  }, []);

  const fetchAggregationOptions = async () => {
    try {
      const response = await api.get('/api/additional-files/aggregation-options');
      setAggregationOptions(response.data);
    } catch (error) {
      console.error('Error fetching aggregation options:', error);
    }
  };

  const fetchExistingAggregation = async () => {
    try {
      const response = await api.get(`/api/aggregation/projects/${project.id}/aggregated-data`);
      setAggregatedData(response.data);
    } catch (error) {
      // No existing aggregation
      console.log('No existing aggregation found');
    }
  };

  const handleAggregate = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/api/aggregation/projects/${project.id}/aggregate`, {
        period: aggregationPeriod,
        main_value_aggregation: mainValueAggregation,
      });

      setAggregatedData(response.data);
      message.success('Data aggregated successfully!');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to aggregate data');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (!aggregatedData) {
      message.warning('Please aggregate data before continuing');
      return;
    }
    onComplete();
  };

  const getPeriodIcon = (period: string) => {
    if (period.includes('weekly')) return '📅';
    if (period.includes('monthly')) return '📆';
    return '🗓️';
  };

  const getPeriodDescription = (period: string) => {
    const descriptions: Record<string, string> = {
      'daily_to_weekly': 'Combine daily data into weekly periods',
      'daily_to_monthly': 'Combine daily data into monthly periods',
      'weekly_to_monthly': 'Combine weekly data into monthly periods',
    };
    return descriptions[period] || 'Aggregate data by time period';
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div>
        <Title level={3} style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 }}>
          Data Aggregation
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
          Aggregate your data to the desired time period. All files will be combined and aligned by date.
        </Paragraph>
      </div>

      {/* Aggregation Configuration */}
      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: '#8b5cf6' }} />
            <span>Aggregation Settings</span>
          </Space>
        }
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Period Selection */}
          <Card size="small" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 500 }}>
                  Aggregation Period
                </Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                  Select how to combine time periods
                </Text>
              </div>
              
              <Radio.Group
                value={aggregationPeriod}
                onChange={(e) => setAggregationPeriod(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {Object.entries(aggregationOptions.periods || {}).map(([key, label]) => (
                    <Card
                      key={key}
                      size="small"
                      style={{
                        background: aggregationPeriod === key ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.3)',
                        border: aggregationPeriod === key ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setAggregationPeriod(key)}
                    >
                      <Radio value={key}>
                        <Space>
                          <span style={{ fontSize: '20px' }}>{getPeriodIcon(key)}</span>
                          <div>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                              {label as string}
                            </Text>
                            <br />
                            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                              {getPeriodDescription(key)}
                            </Text>
                          </div>
                        </Space>
                      </Radio>
                    </Card>
                  ))}
                </Space>
              </Radio.Group>
            </Space>
          </Card>

          {/* Main Value Aggregation */}
          <Card size="small" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 500 }}>
                  Main Value Aggregation Function
                </Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                  How to combine values from the main file column: {project.value_column}
                </Text>
              </div>
              
              <Select
                value={mainValueAggregation}
                onChange={setMainValueAggregation}
                style={{ width: '100%' }}
                size="large"
              >
                {Object.entries(aggregationOptions.aggregation_functions || {}).map(([key, label]) => (
                  <Option key={key} value={key}>
                    <Space>
                      <FunctionOutlined />
                      {label as string}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Space>
          </Card>

          {/* Aggregate Button */}
          <Button
            type="primary"
            size="large"
            icon={<BarChartOutlined />}
            onClick={handleAggregate}
            loading={loading}
            block
            style={{
              background: loading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              border: 'none',
              borderRadius: '12px',
              height: '56px',
              fontSize: '16px',
            }}
          >
            {loading ? 'Aggregating Data...' : 'Aggregate Data'}
          </Button>
        </Space>
      </Card>

      {/* Aggregation Results */}
      {aggregatedData && (
        <Card
          title={
            <Space>
              <DatabaseOutlined style={{ color: '#10b981' }} />
              <span>Aggregation Results</span>
            </Space>
          }
          extra={
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Completed
            </Tag>
          }
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Statistics */}
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Statistic
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Total Rows</Text>}
                    value={aggregatedData.row_count}
                    valueStyle={{ color: '#8b5cf6' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <Statistic
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Total Columns</Text>}
                    value={aggregatedData.columns?.length || 0}
                    valueStyle={{ color: '#06b6d4' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Statistic
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Period</Text>}
                    value={aggregatedData.period?.toUpperCase() || 'N/A'}
                    valueStyle={{ color: '#10b981', fontSize: '20px' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Date Range Info */}
            {aggregatedData.date_range && (
              <Alert
                message="Date Range"
                description={
                  <Space>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      From: <strong>{aggregatedData.date_range.min}</strong>
                    </Text>
                    <Divider type="vertical" />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      To: <strong>{aggregatedData.date_range.max}</strong>
                    </Text>
                  </Space>
                }
                type="info"
                showIcon
              />
            )}

            {/* Columns Info */}
            <Card size="small" title="Available Columns">
              <Space size={[0, 8]} wrap>
                {aggregatedData.columns?.map((col: string, index: number) => {
                  const isMain = col === project.date_column || col === project.value_column;
                  const isAdditional = col.includes('_add');
                  return (
                    <Tag
                      key={index}
                      color={isMain ? 'purple' : isAdditional ? 'cyan' : 'blue'}
                      style={{ fontSize: '12px' }}
                    >
                      {col}
                    </Tag>
                  );
                })}
              </Space>
            </Card>

            {/* Data Preview */}
            <Card size="small" title="Data Preview (First 10 Rows)">
              <Table
                columns={aggregatedData.columns?.map((col: string) => ({
                  title: col,
                  dataIndex: col,
                  key: col,
                  ellipsis: true,
                  render: (text: any) => (
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {typeof text === 'number' ? text.toFixed(2) : String(text || '')}
                    </Text>
                  ),
                }))}
                dataSource={aggregatedData.sample_data?.map((row: any, index: number) => ({ ...row, key: index }))}
                pagination={false}
                size="small"
                scroll={{ x: true }}
                style={{ background: 'rgba(30, 41, 59, 0.2)' }}
              />
            </Card>
          </Space>
        </Card>
      )}

      {/* Continue Button */}
      <Button
        type="primary"
        size="large"
        icon={<CheckCircleOutlined />}
        onClick={handleComplete}
        disabled={!aggregatedData}
        style={{
          background: aggregatedData ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : 'rgba(139, 92, 246, 0.3)',
          border: 'none',
          borderRadius: '12px',
          height: '48px',
          paddingLeft: '24px',
          paddingRight: '24px',
          fontSize: '16px',
        }}
      >
        Continue to Feature Generation
      </Button>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Processing and aggregating data from all files...
            </Text>
          </div>
        </div>
      )}
    </Space>
  );
};

export default AggregationStep;