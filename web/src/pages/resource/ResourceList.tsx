import React, { useCallback, useMemo, useState } from 'react';
import { Card, Table, Button, Row, Col, Space, Tag, Modal, Form, Input, Select, message, Typography, Badge, Switch } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CloudUploadOutlined, CloudDownloadOutlined, CheckCircleOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { OpenResource } from '@/types/device';
import { useAuditStore } from '@/store/audit';
import { useDomainStore } from '@/store/domain';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const ResourceList: React.FC = () => {
  const [form] = Form.useForm();
  const [reasonForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [maskSensitive, setMaskSensitive] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'status' | 'delete'; record: OpenResource; nextStatus?: OpenResource['status'] } | null>(null);
  const currentUserName = 'admin';
  const currentUserRoles = ['admin'];
  const canManage = currentUserRoles.includes('admin') || currentUserRoles.includes('data_admin');
  const appendAudit = useAuditStore(s => s.appendAudit);
  const appendNotification = useAuditStore(s => s.appendNotification);
  const domainList = useDomainStore(s => s.domains);

  const initialData: OpenResource[] = [
    {
      id: '1',
      name: '用户行为日志数据',
      code: 'USER_LOG_2023',
      type: 'data',
      domain: 'marketing',
      description: '包含用户点击、浏览、购买等行为日志',
      status: 'published',
      createTime: '2023-10-01 10:00:00',
      updateTime: '2023-10-05 14:20:00',
      creator: 'Admin',
      version: 'v1.0',
      resourceMode: 'formal',
      sandboxId: 'SANDBOX-001',
      integrityStatus: 'pass',
      isSensitive: true
    },
    {
      id: '2',
      name: '商品销售实时API',
      code: 'SALES_API_V1',
      type: 'api',
      domain: 'sales',
      description: '实时获取商品销售统计数据',
      status: 'reviewing',
      createTime: '2023-11-12 09:30:00',
      updateTime: '2023-11-12 09:30:00',
      creator: 'User_A',
      version: 'v0.1',
      resourceMode: 'formal',
      sandboxId: 'SANDBOX-002',
      integrityStatus: 'missing',
      isSensitive: false
    },
    {
      id: '3',
      name: '库存快照数据',
      code: 'STOCK_SNAP',
      type: 'data',
      domain: 'logistics',
      description: '每日凌晨库存快照',
      status: 'draft',
      createTime: '2023-12-01 16:00:00',
      updateTime: '2023-12-01 16:00:00',
      creator: 'Admin',
      version: 'v0.1',
      resourceMode: 'trial',
      sandboxId: '',
      integrityStatus: 'missing',
      isSensitive: true
    },
  ];

  const [dataSource, setDataSource] = useState<OpenResource[]>(initialData);

  const sandboxOptions = [
    { label: 'SANDBOX-001', value: 'SANDBOX-001' },
    { label: 'SANDBOX-002', value: 'SANDBOX-002' },
    { label: 'SANDBOX-003', value: 'SANDBOX-003' },
  ];

  const maskText = useCallback((value?: string) => {
    if (!value) return '-';
    if (!maskSensitive) return value;
    if (value.length <= 4) return '*'.repeat(value.length);
    return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`;
  }, [maskSensitive]);

  const checkIntegrity = useCallback((resource: OpenResource): 'pass' | 'missing' => {
    const nameOk = Boolean(resource.name?.trim());
    const codeOk = Boolean(resource.code?.trim());
    const descOk = Boolean(resource.description && resource.description.trim().length >= 10);
    const sandboxOk = resource.type === 'api' || Boolean(resource.sandboxId);
    return nameOk && codeOk && descOk && sandboxOk ? 'pass' : 'missing';
  }, []);

  const bumpVersion = (version?: string) => {
    if (!version) return 'v0.1';
    const match = version.match(/^v(\d+)\.(\d+)$/);
    if (!match) return 'v0.1';
    const major = Number(match[1]);
    const minor = Number(match[2]) + 1;
    return `v${major}.${minor}`;
  };

  const columns: ColumnsType<OpenResource> = [
    {
      title: '资源名称/编码',
      key: 'name_code',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.isSensitive ? maskText(record.code) : record.code}</Text>
        </Space>
      ),
    },
    {
      title: '资源形态',
      dataIndex: 'resourceMode',
      key: 'resourceMode',
      width: 100,
      align: 'center',
      render: (mode) => <Tag color={mode === 'trial' ? 'orange' : 'blue'}>{mode === 'trial' ? '试用' : '正式'}</Tag>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center',
      render: (type) => (
        <Tag color={type === 'data' ? 'blue' : 'purple'}>
          {type === 'data' ? '数据接入' : 'API接入'}
        </Tag>
      ),
    },
    {
      title: '开放域',
      dataIndex: 'domain',
      key: 'domain',
      width: 120,
      align: 'center',
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: '沙盒对接',
      dataIndex: 'sandboxId',
      key: 'sandboxId',
      width: 120,
      align: 'center',
      render: (text) => <Tag color={text ? 'green' : 'default'}>{text || '未关联'}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text, record) => <span>{record.isSensitive ? maskText(text) : text || '-'}</span>,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      align: 'center',
    },
    {
      title: '完整性',
      dataIndex: 'integrityStatus',
      key: 'integrityStatus',
      width: 100,
      align: 'center',
      render: (status) => <Tag color={status === 'pass' ? 'success' : 'warning'}>{status === 'pass' ? '通过' : '缺失'}</Tag>
    },
    {
      title: '敏感',
      dataIndex: 'isSensitive',
      key: 'isSensitive',
      width: 80,
      align: 'center',
      render: (value) => <Tag color={value ? 'red' : 'default'}>{value ? '是' : '否'}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => {
        const config: Record<OpenResource['status'], { status: 'success' | 'processing' | 'default' | 'error'; text: string }> = {
          draft: { status: 'default', text: '草稿' },
          reviewing: { status: 'processing', text: '审核中' },
          published: { status: 'success', text: '已发布' },
          offline: { status: 'error', text: '已下线' },
        };
        const curr = config[status as keyof typeof config];
        return <Badge status={curr.status} text={curr.text} />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      align: 'center',
      render: (text) => <span style={{ fontSize: '13px', color: '#888' }}>{text}</span>,
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 240,
      render: (_, record) => (
        <Space size="小">
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" onClick={() => handleIntegrityCheck(record)}>校验</Button>
          {record.status === 'draft' || record.status === 'offline' ? (
             <Button type="link" style={{ color: '#1890ff' }} icon={<CloudUploadOutlined />} size="small" onClick={() => handleStatusChange(record, 'reviewing')}>发布</Button>
          ) : record.status === 'reviewing' ? (
             <Button type="link" style={{ color: '#52c41a' }} icon={<CheckCircleOutlined />} size="small" onClick={() => handleStatusChange(record, 'published')}>通过</Button>
          ) : record.status === 'published' ? (
             <Button type="link" danger icon={<CloudDownloadOutlined />} size="small" onClick={() => handleStatusChange(record, 'offline')}>下线</Button>
          ) : null}
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  const requestReason = (type: 'status' | 'delete', record: OpenResource, nextStatus?: OpenResource['status']) => {
    if (!canManage) {
      message.error('当前用户无权限执行该操作');
      return;
    }
    setPendingAction({ type, record, nextStatus });
    reasonForm.resetFields();
    setReasonModalOpen(true);
  };

  const handleStatusChange = (record: OpenResource, newStatus: OpenResource['status']) => {
    requestReason('status', record, newStatus);
  };

  const handleEdit = (record: OpenResource) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
    });
    setIsModalOpen(true);
  };

  const handleIntegrityCheck = (record: OpenResource) => {
    const result = checkIntegrity(record);
    setDataSource(prev => prev.map(item => item.id === record.id ? ({ ...item, integrityStatus: result }) : item));
    message.success('已校验完整性');
  };

  const handleDelete = (record: OpenResource) => {
    requestReason('delete', record);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingId) {
        setDataSource(prev => prev.map(item => item.id === editingId ? ({ ...item, ...values, updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }) : item));
        message.success('更新成功');
        setIsModalOpen(false);
      } else {
        const newRes: OpenResource = {
          id: `${Date.now()}`,
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          status: 'draft',
          resourceMode: 'trial',
          integrityStatus: 'missing',
          isSensitive: false,
          ...values,
        };
        setDataSource(prev => [newRes, ...prev]);
        message.success('创建成功');
        setIsModalOpen(false);
      }
    });
  };

  const handleReasonOk = () => {
    reasonForm.validateFields().then(values => {
      if (!pendingAction) return;
      if (pendingAction.type === 'delete') {
        setDataSource(prev => prev.filter(item => item.id !== pendingAction.record.id));
        appendAudit({
          operationType: '资源删除',
          operator: currentUserName,
          content: `删除资源：${pendingAction.record.name}`,
          result: 'success',
          clientIp: '192.168.1.10',
          details: values.reason,
        });
      } else if (pendingAction.type === 'status') {
        setDataSource(prev => prev.map(item => item.id === pendingAction.record.id ? ({ ...item, status: pendingAction.nextStatus! }) : item));
        appendAudit({
          operationType: '资源发布',
          operator: currentUserName,
          content: `资源状态变更：${pendingAction.record.name} -> ${pendingAction.nextStatus}`,
          result: 'success',
          clientIp: '192.168.1.10',
          details: values.reason,
        });
      }
      setReasonModalOpen(false);
      setPendingAction(null);
    });
  };

  const handleExport = () => {
    setExportModalOpen(true);
    const txt = JSON.stringify(dataSource, null, 2);
    const blob = new Blob([txt], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'open_resources.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Row justify="space-between">
          <Col>
            <Space>
              <Input 
                placeholder="请输入资源名称或编码" 
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>新增</Button>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>导入</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
              <Switch checked={maskSensitive} onChange={setMaskSensitive} checkedChildren="脱敏" unCheckedChildren="原文" />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table columns={columns} dataSource={dataSource} rowKey="id" pagination={{ total: dataSource.length, pageSize: 10 }} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal
        title={editingId ? '编辑资源' : '新增资源'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="资源名称" rules={[{ required: true }]}>
            <Input placeholder="请输入资源名称" />
          </Form.Item>
          <Form.Item name="code" label="资源编码" rules={[{ required: true }]}>
            <Input placeholder="请输入资源编码" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}> 
            <Select>
              <Option value="data">数据接入</Option>
              <Option value="api">API接入</Option>
            </Select>
          </Form.Item>
          <Form.Item name="domain" label="开放域" rules={[{ required: true }]}> 
            <Select options={domainList.map(d => ({ label: d.name, value: d.code }))} />
          </Form.Item>
          <Form.Item name="sandboxId" label="关联沙盒"> 
            <Select options={sandboxOptions} allowClear />
          </Form.Item>
          <Form.Item name="description" label="描述"> 
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="version" label="版本"> 
            <Input placeholder="例如：v1.0" />
          </Form.Item>
          <Form.Item name="isSensitive" label="敏感数据"> 
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={pendingAction?.type === 'delete' ? '确认删除' : '填写变更原因'}
        open={reasonModalOpen}
        onOk={handleReasonOk}
        onCancel={() => setReasonModalOpen(false)}
        width={500}
      >
        <Form form={reasonForm} layout="vertical">
          <Form.Item name="reason" label="原因" rules={[{ required: true, message: '请输入原因说明' }]}> 
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导入开放资源"
        open={importModalOpen}
        onOk={() => {
          try {
            const imported = JSON.parse(importText) as OpenResource[];
            if (!Array.isArray(imported)) throw new Error();
            setDataSource(prev => [...imported, ...prev]);
            setImportModalOpen(false);
            setImportText('');
            message.success('导入成功');
            appendAudit({
              operationType: '资源导入',
              operator: currentUserName,
              content: `导入资源 ${imported.length} 条`,
              result: 'success',
              clientIp: '192.168.1.10'
            });
          } catch {
            message.error('导入内容不是有效的 JSON 数组');
          }
        }}
        onCancel={() => setImportModalOpen(false)}
        width={600}
      >
        <TextArea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='粘贴格式如: [{"name":"用户行为日志","code":"USER_LOG","type":"data","domain":"marketing"}]' />
      </Modal>
    </div>
  );
};

export default ResourceList;
