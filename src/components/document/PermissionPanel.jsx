import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import RankBadge from '../common/RankBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ConfirmDialog from '../common/ConfirmDialog';
import InviteeEmailInput from '../common/InviteeEmailInput';
import { documentService } from '../../services/documentService';
import { getErrorMessage } from '../../utils/errors';

const CONFIRM_TEXT = {
  ACCEPTED: '열람자를 회수하시겠습니까?',
  PENDING: '초대를 취소하시겠습니까?',
  REJECTED: '거절한 초대 기록을 삭제하시겠습니까?',
};
const ACTION_LABEL = { ACCEPTED: '회수', PENDING: '취소', REJECTED: '삭제' };
// 확인창의 취소 버튼과 겹치지 않게 다른 문구를 쓴다
const CONFIRM_LABEL = { ACCEPTED: '회수', PENDING: '초대 취소', REJECTED: '삭제' };

function Person({ name, email, rankLevel, children }) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5">
      <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-chip" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-medium text-ink">{name}</span>
          {rankLevel ? <RankBadge rankLevel={rankLevel} /> : null}
        </span>
        {email ? <span className="truncate text-[12px] text-muted">{email}</span> : null}
      </div>
      {children}
    </li>
  );
}

Person.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string,
  rankLevel: PropTypes.number,
  children: PropTypes.node,
};

/**
 * 등록자: 전체 목록(이메일, 대기·수락·거절)과 초대·취소·회수.
 * 그 외 열람자: 수락한 사람의 이름·직급·이메일만 보기 전용.
 */
export default function PermissionPanel({ documentId, owned, uploadedByName, onClose, onChanged }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [invitees, setInvitees] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [target, setTarget] = useState(null); // 확인 중인 회수 대상
  const [revoking, setRevoking] = useState(false);
  const panelRef = useRef(null);
  const confirmOpen = useRef(false);
  useEffect(() => {
    confirmOpen.current = Boolean(target);
  }, [target]);

  const load = useCallback(async () => {
    try {
      const data = await documentService.permissions(documentId);
      setList(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [documentId]);

  useEffect(() => {
    load();
  }, [load]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !confirmOpen.current) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus instanceof HTMLElement) prevFocus.focus();
    };
  }, []);

  const invite = async () => {
    if (inviting || invitees.length === 0) return;
    setInviting(true);
    setNotice('');
    setActionError('');
    try {
      const res = await documentService.invite(documentId, invitees.map((i) => i.email));
      setInvitees([]);
      if (res?.notFound?.length) setNotice(`${res.notFound.join(', ')} 사용자를 찾을 수 없습니다`);
      await load();
      onChanged?.();
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setInviting(false);
    }
  };

  const revoke = async () => {
    if (!target || revoking) return;
    setRevoking(true);
    try {
      await documentService.revoke(documentId, target.uuid);
      setTarget(null);
      setActionError('');
      await load();
      onChanged?.();
    } catch (e) {
      setTarget(null);
      setActionError(getErrorMessage(e));
      await load();
    } finally {
      setRevoking(false);
    }
  };

  // 이미 대기·수락 중인 사람은 다시 초대하지 않는다 (거절한 사람은 다시 초대 가능)
  const excludeEmails = (list || []).filter((p) => p.status !== 'REJECTED').map((p) => p.email);
  const accepted = (list || []).filter((p) => p.status === 'ACCEPTED');
  const visible = owned ? list || [] : accepted;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={owned ? '열람자 관리' : '열람자'}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-[480px] flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.16)] outline-none sm:rounded-l-3xl"
      >
        <div className="flex shrink-0 items-start gap-3 px-7 pt-7 pb-2.5">
          <h2 className="flex-1 text-[22px] font-bold text-ink">{owned ? '열람자 관리' : '열람자'}</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center text-[18px] text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-7 py-3">
          {owned ? (
            <>
              <InviteeEmailInput
                invitees={invitees}
                onChange={setInvitees}
                excludeEmails={excludeEmails}
                disabled={inviting}
                label="열람자 초대"
              />
              <Button onClick={invite} disabled={inviting || invitees.length === 0}>
                {inviting ? '초대 중…' : '초대하기'}
              </Button>
              {notice ? (
                <p role="status" className="text-[12px] text-danger">
                  {notice}
                </p>
              ) : null}
              <div className="h-px shrink-0 bg-line" />
              <h3 className="text-[13px] font-medium text-ink-2">열람자 목록</h3>
            </>
          ) : (
            <>
              <h3 className="text-[13px] font-medium text-ink-2">책임자</h3>
              <ul>
                <Person name={uploadedByName || '-'}>
                  <span className="rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-chip-ink">등록자</span>
                </Person>
              </ul>
              <div className="h-px shrink-0 bg-line" />
              <h3 className="flex items-baseline gap-2 text-[13px] font-medium text-ink-2">
                열람자 {list ? <span className="text-[12px] font-normal text-muted">{accepted.length}명</span> : null}
              </h3>
            </>
          )}

          {actionError ? (
            <p role="alert" className="text-[12px] text-danger">
              {actionError}
            </p>
          ) : null}

          {list === null && !error ? (
            <LoadingSpinner />
          ) : error && list === null ? (
            <ErrorMessage message={error} onRetry={load} />
          ) : visible.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">
              {owned ? '아직 초대한 열람자가 없습니다' : '열람자가 없습니다'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((p) => (
                <Person key={p.permissionId ?? p.uuid} name={p.name} email={p.email} rankLevel={owned ? undefined : p.rankLevel}>
                  {owned ? (
                    <>
                      <StatusBadge status={p.status} />
                      <Button size="sm" variant="danger" onClick={() => setTarget(p)} aria-label={`${p.name} ${ACTION_LABEL[p.status] || '삭제'}`}>
                        {ACTION_LABEL[p.status] || '삭제'}
                      </Button>
                    </>
                  ) : null}
                </Person>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        message={target ? CONFIRM_TEXT[target.status] || '삭제하시겠습니까?' : ''}
        confirmLabel={target ? CONFIRM_LABEL[target.status] || '삭제' : '삭제'}
        pending={revoking}
        onConfirm={revoke}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}

PermissionPanel.propTypes = {
  documentId: PropTypes.number.isRequired,
  owned: PropTypes.bool,
  uploadedByName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onChanged: PropTypes.func,
};
