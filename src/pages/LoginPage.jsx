import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { getErrorMessage } from '../utils/errors';

export default function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const signedUp = Boolean(location.state?.signedUp);

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요');
      return;
    }
    setError('');
    setPending(true);
    try {
      const auth = await authService.login(email.trim(), password);
      // /users/me 에 토큰이 실리도록 먼저 토큰만 저장한다
      useAuthStore.getState().setTokens(auth.accessToken, auth.refreshToken);
      let me;
      try {
        me = await userService.me();
      } catch (err) {
        useAuthStore.getState().logout();
        throw err;
      }
      useChatStore.getState().clear(); // 이전 사용자의 대화가 남지 않게
      // 로그인되면 PublicOnlyRoute 가 원래 화면(또는 /)으로 보낸다
      useAuthStore.getState().login(me, auth.accessToken, auth.refreshToken);
    } catch (err) {
      setError(getErrorMessage(err)); // 401·423 은 서버 문구 그대로
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-4 py-10">
      <form
        onSubmit={submit}
        noValidate
        className="flex w-full max-w-[460px] flex-col gap-[18px] rounded-[28px] bg-white p-7 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-9"
      >
        <h1 className="text-[28px] font-bold text-brand">DoQFlow AI</h1>
        <h2 className="text-[20px] font-bold text-ink">로그인</h2>
        {signedUp ? (
          <p role="status" className="rounded-[10px] bg-chip px-3 py-2.5 text-[13px] text-chip-ink">
            가입이 완료되었습니다. 로그인해 주세요.
          </p>
        ) : null}
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          maxLength={255}
          disabled={pending}
        />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          maxLength={64}
          disabled={pending}
        />
        {error ? (
          <p role="alert" className="rounded-[10px] bg-danger-bg px-3 py-2.5 text-[13px] text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? '로그인 중…' : '로그인'}
        </Button>
        <p className="text-center text-[13px] text-muted">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-bold text-brand">
            회원가입
          </Link>
        </p>
      </form>
    </div>
  );
}
