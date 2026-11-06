import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import { formatFileSize } from '../../utils/format';

export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'docx'];

const extOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

// File 객체마다 안정적인 key (순서를 바꿔도 행이 섞이지 않게)
const ids = new WeakMap();
let idSeq = 0;
const keyOf = (file) => {
  if (!ids.has(file)) ids.set(file, ++idSeq);
  return ids.get(file);
};

/** 사전 검증: PDF·DOCX, 파일당 20MB, 빈 파일 제외, 최대 10개 */
export function validateFiles(current, incoming) {
  const accepted = [];
  const errors = [];
  for (const f of incoming) {
    if (!ALLOWED_EXT.includes(extOf(f.name))) {
      errors.push(`${f.name}: PDF·DOCX 파일만 올릴 수 있습니다`);
    } else if (f.size === 0) {
      errors.push(`${f.name}: 빈 파일은 올릴 수 없습니다`);
    } else if (f.size > MAX_FILE_BYTES) {
      errors.push(`${f.name}: 파일당 20MB를 넘을 수 없습니다 (${formatFileSize(f.size)})`);
    } else if (current.length + accepted.length >= MAX_FILES) {
      errors.push(`한 번에 최대 ${MAX_FILES}개까지 올릴 수 있습니다`);
      break;
    } else {
      accepted.push(f);
    }
  }
  return { accepted, errors: [...new Set(errors)] };
}

/**
 * 고른 파일의 순서와 붙을 버전 번호(startVersionNo 부터)만 다룬다. 전송은 부모가 한다.
 */
export default function VersionUploadPanel({ files, onChange, startVersionNo, disabled = false, title = '새 버전 올리기' }) {
  const inputRef = useRef(null);
  const [errors, setErrors] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const addFiles = (list) => {
    const { accepted, errors: errs } = validateFiles(files, Array.from(list));
    setErrors(errs);
    if (accepted.length > 0) onChange([...files, ...accepted]);
  };

  const move = (from, to) => {
    if (to < 0 || to >= files.length || from === to) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const removeAt = (i) => {
    setErrors([]);
    onChange(files.filter((_, idx) => idx !== i));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const openPicker = () => inputRef.current?.click();

  const picker = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      className="hidden"
      onChange={(e) => {
        if (e.target.files?.length) addFiles(e.target.files);
        e.target.value = ''; // 같은 파일을 다시 골라도 change 가 나게
      }}
      disabled={disabled}
    />
  );

  const dropProps = {
    onDragOver: (e) => {
      // 파일 끌기일 때만 반응 (목록 순서 바꾸기 드래그와 구분)
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }
    },
    onDragLeave: () => setDragOver(false),
    onDrop,
  };

  const latest = startVersionNo - 1;

  return (
    <div className="flex flex-col gap-2.5">
      {files.length === 0 ? (
        <div
          {...dropProps}
          className={`flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3.5 ${
            dragOver ? 'border-brand bg-chip' : 'border-soft-line bg-soft'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink-2">{title}</p>
            <p className="text-[12px] text-muted">PDF·DOCX, 한 번에 1~10개, 파일당 20MB</p>
          </div>
          <Button size="sm" onClick={openPicker} disabled={disabled}>
            파일 선택
          </Button>
        </div>
      ) : (
        <div
          {...dropProps}
          className={`flex flex-col gap-2 rounded-2xl border p-3.5 ${
            dragOver ? 'border-brand bg-chip' : 'border-soft-line bg-soft'
          }`}
        >
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[13px] font-medium text-ink-2">
              {latest > 0 ? `현재 최신 버전: v${latest}` : '첫 버전부터 올라갑니다'}
            </p>
            <Button size="sm" variant="outline" onClick={openPicker} disabled={disabled || files.length >= MAX_FILES}>
              파일 추가
            </Button>
          </div>
          <ol className="flex flex-col gap-1.5">
            {files.map((file, i) => (
              <li
                key={keyOf(file)}
                draggable={!disabled}
                onDragStart={(e) => {
                  setDragIndex(i);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(i));
                }}
                onDragOver={(e) => {
                  if (dragIndex !== null) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  e.stopPropagation();
                  move(dragIndex, i);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2 ${
                  dragIndex === i ? 'border-brand opacity-60' : 'border-line'
                }`}
              >
                <span aria-hidden="true" className="cursor-grab select-none px-1 text-[16px] leading-none text-muted">
                  ⋮⋮
                </span>
                <span className="w-5 shrink-0 text-[12px] text-muted">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2" title={file.name}>
                  {file.name}
                </span>
                <span className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-chip-ink">
                  v{startVersionNo + i}
                </span>
                <button
                  type="button"
                  aria-label={`${file.name} 위로`}
                  disabled={disabled || i === 0}
                  onClick={() => move(i, i - 1)}
                  className="flex h-11 w-8 items-center justify-center text-[12px] text-muted hover:text-ink disabled:opacity-30 md:h-7"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`${file.name} 아래로`}
                  disabled={disabled || i === files.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="flex h-11 w-8 items-center justify-center text-[12px] text-muted hover:text-ink disabled:opacity-30 md:h-7"
                >
                  ▼
                </button>
                <button
                  type="button"
                  aria-label={`${file.name} 빼기`}
                  disabled={disabled}
                  onClick={() => removeAt(i)}
                  className="flex h-11 w-9 items-center justify-center text-[12px] text-danger hover:bg-danger-bg disabled:opacity-40 md:h-7"
                >
                  빼기
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      {picker}
      {errors.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-0.5 text-[12px] text-danger">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

VersionUploadPanel.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
  startVersionNo: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
  title: PropTypes.string,
};
