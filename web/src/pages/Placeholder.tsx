import React from 'react';
import { Card, Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface PlaceholderProps { title: string; }

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
  const navigate = useNavigate();
  return (
    <Card title={title} bordered={false}>
      <Result status="info" title="功能开发中" subTitle={`"${title}" 模块正在紧锣密鼓地开发中，敬请期待。`} extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>} />
    </Card>
  );
};

export default Placeholder;
