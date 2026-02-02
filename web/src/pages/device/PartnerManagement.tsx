import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Space, Input, Modal, Form, Select, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Partner } from '@/types/partner';
import { usePartnerStore } from '@/store/partner';
import { useAuditStore } from '@/store/audit';

const { Option } = Select;

const PartnerManagement: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const appendAudit = useAuditStore(s => s.appendAudit);
  const partners = usePartnerStore(s => s.partners);
  const addPartner = usePartnerStore(s => s.addPartner);
  const updatePartner = usePartnerStore(s => s.updatePartner);
  const deletePartner = usePartnerStore(s => s.deletePartner);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(
    () => partners.filter(p => [p.name, p.organization, p.contactName].some(x => (x || '').includes(keyword))),
    [partners, keyword]
  );

  const columns: ColumnsType<Partner> = [
    { title: '合作方名称', dataIndex: 'name', key: 'name', align: 'center', width: 180 },
    { title: '组织名称', dataIndex: 'organization', key: 'organization', align: 'center', width: 200 },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName', align: 'center', width: 120, render: v => v || '-' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', align: 'center', width: 140, render: v => v || '-' },
    { title: '邮箱', dataIndex: 'contactEmail', key: 'contactEmail', align: 'center', width: 200, render: v => v || '-' },
    { 
      title: '状态', dataIndex: 'status', key: 'status', align: 'center', width: 100, 
      render: (s) => <Tag color={s === 'active' ? 'success' : 'default'}>{s === 'active' ? '启用' : '停用'}</Tag>
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', align: 'center', width: 160 },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<UserOutlined />} size="small" onClick={() => navigate(`/device/partner/${record.id}`)}>合作方详情</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (p: Partner) => {
    setEditingId(p.id);
    form.setFieldsValue({
      name: p.name,
      organization: p.organization,
      contactName: p.contactName,
      contactPhone: p.contactPhone,
      contactEmail: p.contactEmail,
      status: p.status,
      remark: p.remark,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (p: Partner) => {
    Modal.confirm({
      title: '确认删除合作方',
      content: `删除后将同时删除其关联的设备信息，是否继续删除 ${p.name}？`,
      okType: 'danger',
      onOk() {
        deletePartner(p.id);
        message.success('已删除合作方及其设备');
        appendAudit({
          operationType: '合作方管理',
          operator: 'admin',
          content: `删除合作方：${p.name}`,
          result: 'success',
          clientIp: '192.168.1.10',
        });
      },
    });
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (!editingId) {
        const p = addPartner({
          name: values.name,
          organization: values.organization,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          contactEmail: values.contactEmail,
          status: values.status,
          remark: values.remark,
        });
        message.success('新增合作方成功');
        appendAudit({
          operationType: '合作方管理',
          operator: 'admin',
          content: `新增合作方：${p.name}`,
          result: 'success',
          clientIp: '192.168.1.10',
        });
      } else {
        updatePartner(editingId, {
          ...values,
          updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        });
        message.success('编辑合作方成功');
        appendAudit({
          operationType: '合作方管理',
          operator: 'admin',
          content: `编辑合作方：${values.name}`,
          result: 'success',
          clientIp: '192.168.1.10',
        });
      }
      setIsModalOpen(false);
    });
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Space>
          <Input 
            placeholder="按名称/组织/联系人搜索" 
            prefix={<SearchOutlined />} 
            style={{ width: 260 }} 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增合作方</Button>
        </Space>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ total: filtered.length, pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑合作方' : '新增合作方'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="合作方名称" rules={[{ required: true }]}> 
            <Input placeholder="请输入合作方名称" />
          </Form.Item>
          <Form.Item name="organization" label="组织名称" rules={[{ required: true }]}> 
            <Input placeholder="请输入组织名称" />
          </Form.Item>
          <Form.Item name="contactName" label="联系人"> 
            <Input placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话"> 
            <Input placeholder="例如：13800000000" />
          </Form.Item>
          <Form.Item name="contactEmail" label="邮箱"> 
            <Input placeholder="例如：name@example.com" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]} initialValue="active">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注"> 
            <Input.TextArea rows={3} placeholder="补充备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PartnerManagement;
