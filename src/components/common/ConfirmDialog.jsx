// 소유: 공통 베이스
import PropTypes from 'prop-types';
import Modal from './Modal';
import Button from './Button';

/** 삭제·회수 등 되돌릴 수 없는 작업 확인. pending 동안은 닫기·버튼을 막습니다 */
export default function ConfirmDialog({ open, message, onConfirm, onCancel, pending = false, confirmLabel = '삭제' }) {
  return (
    <Modal
      open={open}
      title="확인"
      onClose={onCancel}
      closeDisabled={pending}
      width="max-w-[420px]"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={pending}>
            {pending ? '처리 중…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="py-3 text-body text-ink-2">{message}</p>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  confirmLabel: PropTypes.string,
};
