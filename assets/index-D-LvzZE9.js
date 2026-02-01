/*
 * 连接器项目主应用入口文件
 * 构建时间: 2026-02-01
 * 版本: 0.0.0
 */

// React 应用启动代码
import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// 创建根节点并渲染应用
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

console.log('🚀 连接器应用已启动');
console.log('📅 构建时间:', new Date().toLocaleString());
console.log('🔧 当前环境:', process.env.NODE_ENV || 'development');