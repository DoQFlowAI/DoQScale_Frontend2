import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import Button from './Button';
import { formatMonthDay } from '../../utils/format';

function RadioColumn({ legend, name, versions, value, onChange }) {
  return (
    <fieldset className="min-w-0 flex-1">
      <legend className="mb-2 text-[14px] font-bold text-ink">{legend}</legend>
      <div className="thin-scroll flex max-h-[220px] flex-col gap-1.5 overflow-y-auto pr-1">
        {versions.map((v) => {
          const checked = value === v.versionNo;
          return (
            <label
              key={v.versionNo}
              className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${
                checked ? 'border-soft-line bg-soft' : 'border-line bg-white hover:bg-th'
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(v.versionNo)}
                className="h-4 w-4 accent-[#1b5444]"
              />
              <span className="text-[15px] font-bold text-ink">v{v.versionNo}</span>
              <span className="ml-auto text-[12px] text-muted">{formatMonthDay(v.createdAt)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

RadioColumn.propTypes = {
  legend: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  versions: PropTypes.array.isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

// 열려 있는 동안에만 마운트해서 열 때마다 초기값으로 시작한다
function Body({ versions, initialFrom, initialTo, onConfirm, onClose, error }) {
  const ready = useMemo(
    () => versions.filter((v) => v.status === 'READY').sort((a, b) => a.versionNo - b.versionNo),
    [versions],
  );
  const has = (n) => ready.some((v) => v.versionNo === n);
  const [from, setFrom] = useState(has(initialFrom) ? initialFrom : undefined);
  const [to, setTo] = useState(has(initialTo) ? initialTo : undefined);

  const invalid = from == null || to == null || from === to;
  const hint =
    ready.length < 2
      ? '비교하려면 준비 완료 버전이 2개 이상 필요합니다'
      : from != null && to != null && from === to
        ? '서로 다른 두 버전을 골라 주세요'
        : '';

  const confirm = () => {
    if (invalid) return;
    // 오래된 버전이 from
    onConfirm(Math.min(from, to), Math.max(from, to));
  };

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
          <Button onClick={confirm} disabled={invalid}>
            비교하기
          </Button>
        </>
      }
    >
      {error ? (
        <p role="alert" className="mb-3 rounded-[10px] bg-danger-bg px-3 py-2.5 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row">
        <RadioColumn legend="이전 버전 (from)" name="cmp-from" versions={ready} value={from} onChange={setFrom} />
        <RadioColumn legend="이후 버전 (to)" name="cmp-to" versions={ready} value={to} onChange={setTo} />
      </div>
      {hint ? <p className="mt-3 text-[12px] text-danger">{hint}</p> : null}
    </Modal>
  );
}

Body.propTypes = {
  versions: PropTypes.array.isRequired,
  initialFrom: PropTypes.number,
  initialTo: PropTypes.number,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default function VersionSelectModal({ open, versions, initialFrom, initialTo, onConfirm, onClose, error }) {
  if (!open) return null;
  return (
    <Body
      versions={versions}
      initialFrom={initialFrom}
      initialTo={initialTo}
      onConfirm={onConfirm}
      onClose={onClose}
      error={error}
    />
  );
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
