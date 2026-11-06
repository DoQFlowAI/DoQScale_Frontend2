import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function NotFoundPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-page px-4 py-20 text-center">
      <p className="text-[56px] font-bold text-brand">404</p>
      <p className="text-[20px] font-bold text-ink">문서를 찾을 수 없습니다</p>
      <Link
        to={isAuthenticated ? '/' : '/login'}
        className="mt-3 inline-flex min-h-11 items-center rounded-[14px] bg-brand px-5 py-3 text-[15px] font-medium text-white hover:bg-[#164538]"
      >
        대시보드로 가기
      </Link>
    </div>
  );
}
