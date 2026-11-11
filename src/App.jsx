// 소유: 공통 베이스
import { useEffect, useState } from 'react';
import AppRouter from './routes/AppRouter';
import LoadingSpinner from './components/common/LoadingSpinner';
import { restoreSession } from './services/restoreSession';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreSession().then(() => setReady(true));
  }, []);

  if (!ready) return <LoadingSpinner label="로그인 확인 중…" />;
  return <AppRouter />;
}
