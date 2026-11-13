// 소유: KJH (로그인)
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import WalkingDogs from '../components/common/WalkingDogs';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { getErrorMessage } from '../utils/errors';

// 로그아웃으로 인해 비로그인 상태가 된 경우, 다음 로그인 사용자가 이전 사용자의 화면(state.from)으로 가지 않도록 표시
let loggedOutFlag = false;
useAuthStore.subscribe((state, prevState) => {
  if (prevState.isAuthenticated && !state.isAuthenticated) {
    loggedOutFlag = true;
  }
});

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const signedUp = Boolean(location.state?.signedUp);

  useEffect(() => {
    if (loggedOutFlag) {
      loggedOutFlag = false;
      if (location.state?.from) {
        navigate('/login', { replace: true, state: null });
      }
    }
  }, [location.state, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('이메일과 비밀번호를 입력해 주세요');
      return;
    }

    setError('');
    setPending(true);
    try {
      const { accessToken } = await authService.login(trimmedEmail, password);
      useAuthStore.getState().setTokens(accessToken); // /users/me 요청에 토큰을 싣기 위해 먼저 저장
      const me = await userService.me();
      useChatStore.getState().clear(); // 이전 사용자의 대화가 남지 않게
      useAuthStore.getState().login(me, accessToken); // → PublicOnlyRoute 가 원래 화면으로 보냄
    } catch (err) {
      useAuthStore.getState().logout();
      setError(getErrorMessage(err));
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-page px-4 py-10">
      <form
        onSubmit={submit}
        noValidate
        className="flex w-full max-w-[460px] flex-col gap-4 rounded-panel bg-white p-7 shadow-modal sm:p-9"
      >
        <h1 className="text-display font-bold text-brand">DoQFlow AI</h1>
        <h2 className="text-title font-bold text-ink">로그인</h2>
        {signedUp ? (
          <p role="status" className="rounded-btn-sm bg-chip px-3 py-2.5 text-label text-chip-ink">
            가입이 완료되었습니다. 로그인해 주세요.
          </p>
        ) : null}
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="name@example.com"
          maxLength={255}
          disabled={pending}
        />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          placeholder="••••••••"
          maxLength={64}
          disabled={pending}
        />
        {error ? (
          <p role="alert" className="rounded-btn-sm bg-danger-bg px-3 py-2.5 text-label text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? '로그인 중…' : '로그인'}
        </Button>
        <p className="text-center text-label text-muted">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="inline-flex min-h-11 min-w-11 items-center justify-center font-bold text-brand hover:underline">
            회원가입
          </Link>
        </p>
      </form>
      <WalkingDogs />
    </div>
  );
}
