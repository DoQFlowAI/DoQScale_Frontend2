// 소유: 공통 베이스
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/** 비로그인이면 /login 으로. 로그인 후 돌아오도록 원래 주소를 from 에 남깁니다. 최종 인가는 서버가 합니다 */
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { pathname, search } = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: pathname + search }} />;
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
