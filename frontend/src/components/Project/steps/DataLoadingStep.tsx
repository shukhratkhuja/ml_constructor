import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Switch,
  Upload,
  Select,
  Form,
  Input,
  Row,
  Col,
  Space,
  Modal,
  Table,
  Tag,
  message,
  Spin,
  Alert,
  Divider,
} from 'antd';
import {
  CloudUploadOutlined,
  DatabaseOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  TableOutlined,
  FileExcelOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { UploadFile, UploadProps } from 'antd/es/upload/interface';
import api from '../../../config/axios';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

interface DataLoadingStepProps {
  project: any;
  onDataLoaded: (dataInfo: any) => void;
  updateProject: (updates: any) => Promise<any>;
}

interface DatabaseConnection {
  id: number;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
}

const DataLoadingStep: React.FC<DataLoadingStepProps> = ({
  project,
  onDataLoaded,
  updateProject,
}) => {
  const [sourceType, setSourceType] = useState<'file' | 'db'>(project?.source_type || 'file');
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  
  // Database related states
  const [dbConnections, setDbConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | undefined>(undefined);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [connectionModalVisible, setConnectionModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const [form] = Form.useForm();

  useEffect(() => {
    // Load existing dataInfo when component mounts
    const savedDataInfo = sessionStorage.getItem('dataInfo');
    if (savedDataInfo && !previewData) {
      try {
        const parsedDataInfo = JSON.parse(savedDataInfo);
        setPreviewData(parsedDataInfo);
        console.log('Restored previewData from sessionStorage:', parsedDataInfo);
      } catch (error) {
        console.error('Failed to parse saved dataInfo:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (sourceType === 'db') {
      fetchDbConnections();
    }
  }, [sourceType]);

  useEffect(() => {
    if (selectedConnection) {
      fetchTables();
    }
  }, [selectedConnection]);

  const fetchDbConnections = async () => {
    try {
      const response = await api.get('/data-source/db-connections'); // Fixed: removed /api prefix
      setDbConnections(response.data);
    } catch (error) {
      message.error('Failed to fetch database connections');
      console.error('Error fetching DB connections:', error);
    }
  };

  const fetchTables = async () => {
    if (!selectedConnection) return;
    
    try {
      const response = await api.get(`/data-source/db-connections/${selectedConnection}/tables`); // Fixed: removed /api prefix
      setTables(response.data.tables);
    } catch (error) {
      message.error('Failed to fetch tables');
      console.error('Error fetching tables:', error);
    }
  };

  const handleFileUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/data-source/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('File upload response:', response.data); // Debug log

      // Update project with file information
      await updateProject({
        source_type: 'file',
        file_path: response.data.file_path,
      });

      // Set preview data to show the uploaded file content
      setPreviewData(response.data.source_info);
      
      // Store data info in sessionStorage as backup
      sessionStorage.setItem('dataInfo', JSON.stringify(response.data.source_info));
      
      // Call onDataLoaded to proceed to next step - but don't auto-advance yet
      // Let user manually continue to ensure data is properly loaded
      
      onSuccess?.(response.data);
      message.success('File uploaded and processed successfully!');
    } catch (error: any) {
      console.error('File upload error:', error); // Debug log
      onError?.(error);
      message.error(error.response?.data?.detail || 'File upload failed');
      // Reset file list on error
      setFileList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDbPreview = async () => {
    if (!selectedConnection || !selectedTable) return;

    setLoading(true);
    try {
      const response = await api.get(
        `/data-source/db-connections/${selectedConnection}/tables/${selectedTable}/preview` // Fixed: removed /api prefix
      );

      await updateProject({
        source_type: 'db',
        db_connection_id: selectedConnection,
        table_name: selectedTable,
      });

      setPreviewData(response.data.source_info);
      onDataLoaded(response.data.source_info);
      message.success('Data loaded successfully!');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Database preview failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (values: any) => {
    try {
      await api.post('/data-source/test-db-connection', values); // Fixed: removed /api prefix
      message.success('Connection successful!');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Connection failed');
    }
  };

  const handleSaveConnection = async (values: any) => {
    try {
      await api.post('/data-source/db-connections', values); // Fixed: removed /api prefix
      message.success('Connection saved successfully!');
      setConnectionModalVisible(false);
      form.resetFields();
      fetchDbConnections();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save connection');
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.csv')) return <TableOutlined style={{ color: '#10b981' }} />;
    if (fileName.endsWith('.json')) return <ApiOutlined style={{ color: '#f59e0b' }} />;
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return <FileExcelOutlined style={{ color: '#06b6d4' }} />;
    return <FileTextOutlined style={{ color: '#8b5cf6' }} />;
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv,.json,.xlsx,.xls',
    fileList,
    customRequest: handleFileUpload,
    onChange: (info) => {
      setFileList(info.fileList);
      
      // Handle upload status changes
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed`);
        setFileList([]); // Clear failed uploads
      }
    },
    onRemove: (file) => {
      // Clear preview data when file is removed
      setPreviewData(null);
      setFileList([]);
      return true;
    },
    onDrop: (e) => {
      console.log('Dropped files', e.dataTransfer.files);
    },
    beforeUpload: (file) => {
      // Validate file size
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('File must be smaller than 100MB!');
        return false;
      }
      
      // Validate file type
      const allowedTypes = ['.csv', '.json', '.xlsx', '.xls'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = allowedTypes.includes(fileExt);
      if (!isValidType) {
        message.error('Please upload CSV, JSON, or Excel files only!');
        return false;
      }
      
      return true;
    },
  };

  const previewColumns = previewData?.columns?.map((col: string) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (text: any) => (
      <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
        {String(text || '')}
      </Text>
    ),
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div>
        <Title level={3} style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 }}>
          Data Source
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
          Choose your data source to begin the machine learning pipeline
        </Paragraph>
      </div>

      {/* Source Type Toggle */}
      <Card
        title="Select Data Source Type"
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card
              hoverable
              style={{
                background: sourceType === 'file' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(30, 41, 59, 0.2)',
                border: sourceType === 'file' ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
              onClick={() => setSourceType('file')}
            >
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <CloudUploadOutlined style={{ fontSize: 48, color: '#8b5cf6' }} />
                <Title level={5} style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                  File Upload
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  Upload CSV, JSON, or Excel files
                </Text>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              hoverable
              style={{
                background: sourceType === 'db' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(30, 41, 59, 0.2)',
                border: sourceType === 'db' ? '2px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
              onClick={() => setSourceType('db')}
            >
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <DatabaseOutlined style={{ fontSize: 48, color: '#06b6d4' }} />
                <Title level={5} style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                  Database
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  Connect to PostgreSQL database
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* File Upload Section */}
      {sourceType === 'file' && (
        <Card
          title="Upload File"
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Dragger {...uploadProps} style={{ background: 'rgba(30, 41, 59, 0.2)' }}>
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ color: '#8b5cf6' }} />
            </p>
            <p className="ant-upload-text" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Support for CSV, JSON, Excel files. Single file upload only.
            </p>
          </Dragger>

          {fileList.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Alert
                message="File Ready"
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      {getFileIcon(fileList[0].name!)}
                      <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {fileList[0].name}
                      </Text>
                      <Tag color="success">
                        {((fileList[0].size || 0) / (1024 * 1024)).toFixed(2)} MB
                      </Tag>
                    </Space>
                    {previewData && (
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => {
                          console.log('Continue button clicked, passing data:', previewData); // Debug log
                          onDataLoaded(previewData); // Pass data to next step
                          message.success('Proceeding to column mapping...');
                        }}
                        style={{
                          marginTop: 8,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none',
                        }}
                      >
                        Continue to Column Mapping
                      </Button>
                    )}
                  </Space>
                }
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            </div>
          )}
        </Card>
      )}

      {/* Database Connection Section */}
      {sourceType === 'db' && (
        <Card
          title={
            <Space>
              <span>Database Connection</span>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => setConnectionModalVisible(true)}
              >
                Add Connection
              </Button>
            </Space>
          }
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Database Connection</Text>}>
                <Select
                  placeholder="Select database connection"
                  value={selectedConnection}
                  onChange={setSelectedConnection}
                  style={{ width: '100%' }}
                >
                  {dbConnections.map((conn) => (
                    <Option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.host}:{conn.port}/{conn.database})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Table</Text>}>
                <Select
                  placeholder="Select table"
                  value={selectedTable}
                  onChange={setSelectedTable}
                  disabled={!selectedConnection}
                  style={{ width: '100%' }}
                >
                  {tables.map((table) => (
                    <Option key={table} value={table}>
                      {table}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            icon={<DatabaseOutlined />}
            onClick={handleDbPreview}
            disabled={!selectedConnection || !selectedTable || loading}
            loading={loading}
            size="large"
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
            {loading ? 'Loading Data...' : 'Load Data & Continue'}
          </Button>
        </Card>
      )}

      {/* Data Preview */}
      {previewData && (
        <Card
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#10b981' }} />
              <span>Data Preview - Ready for Next Step</span>
            </Space>
          }
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          extra={
            <Button
              type="primary"
              size="small"
              onClick={() => {
                // This will trigger the next step
                message.success('Data loaded successfully! Proceeding to column mapping...');
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
              }}
            >
              Next: Column Mapping
            </Button>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 'bold' }}>
                      {previewData.row_count}
                    </Text>
                    <br />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Total Rows</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text style={{ color: '#06b6d4', fontSize: '24px', fontWeight: 'bold' }}>
                      {previewData.columns?.length || 0}
                    </Text>
                    <br />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Columns</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
                      {previewData.source_type === 'file' ? 'FILE' : 'DB'}
                    </Text>
                    <br />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Source Type</Text>
                  </div>
                </Card>
              </Col>
            </Row>

            <Table
              columns={previewColumns}
              dataSource={previewData.sample_data?.map((row: any, index: number) => ({ ...row, key: index }))}
              pagination={false}
              scroll={{ x: true }}
              size="small"
              style={{ background: 'rgba(30, 41, 59, 0.2)' }}
            />
          </Space>
        </Card>
      )}

      {/* New Connection Modal */}
      <Modal
        title="Add Database Connection"
        open={connectionModalVisible}
        onCancel={() => {
          setConnectionModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveConnection}
        >
          <Form.Item
            name="name"
            label="Connection Name"
            rules={[{ required: true, message: 'Please enter connection name!' }]}
          >
            <Input placeholder="Enter connection name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="host"
                label="Host"
                rules={[{ required: true, message: 'Please enter host!' }]}
              >
                <Input placeholder="localhost" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="port"
                label="Port"
                initialValue={5432}
                rules={[{ required: true, message: 'Please enter port!' }]}
              >
                <Input type="number" placeholder="5432" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="database"
            label="Database"
            rules={[{ required: true, message: 'Please enter database name!' }]}
          >
            <Input placeholder="Enter database name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username!' }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter password!' }]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button onClick={() => form.validateFields().then(handleTestConnection)}>
                Test Connection
              </Button>
              <Button type="primary" htmlType="submit">
                Save Connection
              </Button>
              <Button
                onClick={() => {
                  setConnectionModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Loading State */}
      {loading && (
        <Card
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <Space direction="vertical" size="large">
            <Spin size="large" />
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 500 }}>
                Processing your data...
              </Text>
              <br />
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {sourceType === 'file' ? 'Analyzing file structure and content' : 'Connecting to database and loading data'}
              </Text>
            </div>
          </Space>
        </Card>
      )}

      {/* Success State - only show if not loading and we have preview data */}
      {!loading && previewData && (
        <Alert
          message="✅ Data Source Ready!"
          description={
            <div>
              Successfully loaded <strong>{previewData.row_count}</strong> rows with <strong>{previewData.columns?.length}</strong> columns from your {previewData.source_type === 'file' ? 'file' : 'database'}.
              <br />
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                You can now proceed to map your data columns for time series analysis.
              </Text>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
    </Space>
  );
};

export default DataLoadingStep;