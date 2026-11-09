// 소유: JJW (버전 본문 사이드 패널)
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import Chip from '../common/Chip';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import { versionService } from '../../services/versionService';
import { ApiError, getErrorMessage, isNotFound } from '../../utils/errors';
import { changeTypeLabel } from '../../utils/changeType';
import { formatDate, formatFileSize } from '../../utils/format';

/**
 * 버전 표의 줄을 누르면 화면 오른쪽 절반에 열리는 패널: 그 버전의 정보와 본문 (필수 기능).
 * 페이지는 이동하지 않고, 열림 상태는 주소 쿼리(?version=3)로 페이지가 관리합니다.
 * 데스크톱은 오른쪽 절반(뒤 화면은 그대로 보이고 스크롤도 됨), 모바일(768px 미만)은 전체 화면입니다.
 *
 * 본문은 버전 단건 API(V-03)의 contentText 입니다. 이 필드는 아직 04 API 설계서·Backend 에 없고 목 서버만 줍니다.
 *
 * @param versionNo 지금 보여 줄 버전. 바뀌면 패널은 그대로 두고 내용만 바꿉니다
 * @param onClose 닫기 (버튼·Esc)
 * @param onCompare (versionNo) 직전 버전과 비교. 없으면 [직전 버전과 비교] 버튼을 숨김
 */
export default function VersionPeekPanel({ documentId, versionNo, onClose, onCompare }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const seq = useRef(0); // 버전을 빠르게 바꿀 때 늦게 온 이전 응답이 덮지 않게
  // 불러온 결과에는 "어느 버전을 요청한 결과인지"를 같이 적어 둡니다. 버전이 바뀐 직후 한 프레임 동안
  // 새 번호 옆에 이전 버전의 파일 이름·본문이 보이지 않도록, 지금 버전의 결과일 때만 씁니다
  const [view, setView] = useState({ no: null, status: 'loading', data: null, error: null });

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setView({ no: versionNo, status: 'loading', data: null, error: null });
    try {
      const result = await versionService.get(documentId, versionNo);
      if (mine === seq.current) setView({ no: versionNo, status: 'ok', data: result, error: null });
    } catch (e) {
      if (mine === seq.current) setView({ no: versionNo, status: 'error', data: null, error: e });
    }
  }, [documentId, versionNo]);

  const current = view.no === versionNo ? view : { status: 'loading', data: null, error: null };
  const { data, error } = current;
  const loading = current.status === 'loading';

  useEffect(() => {
    load();
  }, [load]);

  // 열 때 패널로 포커스를 옮깁니다 (닫을 때 줄로 돌려주는 일은 페이지가 합니다)
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // Esc 로 닫기. 확인창 같은 모달이 위에 떠 있을 때는 모달만 닫히게 건드리지 않습니다
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // 모바일은 전체 화면이라 뒤 화면 스크롤을 막습니다. 데스크톱은 뒤 화면도 스크롤됩니다
  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const ready = data?.status === 'READY';
  const label = changeTypeLabel(data?.changeType);

  let body;
  if (loading) body = <LoadingSpinner />;
  else if (error) {
    body = (
      <ErrorMessage
        message={getErrorMessage(error)}
        traceId={error instanceof ApiError ? error.traceId : undefined}
        onRetry={isNotFound(error) ? undefined : load}
      />
    );
  } else if (!data) body = null;
  else if (!ready) body = <p className="py-6 text-center text-sm text-muted">아직 본문을 볼 수 없습니다</p>;
  else if (!data.contentText) body = <p className="py-6 text-center text-sm text-muted">본문을 불러올 수 없습니다</p>;
  else {
    // 본문은 텍스트로만 그립니다 (명세 9.1). 문장마다 줄바꿈이 있으므로 그대로 보여 줍니다
    body = <div className="whitespace-pre-wrap break-words text-body leading-7 text-ink-2">{data.contentText}</div>;
  }

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-40 flex flex-col bg-white shadow-modal outline-none md:inset-auto md:bottom-0 md:right-0 md:top-16 md:w-1/2"
    >
      <div className="flex shrink-0 items-start gap-2 border-b border-line px-5 py-4 md:px-6">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="break-words text-title font-bold text-ink">
            v{versionNo}
            {data?.originalFilename ? ` · ${data.originalFilename}` : ''}
          </h2>
          {data ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-caption text-muted">
              <span>{formatDate(data.createdAt)}</span>
              <StatusBadge status={data.status} />
              <span>{formatFileSize(data.fileSize)}</span>
            </div>
          ) : null}
        </div>
        {onCompare && ready ? (
          <Button variant="outline" size="sm" onClick={() => onCompare(versionNo)}>
            직전 버전과 비교
          </Button>
        ) : null}
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center text-lg text-muted hover:text-ink"
        >
          ✕
        </button>
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
        {data?.changeSummary ? (
          <div className="mb-4 flex flex-wrap items-start gap-2 rounded-xl bg-soft px-3.5 py-3">
            {label ? <Chip tone="green">{label}</Chip> : null}
            <p className="min-w-0 flex-1 break-words text-sm text-ink-2">{data.changeSummary}</p>
          </div>
        ) : null}
        {body}
      </div>
    </aside>
  );
}

VersionPeekPanel.propTypes = {
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  versionNo: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onCompare: PropTypes.func,
};
