import React, { useState } from 'react';
import { Card, Table, Button, Space, Input, Select, Modal, Form, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const UserManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<any[]>([
    { id: 'U0001', username: '管理员A', email: 'admin@example.com', role: 'admin', status: 'active', lastLogin: '-' },
  ]);

  const columns = [
    { title: '用户ID', dataIndex: 'id', key: 'id' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '最近登录', dataIndex: 'lastLogin', key: 'lastLogin' },
  ];

  const handleAdd = () => setIsModalOpen(true);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const newUser = { id: `U${String(dataSource.length + 1).padStart(4, '0')}`, ...values, status: 'active', lastLogin: '-' };
      setDataSource([newUser, ...dataSource]);
      setIsModalOpen(false);
      form.resetFields();
      message.success('新增成功');
    });
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Space>
          <Input placeholder="输入用户名/ID搜索" prefix={<SearchOutlined />} style={{ width: 200 }} />
          <Select defaultValue="all" style={{ width: 120 }} options={[
            { value: 'all', label: '所有状态' },
            { value: 'active', label: '启用' },
            { value: 'inactive', label: '停用' },
          ]} />
          <Button type="primary" icon={<SearchOutlined />}>搜索</Button>
        </Space>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table columns={columns} dataSource={dataSource} pagination={{ total: dataSource.length, pageSize: 10, showSizeChanger: true, showQuickJumper: true }} rowSelection={{}} scroll={{ x: 'max-content' }} />
      </Card>

      <div style={{ position: 'fixed', bottom: 24, right: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增用户</Button>
      </div>

      <Modal title="新增用户" open={isModalOpen} onOk={handleOk} onCancel={() => setIsModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]} initialValue="user">
            <Select options={[
              { value: 'admin', label: '管理员' },
              { value: 'user', label: '普通用户' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
