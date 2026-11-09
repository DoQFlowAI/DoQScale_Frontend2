// 소유: 공통 베이스
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ErrorMessage from './ErrorMessage';

/** 화면 전체 오류: 404·없는 문서·렌더링 오류 (명세 4.4 "404 / 오류"). 안내 문구 + 대시보드 링크 */
export default function PageError({ message, traceId, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 pt-20">
      <ErrorMessage message={message} traceId={traceId} onRetry={onRetry} />
      <Link
        to="/"
        className="inline-flex min-h-11 items-center rounded-btn bg-brand px-5 py-3 text-body font-medium text-white hover:bg-brand-hover"
      >
        대시보드로 가기
      </Link>
    </div>
  );
}

PageError.propTypes = {
  message: PropTypes.string.isRequired,
  traceId: PropTypes.string,
  onRetry: PropTypes.func,
};
