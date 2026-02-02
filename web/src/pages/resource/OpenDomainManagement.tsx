import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Row, Col, Space, Tag, Modal, Form, Input, Select, message, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useDomainStore } from '@/store/domain';
import type { OpenDomain } from '@/types/domain';
import { useAuditStore } from '@/store/audit';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const OpenDomainManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const appendAudit = useAuditStore(s => s.appendAudit);
  const appendNotification = useAuditStore(s => s.appendNotification);

  const domains = useDomainStore(s => s.domains);
  const addDomain = useDomainStore(s => s.addDomain);
  const updateDomain = useDomainStore(s => s.updateDomain);
  const deleteDomain = useDomainStore(s => s.deleteDomain);

  const filteredData = useMemo(() => domains.filter(item =>
    item.name.includes(searchText) || item.code.includes(searchText)
  ), [domains, searchText]);

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: OpenDomain) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      status: record.status,
      description: record.description,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (record: OpenDomain) => {
    Modal.confirm({
      title: '确认删除该开放域？',
      content: '删除后不可恢复，请确认无资源关联后再删除。',
      onOk: () => {
        deleteDomain(record.id);
        message.success('已删除开放域');
        appendAudit({
          operationType: '开放域删除',
          operator: 'admin',
          content: `删除开放域：${record.name}(${record.code})`,
          result: 'success',
          clientIp: '192.168.1.10'
        });
        appendNotification({
          channel: 'system',
          content: `开放域删除通知：${record.name}`,
          status: 'sent'
        });
      }
    });
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const codePattern = /^[a-z0-9_]+$/;
      if (!codePattern.test(values.code)) {
        message.error('域编码仅允许小写字母、数字与下划线');
        return;
      }
      const duplicated = domains.some(item => item.code === values.code && item.id !== editingId);
      if (duplicated) {
        message.error('域编码已存在');
        return;
      }
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      if (editingId) {
        updateDomain(editingId, {
          name: values.name,
          code: values.code,
          status: values.status,
          description: values.description,
          updateTime: now,
        });
        message.success('开放域更新成功');
        appendAudit({
          operationType: '开放域更新',
          operator: 'admin',
          content: `更新开放域：${values.name}(${values.code})`,
          result: 'success',
          clientIp: '192.168.1.10'
        });
      } else {
        const created = addDomain({
          name: values.name,
          code: values.code,
          status: values.status,
          description: values.description,
        });
        message.success('开放域创建成功');
        appendAudit({
          operationType: '开放域创建',
          operator: 'admin',
          content: `创建开放域：${created.name}(${created.code})`,
          result: 'success',
          clientIp: '192.168.1.10'
        });
        appendNotification({
          channel: 'system',
          content: `开放域创建通知：${created.name}`,
          status: 'sent'
        });
      }
      setIsModalOpen(false);
    });
  };

  const handleImport = () => {
    try {
      const arr = JSON.parse(importText) as Array<Omit<OpenDomain, 'id' | 'createTime' | 'updateTime'>>;
      if (!Array.isArray(arr)) throw new Error();
      arr.forEach(item => addDomain({ ...item, status: item.status || 'enabled' }));
      setImportModalOpen(false);
      setImportText('');
      message.success('导入成功');
      appendAudit({
        operationType: '开放域导入',
        operator: 'admin',
        content: `导入开放域 ${arr.length} 条`,
        result: 'success',
        clientIp: '192.168.1.10'
      });
    } catch {
      message.error('导入内容不是有效的 JSON 数组');
    }
  };

  const handleExport = () => {
    setExportModalOpen(true);
    appendAudit({
      operationType: '开放域导出',
      operator: 'admin',
      content: '导出开放域数据',
      result: 'success',
      clientIp: '192.168.1.10'
    });
  };

  const columns: ColumnsType<OpenDomain> = [
    {
      title: '域名称/编码',
      key: 'name_code',
      width: 260,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => <Tag color={status === 'enabled' ? 'green' : 'default'}>{status === 'enabled' ? '启用' : '停用'}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      render: (text) => <span>{text || '-'}</span>,
    },
    {
      title: '创建/更新',
      key: 'times',
      width: 220,
      align: 'center',
      render: (_, r) => <span>{r.createTime} / {r.updateTime}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Row justify="space-between">
          <Col>
            <Space>
              <Input 
                placeholder="请输入域名称或编码" 
                prefix={<SearchOutlined />} 
                style={{ width: 240 }} 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              <Button type="primary">查询</Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>导入</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ total: filteredData.length, pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑开放域' : '新增开放域'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="域名称" rules={[{ required: true }]}> 
            <Input placeholder="请输入域名称" />
          </Form.Item>
          <Form.Item name="code" label="域编码" rules={[{ required: true }]}> 
            <Input placeholder="仅允许小写字母、数字与下划线" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]} initialValue="enabled">
            <Select>
              <Option value="enabled">启用</Option>
              <Option value="disabled">停用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述"> 
            <Input.TextArea rows={3} placeholder="补充说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导入开放域"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => setImportModalOpen(false)}
        width={600}
      >
        <TextArea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='粘贴格式如: [{"name":"营销","code":"marketing","status":"enabled"}]' />
      </Modal>

      <Modal
        title="导出开放域"
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={null}
        width={600}
      >
        <Alert message="导出将生成 JSON 文件并下载" type="info" showIcon />
      </Modal>
    </div>
  );
};

export default OpenDomainManagement;
