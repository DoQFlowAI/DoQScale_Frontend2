// 소유: KJH (로그인)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { getErrorMessage } from '../utils/errors';

/**
 * 최소 로그인 (다른 담당이 화면을 확인할 수 있게 동작만 해 둠).
 * TODO(KJH): 명세 4.4 로그인 — 입력 검증, 가입 완료 안내, 로그아웃 후 다른 계정 로그인 시 이전 화면으로 복귀하지 않는지 확인
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const { accessToken, refreshToken } = await authService.login(email.trim(), password);
      useAuthStore.getState().setTokens(accessToken, refreshToken); // /users/me 요청에 토큰을 싣기 위해 먼저 저장
      const me = await userService.me();
      useChatStore.getState().clear(); // 이전 사용자의 대화가 남지 않게
      useAuthStore.getState().login(me, accessToken, refreshToken); // → PublicOnlyRoute 가 원래 화면으로 보냄
    } catch (err) {
      useAuthStore.getState().logout();
      setError(getErrorMessage(err));
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <form onSubmit={submit} noValidate className="flex w-full max-w-[460px] flex-col gap-4 rounded-panel bg-white p-7 sm:p-9">
        <h1 className="text-display font-bold text-brand">DoQFlow AI</h1>
        <TextField label="이메일" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
        <Button type="submit" disabled={pending}>
          {pending ? '로그인 중…' : '로그인'}
        </Button>
        <Link to="/signup" className="text-center text-label text-muted hover:underline">
          회원가입
        </Link>
      </form>
    </div>
  );
}
