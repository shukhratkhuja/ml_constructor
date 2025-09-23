import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Checkbox,
  Row,
  Col,
  Space,
  Modal,
  Tag,
  Switch,
  Divider,
  Alert,
  message,
} from 'antd';
import {
  CalendarOutlined,
  FunctionOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  NumberOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

interface FeatureGenerationStepProps {
  project: any;
  onFeaturesGenerated: () => void;
  updateProject: (updates: any) => Promise<any>;
}

const FeatureGenerationStep: React.FC<FeatureGenerationStepProps> = ({
  project,
  onFeaturesGenerated,
  updateProject,
}) => {
  const [loading, setLoading] = useState(false);
  
  // Date features state
  const [dateFeatures, setDateFeatures] = useState({
    month: false,
    year: false,
    quarter: false,
    month_sin: false,
    month_cos: false,
    quarter_sin: false,
    quarter_cos: false,
    number_of_holidays_governmental: false,
    number_of_holidays_religious: false,
    periods_until_next_governmental_holiday: false,
    periods_until_next_religious_holiday: false,
    number_of_ramadan_days_in_month: false,
  });

  // Numerical features state
  const [numericalFeatures, setNumericalFeatures] = useState({
    lag_periods: [] as number[],
    rolling_windows: [] as number[],
    trend_periods: [] as number[],
    change_periods: [] as number[],
    include_statistics: false,
    include_trend_features: false,
  });

  const [numberModalVisible, setNumberModalVisible] = useState(false);
  const [currentNumberType, setCurrentNumberType] = useState<string>('');

  // Numbers 1-30 for calendar view
  const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

  useEffect(() => {
    // Load existing features if they exist
    if (project?.date_features) {
      setDateFeatures({ ...dateFeatures, ...project.date_features });
    }
    if (project?.numerical_features) {
      setNumericalFeatures({ ...numericalFeatures, ...project.numerical_features });
    }
  }, [project]);

  const handleDateFeatureChange = (feature: string, checked: boolean) => {
    setDateFeatures(prev => ({
      ...prev,
      [feature]: checked,
    }));
  };

  const handleNumberSelection = (number: number) => {
    setNumericalFeatures(prev => {
      const currentArray = prev[currentNumberType as keyof typeof prev] as number[];
      const newArray = currentArray.includes(number)
        ? currentArray.filter(n => n !== number)
        : [...currentArray, number].sort((a, b) => a - b);
      
      return {
        ...prev,
        [currentNumberType]: newArray,
      };
    });
  };

  const openNumberModal = (type: string) => {
    setCurrentNumberType(type);
    setNumberModalVisible(true);
  };

  const handleGenerateFeatures = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/features/projects/${project.id}/generate-features`,
        {
          date_features: dateFeatures,
          numerical_features: numericalFeatures,
        }
      );

      await updateProject({
        date_features: dateFeatures,
        numerical_features: numericalFeatures,
      });

      message.success('Features generated successfully!');
      onFeaturesGenerated();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to generate features');
    } finally {
      setLoading(false);
    }
  };

  const dateFeaturesList = [
    { key: 'month', label: 'Month (1-12)', description: 'Extract month number from date' },
    { key: 'year', label: 'Year', description: 'Extract year from date' },
    { key: 'quarter', label: 'Quarter (1-4)', description: 'Extract quarter from date' },
    { key: 'month_sin', label: 'Month Sine', description: 'Cyclical month representation (sine)' },
    { key: 'month_cos', label: 'Month Cosine', description: 'Cyclical month representation (cosine)' },
    { key: 'quarter_sin', label: 'Quarter Sine', description: 'Cyclical quarter representation (sine)' },
    { key: 'quarter_cos', label: 'Quarter Cosine', description: 'Cyclical quarter representation (cosine)' },
    { key: 'number_of_holidays_governmental', label: 'Government Holidays', description: 'Count of government holidays in period' },
    { key: 'number_of_holidays_religious', label: 'Religious Holidays', description: 'Count of religious holidays in period' },
    { key: 'periods_until_next_governmental_holiday', label: 'Next Gov Holiday', description: 'Periods until next government holiday' },
    { key: 'periods_until_next_religious_holiday', label: 'Next Religious Holiday', description: 'Periods until next religious holiday' },
    { key: 'number_of_ramadan_days_in_month', label: 'Ramadan Days', description: 'Number of Ramadan days in month' },
  ];

  const numericalFeatureTypes = [
    { 
      key: 'lag_periods', 
      title: 'Lag Periods', 
      description: 'Previous period values (e.g., yesterday\'s value)',
      icon: NumberOutlined,
      color: '#8b5cf6' 
    },
    { 
      key: 'rolling_windows', 
      title: 'Rolling Windows', 
      description: 'Moving averages and statistics over N periods',
      icon: FunctionOutlined,
      color: '#06b6d4' 
    },
    { 
      key: 'trend_periods', 
      title: 'Trend Periods', 
      description: 'Trend analysis over N periods',
      icon: SettingOutlined,
      color: '#f59e0b' 
    },
    { 
      key: 'change_periods', 
      title: 'Change Periods', 
      description: 'Percentage change over N periods',
      icon: CalendarOutlined,
      color: '#10b981' 
    },
  ];

  const getSelectedNumbers = (type: string) => {
    return numericalFeatures[type as keyof typeof numericalFeatures] as number[];
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div>
        <Title level={3} style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 }}>
          Feature Generation
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
          Select and configure features for your time series model
        </Paragraph>
      </div>

      {/* Date Features */}
      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: '#8b5cf6' }} />
            <span>Date Features</span>
          </Space>
        }
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 16 }}>
          Extract temporal features from your date column
        </Paragraph>
        
        <Row gutter={[16, 16]}>
          {dateFeaturesList.map((feature) => (
            <Col xs={24} sm={12} md={8} lg={6} key={feature.key}>
              <Card
                size="small"
                style={{
                  background: dateFeatures[feature.key as keyof typeof dateFeatures] 
                    ? 'rgba(139, 92, 246, 0.1)' 
                    : 'rgba(30, 41, 59, 0.2)',
                  border: dateFeatures[feature.key as keyof typeof dateFeatures]
                    ? '1px solid #8b5cf6'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                }}
                onClick={() => handleDateFeatureChange(feature.key, !dateFeatures[feature.key as keyof typeof dateFeatures])}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space size="small" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      fontWeight: 500,
                      fontSize: '13px' 
                    }}>
                      {feature.label}
                    </Text>
                    <Checkbox 
                      checked={dateFeatures[feature.key as keyof typeof dateFeatures]}
                      onChange={(e) => handleDateFeatureChange(feature.key, e.target.checked)}
                    />
                  </Space>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '11px',
                    lineHeight: '1.3' 
                  }}>
                    {feature.description}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Numerical Features */}
      <Card
        title={
          <Space>
            <FunctionOutlined style={{ color: '#06b6d4' }} />
            <span>Numerical Features</span>
          </Space>
        }
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 16 }}>
          Generate numerical features from your value column
        </Paragraph>

        <Row gutter={[16, 16]}>
          {numericalFeatureTypes.map((featureType) => {
            const IconComponent = featureType.icon;
            const selectedNumbers = getSelectedNumbers(featureType.key);
            
            return (
              <Col xs={24} sm={12} md={6} key={featureType.key}>
                <Card
                  style={{
                    background: `rgba(${featureType.color === '#8b5cf6' ? '139, 92, 246' : featureType.color === '#06b6d4' ? '6, 182, 212' : featureType.color === '#f59e0b' ? '245, 158, 11' : '16, 185, 129'}, 0.1)`,
                    border: `1px solid ${featureType.color}33`,
                    height: '100%',
                  }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space>
                      <IconComponent style={{ color: featureType.color, fontSize: 20 }} />
                      <div>
                        <Title level={5} style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                          {featureType.title}
                        </Title>
                      </div>
                    </Space>

                    <Paragraph
                      style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '13px',
                        margin: 0,
                      }}
                    >
                      {featureType.description}
                    </Paragraph>

                    <Button
                      onClick={() => openNumberModal(featureType.key)}
                      style={{
                        width: '100%',
                        borderColor: featureType.color,
                        color: featureType.color,
                      }}
                    >
                      Select Periods
                    </Button>

                    {selectedNumbers.length > 0 && (
                      <div>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                          Selected:
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          {selectedNumbers.map(num => (
                            <Tag 
                              key={num} 
                              color={featureType.color} 
                              size="small" 
                              style={{ margin: '2px' }}
                            >
                              {num}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

        <Row gutter={16}>
          <Col span={12}>
            <Space align="center">
              <Switch
                checked={numericalFeatures.include_statistics}
                onChange={(checked) => setNumericalFeatures(prev => ({
                  ...prev,
                  include_statistics: checked
                }))}
              />
              <div>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Include Statistics</Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                  Add mean, min, max, std for rolling windows
                </Text>
              </div>
            </Space>
          </Col>
          <Col span={12}>
            <Space align="center">
              <Switch
                checked={numericalFeatures.include_trend_features}
                onChange={(checked) => setNumericalFeatures(prev => ({
                  ...prev,
                  include_trend_features: checked
                }))}
              />
              <div>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Include Trend Features</Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                  Add trend analysis features
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Generate Features Button */}
      <Button
        type="primary"
        size="large"
        icon={<CheckCircleOutlined />}
        onClick={handleGenerateFeatures}
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
        {loading ? 'Generating Features...' : 'Generate Features & Continue'}
      </Button>

      {/* Number Selection Modal */}
      <Modal
        title={`Select ${numericalFeatureTypes.find(t => t.key === currentNumberType)?.title || 'Periods'}`}
        open={numberModalVisible}
        onCancel={() => setNumberModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setNumberModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message="Select Periods"
            description="Click on numbers to select/deselect periods for feature generation"
            type="info"
            showIcon
          />
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)', 
            gap: '8px',
            padding: '16px 0'
          }}>
            {numbers.map((num) => {
              const isSelected = getSelectedNumbers(currentNumberType).includes(num);
              return (
                <Button
                  key={num}
                  type={isSelected ? "primary" : "default"}
                  onClick={() => handleNumberSelection(num)}
                  style={{
                    height: '40px',
                    background: isSelected ? '#8b5cf6' : 'transparent',
                    borderColor: isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)',
                    color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {num}
                </Button>
              );
            })}
          </div>

          {getSelectedNumbers(currentNumberType).length > 0 && (
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Selected: {getSelectedNumbers(currentNumberType).join(', ')}
              </Text>
            </div>
          )}
        </Space>
      </Modal>
    </Space>
  );
};

export default FeatureGenerationStep;