import React, { useState } from 'react';
import {
    Table,
    Button,
    Tag,
    Space,
    Card,
    Typography,
    Input,
    Drawer,
    Form,
    message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    RocketOutlined,
    StopOutlined,
    BugOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { SandboxApp } from '@/types/sandboxApp';
import { useSandboxAppStore } from '@/store/sandboxApp';

const { Title } = Typography;

type SandboxAppFormValues = {
    name: string;
    description?: string;
    developer: string;
    producer: string;
    relatedAppSystem?: string;
    port: number | string;
    ipAddresses: string;
};

const SandboxAppList: React.FC = () => {
    const navigate = useNavigate();
    const { apps: data, addApp, updateApp, deleteApp } = useSandboxAppStore();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleCreate = () => {
        setEditingId(null);
        form.resetFields();
        setDrawerVisible(true);
    };

    const handleEdit = (record: SandboxApp) => {
        setEditingId(record.id);
        form.setFieldsValue({
            ...record,
            ipAddresses: record.gatewayConfig.ipAddresses.join(','),
            port: record.gatewayConfig.port
        });
        setDrawerVisible(true);
    };

    const handleSubmit = (values: SandboxAppFormValues) => {
        const { ipAddresses, port, name, description, developer, producer, relatedAppSystem } = values;
        
        const commonFields = {
            name,
            description: description || '',
            developer,
            producer,
            gatewayConfig: {
                port: Number(port),
                ipAddresses: ipAddresses.split(',').map(ip => ip.trim()).filter(Boolean)
            },
            relatedAppSystem: relatedAppSystem || '',
            updateTime: new Date().toLocaleString(),
        };

        if (editingId) {
            const existingApp = data.find(d => d.id === editingId);
            if (existingApp) {
                updateApp({
                    ...existingApp,
                    ...commonFields
                });
                message.success('更新成功');
            }
        } else {
            const newApp: SandboxApp = {
                id: `APP-${Date.now()}`,
                ...commonFields,
                status: 'draft',
                runStatus: 'stopped',
                config: { parallelism: 1, slots: 1, restartCount: 3 },
                createTime: new Date().toLocaleString(),
                version: 'v1.0.0',
                authorizedResources: [],
            };
            addApp(newApp);
            message.success('创建成功');
        }
        setDrawerVisible(false);
    };

    const handleDelete = (id: string) => {
        deleteApp(id);
        message.success('删除成功');
    };

    const columns: ColumnsType<SandboxApp> = [
        {
            title: '应用名称',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <a onClick={() => navigate(`/sandbox-app/detail/${record.id}`)}>{text}</a>
            )
        },
        {
            title: '处理器',
            key: 'processor',
            render: (_, record) => {
                const type = record.config.processorType;
                const name = record.config.processorName;
                const ver = record.config.processorVersion;
                if (type === 'udf' && name && ver) {
                    return <Tag color="purple">{`${name}@${ver}`}</Tag>;
                }
                if (type === 'builtin') {
                    return <Tag>内置</Tag>;
                }
                return <Tag>—</Tag>;
            }
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    draft: 'default',
                    auditing: 'processing',
                    published: 'success',
                    offline: 'error'
                };
                const texts = {
                    draft: '草稿',
                    auditing: '审核中',
                    published: '已发布',
                    offline: '已下线'
                };
                return <Tag color={colors[status as keyof typeof colors]}>{texts[status as keyof typeof texts]}</Tag>;
            }
        },
        {
            title: '运行状态',
            dataIndex: 'runStatus',
            key: 'runStatus',
            render: (status) => {
                const config = {
                    running: { color: 'success', text: '运行中', icon: <PlayCircleOutlined spin /> },
                    stopped: { color: 'default', text: '已停止', icon: <StopOutlined /> },
                    abnormal: { color: 'error', text: '异常', icon: <BugOutlined /> },
                    starting: { color: 'processing', text: '启动中', icon: <RocketOutlined spin /> }
                };
                const curr = config[status as keyof typeof config];
                return <Tag icon={curr.icon} color={curr.color}>{curr.text}</Tag>;
            }
        },
        {
            title: '开发者',
            dataIndex: 'developer',
            key: 'developer',
        },
        {
            title: '版本',
            dataIndex: 'version',
            key: 'version',
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
        },
        {
            title: '操作',
            key: 'action',
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
                    <Button 
                        type="link" 
                        onClick={() => navigate(`/sandbox-app/detail/${record.id}`)}
                    >
                        开发与管理
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card 
                title={<Title level={4}>沙盒 APP 管理</Title>} 
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建沙盒 APP</Button>}
                bordered={false}
            >
                <Table columns={columns} dataSource={data} rowKey="id" scroll={{ x: 'max-content' }} />
            </Card>

            <Drawer
                title={editingId ? "编辑沙盒 APP" : "新建沙盒 APP"}
                width={500}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item name="name" label="应用名称" rules={[{ required: true }]}> 
                        <Input placeholder="请输入应用名称" />
                    </Form.Item>
                    <Form.Item name="description" label="描述"> 
                        <Input.TextArea rows={3} placeholder="请输入应用描述" />
                    </Form.Item>
                    <Form.Item name="developer" label="开发者" rules={[{ required: true }]}> 
                        <Input placeholder="请输入开发者名称" />
                    </Form.Item>
                    <Form.Item name="producer" label="生产者" rules={[{ required: true }]}> 
                        <Input placeholder="请输入生产者名称" />
                    </Form.Item>
                    <Form.Item name="relatedAppSystem" label="关联上层应用系统"> 
                        <Input placeholder="例如：智慧交通监控平台" />
                    </Form.Item>
                    <Form.Item name="ipAddresses" label="网关 IP 列表" rules={[{ required: true }]}> 
                        <Input placeholder="多个 IP 用逗号分隔" />
                    </Form.Item>
                    <Form.Item name="port" label="网关端口" rules={[{ required: true }]}> 
                        <Input placeholder="例如：8080" />
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

export default SandboxAppList;
