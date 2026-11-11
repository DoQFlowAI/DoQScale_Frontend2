// 소유: JJW (비교할 버전 선택)
import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import Button from './Button';
import { formatMonthDay } from '../../utils/format';

/** 준비 완료(READY) 버전 중 서로 다른 두 개를 고릅니다 (명세 5.1). 오래된 쪽이 from(이전), 새 쪽이 to(이후)입니다. */
function VersionSelectBody({ versions, initialFrom, initialTo, onConfirm, onClose, error }) {
  const groupId = useId();
  // 비교는 READY 버전만 가능합니다 (FAILED·PROCESSING 은 서버도 400)
  const ready = [...versions].filter((v) => v.status === 'READY').sort((a, b) => b.versionNo - a.versionNo);
  const has = (no) => ready.some((v) => v.versionNo === no);

  // 처음 값: 넘겨받은 값이 고를 수 있는 버전이면 그대로, 아니면 가장 최근 두 개
  const [from, setFrom] = useState(() => (has(initialFrom) ? initialFrom : (ready[1]?.versionNo ?? null)));
  const [to, setTo] = useState(() => (has(initialTo) ? initialTo : (ready[0]?.versionNo ?? null)));

  // 열려 있는 동안 버전이 지워지거나 상태가 바뀌어 고를 수 없게 된 값은 "고르지 않음"으로 봅니다
  // (그대로 두면 없는 버전으로 비교를 요청해 서버 오류가 납니다)
  const fromNo = has(from) ? from : null;
  const toNo = has(to) ? to : null;

  let hint = '';
  if (ready.length < 2) hint = '비교하려면 준비 완료된 버전이 2개 이상 있어야 합니다';
  else if (fromNo !== null && fromNo === toNo) hint = '서로 다른 두 버전을 선택해 주세요';
  const canConfirm = !hint && fromNo !== null && toNo !== null;

  const confirm = () => {
    if (!canConfirm) return;
    onConfirm(Math.min(fromNo, toNo), Math.max(fromNo, toNo)); // 거꾸로 골라도 오래된 버전이 from
  };

  const column = (name, label, value, setValue) => (
    <fieldset className="min-w-0 flex-1">
      <legend className="mb-2 text-label font-medium text-ink-2">{label}</legend>
      <div className="thin-scroll flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
        {ready.map((v) => (
          <label
            key={v.versionNo}
            className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-body ${
              value === v.versionNo ? 'border-soft-line bg-soft' : 'border-line'
            }`}
          >
            <input
              type="radio"
              name={`${groupId}-${name}`}
              checked={value === v.versionNo}
              onChange={() => setValue(v.versionNo)}
              className="h-4 w-4 accent-brand"
            />
            <span className="font-medium text-ink">v{v.versionNo}</span>
            <span className="ml-auto text-caption text-muted">{formatMonthDay(v.createdAt)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <Modal
      open
      title="비교할 버전 선택"
      subtitle="준비 완료(READY) 버전 중 서로 다른 두 개를 고르세요"
      onClose={onClose}
      width="max-w-[560px]"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={confirm} disabled={!canConfirm}>
            비교하기
          </Button>
        </>
      }
    >
      {error ? (
        <p role="alert" className="mb-3 rounded-xl bg-danger-bg px-3 py-2.5 text-label text-danger">
          {error}
        </p>
      ) : null}
      {ready.length > 0 ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          {column('from', '이전 버전 (from)', fromNo, setFrom)}
          {column('to', '이후 버전 (to)', toNo, setTo)}
        </div>
      ) : null}
      {hint ? (
        <p role="status" className="mt-3 text-label text-muted">
          {hint}
        </p>
      ) : null}
    </Modal>
  );
}

VersionSelectBody.propTypes = {
  versions: PropTypes.array.isRequired,
  initialFrom: PropTypes.number,
  initialTo: PropTypes.number,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  error: PropTypes.string,
};

/**
 * 열려 있을 때만 안쪽을 그려서, 열 때마다 처음 값부터 다시 시작합니다.
 * @param versions 문서의 버전 목록 ({ versionNo, status, createdAt, ... })
 * @param onConfirm (from, to) 오래된 버전이 from
 * @param error 비교 요청이 400일 때 서버 문구
 */
export default function VersionSelectModal({ open, ...rest }) {
  if (!open) return null;
  return <VersionSelectBody {...rest} />;
}

VersionSelectModal.propTypes = {
  open: PropTypes.bool.isRequired,
  versions: PropTypes.array.isRequired,
  initialFrom: PropTypes.number,
  initialTo: PropTypes.number,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  error: PropTypes.string,
};
