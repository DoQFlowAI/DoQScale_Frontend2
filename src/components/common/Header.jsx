// 소유: WJH (공통 레이아웃 틀)
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import RankBadge from './RankBadge';
import Icon from './Icon';
import InvitationMenu from './InvitationMenu';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { expireSession } from '../../services/session';

export default function Header({ menuOpen = false, onMenuClick, onInvitationAccepted }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await authService.logout(useAuthStore.getState().refreshToken);
    } catch {
      // 결과와 상관없이 로컬 상태를 비웁니다 (명세 4.4 로그인)
    }
    expireSession(); // 같은 탭의 다음 사용자에게 이전 대화가 보이지 않게 대화도 비움
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 bg-brand-header px-4 md:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="메뉴 열기"
        aria-expanded={menuOpen}
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-btn-sm text-white hover:bg-white/10 md:hidden"
      >
        <Icon name="menu" />
      </button>
      <Link to="/" className="min-w-0 truncate py-3 text-[length:clamp(14px,calc((100vw_-_280px)/5.5),18px)] font-bold text-white md:py-0 md:text-heading">
        DoQFlow AI
      </Link>
      <div className="flex-1" />
      <InvitationMenu onAccepted={onInvitationAccepted} />
      {user ? (
        <>
          <span className="hidden max-w-40 truncate text-body font-medium text-white sm:block">{user.name}</span>
          <RankBadge rankLevel={user.rankLevel} />
        </>
      ) : null}
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-btn-sm border border-line-strong px-2.5 text-[length:clamp(12px,3.4vw,13px)] font-medium text-white hover:bg-white/10 disabled:opacity-60 sm:px-3.5 md:min-h-9 md:text-label"
      >
        {loggingOut ? '로그아웃 중…' : '로그아웃'}
      </button>
    </header>
  );
}

Header.propTypes = {
  menuOpen: PropTypes.bool,
  onMenuClick: PropTypes.func,
  onInvitationAccepted: PropTypes.func,
};
