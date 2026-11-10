// 소유: KJH (생성·초대 모달)
import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import Chip from '../common/Chip';
import ConfirmDialog from '../common/ConfirmDialog';
import ErrorMessage from '../common/ErrorMessage';
import InviteeEmailInput from '../common/InviteeEmailInput';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import RankBadge from '../common/RankBadge';
import StatusBadge from '../common/StatusBadge';
import { documentService } from '../../services/documentService';
import { getErrorMessage } from '../../utils/errors';

const CONFIRM_TEXT = {
  ACCEPTED: '열람자를 회수하시겠습니까?',
  PENDING: '초대를 취소하시겠습니까?',
  REJECTED: '거절된 초대 기록을 삭제하시겠습니까?',
};
const ACTION_LABEL = {
  ACCEPTED: '회수',
  PENDING: '취소',
  REJECTED: '삭제',
};
const CONFIRM_LABEL = {
  ACCEPTED: '회수',
  PENDING: '초대 취소',
  REJECTED: '삭제',
};

function PersonRow({ name, email, rankLevel, children }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3">
      <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-chip" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-body font-bold text-ink">{name}</span>
          {rankLevel ? <RankBadge rankLevel={rankLevel} /> : null}
        </span>
        {email ? <span className="truncate text-caption text-muted">{email}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </li>
  );
}

PersonRow.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string,
  rankLevel: PropTypes.number,
  children: PropTypes.node,
};

/**
 * 열람자 목록·초대·회수 모달 (명세 4.4 문서 상세).
 * 약속 props: documentId(필수), owned(필수), uploadedByName, uploadedByEmail, onClose(필수)
 */
export default function PermissionPanel({ documentId, owned, uploadedByName = '', uploadedByEmail = '', onClose }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [invitees, setInvitees] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [target, setTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

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

  const invite = async () => {
    if (inviting || invitees.length === 0) return;
    setInviting(true);
    setNotice('');
    setActionError('');
    try {
      const res = await documentService.invite(
        documentId,
        invitees.map((i) => i.email),
      );
      setInvitees([]);
      if (res?.notFound?.length) {
        setNotice(`가입되지 않은 이메일: ${res.notFound.join(', ')}`);
      }
      await load();
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setInviting(false);
    }
  };

  const revoke = async () => {
    if (!target || revoking) return;
    setRevoking(true);
    setActionError('');
    try {
      await documentService.revoke(documentId, target.uuid);
      setTarget(null);
      await load();
    } catch (e) {
      setActionError(getErrorMessage(e));
      setTarget(null);
    } finally {
      setRevoking(false);
    }
  };

  // 대기·수락 중인 사람은 다시 초대하지 않음 (거절한 사람은 다시 초대하면 대기로 돌아감)
  const excludeEmails = (list || []).filter((p) => p.status !== 'REJECTED').map((p) => p.email);
  const visible = list || [];

  return (
    <>
      <Modal
        open
        title={owned ? '열람자 관리' : '열람자'}
        onClose={onClose}
        closeDisabled={inviting || revoking || Boolean(target)}
        placement="right"
        width="max-w-[480px]"
      >
        <div className="flex flex-col gap-3 pb-2">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-medium text-ink-2">책임자</h3>
            <ul>
              <PersonRow name={uploadedByName || '-'} email={uploadedByEmail}>
                <Chip tone="green">등록자</Chip>
              </PersonRow>
            </ul>
          </div>

          {owned ? (
            <>
              <div className="h-px bg-line" />
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
                <p role="status" className="text-caption text-danger">
                  {notice}
                </p>
              ) : null}
            </>
          ) : null}

          <div className="h-px bg-line" />
          <h3 className="flex items-baseline gap-2 text-label font-medium text-ink-2">
            <span>{owned ? '열람자 목록' : '열람자'}</span>
            {list ? <span className="text-caption font-normal text-muted">{visible.length}명</span> : null}
          </h3>

          {actionError ? (
            <p role="alert" className="text-caption text-danger">
              {actionError}
            </p>
          ) : null}

          {list === null && !error ? (
            <LoadingSpinner />
          ) : error && list === null ? (
            <ErrorMessage message={error} onRetry={load} />
          ) : visible.length === 0 ? (
            <p className="py-4 text-center text-label text-muted">
              {owned ? '아직 초대한 열람자가 없습니다' : '열람자가 없습니다'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((p, index) => {
                return (
                  <PersonRow
                    key={p.permissionId ?? p.uuid ?? index}
                    name={p.name}
                    email={p.email}
                    rankLevel={p.rankLevel}
                  >
                    {owned ? (
                      <>
                        <StatusBadge status={p.status} />
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setTarget(p)}
                          aria-label={`${p.name} ${ACTION_LABEL[p.status] || '삭제'}`}
                        >
                          {ACTION_LABEL[p.status] || '삭제'}
                        </Button>
                      </>
                    ) : null}
                  </PersonRow>
                );
              })}
            </ul>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        message={target ? CONFIRM_TEXT[target.status] || '삭제하시겠습니까?' : ''}
        confirmLabel={target ? CONFIRM_LABEL[target.status] || '삭제' : '삭제'}
        pending={revoking}
        onConfirm={revoke}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}

PermissionPanel.propTypes = {
  documentId: PropTypes.number.isRequired,
  owned: PropTypes.bool.isRequired,
  uploadedByName: PropTypes.string,
  uploadedByEmail: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
