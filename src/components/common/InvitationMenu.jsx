import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { invitationService } from '../../services/invitationService';
import { getErrorMessage, ApiError } from '../../utils/errors';
import { formatDate } from '../../utils/format';

export default function InvitationMenu({ onAccepted }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null); // null: 아직 받지 못함
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const rootRef = useRef(null);
  const seq = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    const mine = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const data = await invitationService.list();
      if (mine !== seq.current) return;
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      if (mine !== seq.current) return;
      if (!silent || items === null) setError(getErrorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인 직후와 화면 이동 때 다시 받는다
  useEffect(() => {
    load({ silent: true });
  }, [pathname, load]);

  // 바깥 클릭·Esc 로 닫기
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
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
      if (e instanceof ApiError && e.status === 400) {
        // 이미 응답한 초대: 목록을 다시 받는다
        setActionError(getErrorMessage(e));
        await load({ silent: true });
        if (accept) onAccepted?.();
      } else {
        setActionError(getErrorMessage(e));
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
        className="flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line-strong px-3.5 py-2 text-[13px] font-medium text-white hover:bg-white/10 md:min-h-0"
      >
        <span>초대 알림</span>
        {count > 0 ? (
          <span
            aria-label={`대기 중인 초대 ${count}개`}
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[12px] font-bold text-brand"
          >
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="region"
          aria-label="받은 초대"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(400px,calc(100vw-32px))] rounded-2xl bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.16)]"
        >
          <h2 className="mb-2 text-[16px] font-bold text-ink">받은 초대</h2>
          {loading && items === null ? (
            <LoadingSpinner />
          ) : error && items === null ? (
            <ErrorMessage message={error} onRetry={() => load()} />
          ) : count === 0 ? (
            <p className="py-6 text-center text-[14px] text-muted">받은 초대가 없습니다</p>
          ) : (
            <ul className="flex max-h-[320px] flex-col gap-2 overflow-y-auto">
              {items.map((item) => {
                const busy = pendingId === item.invitationId;
                return (
                  <li key={item.invitationId} className="rounded-xl border border-line p-3">
                    <p className="break-words text-[14px] font-bold text-ink">{item.documentName}</p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      초대자 {item.invitedByName} · {formatDate(item.grantedAt)}
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <Button size="sm" onClick={() => respond(item, true)} disabled={Boolean(pendingId)}>
                        {busy ? '처리 중…' : '수락'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => respond(item, false)} disabled={Boolean(pendingId)}>
                        거절
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {actionError ? (
            <p role="alert" className="mt-2 text-[12px] text-danger">
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
