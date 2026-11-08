// 소유: KJH (초대 알림창)
import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import { invitationService } from '../../services/invitationService';
import { ApiError, getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';

/**
 * 헤더 초대 알림 드롭다운 (명세 4.4 공통 레이아웃, 5.1).
 * 약속 props: onAccepted (수락 성공 시 사이드바 목록 갱신 콜백)
 */
export default function InvitationMenu({ onAccepted }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const rootRef = useRef(null);
  const seqRef = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    const mine = ++seqRef.current;
    if (!silent) setLoading(true);
    try {
      const data = await invitationService.list();
      if (mine !== seqRef.current) return;
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      if (mine !== seqRef.current) return;
      setError(getErrorMessage(e));
    } finally {
      if (mine === seqRef.current) setLoading(false);
    }
  }, []);

  // 처음 그려질 때와 화면 이동 때마다 다시 받습니다
  useEffect(() => {
    load({ silent: true });
  }, [pathname, load]);

  // 바깥 클릭·Esc 로 닫기
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setActionError('');
      load({ silent: items !== null });
    }
  };

  const respond = async (item, accept) => {
    if (pendingId) return;
    setPendingId(item.invitationId);
    setActionError('');
    try {
      if (accept) await invitationService.accept(item.invitationId);
      else await invitationService.reject(item.invitationId);
      setItems((prev) => (prev || []).filter((i) => i.invitationId !== item.invitationId));
      if (accept) onAccepted?.();
    } catch (e) {
      setActionError(getErrorMessage(e));
      if (e instanceof ApiError && e.status === 400) {
        // 이미 응답한 초대이면 목록을 다시 받습니다
        await load({ silent: true });
        if (accept) onAccepted?.();
      }
    } finally {
      setPendingId(null);
    }
  };

  const count = items?.length ?? 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex min-h-11 items-center gap-1.5 rounded-btn-sm border border-line-strong px-3.5 py-2 text-label font-medium text-white hover:bg-white/10 md:min-h-9"
      >
        <span>초대 알림</span>
        {count > 0 ? (
          <span
            aria-label={`대기 중인 초대 ${count}개`}
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-caption font-bold text-brand"
          >
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="region"
          aria-label="받은 초대"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(400px,calc(100vw-32px))] rounded-3xl bg-white p-4 shadow-modal"
        >
          <h2 className="mb-2 text-base font-bold text-ink">받은 초대</h2>
          {loading && items === null ? (
            <LoadingSpinner />
          ) : error && items === null ? (
            <ErrorMessage message={error} onRetry={() => load()} />
          ) : count === 0 ? (
            <p className="py-6 text-center text-sm text-muted">받은 초대가 없습니다</p>
          ) : (
            <ul className="thin-scroll flex max-h-80 flex-col gap-2 overflow-y-auto">
              {items.map((item) => {
                const busy = pendingId === item.invitationId;
                return (
                  <li key={item.invitationId} className="rounded-xl border border-line p-3">
                    <p className="break-words text-sm font-bold text-ink">{item.documentName}</p>
                    <p className="mt-0.5 text-caption text-muted">
                      초대자 {item.invitedByName} · {formatDate(item.grantedAt)}
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <Button size="sm" onClick={() => respond(item, true)} disabled={Boolean(pendingId)}>
                        {busy ? '처리 중…' : '수락'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respond(item, false)}
                        disabled={Boolean(pendingId)}
                      >
                        거절
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {actionError ? (
            <p role="alert" className="mt-2 text-caption text-danger">
              {actionError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

InvitationMenu.propTypes = {
  onAccepted: PropTypes.func,
};
