import PropTypes from 'prop-types';
import Button from './Button';

export default function ErrorMessage({ message, traceId, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-[15px] font-medium text-danger">{message}</p>
      {traceId ? <p className="text-[12px] text-muted">traceId: {traceId}</p> : null}
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
