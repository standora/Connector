import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import Placeholder from '@/pages/Placeholder';
import UserManagement from '@/pages/system/UserManagement';
import TrustManagement from '@/pages/device/TrustManagement';
import AuthManagement from '@/pages/device/AuthManagement';
import ResourceList from '@/pages/resource/ResourceList';
import SandboxManagement from '@/pages/resource/SandboxManagement';
import OpenDomainManagement from '@/pages/resource/OpenDomainManagement';
import ApplicationSystemManagement from '@/pages/resource/ApplicationSystemManagement';
import PolicyNegotiationPage from '@/pages/policy/PolicyNegotiation';
import UdfNegotiationPage from '@/pages/policy/UdfNegotiation';
import SandboxAppList from '@/pages/sandbox-app/SandboxAppList';
import SandboxAppDetail from '@/pages/sandbox-app/SandboxAppDetail';
import PartnerManagement from '@/pages/device/PartnerManagement';
import PartnerDetail from '@/pages/device/PartnerDetail';
import AuditWarnings from '@/pages/audit/AuditWarnings';
import AuditRecords from '@/pages/audit/AuditRecords';
import RoleManagement from '@/pages/system/RoleManagement';
import PermissionManagement from '@/pages/system/PermissionManagement';
import RouteErrorElement from '@/pages/RouteErrorElement';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      { index: true, element: <Home /> },
      // 设备互信与授权
      { path: 'device/trust', element: <TrustManagement /> },
      { path: 'device/auth', element: <AuthManagement /> },
      { path: 'device/partner', element: <PartnerManagement /> },
      { path: 'device/partner/:id', element: <PartnerDetail /> },
      
      // 开放资源管理
      { path: 'resource/domain', element: <OpenDomainManagement /> },
      { path: 'resource/list', element: <ResourceList /> },
      { path: 'resource/app-system', element: <ApplicationSystemManagement /> },
      { path: 'resource/sandbox', element: <SandboxManagement /> },
      
      // 沙盒 APP 管理
      { path: 'sandbox-app/list', element: <SandboxAppList /> },
      { path: 'sandbox-app/detail/:id', element: <SandboxAppDetail /> },
      
      // 使用策略管理
      { path: 'policy/negotiation', element: <PolicyNegotiationPage /> },
      { path: 'policy/udf', element: <UdfNegotiationPage /> },
      
      // 安全审计管理
      { path: 'audit/warnings', element: <AuditWarnings /> },
      { path: 'audit/records', element: <AuditRecords /> },
      
      // 系统管理
      { path: 'system/users', element: <UserManagement /> },
      { path: 'system/roles', element: <RoleManagement /> },
      { path: 'system/permissions', element: <PermissionManagement /> },

      {
        path: '*',
        element: <Placeholder title="404 Not Found" />,
      },
    ],
  },
], { basename: '/Connector' });
