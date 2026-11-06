import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import { getErrorMessage } from '../../utils/errors';

export const NAME_MAX = 200;
export const DESC_MAX = 500;

/** 문서 이름·설명 표시와 수정 (수정은 등록자만). 바뀐 필드만 보낸다 */
export default function DocumentInfoPanel({ document, onSave, onOpenViewers, onDelete }) {
  const { name, description, status, uploadedByName, currentVersionNo, owned } = document;
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftDesc, setDraftDesc] = useState(description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setDraftName(name);
    setDraftDesc(description || '');
    setError('');
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    const n = draftName.trim();
    if (n.length < 1 || n.length > NAME_MAX) {
      setError(`이름은 1~${NAME_MAX}자로 입력해 주세요`);
      return;
    }
    if (draftDesc.length > DESC_MAX) {
      setError(`설명은 ${DESC_MAX}자까지 입력할 수 있습니다`);
      return;
    }
    const patch = {};
    if (n !== name) patch.name = n;
    if (draftDesc !== (description || '')) patch.description = draftDesc;
    if (Object.keys(patch).length === 0) {
      setEditing(false); // 바뀐 것이 없으면 보내지 않는다
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(patch);
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-2 rounded-3xl bg-white px-5 py-5 md:px-7 md:py-[22px]">
      {editing ? (
        <form onSubmit={save} className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              aria-label="문서 이름"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={NAME_MAX}
              disabled={saving}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-soft-line px-3.5 py-2 text-[22px] font-bold text-ink md:text-[24px]"
            />
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              취소
            </Button>
          </div>
          <textarea
            aria-label="문서 설명"
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            maxLength={DESC_MAX}
            rows={2}
            disabled={saving}
            placeholder="설명 (0~500자)"
            className="w-full resize-y rounded-xl border border-line px-3.5 py-2.5 text-[15px] text-ink-2"
          />
          {error ? (
            <p role="alert" className="text-[12px] text-danger">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="min-w-0 break-words text-[24px] font-bold text-ink md:text-[28px]">{name}</h1>
            <StatusBadge status={status} />
            {owned ? (
              <Button size="sm" variant="outline" onClick={startEdit}>
                정보 수정
              </Button>
            ) : null}
            <div className="hidden flex-1 md:block" />
            <div className="flex w-full gap-2 md:w-auto">
              <Button variant="outline" onClick={onOpenViewers}>
                {owned ? '열람자 관리' : '열람자 보기'}
              </Button>
              {owned ? (
                <Button variant="danger" onClick={onDelete}>
                  문서 삭제
                </Button>
              ) : null}
            </div>
          </div>
          {description ? <p className="break-words text-[15px] text-ink-2">{description}</p> : null}
          <p className="text-[13px] text-muted">
            등록자 {uploadedByName}
            {currentVersionNo > 0 ? ` · 현재 v${currentVersionNo}` : ''}
          </p>
        </>
      )}
    </section>
  );
}

DocumentInfoPanel.propTypes = {
  document: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    uploadedByName: PropTypes.string,
    currentVersionNo: PropTypes.number,
    owned: PropTypes.bool,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onOpenViewers: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};
