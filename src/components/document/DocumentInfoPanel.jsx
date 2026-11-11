// 소유: JJW (문서 상세 - 문서 정보)
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import Card from '../common/Card';
import Chip from '../common/Chip';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import { getErrorMessage } from '../../utils/errors';

const NAME_MAX = 200;
const DESCRIPTION_MAX = 500;

/**
 * 문서 이름·설명 표시와 수정 (명세 4.4 "문서 정보 수정").
 * 수정·삭제 버튼은 등록자(owned)에게만 보입니다. 수정은 그 자리에서 하고,
 * 바뀐 필드만 onSave(patch)로 보냅니다. 바뀐 것이 없으면 요청 없이 닫습니다.
 * 실제 API 호출과 다시 조회는 페이지가 하고, 여기서는 결과(성공·실패)만 받습니다.
 *
 * @param doc GET /documents/{id} 응답 ({ name, description, status, currentVersionNo, uploadedBy{name, email, rankLevel}, owned })
 * @param onSave (patch) => Promise. 실패하면 throw 해서 이 패널이 오류 문구를 보여 줍니다
 * @param onDelete 삭제 확인창을 여는 일은 페이지가 합니다
 * @param actions 제목 줄 오른쪽에 둘 버튼들 (페이지가 넣음)
 */
export default function DocumentInfoPanel({ doc, onSave, onDelete, actions }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setName(doc.name);
    setDescription(doc.description ?? '');
    setNameError('');
    setDescriptionError('');
    setError('');
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    const nextName = name.trim();
    const nextDescription = description.trim();
    const nameMsg = nextName.length < 1 || nextName.length > NAME_MAX ? `이름은 1~${NAME_MAX}자로 입력해 주세요` : '';
    const descMsg = nextDescription.length > DESCRIPTION_MAX ? `설명은 ${DESCRIPTION_MAX}자 이하로 입력해 주세요` : '';
    setNameError(nameMsg);
    setDescriptionError(descMsg);
    if (nameMsg || descMsg) return;

    // 바뀐 필드만 보냅니다. 입력값은 앞뒤 공백을 잘랐으므로 원본도 같은 방식으로 잘라서 비교합니다
    // (서버 값 끝에 공백이 있을 때 아무것도 안 바꿨는데 요청이 나가는 일을 막음)
    const patch = {};
    if (nextName !== doc.name.trim()) patch.name = nextName;
    if (nextDescription !== (doc.description ?? '').trim()) patch.description = nextDescription;
    if (Object.keys(patch).length === 0) {
      setEditing(false); // 바뀐 것이 없으면 요청하지 않음
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

  if (editing) {
    // Figma: 제목·설명이 그 자리에서 입력칸으로 바뀌고, 저장·취소 버튼은 오른쪽 위에 놓입니다
    return (
      <Card>
        <form onSubmit={save} noValidate className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1 basis-60">
              <input
                aria-label="이름"
                aria-invalid={Boolean(nameError)}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError('');
                }}
                maxLength={NAME_MAX}
                placeholder={`이름 (1~${NAME_MAX}자)`}
                disabled={saving}
                autoFocus
                className={`w-full rounded-xl border bg-white px-3.5 py-2 text-display font-bold text-ink placeholder:text-placeholder disabled:bg-th ${
                  nameError ? 'border-danger' : 'border-brand'
                }`}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? '저장 중…' : '저장'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                취소
              </Button>
            </div>
          </div>
          {nameError ? (
            <p role="alert" className="text-caption text-danger">
              {nameError}
            </p>
          ) : null}
          <textarea
            aria-label="설명"
            aria-invalid={Boolean(descriptionError)}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDescriptionError('');
            }}
            maxLength={DESCRIPTION_MAX}
            rows={1}
            placeholder={`설명 (0~${DESCRIPTION_MAX}자)`}
            disabled={saving}
            className={`field-sizing-content max-h-40 min-h-11 w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-placeholder disabled:bg-th ${
              descriptionError ? 'border-danger' : 'border-brand'
            }`}
          />
          {descriptionError ? (
            <p role="alert" className="text-caption text-danger">
              {descriptionError}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2.5 text-label text-danger">
              {error}
            </p>
          ) : null}
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-60">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* 문서 이름·설명은 사용자가 쓴 글이므로 텍스트로만 그립니다 (명세 9.1) */}
            <h1 className="min-w-0 break-words text-display font-bold text-ink">{doc.name}</h1>
            <StatusBadge status={doc.status} />
            {doc.currentVersionNo > 0 ? <Chip tone="soft">현재 v{doc.currentVersionNo}</Chip> : null}
            {doc.uploadedBy?.name ? (
              <span className="text-caption text-muted">등록자 {doc.uploadedBy.name}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center">
          {actions}
          {doc.owned ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={startEdit}
                aria-label="정보 수정"
                title="정보 수정"
                className="group shrink-0 !px-1 !py-1 hover:!bg-transparent"
              >
                <Icon
                  name="edit"
                  className="h-5 w-5 text-muted transition-all duration-150 group-hover:scale-115 group-hover:text-ink-2"
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                aria-label="문서 삭제"
                title="문서 삭제"
                className="group shrink-0 !px-1 !py-1 hover:!bg-transparent"
              >
                <Icon
                  name="trash"
                  className="h-5 w-5 text-[#C27D70] transition-all duration-150 group-hover:scale-115 group-hover:text-[#A85D60]"
                />
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <p className={`whitespace-pre-wrap break-words text-body ${doc.description ? 'text-ink-2' : 'text-muted'}`}>
        {doc.description || '설명이 없습니다'}
      </p>
    </Card>
  );
}

DocumentInfoPanel.propTypes = {
  doc: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    currentVersionNo: PropTypes.number,
    uploadedBy: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string, rankLevel: PropTypes.number }),
    owned: PropTypes.bool,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  actions: PropTypes.node,
};
