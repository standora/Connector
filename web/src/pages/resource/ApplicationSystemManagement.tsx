import React, { useState } from 'react';
import {
    Table,
    Button,
    Card,
    Typography,
    Input,
    Drawer,
    Form,
    message,
    Space,
    Descriptions,
    Select,
    Tag
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useApplicationSystemStore } from '@/store/applicationSystem';
import { useSandboxAppStore } from '@/store/sandboxApp';
import type { ApplicationSystem } from '@/types/applicationSystem';

const { Title } = Typography;
const { Option } = Select;

const ApplicationSystemManagement: React.FC = () => {
    const { systems, addSystem, updateSystem, deleteSystem } = useApplicationSystemStore();
    const { apps, updateApp } = useSandboxAppStore();
    
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleCreate = () => {
        setEditingId(null);
        form.resetFields();
        setDrawerVisible(true);
    };

    const handleEdit = (record: ApplicationSystem) => {
        setEditingId(record.id);
        form.setFieldsValue({
            ...record,
        });
        setDrawerVisible(true);
    };

    const handleDelete = (id: string) => {
        deleteSystem(id);
        message.success('删除成功');
    };

    type FormValues = {
        name: string;
        description: string;
        environment: string;
        externalDataRequirements: string;
        landingHardwareEnv: string;
        landingSecurityMeasures: string;
        relatedSandboxAppIds?: string[];
    };

    const handleSubmit = (values: FormValues) => {
        const { 
            name, 
            description, 
            environment, 
            externalDataRequirements, 
            landingHardwareEnv, 
            landingSecurityMeasures,
            relatedSandboxAppIds 
        } = values;

        const systemData: ApplicationSystem = {
            id: editingId || `SYS-${Date.now()}`,
            name,
            description,
            environment,
            externalDataRequirements,
            landingHardwareEnv,
            landingSecurityMeasures,
            relatedSandboxAppIds: relatedSandboxAppIds || [],
            createTime: editingId ? (systems.find(s => s.id === editingId)?.createTime || new Date().toLocaleString()) : new Date().toLocaleString(),
            updateTime: new Date().toLocaleString(),
        };

        if (editingId) {
            const previousSystem = systems.find(s => s.id === editingId);
            updateSystem(systemData);
            message.success('更新成功');
            
            // Sync with Sandbox Apps (Clear removed associations)
            if (previousSystem) {
                 const previousIds = previousSystem.relatedSandboxAppIds || [];
                 const currentIds = relatedSandboxAppIds || [];
                 const removedIds = previousIds.filter(id => !currentIds.includes(id));
                 
                 removedIds.forEach(id => {
                     const app = apps.find(a => a.id === id);
                     if (app && app.relatedAppSystem === previousSystem.name) {
                         updateApp({
                             ...app,
                             relatedAppSystem: ''
                         });
                     }
                 });
            }
        } else {
            addSystem(systemData);
            message.success('创建成功');
        }

        // Sync with Sandbox Apps (Add new associations)
        if (relatedSandboxAppIds && relatedSandboxAppIds.length > 0) {
            relatedSandboxAppIds.forEach((appId: string) => {
                const app = apps.find(a => a.id === appId);
                if (app) {
                     if (app.relatedAppSystem !== name) {
                         updateApp({
                             ...app,
                             relatedAppSystem: name
                         });
                     }
                }
            });
        }

        setDrawerVisible(false);
    };

    const columns: ColumnsType<ApplicationSystem> = [
        {
            title: '系统名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: '用途',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: '关联沙盒APP数',
            key: 'sandboxCount',
            render: (_, record) => record.relatedSandboxAppIds?.length || 0,
            width: 150,
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
            width: 180,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDelete(record.id)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card 
                title={<Title level={4}>上层应用系统管理</Title>} 
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建系统</Button>}
                bordered={false}
            >
                <Table 
                    columns={columns} 
                    dataSource={systems} 
                    rowKey="id" 
                    expandable={{
                        expandedRowRender: (record) => (
                            <Descriptions title="详细信息" bordered column={2} size="small" className="p-4">
                                <Descriptions.Item label="软硬件环境" span={2}>{record.environment}</Descriptions.Item>
                                <Descriptions.Item label="外部数据需求" span={2}>{record.externalDataRequirements}</Descriptions.Item>
                                <Descriptions.Item label="数据落地硬件环境" span={2}>{record.landingHardwareEnv}</Descriptions.Item>
                                <Descriptions.Item label="数据落地安全措施" span={2}>{record.landingSecurityMeasures}</Descriptions.Item>
                                <Descriptions.Item label="关联沙盒APP" span={2}>
                                    {record.relatedSandboxAppIds && record.relatedSandboxAppIds.length > 0 ? (
                                        <Space wrap>
                                            {record.relatedSandboxAppIds.map(id => {
                                                const app = apps.find(a => a.id === id);
                                                return <Tag key={id} color="blue">{app ? app.name : id}</Tag>;
                                            })}
                                        </Space>
                                    ) : '无'}
                                </Descriptions.Item>
                            </Descriptions>
                        )
                    }}
                />
            </Card>

            <Drawer
                title={editingId ? "编辑上层应用系统" : "新建上层应用系统"}
                width={600}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item name="name" label="系统名称" rules={[{ required: true }]}>
                        <Input placeholder="请输入系统名称" />
                    </Form.Item>
                    
                    <Form.Item name="description" label="用途说明" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} placeholder="请说明系统用途" />
                    </Form.Item>

                    <Form.Item name="environment" label="软硬件环境" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder="描述软硬件环境" />
                    </Form.Item>

                    <Form.Item name="externalDataRequirements" label="外部数据需求">
                        <Input.TextArea rows={2} placeholder="说明需要接入的外部数据" />
                    </Form.Item>

                    <Form.Item name="landingHardwareEnv" label="数据落地硬件环境">
                        <Input.TextArea rows={2} placeholder="例如服务器型号、磁盘阵列等" />
                    </Form.Item>

                    <Form.Item name="landingSecurityMeasures" label="数据落地安全措施">
                        <Input.TextArea rows={3} placeholder="例如加密存储、访问控制、脱敏策略等" />
                    </Form.Item>

                    <Form.Item name="relatedSandboxAppIds" label="关联沙盒APP">
                        <Select mode="multiple" placeholder="选择关联的沙盒APP" allowClear>
                            {apps.map(app => (
                                <Option key={app.id} value={app.id}>{app.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">保存</Button>
                            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
};

export default ApplicationSystemManagement;
