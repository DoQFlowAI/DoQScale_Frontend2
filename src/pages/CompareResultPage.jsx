// 소유: JJW (비교 탭 diff 뷰어)
import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Chip from '../components/common/Chip';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageError from '../components/common/PageError';
import VersionSelectModal from '../components/common/VersionSelectModal';
import DiffViewer from '../components/document/DiffViewer';
import { documentService } from '../services/documentService';
import { versionService } from '../services/versionService';
import { ApiError, getErrorMessage, isNotFound } from '../utils/errors';

// 쿼리 값은 양의 정수 문자열일 때만 인정합니다 ("1e3", "-2", "abc" 는 모두 잘못된 쿼리)
const toVersionNo = (value) => (/^[1-9]\d*$/.test(value ?? '') ? Number(value) : null);

/**
 * 문서 비교 결과 /documents/:documentId/compare?from=&to= (명세 4.4)
 * 서버가 준 diffJson 위치대로 DiffViewer 가 색칠하고, 이 페이지는 데이터 불러오기·오류 처리·변경 이동을 맡습니다.
 */
export default function CompareResultPage() {
  const { documentId } = useParams();
  // 주소의 문서가 바뀌면 key 로 안쪽을 통째로 새로 시작해서 이전 문서의 이름·결과가 잠깐 남아 보이지 않게 합니다
  return <CompareResult key={documentId} documentId={documentId} />;
}

function CompareResult({ documentId }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fromQuery = toVersionNo(searchParams.get('from'));
  const toQuery = toVersionNo(searchParams.get('to'));
  const validQuery = fromQuery !== null && toQuery !== null && fromQuery !== toQuery;
  // 거꾸로 들어와도 오래된 버전이 항상 from
  const from = validQuery ? Math.min(fromQuery, toQuery) : null;
  const to = validQuery ? Math.max(fromQuery, toQuery) : null;

  const [doc, setDoc] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState(null); // 화면 전체 오류 (404·서버 오류)
  const [compareError, setCompareError] = useState(''); // 비교 요청 400의 서버 문구
  const [modalOpen, setModalOpen] = useState(false);
  const [activeBlock, setActiveBlock] = useState(0);
  const [scrollKey, setScrollKey] = useState(0);
  const seq = useRef(0); // 주소가 바뀌어 늦게 온 이전 응답이 화면을 덮지 않게

  // from > to 로 들어오면 바꾼 주소로 교체 (뒤로 가기 기록에 남기지 않음)
  useEffect(() => {
    if (validQuery && fromQuery > toQuery) setSearchParams({ from: String(from), to: String(to) }, { replace: true });
  }, [validQuery, fromQuery, toQuery, from, to, setSearchParams]);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    setFailure(null);
    setCompareError('');
    setResult(null);
    setActiveBlock(0);
    // 문서(이름·버전 목록)와 비교 결과를 함께 받습니다. 쿼리가 잘못됐으면 문서만 받습니다
    const [docRes, cmpRes] = await Promise.allSettled([
      documentService.get(documentId),
      validQuery ? versionService.compare(documentId, from, to) : Promise.resolve(null),
    ]);
    if (mine !== seq.current) return;

    if (docRes.status === 'rejected') {
      setFailure(docRes.reason);
    } else {
      setDoc(docRes.value);
      if (cmpRes.status === 'fulfilled') {
        setResult(cmpRes.value);
      } else if (cmpRes.reason instanceof ApiError && cmpRes.reason.status === 400) {
        // 비교할 수 없는 조합 (FAILED·PROCESSING 버전 등): 버전을 다시 고르게 모달을 엽니다
        setCompareError(getErrorMessage(cmpRes.reason));
      } else {
        setFailure(cmpRes.reason);
      }
    }
    setLoading(false);
  }, [documentId, validQuery, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  // 뒤로 가기 등으로 주소가 다른 유효한 비교로 바뀌면 열려 있던 선택 모달을 닫습니다
  useEffect(() => {
    if (validQuery) setModalOpen(false);
  }, [validQuery, from, to]);

  // 쿼리가 없거나 잘못됐거나 비교 요청이 400이면 모달을 엽니다
  const needsSelect = !loading && !failure && (!validQuery || Boolean(compareError));
  useEffect(() => {
    if (needsSelect) setModalOpen(true);
  }, [needsSelect]);

  const blocks = Array.isArray(result?.diffJson) ? result.diffJson : [];

  const move = (delta) => {
    if (blocks.length === 0) return;
    setActiveBlock((current) => {
      if (current === null) return delta > 0 ? 0 : blocks.length - 1;
      return Math.min(blocks.length - 1, Math.max(0, current + delta));
    });
    setScrollKey((k) => k + 1);
  };

  const confirmVersions = (nextFrom, nextTo) => {
    setModalOpen(false);
    setSearchParams({ from: String(nextFrom), to: String(nextTo) }, { replace: true });
  };

  const closeModal = () => {
    setModalOpen(false);
    // 잘못된 쿼리인 채로 닫으면 보여 줄 비교가 없으므로 문서 상세로 돌아갑니다
    if (!validQuery || compareError) navigate(`/documents/${documentId}`, { replace: true });
  };

  if (failure) {
    const traceId = failure instanceof ApiError ? failure.traceId : '';
    // 없는 문서(404)는 다시 시도해도 같으므로 다시 시도 버튼을 두지 않습니다
    return <PageError message={getErrorMessage(failure)} traceId={traceId} onRetry={isNotFound(failure) ? undefined : load} />;
  }
  if (loading && !doc) return <LoadingSpinner />;

  const same = result && result.changeCount === 0 && blocks.length === 0;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 md:px-8 md:py-7">
      {/* 위쪽 도구 줄: 스크롤해도 이전 변경·다음 변경을 누를 수 있게 붙여 둡니다 */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 bg-page px-4 pb-2 md:-mx-8 md:px-8">
        <Link to={`/documents/${documentId}`} className="inline-flex min-h-11 w-fit items-center text-label font-medium text-brand md:min-h-0">
          ← 문서로 돌아가기
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 max-w-full break-words text-title font-bold text-ink">{doc?.name}</h1>
          {result ? (
            <>
              <Chip tone="soft" size="md">
                v{result.fromVersionNo} → v{result.toVersionNo}
              </Chip>
              <Chip tone={result.changeCount > 0 ? 'warn' : 'gray'} size="md">
                변경 {result.changeCount}건
              </Chip>
            </>
          ) : null}
          <div className="flex-1" />
          {result && blocks.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => move(-1)} disabled={activeBlock === 0}>
                이전 변경
              </Button>
              <span aria-live="polite" className="min-w-12 text-center text-label text-muted">
                {activeBlock === null ? '-' : activeBlock + 1} / {blocks.length}
              </span>
              <Button variant="outline" size="sm" onClick={() => move(1)} disabled={activeBlock === blocks.length - 1}>
                다음 변경
              </Button>
            </div>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
            다른 버전 선택
          </Button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : null}

      {!loading && result ? (
        same ? (
          <p className="rounded-3xl bg-white p-8 text-center text-body text-muted">두 버전의 내용이 같습니다</p>
        ) : (
          <DiffViewer
            fromLabel={`v${result.fromVersionNo} (이전)`}
            toLabel={`v${result.toVersionNo} (이후)`}
            fromText={result.fromText}
            toText={result.toText}
            diffJson={blocks}
            activeBlock={activeBlock}
            scrollKey={scrollKey}
          />
        )
      ) : null}

      <VersionSelectModal
        open={modalOpen}
        versions={doc?.versions ?? []}
        initialFrom={from ?? undefined}
        initialTo={to ?? undefined}
        error={compareError}
        onConfirm={confirmVersions}
        onClose={closeModal}
      />
    </div>
  );
}

CompareResult.propTypes = {
  documentId: PropTypes.string.isRequired,
};
