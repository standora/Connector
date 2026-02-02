import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  TeamOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const { collapsed, toggleCollapsed, perspective, setPerspective } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '首页' },
    {
      key: '/device', icon: <SafetyCertificateOutlined />, label: '设备互信与授权',
      children: [
        { key: '/device/partner', label: '合作方管理' },
        { key: '/device/trust', label: '互信管理' },
        { key: '/device/auth', label: '授权管理' },
      ],
    },
    {
      key: '/resource', icon: <AppstoreOutlined />, label: '开放资源管理',
      children: [
        { key: '/resource/domain', label: '开放域管理' },
        { key: '/resource/list', label: '资源列表' },
        { key: '/resource/app-system', label: '上层应用系统管理' },
        { key: '/sandbox-app/list', label: '沙盒APP管理' },
        { key: '/resource/sandbox', label: '沙盒APP开发管理' },
      ],
    },
    {
      key: '/policy', icon: <FileTextOutlined />, label: '使用策略管理',
      children: [
        { key: '/policy/negotiation', label: '策略协商' },
        { key: '/policy/udf', label: 'UDF 变更' },
      ],
    },
    {
      key: '/audit', icon: <SecurityScanOutlined />, label: '安全审计管理',
      children: [
        { key: '/audit/warnings', label: '违规预警' },
        { key: '/audit/records', label: '违规记录' },
      ],
    },
    {
      key: '/system', icon: <TeamOutlined />, label: '系统管理',
      children: [
        { key: '/system/users', label: '用户管理' },
        { key: '/system/roles', label: '角色管理' },
        { key: '/system/permissions', label: '权限管理' },
      ],
    },
  ];

  const getFilteredMenuItems = () => {
    if (perspective === 'admin') return menuItems;
    return menuItems
      .filter((item) => {
        if (perspective === 'provider') return !['/policy', '/audit', '/system'].includes(item.key);
        if (perspective === 'consumer') return !['/audit', '/system'].includes(item.key);
        return true;
      })
      .map((item) => {
        if (item.key === '/device') {
          return {
            ...item,
            children: item.children?.filter((child) => {
              if (perspective === 'provider') return child.key !== '/device/trust';
              if (perspective === 'consumer') return child.key !== '/device/auth';
              return true;
            }),
          };
        }
        return item;
      });
  };

  const getPlatformTitle = () => {
    if (collapsed) return 'CS';
    switch (perspective) {
      case 'provider':
        return '数据提供方连接器';
      case 'consumer':
        return '数据使用方连接器';
      default:
        return '连接器管理平台';
    }
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'admin' || key === 'provider' || key === 'consumer') {
      setPerspective(key as 'admin' | 'provider' | 'consumer');
      navigate('/');
    } else if (key === 'logout') {
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0, background: '#2C8FFF', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: collapsed ? 80 : 200, color: '#fff', fontWeight: 'bold', fontSize: '18px', textAlign: 'center', transition: 'width 0.2s', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {getPlatformTitle()}
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Dropdown
              menu={{ items: [
                  { key: 'admin', label: '管理员视角' },
                  { key: 'provider', label: '数据提供方视角' },
                  { key: 'consumer', label: '数据使用方视角' },
                ], onClick: handleMenuClick, selectedKeys: [perspective] }}
           >
              <div className="cursor-pointer hover:bg-white/20 p-2 rounded flex items-center justify-center" title="切换视角" style={{ width: 32, height: 32 }}>
                  <SwapOutlined style={{ fontSize: '16px' }} />
              </div>
           </Dropdown>

           <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录' }] }}>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-white/20 p-2 rounded">
                  <Avatar icon={<UserOutlined />} />
                  <span>
                    {perspective === 'admin' ? '管理员' : perspective === 'provider' ? '数据提供方' : '数据使用方'}
                  </span>
              </div>
           </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={toggleCollapsed} style={{ fontSize: '16px' }} />
          </div>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname === '/' ? '/' : location.pathname]}
            items={getFilteredMenuItems()}
            onClick={({ key }) => navigate(key)}
            style={{ border: 'none' }}
          />
        </Sider>
        <Content style={{ margin: '16px', background: 'transparent', minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
