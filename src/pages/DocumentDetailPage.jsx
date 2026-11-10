// 소유: JJW (문서 상세)
import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import PageError from '../components/common/PageError';
import VersionSelectModal from '../components/common/VersionSelectModal';
import VersionUploadPanel from '../components/common/VersionUploadPanel';
import ChatWidget from '../components/chat/ChatWidget';
import DocumentInfoPanel from '../components/document/DocumentInfoPanel';
import HistoryTimeline from '../components/document/HistoryTimeline';
import PermissionPanel from '../components/document/PermissionPanel';
import VersionPeekPanel from '../components/document/VersionPeekPanel';
import VersionTable from '../components/document/VersionTable';
import { documentService } from '../services/documentService';
import { versionService } from '../services/versionService';
import { ApiError, getErrorMessage, isNotFound } from '../utils/errors';
import { usePolling } from '../utils/usePolling';
import { withStatus } from '../utils/versionStatus'; // 변천사 응답에 없는 버전 status 를 문서의 버전 목록에서 채움 (API 설계서 5.13)

const POLLING_MS = 3000; // 분석 중(PROCESSING) 재조회 간격
const toVersionNo = (value) => (/^[1-9]\d*$/.test(value ?? '') ? Number(value) : null);

/** 안내(notice)·오류(error) 한 줄. 닫기 버튼이 있습니다 */
function Banner({ tone, onClose, children }) {
  const style = tone === 'error' ? 'bg-danger-bg text-danger' : 'bg-chip text-chip-ink';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-label ${style}`}>
      <p className="min-w-0 flex-1 break-words">{children}</p>
      <button type="button" aria-label="안내 닫기" onClick={onClose} className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center">
        ✕
      </button>
    </div>
  );
}

Banner.propTypes = {
  tone: PropTypes.oneOf(['notice', 'error']).isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
};

/**
 * 문서 상세 /documents/:documentId (명세 4.4)
 * 문서 정보, 버전 목록, 변천사, 버전 본문 패널을 한 화면에 엮고, 삭제·수정·폴링 같은 동작은 여기서 합니다.
 * 주소의 문서가 바뀌면 key 로 안쪽을 통째로 새로 시작해서 이전 문서의 상태가 남지 않게 합니다.
 */
export default function DocumentDetailPage() {
  const { documentId } = useParams();
  return <DocumentDetail key={documentId} documentId={documentId} />;
}

function DocumentDetail({ documentId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshDocuments } = useOutletContext();

  const [doc, setDoc] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [failure, setFailure] = useState(null); // 화면 전체 오류 (404·서버 오류)
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null); // { notice?, error? } 한 번 보여 주는 안내
  const [versionToDelete, setVersionToDelete] = useState(null);
  const [deletingVersion, setDeletingVersion] = useState(false);
  const [deleteDocOpen, setDeleteDocOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false); // KJH 의 열람자 관리 모달
  const [files, setFiles] = useState([]); // WJH 의 업로드 패널이 관리하는 고른 파일 (보내는 것은 이 페이지가 함)
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const seq = useRef(0); // 늦게 온 이전 응답이 화면을 덮지 않게

  // 사이드바 갱신 함수는 매번 새로 만들어질 수 있으므로 ref 로 최신 것만 부릅니다
  const refreshRef = useRef(refreshDocuments);
  useEffect(() => {
    refreshRef.current = refreshDocuments;
  }, [refreshDocuments]);

  // 문서 만들기가 남긴 안내(location.state.flash)를 한 번 보여 주고 state 를 비웁니다 (새로고침해도 다시 안 나옴)
  useEffect(() => {
    const incoming = location.state?.flash;
    if (!incoming) return;
    setFlash(incoming);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  /** 문서와 변천사를 함께 받습니다. 변천사만 실패하면 상세는 그대로 보이고 변천사 자리만 오류입니다 */
  const fetchAll = useCallback(
    async ({ silent = false } = {}) => {
      const mine = ++seq.current;
      if (!silent) setLoading(true);
      const [docRes, historyRes] = await Promise.allSettled([documentService.get(documentId), versionService.history(documentId)]);
      if (mine !== seq.current) return;

      if (docRes.status === 'rejected') {
        // 폴링 중 일시 오류는 무시하고, 문서가 사라졌을 때(404)만 화면을 바꿉니다
        if (!silent || isNotFound(docRes.reason)) setFailure(docRes.reason);
      } else {
        setDoc(docRes.value);
        setFailure(null);
        if (historyRes.status === 'fulfilled') {
          setHistory(historyRes.value);
          setHistoryError(null);
        } else if (!silent) {
          setHistoryError(historyRes.reason);
        }
      }
      if (!silent) setLoading(false);
    },
    [documentId],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 문서나 버전 중 PROCESSING 이 있으면 3초마다 다시 조회하고 사이드바 상태 배지도 같이 갱신합니다. 끝나면 멈춥니다
  const processing = Boolean(doc && (doc.status === 'PROCESSING' || doc.versions.some((v) => v.status === 'PROCESSING')));
  usePolling(
    async () => {
      await fetchAll({ silent: true });
      refreshRef.current?.();
    },
    POLLING_MS,
    processing,
  );

  // ---- 버전 본문 패널 (?version=3) ----
  const requestedNo = toVersionNo(searchParams.get('version'));
  const selectedNo = requestedNo !== null && doc?.versions.some((v) => v.versionNo === requestedNo) ? requestedNo : null;
  const selected = selectedNo === null ? null : doc.versions.find((v) => v.versionNo === selectedNo);
  // 이 버전보다 앞선 가장 가까운 READY 버전 (직전 버전과 비교할 때 씀)
  const previousReady = selected
    ? doc.versions.filter((v) => v.status === 'READY' && v.versionNo < selected.versionNo).sort((a, b) => b.versionNo - a.versionNo)[0]
    : null;

  const setVersionParam = useCallback(
    (versionNo) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (versionNo === null) next.delete('version');
          else next.set('version', String(versionNo));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // 삭제됐거나 잘못된 ?version= 값은 지웁니다
  useEffect(() => {
    if (doc && searchParams.get('version') !== null && selectedNo === null) setVersionParam(null);
  }, [doc, searchParams, selectedNo, setVersionParam]);

  const closePanel = () => {
    const no = selectedNo;
    setVersionParam(null);
    // 닫으면 눌렀던 줄로 포커스를 돌려줍니다
    setTimeout(() => document.querySelector(`[data-version-no="${no}"]`)?.focus(), 0);
  };

  // ---- 동작 ----
  const saveInfo = async (patch) => {
    await documentService.update(documentId, patch);
    await fetchAll({ silent: true });
    refreshRef.current?.();
  };

  const removeVersion = async () => {
    if (!versionToDelete || deletingVersion) return;
    setDeletingVersion(true);
    try {
      await versionService.remove(documentId, versionToDelete.versionNo);
      if (selectedNo === versionToDelete.versionNo) setVersionParam(null);
      setVersionToDelete(null);
      await fetchAll({ silent: true });
      refreshRef.current?.();
    } catch (e) {
      setVersionToDelete(null);
      setFlash({ error: getErrorMessage(e) });
    } finally {
      setDeletingVersion(false);
    }
  };

  /** 고른 파일을 순서대로 올립니다. 서버는 하나라도 걸리면 전체를 거부합니다 (413: 20MB 초과, 400: 서버 문구) */
  const uploadFiles = async () => {
    if (uploading || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      const result = await versionService.upload(documentId, files);
      const count = result?.versions?.length ?? files.length;
      setFiles([]);
      setUploadConfirmOpen(false);
      setFlash({ notice: `${count}개 버전을 올렸습니다. 분석이 끝나면 비교할 수 있습니다` });
      await fetchAll({ silent: true }); // 서버가 준 버전 번호로 목록을 다시 그립니다
      refreshRef.current?.();
    } catch (e) {
      setUploadConfirmOpen(false);
      setUploadError(getErrorMessage(e)); // 고른 파일은 그대로 두어 고쳐서 다시 올릴 수 있게 합니다
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async () => {
    if (deletingDoc) return;
    setDeletingDoc(true);
    try {
      await documentService.remove(documentId);
      refreshRef.current?.();
      navigate('/', { replace: true });
    } catch (e) {
      if (isNotFound(e)) {
        refreshRef.current?.();
        navigate('/', { replace: true });
        return;
      }
      setDeleteDocOpen(false);
      setFlash({ error: getErrorMessage(e) });
      setDeletingDoc(false);
    }
  };

  if (failure) {
    const traceId = failure instanceof ApiError ? failure.traceId : '';
    // 없는 문서·권한 밖 문서는 구분하지 않습니다 (서버가 둘 다 404, 명세 9.6)
    return (
      <PageError
        code={isNotFound(failure) ? '404' : undefined}
        message={getErrorMessage(failure)}
        traceId={traceId}
        onRetry={isNotFound(failure) ? undefined : () => fetchAll()}
      />
    );
  }
  if (loading && !doc) return <LoadingSpinner />;
  if (!doc) return null;

  // 올릴 버전 범위: 보낸 순서가 곧 버전 번호이므로 현재 최신 버전 다음부터 순서대로 매깁니다
  const firstNo = doc.currentVersionNo + 1;
  const lastNo = doc.currentVersionNo + files.length;
  const range = files.length > 1 ? `v${firstNo}~v${lastNo}` : `v${firstNo}`;
  const uploadLabel = uploading ? '올리는 중…' : `${range}, ${files.length}개 버전 올리기`;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 md:px-8 md:py-7">
      {flash?.notice ? (
        <Banner tone="notice" onClose={() => setFlash((f) => ({ ...f, notice: undefined }))}>
          {flash.notice}
        </Banner>
      ) : null}
      {flash?.error ? (
        <Banner tone="error" onClose={() => setFlash((f) => ({ ...f, error: undefined }))}>
          {flash.error}
        </Banner>
      ) : null}

      <DocumentInfoPanel
        doc={doc}
        onSave={saveInfo}
        onDelete={() => setDeleteDocOpen(true)}
        actions={
          // Figma: 등록자는 [열람자 관리], 열람만 하는 사람은 [열람자 보기]
          <Button variant="outline" onClick={() => setPermissionOpen(true)}>
            {doc.owned ? '열람자 관리' : '열람자 보기'}
          </Button>
        }
      />

      {/* 명세 8.1: 태블릿(768px)은 1열, 데스크톱(1280px)은 2열(버전·변천사). 사이드바가 768px부터 고정되어 본문이 좁으므로 lg(1024px)부터 2열. Figma 비율은 560 : 516, 간격 20 */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,560fr)_minmax(0,516fr)] lg:gap-5">
        <Card>
          <VersionTable
            versions={doc.versions}
            currentVersionNo={doc.currentVersionNo}
            owned={doc.owned}
            selectedVersionNo={selectedNo}
            onSelect={(v) => setVersionParam(v.versionNo)}
            onDelete={setVersionToDelete}
          >
            {/* 업로드는 등록자만. 파일 고르기·순서·검증은 WJH 의 패널이, 올리기 버튼과 전송은 이 페이지가 합니다 */}
            {doc.owned ? (
              <div className="flex flex-col gap-3">
                <VersionUploadPanel files={files} onChange={setFiles} startVersionNo={doc.currentVersionNo + 1} disabled={uploading} />
                {uploadError ? (
                  <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2.5 text-label text-danger">
                    {uploadError}
                  </p>
                ) : null}
                {/* Figma: 파일을 고른 뒤에만 [취소]와 [vN~vM, k개 버전 올리기]가 나타납니다 */}
                {files.length > 0 ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => {
                        setFiles([]);
                        setUploadError('');
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      disabled={uploading}
                      onClick={() => {
                        setUploadError('');
                        setUploadConfirmOpen(true);
                      }}
                    >
                      {uploadLabel}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </VersionTable>
        </Card>
        <Card
          title="변천사"
          actions={
            <Button variant="outline" size="sm" onClick={() => setCompareOpen(true)}>
              버전 비교
            </Button>
          }
        >
          {historyError ? (
            <ErrorMessage
              message={getErrorMessage(historyError)}
              traceId={historyError instanceof ApiError ? historyError.traceId : undefined}
              onRetry={() => fetchAll()}
            />
          ) : history ? (
            <HistoryTimeline documentId={documentId} versions={withStatus(history.versions, doc.versions)} segments={history.segments ?? []} />
          ) : (
            <LoadingSpinner />
          )}
        </Card>
      </div>

      {selected ? (
        <VersionPeekPanel
          documentId={documentId}
          versionNo={selected.versionNo}
          onClose={closePanel}
          onCompare={
            selected.status === 'READY' && previousReady
              ? (no) => navigate(`/documents/${documentId}/compare?from=${previousReady.versionNo}&to=${no}`)
              : undefined
          }
        />
      ) : null}

      <VersionSelectModal
        open={compareOpen}
        versions={doc.versions}
        onConfirm={(from, to) => navigate(`/documents/${documentId}/compare?from=${from}&to=${to}`)}
        onClose={() => setCompareOpen(false)}
      />

      {permissionOpen ? (
        <PermissionPanel
          documentId={Number(documentId)}
          owned={doc.owned}
          uploadedByName={doc.uploadedBy?.name}
          uploadedByEmail={doc.uploadedBy?.email}
          onClose={() => setPermissionOpen(false)}
        />
      ) : null}

      {/* 올리기 전 한 번 더 확인: 되돌릴 수 없는 삭제가 아니므로 빨간 확인창 대신 기본 모달을 씁니다 */}
      <Modal
        open={uploadConfirmOpen}
        title="버전 올리기"
        onClose={() => setUploadConfirmOpen(false)}
        closeDisabled={uploading}
        width="max-w-[420px]"
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadConfirmOpen(false)} disabled={uploading}>
              취소
            </Button>
            <Button onClick={uploadFiles} disabled={uploading}>
              {uploading ? '올리는 중…' : '올리기'}
            </Button>
          </>
        }
      >
        <p className="py-3 text-body text-ink-2">
          {range}, {files.length}개 버전을 올립니다. 올린 버전은 고칠 수 없습니다.
        </p>
      </Modal>

      <ConfirmDialog
        open={Boolean(versionToDelete)}
        message={versionToDelete ? '이 버전을 삭제하시겠습니까?' : ''}
        pending={deletingVersion}
        onConfirm={removeVersion}
        onCancel={() => setVersionToDelete(null)}
      />
      <ConfirmDialog
        open={deleteDocOpen}
        message="이 문서를 삭제하시겠습니까? 모든 버전과 열람자 정보도 함께 지워지며 되돌릴 수 없습니다."
        pending={deletingDoc}
        onConfirm={removeDocument}
        onCancel={() => setDeleteDocOpen(false)}
      />

      {/* 챗봇은 페이지 맨 끝에 한 번. 버전 본문 패널보다 뒤에 둬서 패널이 열려 있어도 아이콘이 위에 보입니다 */}
      <ChatWidget />
    </div>
  );
}

DocumentDetail.propTypes = {
  documentId: PropTypes.string.isRequired,
};
