// 소유: WJH (공통 레이아웃 틀)
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import Modal from './Modal';
import TextField from './TextField';
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentTabList from '../document/DocumentTabList';
import DocumentCreateModal from '../document/DocumentCreateModal';
import { documentService } from '../../services/documentService';
import { useAuthStore } from '../../store/authStore';
import { LEADER_RANK } from '../../utils/format';
import { getErrorMessage, isNotFound } from '../../utils/errors';

const NAME_MAX = 200;
const DESC_MAX = 500;

export default function Sidebar({ list, open = false, onClose, createOpen: externalCreateOpen, onOpenCreate, onCloseCreate }) {

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isLeader = user?.rankLevel === LEADER_RANK;
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const createOpen = externalCreateOpen ?? internalCreateOpen;
  const openCreate = onOpenCreate ?? (() => setInternalCreateOpen(true));
  const closeCreate = onCloseCreate ?? (() => setInternalCreateOpen(false));
  const { pathname } = useLocation();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [editFormError, setEditFormError] = useState('');
  const [editing, setEditing] = useState(false);

  const handleCreated = (documentId, flash) => {
    closeCreate();
    list.refresh();
    navigate(`/documents/${documentId}`, { state: { flash } });
  };

  const askEdit = (doc) => {
    setEditTarget(doc);
    setEditName(doc.name ?? '');
    setEditDescription(doc.description ?? '');
    setEditErrors({});
    setEditFormError('');
  };

  const closeEdit = () => {
    if (editing) return;
    setEditTarget(null);
    setEditErrors({});
    setEditFormError('');
  };

  const confirmEdit = async (e) => {
    e?.preventDefault();
    if (!editTarget || editing) return;

    const nextName = editName.trim();
    const nextDescription = editDescription.trim();
    const found = {};
    if (nextName.length < 1 || nextName.length > NAME_MAX) {
      found.name = `이름은 1~${NAME_MAX}자로 입력해 주세요`;
    }
    if (nextDescription.length > DESC_MAX) {
      found.description = `설명은 ${DESC_MAX}자 이하로 입력해 주세요`;
    }
    setEditErrors(found);
    setEditFormError('');
    if (Object.keys(found).length > 0) return;

    const patch = {};
    if (nextName !== (editTarget.name ?? '').trim()) patch.name = nextName;
    if (nextDescription !== (editTarget.description ?? '').trim()) patch.description = nextDescription;
    if (Object.keys(patch).length === 0) {
      setEditTarget(null);
      return;
    }

    setEditing(true);
    try {
      await documentService.update(editTarget.documentId, patch);
      setEditing(false);
      setEditTarget(null);
      list.refresh();
    } catch (err) {
      setEditFormError(getErrorMessage(err));
      setEditing(false);
    }
  };

  const askDelete = (doc) => {
    setDeleteTarget(doc);
    setDeleteError('');
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    const id = deleteTarget.documentId;
    setDeleting(true);
    setDeleteError('');

    try {
      await documentService.remove(id);
    }
    catch (e) {
      if (!isNotFound(e)) {
        setDeleteError(getErrorMessage(e));
        setDeleting(false);
        return;
      }
    }

    setDeleting(false);
    setDeleteTarget(null);
    list.refresh();

    const docPath = `/documents/${id}`;
    if (pathname === docPath || pathname.startsWith(`${docPath}/`)) {
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      {open ? <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-50 bg-black/40 md:hidden" /> : null}
      <aside
        aria-label="문서 목록"
        className={`fixed inset-y-0 left-0 z-50 w-70 max-w-[85vw] shrink-0 flex-col gap-3 bg-white px-4 py-5 md:static md:z-auto md:max-w-none md:flex ${open ? 'flex' : 'hidden'}`}
      >
        {/* Figma: "문서" 구역 라벨 → 목록(남는 높이를 차지) → [+ 문서 만들기]는 맨 아래 고정 */}
        <p className="px-3 text-caption text-muted">문서</p>
        <nav className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
          <DocumentTabList
            documents={list.documents}
            hasMore={list.hasMore}
            loading={list.loading}
            error={list.error}
            onLoadMore={list.loadMore}
            onRetry={list.refresh}
            onNavigate={onClose}
            onEdit={askEdit}
            onDelete={askDelete}
          />
        </nav>
        {isLeader ? (
          <Button className="w-full" onClick={openCreate}>
            <span aria-hidden="true">+</span> 문서 만들기
          </Button>
        ) : null}
      </aside>
      <DocumentCreateModal open={createOpen} onClose={closeCreate} onCreated={handleCreated} />
      <Modal
        open={editTarget !== null}
        title="문서 정보 수정"
        onClose={closeEdit}
        closeDisabled={editing}
        width="max-w-[480px]"
        footer={
          <>
            <Button variant="outline" onClick={closeEdit} disabled={editing}>
              취소
            </Button>
            <Button type="submit" form="doc-edit-form" disabled={editing}>
              {editing ? '저장 중…' : '저장'}
            </Button>
          </>
        }
      >
        <form id="doc-edit-form" onSubmit={confirmEdit} noValidate className="flex flex-col gap-4 pb-2">
          <TextField
            label={`이름 (1~${NAME_MAX}자)`}
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              if (editErrors.name) setEditErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={editErrors.name}
            maxLength={NAME_MAX}
            disabled={editing}
            autoFocus
          />
          <TextField
            label={`설명 (0~${DESC_MAX}자)`}
            value={editDescription}
            onChange={(e) => {
              setEditDescription(e.target.value);
              if (editErrors.description) setEditErrors((prev) => ({ ...prev, description: undefined }));
            }}
            error={editErrors.description}
            maxLength={DESC_MAX}
            disabled={editing}
          />
          {editFormError ? (
            <p role="alert" className="rounded-btn-sm bg-danger-bg px-3 py-2.5 text-label text-danger">
              {editFormError}
            </p>
          ) : null}
        </form>
      </Modal>
      <ConfirmDialog
        open={deleteTarget !== null}
        message={
          deleteError
            ? `삭제하지 못했습니다. ${deleteError}`
            : `'${deleteTarget?.name ?? ''}' 문서를 삭제할까요? 모든 버전이 함께 지워지고 되돌릴 수 없습니다.`
        }
        confirmLabel={deleteError ? '다시 시도' : '삭제'}
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
      />
    </>
  );
}

Sidebar.propTypes = {
  list: PropTypes.shape({
    documents: PropTypes.arrayOf(
      PropTypes.shape({ documentId: PropTypes.number.isRequired, name: PropTypes.string.isRequired }),
    ).isRequired,
    hasMore: PropTypes.bool,
    loading: PropTypes.bool,
    error: PropTypes.string,
    loadMore: PropTypes.func,
    refresh: PropTypes.func.isRequired,
  }).isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  createOpen: PropTypes.bool,
  onOpenCreate: PropTypes.func,
  onCloseCreate: PropTypes.func,
};
