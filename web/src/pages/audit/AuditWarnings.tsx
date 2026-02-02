import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, DatePicker, Modal, Form, Typography, message, Row, Col, Statistic, Alert } from 'antd';
import { SearchOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AuditWarning, AuditWarningLevel, AuditWarningStatus } from '@/types/audit';
import { useAuditStore } from '@/store/audit';
import dayjs from 'dayjs';
import * as echarts from 'echarts';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const AuditWarnings: React.FC = () => {
    const [handleModalVisible, setHandleModalVisible] = useState(false);
    const [currentWarning, setCurrentWarning] = useState<AuditWarning | null>(null);
    const [form] = Form.useForm();
    const currentUserName = 'admin';
    const currentUserRoles = ['admin', 'security_admin'];
    const canManage = currentUserRoles.includes('admin') || currentUserRoles.includes('security_admin');

    const [dataSource, setDataSource] = useState<AuditWarning[]>([
        {
            id: 'WARN-20240320-001',
            warningTime: '2024-03-20 10:30:15',
            warningType: 'pre_violation',
            warningContent: '沙盒 APP 启动前违规：申请访问令牌失败',
            level: 'high',
            status: 'unhandled',
            deviceId: 'DEV-001',
            sandboxAppId: 'APP-001'
        },
        {
            id: 'WARN-20240320-002',
            warningTime: '2024-03-20 11:45:22',
            warningType: 'in_violation',
            warningContent: '沙盒运行中违规：开放资源访问次数超过上限',
            level: 'medium',
            status: 'processing',
            deviceId: 'DEV-002',
            sandboxAppId: 'APP-003',
            handler: 'admin',
            handleTime: '2024-03-20 12:00:00'
        },
        {
            id: 'WARN-20240319-003',
            warningTime: '2024-03-19 15:20:10',
            warningType: 'post_violation',
            warningContent: '沙盒运行后违规：落地数据未定期删除',
            level: 'low',
            status: 'resolved',
            deviceId: 'DEV-001',
            sandboxAppId: 'APP-002',
            handler: 'security_admin',
            handleTime: '2024-03-19 16:00:00',
            handleResult: '已强制清理过期数据并通知相关人员'
        }
    ]);
    const appendAudit = useAuditStore(s => s.appendAudit);
    const appendNotification = useAuditStore(s => s.appendNotification);
    const auditLogs = useAuditStore(s => s.auditLogs);
    const notificationLogs = useAuditStore(s => s.notifications);

    const [autoStopLevel, setAutoStopLevel] = useState<AuditWarningLevel>('critical');
    const [notifyPreMinLevel, setNotifyPreMinLevel] = useState<AuditWarningLevel>('medium');
    const [notifyPostMinLevel, setNotifyPostMinLevel] = useState<AuditWarningLevel>('high');
    const [monitoring, setMonitoring] = useState(false);
    const [notifRange, setNotifRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [notifChannel, setNotifChannel] = useState<'system' | 'email' | 'sms' | undefined>();
    const [notifKeyword, setNotifKeyword] = useState<string>('');
    const [auditRange, setAuditRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [auditType, setAuditType] = useState<string | undefined>();
    const [auditKeyword, setAuditKeyword] = useState<string>('');

    const levelCompare = useCallback((a: AuditWarningLevel, b: AuditWarningLevel) => {
        const weights: Record<AuditWarningLevel, number> = { low: 1, medium: 2, high: 3, critical: 4 };
        return weights[a] - weights[b];
    }, []);

    useEffect(() => {
        if (!monitoring) return;
        const timer = window.setInterval(() => {
            const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
            const types: AuditWarning['warningType'][] = ['pre_violation', 'in_violation', 'post_violation'];
            const levels: AuditWarningLevel[] = ['low', 'medium', 'high', 'critical'];
            const t = types[Math.floor(Math.random() * types.length)];
            const l = levels[Math.floor(Math.random() * levels.length)];
            const content =
                t === 'pre_violation'
                    ? '启动前合规校验不通过'
                    : t === 'in_violation'
                    ? '运行中检测到违规访问模式'
                    : '运行后清理策略未达标';
            const w: AuditWarning = {
                id: `WARN-${Date.now()}`,
                warningTime: now,
                warningType: t,
                warningContent: content,
                level: l,
                status: 'unhandled',
                deviceId: `DEV-${String(Math.floor(Math.random() * 3) + 1).padStart(3, '0')}`,
                sandboxAppId: `APP-${String(Math.floor(Math.random() * 3) + 1).padStart(3, '0')}`
            };
            setDataSource(prev => [w, ...prev]);
            if (t === 'in_violation' && levelCompare(l, autoStopLevel) >= 0) {
                appendAudit({
                    operationType: '自动停止',
                    operator: 'system',
                    content: `自动停止 ${w.sandboxAppId}`,
                    result: 'success',
                    clientIp: '127.0.0.1',
                    details: `违规等级 ${l}`
                });
                appendNotification({ channel: 'sms', content: `${w.sandboxAppId} 因事中严重违规已自动停止`, status: 'sent' });
                appendNotification({ channel: 'email', content: `${w.sandboxAppId} 自动停止，原因：${content}`, status: 'sent' });
            } else if (t === 'pre_violation' && levelCompare(l, notifyPreMinLevel) >= 0) {
                appendNotification({ channel: 'email', content: `事前违规预警：${content}`, status: 'sent' });
            } else if (t === 'post_violation' && levelCompare(l, notifyPostMinLevel) >= 0) {
                appendNotification({ channel: 'email', content: `事后违规预警：${content}`, status: 'sent' });
            }
        }, 5000);
        return () => window.clearInterval(timer);
    }, [monitoring, autoStopLevel, notifyPreMinLevel, notifyPostMinLevel, levelCompare, appendAudit, appendNotification]);

    const handleProcess = (record: AuditWarning) => {
        setCurrentWarning(record);
        setHandleModalVisible(true);
        form.resetFields();
    };

    const handleProcessSubmit = () => {
        form.validateFields().then(values => {
            const newDataSource = dataSource.map(item => {
                if (item.id === currentWarning?.id) {
                    return {
                        ...item,
                        status: 'resolved' as AuditWarningStatus,
                        handler: currentUserName,
                        handleTime: new Date().toLocaleString(),
                        handleResult: values.handleResult
                    };
                }
                return item;
            });
            setDataSource(newDataSource);
            setHandleModalVisible(false);
            message.success('违规预警处理成功');
            if (currentWarning) {
                appendAudit({
                    operationType: '违规处理',
                    operator: currentUserName,
                    content: `处理预警 ${currentWarning.id}`,
                    result: 'success',
                    clientIp: '192.168.1.10',
                    details: values.handleResult
                });
            }
        });
    };

    const columns: ColumnsType<AuditWarning> = [
        {
            title: '预警编号',
            dataIndex: 'id',
            key: 'id',
            width: 180,
        },
        {
            title: '预警时间',
            dataIndex: 'warningTime',
            key: 'warningTime',
            width: 180,
            sorter: (a, b) => new Date(a.warningTime).getTime() - new Date(b.warningTime).getTime(),
        },
        {
            title: '违规类型',
            dataIndex: 'warningType',
            key: 'warningType',
            width: 120,
            render: (type) => {
                const config = {
                    pre_violation: { color: 'orange', text: '事前违规' },
                    in_violation: { color: 'red', text: '事中违规' },
                    post_violation: { color: 'blue', text: '事后违规' }
                };
                const c = config[type as keyof typeof config];
                return <Tag color={c.color}>{c.text}</Tag>;
            }
        },
        {
            title: '违规内容',
            dataIndex: 'warningContent',
            key: 'warningContent',
            ellipsis: true,
        },
        {
            title: '风险等级',
            dataIndex: 'level',
            key: 'level',
            width: 120,
            render: (level) => {
                const config = {
                    low: { color: 'green', text: '低' },
                    medium: { color: 'orange', text: '中' },
                    high: { color: 'red', text: '高' },
                    critical: { color: 'purple', text: '严重' }
                };
                const curr = config[level as keyof typeof config];
                return <Tag color={curr.color}>{curr.text}</Tag>;
            },
        },
        {
            title: '处理状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const config = {
                    unhandled: { color: 'default', text: '未处理' },
                    processing: { color: 'processing', text: '处理中' },
                    resolved: { color: 'success', text: '已处理' },
                    ignored: { color: 'warning', text: '忽略' }
                };
                const curr = config[status as keyof typeof config];
                return <Tag color={curr.color}>{curr.text}</Tag>;
            }
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleProcess(record)}>处理</Button>
                    <Button type="link" danger icon={<ExclamationCircleOutlined />} onClick={() => message.info('标记为忽略')}>忽略</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card title="违规预警中心" bordered={false}>
                <Form layout="inline" className="mb-4">
                    <Form.Item label="时间范围">
                        <RangePicker onChange={(dates) => {
                            const d = dates && dates[0] && dates[1] ? [dates[0], dates[1]] as [dayjs.Dayjs, dayjs.Dayjs] : null;
                            setNotifRange(d);
                        }} />
                    </Form.Item>
                    <Form.Item label="通知渠道">
                        <Select placeholder="全部" allowClear style={{ width: 140 }} value={notifChannel} onChange={setNotifChannel}>
                            <Option value="system">系统</Option>
                            <Option value="email">邮件</Option>
                            <Option value="sms">短信</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="关键词">
                        <Input placeholder="预警内容/设备/APP" value={notifKeyword} onChange={(e) => setNotifKeyword(e.target.value)} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                            <Button onClick={() => setMonitoring(v => !v)}>{monitoring ? '停止监控' : '开始监控'}</Button>
                        </Space>
                    </Form.Item>
                </Form>

                <Row gutter={16} className="mb-4">
                    <Col span={6}><Statistic title="未处理" value={dataSource.filter(w => w.status === 'unhandled').length} /></Col>
                    <Col span={6}><Statistic title="处理中" value={dataSource.filter(w => w.status === 'processing').length} /></Col>
                    <Col span={6}><Statistic title="已处理" value={dataSource.filter(w => w.status === 'resolved').length} /></Col>
                    <Col span={6}><Statistic title="严重等级" value={dataSource.filter(w => w.level === 'critical').length} /></Col>
                </Row>

                <Table 
                    columns={columns} 
                    dataSource={dataSource} 
                    rowKey="id"
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Card title="通知记录与审计" bordered={false} className="mt-4">
                <Row gutter={16}>
                    <Col span={12}>
                        <Alert type="info" showIcon message="最近通知概览" description="包含系统通知、邮件、短信等渠道" />
                        <ul className="mt-2 list-disc pl-4">
                            {notificationLogs.map(n => (
                                <li key={n.id}>
                                    <span className="text-gray-400">[{n.time}]</span> {n.channel}: {n.content}
                                </li>
                            ))}
                        </ul>
                    </Col>
                    <Col span={12}>
                        <Alert type="success" showIcon message="最近审计记录" description="包含运行操作与配置校验等" />
                        <ul className="mt-2 list-disc pl-4">
                            {auditLogs.map(a => (
                                <li key={a.id}>
                                    <span className="text-gray-400">[{a.recordTime}]</span> {a.operationType} - {a.operator}: {a.content}
                                </li>
                            ))}
                        </ul>
                    </Col>
                </Row>
            </Card>

            <Modal
                title="违规处理"
                open={handleModalVisible}
                onCancel={() => setHandleModalVisible(false)}
                onOk={handleProcessSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="handleResult" label="处理结果" rules={[{ required: true }]}> 
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AuditWarnings;
