import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ConfirmDialog from '../components/common/ConfirmDialog';
import VersionSelectModal from '../components/common/VersionSelectModal';
import VersionUploadPanel from '../components/common/VersionUploadPanel';
import Button from '../components/common/Button';
import DocumentInfoPanel from '../components/document/DocumentInfoPanel';
import VersionTable from '../components/document/VersionTable';
import HistoryTimeline from '../components/document/HistoryTimeline';
import PermissionPanel from '../components/document/PermissionPanel';
import ChatWidget from '../components/chat/ChatWidget';
import { documentService } from '../services/documentService';
import { versionService } from '../services/versionService';
import { usePolling } from '../utils/usePolling';
import { getErrorMessage, isNotFound, ApiError, MESSAGES } from '../utils/errors';

function Banner({ tone, children, onClose }) {
  const style = tone === 'error' ? 'bg-danger-bg text-danger' : 'bg-chip text-chip-ink';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-[13px] ${style}`}>
      <p className="flex-1 break-words">{children}</p>
      <button type="button" onClick={onClose} aria-label="알림 닫기" className="shrink-0 px-1 text-[14px] leading-none">
        ✕
      </button>
    </div>
  );
}

Banner.propTypes = {
  tone: PropTypes.oneOf(['error', 'notice']).isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

function DocumentDetail({ documentId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshDocuments } = useOutletContext();

  const [doc, setDoc] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { message, notFound, traceId }

  const [viewersOpen, setViewersOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(false);
  const [deleteVersion, setDeleteVersion] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [files, setFiles] = useState([]);
  const [uploadConfirm, setUploadConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [flash, setFlash] = useState(location.state?.flash || null);
  const [actionError, setActionError] = useState('');
  const seq = useRef(0);

  // 문서 만들기 직후 안내를 한 번만 보여 주고 history state 는 비운다
  useEffect(() => {
    if (location.state?.flash) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const mine = ++seq.current;
      if (!silent) setLoading(true);
      const [d, h] = await Promise.allSettled([documentService.get(documentId), versionService.history(documentId)]);
      if (mine !== seq.current) return;
      if (d.status === 'rejected') {
        // 권한 밖·없는 문서는 구분하지 않고 같은 문구로 보여 준다
        if (!silent || !doc) {
          setError({
            message: getErrorMessage(d.reason),
            notFound: isNotFound(d.reason),
            traceId: d.reason instanceof ApiError ? d.reason.traceId : '',
          });
        }
        setLoading(false);
        return;
      }
      setDoc(d.value);
      setError(null);
      if (h.status === 'fulfilled') {
        setHistory(h.value);
        setHistoryError('');
      } else {
        setHistoryError(getErrorMessage(h.reason));
      }
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // PROCESSING 이 있으면 재조회 (사이드바 상태도 함께)
  const processing = Boolean(doc && (doc.status === 'PROCESSING' || doc.versions?.some((v) => v.status === 'PROCESSING')));
  usePolling(
    async () => {
      await load({ silent: true });
      refreshDocuments?.();
    },
    3000,
    processing,
  );

  const reloadAll = async () => {
    await load({ silent: true });
    refreshDocuments?.();
  };

  const closeViewers = useCallback(() => setViewersOpen(false), []);

  if (loading && !doc) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 pt-20">
        <ErrorMessage message={error.message} traceId={error.traceId} onRetry={error.notFound ? undefined : () => load()} />
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-[14px] bg-brand px-5 py-3 text-[15px] font-medium text-white"
        >
          대시보드로 가기
        </Link>
      </div>
    );
  }

  const versions = doc.versions || [];
  const nextVersionNo = (doc.currentVersionNo || 0) + 1;
  const rangeText =
    files.length === 1 ? `v${nextVersionNo}` : `v${nextVersionNo}~v${nextVersionNo + files.length - 1}`;

  const saveInfo = async (patch) => {
    await documentService.update(documentId, patch);
    await reloadAll();
  };

  const confirmDeleteDoc = async () => {
    setDeleting(true);
    try {
      await documentService.remove(documentId);
      refreshDocuments?.();
      navigate('/', { replace: true });
    } catch (e) {
      setDeleteDoc(false);
      setActionError(getErrorMessage(e));
      setDeleting(false);
    }
  };

  const confirmDeleteVersion = async () => {
    if (!deleteVersion) return;
    setDeleting(true);
    try {
      await versionService.remove(documentId, deleteVersion.versionNo);
      setDeleteVersion(null);
      setActionError('');
      await reloadAll();
    } catch (e) {
      setDeleteVersion(null);
      setActionError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const upload = async () => {
    setUploading(true);
    setActionError('');
    try {
      await versionService.upload(documentId, files);
      setFiles([]);
      setUploadConfirm(false);
      await reloadAll(); // 서버가 준 버전 번호로 목록을 다시 그린다
    } catch (e) {
      setUploadConfirm(false);
      // 서버는 하나라도 걸리면 전체를 거부한다
      setActionError(e instanceof ApiError && e.status === 413 ? MESSAGES.FILE_TOO_LARGE : getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 md:px-8 md:pb-24 md:pt-7">
      {flash?.error ? (
        <Banner tone="error" onClose={() => setFlash((f) => ({ ...f, error: undefined }))}>
          {flash.error}
        </Banner>
      ) : null}
      {flash?.notice ? (
        <Banner tone="notice" onClose={() => setFlash((f) => ({ ...f, notice: undefined }))}>
          {flash.notice}
        </Banner>
      ) : null}
      {actionError ? (
        <Banner tone="error" onClose={() => setActionError('')}>
          {actionError}
        </Banner>
      ) : null}

      <DocumentInfoPanel
        document={doc}
        onSave={saveInfo}
        onOpenViewers={() => setViewersOpen(true)}
        onDelete={() => setDeleteDoc(true)}
      />

      <div className="grid gap-5 xl:grid-cols-[560px_minmax(0,1fr)] xl:items-start">
        <VersionTable
          versions={versions}
          currentVersionNo={doc.currentVersionNo}
          owned={doc.owned}
          onDelete={setDeleteVersion}
        >
          {doc.owned ? (
            <div className="flex flex-col gap-2.5">
              <VersionUploadPanel files={files} onChange={setFiles} startVersionNo={nextVersionNo} disabled={uploading} />
              {files.length > 0 ? (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setFiles([])} disabled={uploading}>
                    취소
                  </Button>
                  <Button onClick={() => setUploadConfirm(true)} disabled={uploading}>
                    {uploading ? '올리는 중…' : `${rangeText}, ${files.length}개 버전 올리기`}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </VersionTable>

        {historyError && !history ? (
          <section className="rounded-3xl bg-white px-6 py-5">
            <h2 className="text-[20px] font-bold text-ink">변천사</h2>
            <ErrorMessage message={historyError} onRetry={() => load({ silent: true })} />
          </section>
        ) : (
          <HistoryTimeline
            documentId={doc.documentId}
            versions={history?.versions?.length ? history.versions : versions}
            segments={history?.segments || []}
            currentVersionNo={doc.currentVersionNo}
            onOpenCompare={() => setCompareOpen(true)}
          />
        )}
      </div>

      {viewersOpen ? (
        <PermissionPanel
          documentId={doc.documentId}
          owned={doc.owned}
          uploadedByName={doc.uploadedByName}
          onClose={closeViewers}
        />
      ) : null}

      <VersionSelectModal
        open={compareOpen}
        versions={versions}
        onClose={() => setCompareOpen(false)}
        onConfirm={(from, to) => {
          setCompareOpen(false);
          navigate(`/documents/${documentId}/compare?from=${from}&to=${to}`);
        }}
      />

      <ConfirmDialog
        open={uploadConfirm}
        message={`${rangeText}, ${files.length}개 버전을 올릴까요?`}
        confirmLabel="올리기"
        pending={uploading}
        onConfirm={upload}
        onCancel={() => setUploadConfirm(false)}
      />
      <ConfirmDialog
        open={Boolean(deleteVersion)}
        message={deleteVersion ? `v${deleteVersion.versionNo} 버전을 삭제하시겠습니까?` : ''}
        pending={deleting}
        onConfirm={confirmDeleteVersion}
        onCancel={() => setDeleteVersion(null)}
      />
      <ConfirmDialog
        open={deleteDoc}
        message="문서를 삭제하시겠습니까? 모든 버전과 열람자 정보도 함께 삭제됩니다."
        pending={deleting}
        onConfirm={confirmDeleteDoc}
        onCancel={() => setDeleteDoc(false)}
      />

      <ChatWidget />
    </div>
  );
}

DocumentDetail.propTypes = { documentId: PropTypes.number.isRequired };

export default function DocumentDetailPage() {
  const { documentId } = useParams();
  const id = Number(documentId);
  // 숫자가 아닌 주소(/documents/abc)는 없는 문서와 같게 다룬다
  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 pt-20">
        <ErrorMessage message={MESSAGES.NOT_FOUND} />
        <Link to="/" className="inline-flex min-h-11 items-center rounded-[14px] bg-brand px-5 py-3 text-[15px] font-medium text-white">
          대시보드로 가기
        </Link>
      </div>
    );
  }
  // 문서가 바뀌면 상태를 처음부터 다시 시작한다
  return <DocumentDetail key={id} documentId={id} />;
}
