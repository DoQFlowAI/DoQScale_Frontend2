// 소유: 공통 베이스
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import Layout from '../components/common/Layout';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import DashboardPage from '../pages/DashboardPage';
import DocumentDetailPage from '../pages/DocumentDetailPage';
import CompareResultPage from '../pages/CompareResultPage';
import NotFoundPage from '../pages/NotFoundPage';
import ErrorPage from '../pages/ErrorPage';

// 미리보기 /preview — 개발 서버(npm run dev)에서만 생기고 배포 빌드에는 들어가지 않습니다
const previewRoutes = import.meta.env.DEV
  ? [{ path: '/preview', lazy: () => import('../preview/PreviewPage').then((m) => ({ Component: m.default })) }]
  : [];

// 화면 5개 + 404 (명세 4장). 렌더링 오류는 errorElement 로 처리
const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      { path: '/login', element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
      { path: '/signup', element: <PublicOnlyRoute><SignupPage /></PublicOnlyRoute> },
      {
        element: <ProtectedRoute><Layout /></ProtectedRoute>,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/documents/:documentId', element: <DocumentDetailPage /> },
          { path: '/documents/:documentId/compare', element: <CompareResultPage /> },
          ...previewRoutes,
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
