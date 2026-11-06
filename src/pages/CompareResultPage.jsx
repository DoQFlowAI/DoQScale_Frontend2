import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import VersionSelectModal from '../components/common/VersionSelectModal';
import Button from '../components/common/Button';
import Chip from '../components/common/Chip';
import DiffViewer from '../components/document/DiffViewer';
import { documentService } from '../services/documentService';
import { versionService } from '../services/versionService';
import { ApiError, getErrorMessage, isNotFound, MESSAGES } from '../utils/errors';

const toVersionNo = (v) => (/^\d+$/.test(v ?? '') ? Number(v) : null);

function BackToDashboard() {
  return (
    <Link to="/" className="inline-flex min-h-11 items-center rounded-[14px] bg-brand px-5 py-3 text-[15px] font-medium text-white">
      대시보드로 가기
    </Link>
  );
}

function Compare({ documentId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawFrom = toVersionNo(searchParams.get('from'));
  const rawTo = toVersionNo(searchParams.get('to'));
  const valid = rawFrom !== null && rawTo !== null && rawFrom > 0 && rawTo > 0 && rawFrom !== rawTo;
  // 오래된 버전이 from
  const from = valid ? Math.min(rawFrom, rawTo) : null;
  const to = valid ? Math.max(rawFrom, rawTo) : null;

  const [doc, setDoc] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { message, notFound, status, traceId }
  const [modalOpen, setModalOpen] = useState(!valid);
  const [modalError, setModalError] = useState('');
  const [active, setActive] = useState(0);
  const [scrollKey, setScrollKey] = useState(0);

  // from/to 가 뒤바뀐 주소는 바로잡는다
  useEffect(() => {
    if (valid && rawFrom > rawTo) {
      navigate(`/documents/${documentId}/compare?from=${from}&to=${to}`, { replace: true });
    }
  }, [valid, rawFrom, rawTo, from, to, documentId, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActive(0);
    setScrollKey(0);
    try {
      const d = await documentService.get(documentId);
      setDoc(d);
      if (valid) {
        const r = await versionService.compare(documentId, from, to);
        setResult(r);
      } else {
        setModalOpen(true);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        // 쿼리 오류: 버전 선택 모달을 다시 연다
        setModalError(getErrorMessage(e));
        setModalOpen(true);
      } else {
        setError({
          message: getErrorMessage(e),
          notFound: isNotFound(e),
          traceId: e instanceof ApiError ? e.traceId : '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [documentId, valid, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const diffJson = useMemo(() => (Array.isArray(result?.diffJson) ? result.diffJson : []), [result]);
  const blockCount = diffJson.length;
  const changeCount = result?.changeCount ?? blockCount;
  const same = result && (changeCount === 0 || result.fromText === result.toText);

  const go = (delta) => {
    setActive((a) => Math.min(Math.max(a + delta, 0), Math.max(blockCount - 1, 0)));
    setScrollKey((k) => k + 1);
  };

  const modal = (
    <VersionSelectModal
      open={modalOpen}
      versions={doc?.versions || []}
      initialFrom={from ?? undefined}
      initialTo={to ?? undefined}
      error={modalError}
      onClose={() => {
        setModalOpen(false);
        // 쿼리가 잘못된 채로 닫으면 문서 상세로 돌아간다
        if (!valid || modalError) navigate(`/documents/${documentId}`, { replace: true });
      }}
      onConfirm={(f, t) => {
        setModalOpen(false);
        setModalError('');
        navigate(`/documents/${documentId}/compare?from=${f}&to=${t}`, { replace: true });
      }}
    />
  );

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 pt-20">
        <ErrorMessage message={error.notFound ? MESSAGES.NOT_FOUND : error.message} traceId={error.traceId} onRetry={error.notFound ? undefined : load} />
        <BackToDashboard />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 md:px-8 md:py-7">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="min-w-0 break-words text-[22px] font-bold text-ink md:text-[26px]">{doc?.name ?? ''}</h1>
        {result ? (
          <>
            <Chip size="md">
              v{result.fromVersionNo ?? from} → v{result.toVersionNo ?? to}
            </Chip>
            <Chip size="md" tone="soft">
              변경 {changeCount}건
            </Chip>
          </>
        ) : null}
        <div className="hidden flex-1 md:block" />
        {result && !same && blockCount > 0 ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => go(-1)} disabled={active <= 0}>
              이전 변경
            </Button>
            <span className="text-[13px] font-medium text-muted" aria-live="polite">
              {active + 1} / {blockCount}
            </span>
            <Button size="sm" variant="outline" onClick={() => go(1)} disabled={active >= blockCount - 1}>
              다음 변경
            </Button>
          </div>
        ) : null}
        <Button variant="outline" onClick={() => { setModalError(''); setModalOpen(true); }}>
          다른 버전 선택
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : same ? (
        <p className="rounded-3xl bg-white py-16 text-center text-[15px] text-muted">두 버전의 내용이 같습니다</p>
      ) : result ? (
        <DiffViewer
          fromLabel={`이전 버전 · v${result.fromVersionNo ?? from}`}
          toLabel={`이후 버전 · v${result.toVersionNo ?? to}`}
          fromText={result.fromText}
          toText={result.toText}
          diffJson={diffJson}
          activeBlock={blockCount > 0 ? active : -1}
          scrollKey={scrollKey}
        />
      ) : null}

      {modal}
    </div>
  );
}

Compare.propTypes = { documentId: PropTypes.number.isRequired };

export default function CompareResultPage() {
  const { documentId } = useParams();
  const id = Number(documentId);
  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 pt-20">
        <ErrorMessage message={MESSAGES.NOT_FOUND} />
        <BackToDashboard />
      </div>
    );
  }
  return <Compare key={id} documentId={id} />;
}
