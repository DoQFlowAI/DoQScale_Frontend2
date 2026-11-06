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

// 렌더링 오류는 errorElement 로 처리한다 (createBrowserRouter)
export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      { path: '/login', element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
      { path: '/signup', element: <PublicOnlyRoute><SignupPage /></PublicOnlyRoute> },
      {
        element: (
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/documents/:documentId', element: <DocumentDetailPage /> },
          { path: '/documents/:documentId/compare', element: <CompareResultPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
