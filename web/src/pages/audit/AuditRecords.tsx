import React, { useMemo, useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, DatePicker, Form, Modal, Descriptions } from 'antd';
import { SearchOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AuditRecord } from '@/types/audit';
import { useAuditStore } from '@/store/audit';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AuditRecords: React.FC = () => {
    const dataSource = useAuditStore(s => s.auditLogs);
    const [currentRecord, setCurrentRecord] = useState<AuditRecord | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [opType, setOpType] = useState<string | undefined>();
    const [result, setResult] = useState<string | undefined>();
    const [keyword, setKeyword] = useState<string>('');
    const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

    const filtered = useMemo(() => {
        return (dataSource || []).filter(item => {
            const inRange = range
                ? dayjs(item.recordTime).isAfter(range[0]) && dayjs(item.recordTime).isBefore(range[1])
                : true;
            const typeOk = opType ? item.operationType === opType : true;
            const resOk = result ? item.result === result : true;
            const kw = keyword?.trim();
            const kwOk = kw
                ? [item.operator, item.content, item.clientIp].some(x => (x || '').includes(kw))
                : true;
            return inRange && typeOk && resOk && kwOk;
        });
    }, [dataSource, range, opType, result, keyword]);

    const columns: ColumnsType<AuditRecord> = [
        {
            title: '日志编号',
            dataIndex: 'id',
            key: 'id',
            width: 160,
        },
        {
            title: '记录时间',
            dataIndex: 'recordTime',
            key: 'recordTime',
            width: 180,
            sorter: (a, b) => new Date(a.recordTime).getTime() - new Date(b.recordTime).getTime(),
        },
        {
            title: '操作类型',
            dataIndex: 'operationType',
            key: 'operationType',
            width: 120,
        },
        {
            title: '操作人',
            dataIndex: 'operator',
            key: 'operator',
            width: 120,
        },
        {
            title: '操作内容',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
        },
        {
            title: '操作结果',
            dataIndex: 'result',
            key: 'result',
            width: 100,
            render: (result) => (
                <Tag color={result === 'success' ? 'success' : 'error'}>
                    {result === 'success' ? '成功' : '失败'}
                </Tag>
            ),
        },
        {
            title: '客户端IP',
            dataIndex: 'clientIp',
            key: 'clientIp',
            width: 140,
        },
        {
            title: '详情',
            key: 'action',
            width: 80,
            render: (_, record) => (
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => {
                    setCurrentRecord(record);
                    setDetailVisible(true);
                }}>
                    查看
                </Button>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card title="安全审计日志" bordered={false}>
                <Form layout="inline" className="mb-4">
                    <Form.Item label="时间范围">
                        <RangePicker onChange={(dates) => {
                            const d = dates && dates[0] && dates[1] ? [dates[0], dates[1]] as [dayjs.Dayjs, dayjs.Dayjs] : null;
                            setRange(d);
                        }} />
                    </Form.Item>
                    <Form.Item label="操作类型">
                        <Select placeholder="全部" allowClear style={{ width: 140 }} value={opType} onChange={setOpType}>
                            <Option value="设备互信">设备互信</Option>
                            <Option value="资源发布">资源发布</Option>
                            <Option value="策略协商">策略协商</Option>
                            <Option value="系统登录">系统登录</Option>
                            <Option value="设备授权">设备授权</Option>
                            <Option value="沙盒启动">沙盒启动</Option>
                            <Option value="沙盒停止">沙盒停止</Option>
                            <Option value="沙盒配置更新">沙盒配置更新</Option>
                            <Option value="SQL校验">SQL校验</Option>
                            <Option value="UDF协商">UDF协商</Option>
                            <Option value="UDF测试">UDF测试</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="操作结果">
                        <Select placeholder="全部" allowClear style={{ width: 100 }} value={result} onChange={setResult}>
                            <Option value="success">成功</Option>
                            <Option value="failure">失败</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="关键词">
                        <Input placeholder="操作人/内容/IP" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                            <Button icon={<DownloadOutlined />} onClick={() => {
                                const txt = JSON.stringify(filtered, null, 2);
                                const blob = new Blob([txt], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'audit_logs.json';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}>导出日志</Button>
                        </Space>
                    </Form.Item>
                </Form>
                
                <Table 
                    columns={columns} 
                    dataSource={filtered} 
                    rowKey="id"
                    expandable={{
                        expandedRowRender: record => (
                            <p style={{ margin: 0 }}>
                                <strong>详细信息：</strong> {record.details || '无详细信息'}
                            </p>
                        ),
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title="审计日志详情"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
            >
                {currentRecord && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="日志编号">{currentRecord.id}</Descriptions.Item>
                        <Descriptions.Item label="记录时间">{currentRecord.recordTime}</Descriptions.Item>
                        <Descriptions.Item label="操作类型">{currentRecord.operationType}</Descriptions.Item>
                        <Descriptions.Item label="操作人">{currentRecord.operator}</Descriptions.Item>
                        <Descriptions.Item label="操作内容">{currentRecord.content}</Descriptions.Item>
                        <Descriptions.Item label="操作结果">{currentRecord.result}</Descriptions.Item>
                        <Descriptions.Item label="客户端IP">{currentRecord.clientIp}</Descriptions.Item>
                        <Descriptions.Item label="详细信息">{currentRecord.details || '-'}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default AuditRecords;
