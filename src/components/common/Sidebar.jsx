// 소유: WJH (공통 레이아웃 틀)
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentTabList from '../document/DocumentTabList';
import DocumentCreateModal from '../document/DocumentCreateModal';
import { documentService } from '../../services/documentService';
import { useAuthStore } from '../../store/authStore';
import { LEADER_RANK } from '../../utils/format';
import { getErrorMessage, isNotFound } from '../../utils/errors';

export default function Sidebar({ list, open = false, onClose }) {

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isLeader = user?.rankLevel === LEADER_RANK;
  const [createOpen, setCreateOpen] = useState(false);
  const { pathname } = useLocation();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleCreated = (documentId, flash) => {
    setCreateOpen(false);
    list.refresh();
    navigate(`/documents/${documentId}`, { state: { flash } });
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
            onDelete={askDelete}
          />
        </nav>
        {isLeader ? (
          <Button className="w-full" onClick={() => setCreateOpen(true)}>
            <span aria-hidden="true">+</span> 문서 만들기
          </Button>
        ) : null}
      </aside>
      <DocumentCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
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
};
