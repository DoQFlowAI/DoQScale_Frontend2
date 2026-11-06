import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import InvitationMenu from './InvitationMenu';
import RankBadge from './RankBadge';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { authService } from '../../services/authService';

// 레이아웃이 내려 주는 props (스펙의 "props 없음"에 더해 모바일 사이드바 토글·초대 수락 콜백만 받는다)
export default function Header({ onToggleSidebar, sidebarOpen = false, onInvitationAccepted }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const { refreshToken } = useAuthStore.getState();
      await authService.logout(refreshToken);
    } catch {
      // 결과와 상관없이 로컬 상태를 비운다
    }
    // 같은 탭에서 다음 사용자에게 이전 대화가 보이지 않게 둘 다 비운다
    useAuthStore.getState().logout({ manual: true });
    useChatStore.getState().clear();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 bg-brand-header px-4 md:gap-3.5 md:px-8">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="메뉴 열기"
        aria-expanded={sidebarOpen}
        className="-ml-2 flex h-11 w-11 items-center justify-center text-[20px] text-white md:hidden"
      >
        ☰
      </button>
      <Link to="/" className="text-[18px] font-bold text-white md:text-[22px]">
        DoQFlow AI
      </Link>
      <div className="flex-1" />
      <InvitationMenu onAccepted={onInvitationAccepted} />
      {user ? (
        <>
          <span className="hidden max-w-[160px] truncate text-[15px] font-medium text-white sm:block">{user.name}</span>
          <span className="hidden sm:block">
            <RankBadge rankLevel={user.rankLevel} />
          </span>
        </>
      ) : null}
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="flex min-h-11 items-center rounded-[10px] border border-line-strong px-3.5 py-2 text-[13px] font-medium text-white hover:bg-white/10 disabled:opacity-60 md:min-h-0"
      >
        로그아웃
      </button>
    </header>
  );
}

Header.propTypes = {
  onToggleSidebar: PropTypes.func,
  sidebarOpen: PropTypes.bool,
  onInvitationAccepted: PropTypes.func,
};
