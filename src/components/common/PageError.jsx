// 소유: 공통 베이스
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Button from './Button';
import ErrorMessage from './ErrorMessage';

const homeLinkClass =
  'inline-flex min-h-11 items-center rounded-btn bg-brand px-5 py-3 text-body font-medium text-white hover:bg-brand-hover';

/**
 * 화면 전체 오류: 404·없는 문서·렌더링 오류 (명세 4.4 "404 / 오류"). 안내 문구 + 대시보드 링크.
 * code 가 있으면(예: "404") Figma 처럼 큰 숫자 + 제목 모양으로 그립니다 (문구와 동작은 같음).
 */
export default function PageError({ message, traceId, onRetry, code }) {
  if (code) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 pt-20 text-center">
        <p aria-hidden="true" className="text-8xl font-bold leading-none text-brand">
          {code}
        </p>
        <div role="alert" className="flex flex-col items-center gap-2">
          <p className="text-2xl font-bold text-ink">{message}</p>
          {traceId ? <p className="text-caption text-muted">traceId: {traceId}</p> : null}
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          ) : null}
        </div>
        <Link to="/" className={homeLinkClass}>
          대시보드로 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-8 pt-20">
      <ErrorMessage message={message} traceId={traceId} onRetry={onRetry} />
      <Link to="/" className={homeLinkClass}>
        대시보드로 가기
      </Link>
    </div>
  );
}

PageError.propTypes = {
  message: PropTypes.string.isRequired,
  traceId: PropTypes.string,
  onRetry: PropTypes.func,
  code: PropTypes.string,
};
