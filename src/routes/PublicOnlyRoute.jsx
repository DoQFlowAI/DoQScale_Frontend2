import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// 내부 경로만 허용 ("//evil.com" 같은 값은 버린다)
const safeFrom = (from) => (typeof from === 'string' && /^\/(?!\/)/.test(from) ? from : '/');

/**
 * 로그인한 사용자가 /login·/signup 에 들어오면 / 로 보낸다.
 * 로그인 직후에는 보호 라우트가 남긴 from(원래 화면)으로 복귀한다.
 */
export default function PublicOnlyRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const skipReturn = useAuthStore((s) => s.skipReturn);
  const location = useLocation();
  if (isAuthenticated) {
    return <Navigate to={skipReturn ? '/' : safeFrom(location.state?.from)} replace />;
  }
  return children;
}

PublicOnlyRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
