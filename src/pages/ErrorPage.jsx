import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';
import { MESSAGES } from '../utils/errors';

// 렌더링 오류용 errorElement. 오류 내용은 사용자에게 노출하지 않고 개발 콘솔에서만 본다.
export default function ErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-page px-4 py-20 text-center">
      <p className="text-[20px] font-bold text-ink">{MESSAGES.SERVER}</p>
      <a href="/" className="mt-3 inline-flex min-h-11 items-center rounded-[14px] bg-brand px-5 py-3 text-[15px] font-medium text-white">
        대시보드로 가기
      </a>
    </div>
  );
}
