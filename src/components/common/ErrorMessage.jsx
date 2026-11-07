// 소유: 공통 베이스
import PropTypes from 'prop-types';
import Button from './Button';

/** 데이터 화면의 에러 상태 (명세 4.3). 문구는 utils/errors 의 getErrorMessage 로 만든 것을 넘깁니다 */
export default function ErrorMessage({ message, traceId, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-body font-medium text-danger">{message}</p>
      {traceId ? <p className="text-caption text-muted">traceId: {traceId}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          다시 시도
        </Button>
      ) : null}
    </div>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
  traceId: PropTypes.string,
  onRetry: PropTypes.func,
};
