// 소유: 공통 베이스
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// 사이트 안 경로만 허용 ("//evil.com" 같은 값은 버림)
const safeFrom = (from) => (typeof from === 'string' && /^\/(?!\/)/.test(from) ? from : '/');

/** 로그인 상태로 /login·/signup 에 오면 원래 화면(from) 또는 / 로 보냅니다. 로그인 성공 직후도 이 경로로 이동합니다 */
export default function PublicOnlyRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { state } = useLocation();
  if (isAuthenticated) return <Navigate to={safeFrom(state?.from)} replace />;
  return children;
}

PublicOnlyRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
