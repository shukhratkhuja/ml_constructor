import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Upload,
  Table,
  Space,
  Select,
  Checkbox,
  Tag,
  Modal,
  message,
  Empty,
  Divider,
  Alert,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { UploadFile, UploadProps } from 'antd/es/upload/interface';
import api from '../../../config/axios';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

interface AdditionalFilesStepProps {
  project: any;
  onComplete: () => void;
  updateProject: (updates: any) => Promise<any>;
}

interface AdditionalFile {
  id: number;
  file_name: string;
  file_type: string;
  date_column?: string;
  product_column?: string;
  selected_columns?: string[];
  column_aggregations?: Record<string, string>;
  fill_method: string;
}

interface FilePreview {
  columns: string[];
  row_count: number;
  sample_data: any[];
}

const AdditionalFilesStep: React.FC<AdditionalFilesStepProps> = ({
  project,
  onComplete,
  updateProject,
}) => {
  const [additionalFiles, setAdditionalFiles] = useState<AdditionalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [mappingModalVisible, setMappingModalVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState<AdditionalFile | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [aggregationOptions, setAggregationOptions] = useState<any>({});
  
  // Mapping form state
  const [dateColumn, setDateColumn] = useState<string>('');
  const [productColumn, setProductColumn] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnAggregations, setColumnAggregations] = useState<Record<string, string>>({});
  const [fillMethod, setFillMethod] = useState<string>('zero');

  useEffect(() => {
    fetchAdditionalFiles();
    fetchAggregationOptions();
  }, []);

  const fetchAdditionalFiles = async () => {
    try {
      const response = await api.get(`/api/additional-files/projects/${project.id}/additional-files`);
      setAdditionalFiles(response.data);
    } catch (error) {
      console.error('Error fetching additional files:', error);
    }
  };

  const fetchAggregationOptions = async () => {
    try {
      const response = await api.get('/api/additional-files/aggregation-options');
      setAggregationOptions(response.data);
    } catch (error) {
      console.error('Error fetching aggregation options:', error);
    }
  };

  const handleFileUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(
        `/api/additional-files/projects/${project.id}/additional-files/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      onSuccess?.(response.data);
      message.success('Additional file uploaded successfully!');
      fetchAdditionalFiles();
      setFileList([]);
    } catch (error: any) {
      onError?.(error);
      message.error(error.response?.data?.detail || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMapping = async (file: AdditionalFile) => {
    try {
      const response = await api.get(
        `/api/additional-files/projects/${project.id}/additional-files/${file.id}/preview`
      );
      setFilePreview(response.data);
      setCurrentFile(file);
      setDateColumn(file.date_column || '');
      setProductColumn(file.product_column || '');
      setSelectedColumns(file.selected_columns || []);
      setColumnAggregations(file.column_aggregations || {});
      setFillMethod(file.fill_method || 'zero');
      setMappingModalVisible(true);
    } catch (error: any) {
      message.error('Failed to load file preview');
    }
  };

  const handleSaveMapping = async () => {
    if (!currentFile) return;
    
    if (!dateColumn || selectedColumns.length === 0) {
      message.error('Please select date column and at least one data column');
      return;
    }

    // Ensure all selected columns have aggregation functions
    const updatedAggregations = { ...columnAggregations };
    selectedColumns.forEach(col => {
      if (!updatedAggregations[col]) {
        updatedAggregations[col] = 'mean';
      }
    });

    try {
      await api.post(
        `/api/additional-files/projects/${project.id}/additional-files/${currentFile.id}/map-columns`,
        {
          additional_file_id: currentFile.id,
          date_column: dateColumn,
          product_column: productColumn || null,  // ✅ Send null if empty (optional)
          selected_columns: selectedColumns,
          column_aggregations: updatedAggregations,
          fill_method: fillMethod,
        }
      );

      message.success('Column mapping saved successfully!');
      setMappingModalVisible(false);
      fetchAdditionalFiles();
    } catch (error: any) {
      message.error('Failed to save column mapping');
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await api.delete(
        `/api/additional-files/projects/${project.id}/additional-files/${fileId}`
      );
      message.success('File deleted successfully!');
      fetchAdditionalFiles();
    } catch (error: any) {
      message.error('Failed to delete file');
    }
  };

  const handleColumnSelect = (columns: string[]) => {
    setSelectedColumns(columns);
    
    // Initialize aggregations for newly selected columns
    const newAggregations = { ...columnAggregations };
    columns.forEach(col => {
      if (!newAggregations[col]) {
        newAggregations[col] = 'mean';
      }
    });
    
    // Remove aggregations for deselected columns
    Object.keys(newAggregations).forEach(col => {
      if (!columns.includes(col)) {
        delete newAggregations[col];
      }
    });
    
    setColumnAggregations(newAggregations);
  };

  const handleComplete = () => {
    // Check if all files have mappings
    const unmappedFiles = additionalFiles.filter(f => !f.date_column || !f.selected_columns);
    if (unmappedFiles.length > 0) {
      message.warning('Please map columns for all additional files');
      return;
    }
    onComplete();
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv,.json,.xlsx,.xls',
    fileList,
    customRequest: handleFileUpload,
    onChange: (info) => {
      setFileList(info.fileList);
    },
  };

  const fileColumns = [
    {
      title: 'File Name',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: AdditionalFile) => (
        <Space>
          <FileTextOutlined style={{ color: '#8b5cf6' }} />
          <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{text}</Text>
          <Tag color={record.file_type === 'csv' ? 'green' : record.file_type === 'json' ? 'orange' : 'blue'}>
            {record.file_type.toUpperCase()}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: AdditionalFile) => {
        const isMapped = record.date_column && record.selected_columns && record.selected_columns.length > 0;
        return (
          <Tag color={isMapped ? 'success' : 'warning'}>
            {isMapped ? 'Mapped' : 'Not Mapped'}
          </Tag>
        );
      },
    },
    {
      title: 'Mapped Columns',
      key: 'columns',
      render: (record: AdditionalFile) => {
        if (!record.selected_columns) return <Text style={{ color: 'rgba(255, 255, 255, 0.5)' }}>-</Text>;
        return (
          <Space size={[0, 4]} wrap>
            {record.selected_columns.map(col => (
              <Tag key={col} color="blue" style={{ fontSize: '11px' }}>
                {col}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: AdditionalFile) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenMapping(record)}
          >
            Configure
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteFile(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div>
        <Title level={3} style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 }}>
          Additional Files (Optional)
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
          Add additional data files to enrich your main dataset. These files will be merged based on date alignment.
        </Paragraph>
      </div>

      {/* Upload Section */}
      <Card
        title="Upload Additional Files"
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
            Click or drag additional file to upload
          </p>
          <p className="ant-upload-hint" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Support for CSV, JSON, Excel files. These files will be merged with your main data.
          </p>
        </Dragger>
      </Card>

      {/* Additional Files List */}
      <Card
        title={`Additional Files (${additionalFiles.length})`}
        style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {additionalFiles.length === 0 ? (
          <Empty
            image={<FileTextOutlined style={{ fontSize: 64, color: '#6b7280' }} />}
            description={
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                No additional files uploaded yet
              </Text>
            }
          />
        ) : (
          <Table
            columns={fileColumns}
            dataSource={additionalFiles}
            rowKey="id"
            pagination={false}
            style={{ background: 'rgba(30, 41, 59, 0.2)' }}
          />
        )}
      </Card>

      {/* Continue Button */}
      <Button
        type="primary"
        size="large"
        icon={<CheckCircleOutlined />}
        onClick={handleComplete}
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
        Continue to Aggregation
      </Button>

      {/* Column Mapping Modal */}
      <Modal
        title={
          <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
            Configure File: {currentFile?.file_name}
          </Title>
        }
        open={mappingModalVisible}
        onCancel={() => setMappingModalVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setMappingModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveMapping}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              border: 'none',
            }}
          >
            Save Configuration
          </Button>,
        ]}
      >
        {filePreview && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Date Column Selection */}
            <Card size="small" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                  Select Date Column *
                </Text>
                <Select
                  placeholder="Choose date column"
                  value={dateColumn}
                  onChange={setDateColumn}
                  style={{ width: '100%' }}
                >
                  {filePreview.columns.map(col => (
                    <Option key={col} value={col}>
                      {col}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Card>

            {/* Product Column Selection (Optional) */}
            {project.product_column && (
              <Card size="small" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                    Select Product Column (Optional)
                  </Text>
                  <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', marginBottom: 8 }}>
                    If this file has a product/category column, select it to match with main file's "{project.product_column}" column. 
                    This ensures data is merged correctly by both date and product.
                  </Paragraph>
                  <Select
                    placeholder="Choose product column (or leave empty)"
                    value={productColumn}
                    onChange={setProductColumn}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {filePreview.columns
                      .filter(col => col !== dateColumn)
                      .map(col => (
                        <Option key={col} value={col}>
                          {col}
                        </Option>
                      ))}
                  </Select>
                  {productColumn && (
                    <Alert
                      message="Product-Based Merging Enabled"
                      description={`Data will be merged on both date and product. Only rows where products match will be combined.`}
                      type="info"
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Space>
              </Card>
            )}

            {/* Data Columns Selection */}
            <Card size="small" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                  Select Data Columns *
                </Text>
                <Select
                  mode="multiple"
                  placeholder="Choose columns to include"
                  value={selectedColumns}
                  onChange={handleColumnSelect}
                  style={{ width: '100%' }}
                >
                  {filePreview.columns
                    .filter(col => col !== dateColumn && col !== productColumn)
                    .map(col => (
                      <Option key={col} value={col}>
                        {col}
                      </Option>
                    ))}
                </Select>
              </Space>
            </Card>

            {/* Aggregation Functions */}
            {selectedColumns.length > 0 && (
              <Card size="small" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                    Aggregation Functions
                  </Text>
                  <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', marginBottom: 0 }}>
                    Select how each column should be aggregated when combining time periods
                  </Paragraph>
                  <Divider style={{ margin: '8px 0', borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  {selectedColumns.map(col => (
                    <div key={col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{col}</Text>
                      <Select
                        value={columnAggregations[col] || 'mean'}
                        onChange={(value) => setColumnAggregations({ ...columnAggregations, [col]: value })}
                        style={{ width: 200 }}
                      >
                        {Object.entries(aggregationOptions.aggregation_functions || {}).map(([key, label]) => (
                          <Option key={key} value={key}>
                            {label as string}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            {/* Fill Method */}
            <Card size="small" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                  Missing Data Fill Method
                </Text>
                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', marginBottom: 8 }}>
                  Choose how to handle missing dates in this file compared to main data
                </Paragraph>
                <Select
                  value={fillMethod}
                  onChange={setFillMethod}
                  style={{ width: '100%' }}
                >
                  {Object.entries(aggregationOptions.fill_methods || {}).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label as string}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Card>

            {/* Preview */}
            <Card size="small" title="Data Preview">
              <Table
                columns={filePreview.columns.map(col => ({
                  title: col,
                  dataIndex: col,
                  key: col,
                  ellipsis: true,
                  render: (text: any) => (
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {String(text || '')}
                    </Text>
                  ),
                }))}
                dataSource={filePreview.sample_data.slice(0, 5).map((row, index) => ({ ...row, key: index }))}
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default AdditionalFilesStep;