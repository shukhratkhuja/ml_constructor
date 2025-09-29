import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Select,
  Form,
  Row,
  Col,
  Space,
  Table,
  Tag,
  Alert,
  Avatar,
  message,
} from 'antd';
import {
  CalendarOutlined,
  LineChartOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import api from '../../../config/axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ColumnMappingStepProps {
  project: any;
  dataInfo: any;
  onMappingComplete: () => void;
  updateProject: (updates: any) => Promise<any>;
}

const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  project,
  dataInfo,
  onMappingComplete,
  updateProject,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Debug logs
  console.log('ColumnMappingStep - dataInfo:', dataInfo);
  console.log('ColumnMappingStep - project:', project);

  // Try to get dataInfo from sessionStorage if not provided
  const [localDataInfo, setLocalDataInfo] = useState(dataInfo);
  
  useEffect(() => {
    if (!dataInfo) {
      const storageKey = `project_${project?.id}_dataInfo`;
      const savedDataInfo = sessionStorage.getItem(storageKey);
      if (savedDataInfo) {
        try {
          const parsedDataInfo = JSON.parse(savedDataInfo);
          setLocalDataInfo(parsedDataInfo);
          console.log('ColumnMappingStep restored dataInfo:', parsedDataInfo);
        } catch (error) {
          console.error('Failed to parse saved dataInfo:', error);
        }
      }
    } else {
      setLocalDataInfo(dataInfo);
    }
  }, [dataInfo, project?.id]);

  const currentDataInfo = localDataInfo || dataInfo;
  const columns = currentDataInfo?.columns || [];
  const sampleData = currentDataInfo?.sample_data || [];

  // Show error if no data available
  if (!currentDataInfo || columns.length === 0) {
    console.log('ColumnMappingStep - No data available:', {
      currentDataInfo,
      columns: columns.length,
      projectId: project?.id,
      storageKey: `project_${project?.id}_dataInfo`
    });

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 }}>
            Column Mapping
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
            Map your data columns to the required fields for time series analysis
          </Paragraph>
        </div>

        <Card
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            padding: '48px 24px',
          }}
        >
          <Alert
            message="No Data Available"
            description="It looks like the file data wasn't loaded properly. Please go back to the data loading step and upload your file again."
            type="warning"
            showIcon
            action={
              <Space>
                <Button 
                  onClick={() => {
                    // Try to reload data from the project's source
                    window.location.reload();
                  }}
                >
                  Reload Page
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => {
                    // Go back to data loading step
                    window.history.back();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                    border: 'none',
                  }}
                >
                  Back to Data Loading
                </Button>
              </Space>
            }
          />
        </Card>
      </Space>
    );
  }

  const handleSaveMapping = async (values: any) => {
    setLoading(true);
    try {
      await updateProject({
        date_column: values.dateColumn,
        value_column: values.valueColumn,
        product_column: values.productColumn || null,
      });

      message.success('Column mapping saved successfully!');
      onMappingComplete();
    } catch (error: any) {
      message.error('Failed to save column mapping');
    } finally {
      setLoading(false);
    }
  };

  const getColumnTypeIcon = (columnType: 'date' | 'value' | 'product') => {
    switch (columnType) {
      case 'date':
        return { icon: CalendarOutlined, color: '#8b5cf6' };
      case 'value':
        return { icon: LineChartOutlined, color: '#06b6d4' };
      case 'product':
        return { icon: AppstoreOutlined, color: '#f59e0b' };
      default:
        return { icon: AppstoreOutlined, color: '#6b7280' };
    }
  };

  const getColumnLabel = (col: string, values: any) => {
    // Safely check values
    if (!values) return null;
    
    if (col === values.dateColumn) return { label: 'DATE', color: '#8b5cf6' };
    if (col === values.valueColumn) return { label: 'VALUE', color: '#06b6d4' };
    if (col === values.productColumn) return { label: 'PRODUCT', color: '#f59e0b' };
    return null;
  };

  const tableColumns = columns.map((col: string) => ({
    title: (
      <Form.Item noStyle shouldUpdate>
        {({ getFieldsValue }) => {
          const values = getFieldsValue() || {}; // Ensure values is not undefined
          const columnInfo = getColumnLabel(col, values);
          return (
            <Space direction="vertical" size={0}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                {col}
              </Text>
              {columnInfo && (
                <Tag
                  color={columnInfo.color}
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {columnInfo.label}
                </Tag>
              )}
            </Space>
          );
        }}
      </Form.Item>
    ),
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (text: any) => (
      <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
        {String(text || '')}
      </Text>
    ),
  }));

  const mappingCards = [
    {
      key: 'dateColumn',
      title: 'Date Column',
      description: 'Required - Column containing date/time information',
      icon: CalendarOutlined,
      color: '#8b5cf6',
      required: true,
    },
    {
      key: 'valueColumn',
      title: 'Value Column',
      description: 'Required - Column containing numerical values to predict',
      icon: LineChartOutlined,
      color: '#06b6d4',
      required: true,
    },
    {
      key: 'productColumn',
      title: 'Product Column',
      description: 'Optional - Column for grouping data by product/category',
      icon: AppstoreOutlined,
      color: '#f59e0b',
      required: false,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div>
        <Title level={3} style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 }}>
          Column Mapping
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
          Map your data columns to the required fields for time series analysis
        </Paragraph>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveMapping}
        initialValues={{
          dateColumn: project?.date_column,
          valueColumn: project?.value_column,
          productColumn: project?.product_column,
        }}
      >
        {/* Column Mapping Cards */}
        <Row gutter={[16, 16]}>
          {mappingCards.map((mapping) => {
            const IconComponent = mapping.icon;
            const rgbaColor = mapping.color === '#8b5cf6' ? '139, 92, 246' : 
                             mapping.color === '#06b6d4' ? '6, 182, 212' : '245, 158, 11';
            
            return (
              <Col xs={24} md={8} key={mapping.key}>
                <Card
                  style={{
                    background: `rgba(${rgbaColor}, 0.1)`,
                    border: `1px solid rgba(${rgbaColor}, 0.3)`,
                    borderRadius: '16px',
                    height: '100%',
                  }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space>
                      <Avatar
                        style={{
                          background: `linear-gradient(135deg, ${mapping.color}, ${mapping.color}CC)`,
                          width: 40,
                          height: 40,
                        }}
                        icon={<IconComponent />}
                      />
                      <div>
                        <Title level={5} style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                          {mapping.title}
                        </Title>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                          {mapping.required ? 'Required' : 'Optional'}
                        </Text>
                      </div>
                    </Space>

                    <Paragraph
                      style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '13px',
                        margin: 0,
                      }}
                    >
                      {mapping.description}
                    </Paragraph>

                    <Form.Item
                      name={mapping.key}
                      rules={mapping.required ? [{ required: true, message: `Please select ${mapping.title.toLowerCase()}!` }] : []}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        placeholder={`Select ${mapping.title.toLowerCase()}`}
                        allowClear={!mapping.required}
                        style={{ width: '100%' }}
                      >
                        {columns.map((col: string) => (
                          <Option key={col} value={col}>
                            {col}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Action Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<CheckCircleOutlined />}
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
            {loading ? 'Saving...' : 'Save Mapping & Continue'}
          </Button>
        </Form.Item>
      </Form>

      {/* Data Preview */}
      <Card
        title="Data Preview"
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message="Column Mapping Preview"
            description="First 5 rows of your data with column mappings highlighted"
            type="info"
            showIcon
          />
          
          {sampleData.length > 0 ? (
            <Table
              columns={tableColumns}
              dataSource={sampleData.slice(0, 5).map((row: any, index: number) => ({ ...row, key: index }))}
              pagination={false}
              scroll={{ x: true }}
              size="small"
              style={{ 
                background: 'rgba(30, 41, 59, 0.2)',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                No sample data available
              </Text>
            </div>
          )}
        </Space>
      </Card>
    </Space>
  );
};

export default ColumnMappingStep;