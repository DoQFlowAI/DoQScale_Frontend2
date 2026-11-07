// 소유: WJH (공통 레이아웃 틀)
import { useNavigate, Link } from 'react-router-dom';
import RankBadge from './RankBadge';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { expireSession } from '../../services/session';

/**
 * TODO(WJH): 모바일 메뉴 버튼(사이드바 서랍 열기), 로그아웃 중 버튼 잠금
 * TODO(WJH): KJH 의 InvitationMenu 가 오면 이름 앞에 배치 — <InvitationMenu onAccepted={onInvitationAccepted} />
 *             (Layout 에서 <Header onInvitationAccepted={refreshDocuments} /> 로 넘김. 수락하면 사이드바 목록 갱신)
 */
export default function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const logout = async () => {
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
      <Link to="/" className="text-lg font-bold text-white md:text-heading">
        DoQFlow AI
      </Link>
      <div className="flex-1" />
      {user ? (
        <>
          <span className="hidden max-w-40 truncate text-body font-medium text-white sm:block">{user.name}</span>
          <RankBadge rankLevel={user.rankLevel} />
        </>
      ) : null}
      <button
        type="button"
        onClick={logout}
        className="flex min-h-11 items-center rounded-btn-sm border border-line-strong px-3.5 text-label font-medium text-white hover:bg-white/10 md:min-h-9"
      >
        로그아웃
      </button>
    </header>
  );
}
