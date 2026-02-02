import React from 'react';
import { Result } from 'antd';

const RouteErrorElement: React.FC = () => {
  return <Result status="error" title="路由错误" subTitle="请检查路径或返回首页" />;
};

export default RouteErrorElement;
