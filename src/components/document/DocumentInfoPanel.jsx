// 소유: JJW (문서 상세 - 문서 정보)
import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import Card from '../common/Card';
import Chip from '../common/Chip';
import StatusBadge from '../common/StatusBadge';
import TextField from '../common/TextField';
import { getErrorMessage } from '../../utils/errors';

const NAME_MAX = 200;
const DESCRIPTION_MAX = 500;

/**
 * 문서 이름·설명 표시와 수정 (명세 4.4 "문서 정보 수정").
 * 수정·삭제 버튼은 등록자(owned)에게만 보입니다. 수정은 그 자리에서 하고,
 * 바뀐 필드만 onSave(patch)로 보냅니다. 바뀐 것이 없으면 요청 없이 닫습니다.
 * 실제 API 호출과 다시 조회는 페이지가 하고, 여기서는 결과(성공·실패)만 받습니다.
 *
 * @param doc GET /documents/{id} 응답 ({ name, description, status, currentVersionNo, uploadedByName, owned })
 * @param onSave (patch) => Promise. 실패하면 throw 해서 이 패널이 오류 문구를 보여 줍니다
 * @param onDelete 삭제 확인창을 여는 일은 페이지가 합니다
 * @param actions 제목 줄 오른쪽에 둘 버튼들 (페이지가 넣음)
 */
export default function DocumentInfoPanel({ doc, onSave, onDelete, actions }) {
  const descriptionId = useId();
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

  const actionRow = (
    <div className="flex flex-wrap items-center gap-2">
      {actions}
      {doc.owned ? (
        <>
          <Button variant="outline" size="sm" onClick={startEdit}>
            정보 수정
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            문서 삭제
          </Button>
        </>
      ) : null}
    </div>
  );

  if (editing) {
    return (
      <Card title="문서 정보 수정">
        <form onSubmit={save} noValidate className="flex flex-col gap-3">
          <TextField
            label="이름"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError('');
            }}
            error={nameError}
            maxLength={NAME_MAX}
            disabled={saving}
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={descriptionId} className="text-label font-medium text-ink-2">
              설명
            </label>
            <textarea
              id={descriptionId}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionError('');
              }}
              maxLength={DESCRIPTION_MAX}
              rows={3}
              disabled={saving}
              aria-invalid={descriptionError ? 'true' : 'false'}
              className={`w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-body text-ink placeholder:text-placeholder disabled:bg-th ${
                descriptionError ? 'border-danger' : 'border-line'
              }`}
            />
            <p className="text-right text-caption text-muted">
              {description.length} / {DESCRIPTION_MAX}
            </p>
            {descriptionError ? (
              <p role="alert" className="text-caption text-danger">
                {descriptionError}
              </p>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2.5 text-label text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          {/* 문서 이름·설명은 사용자가 쓴 글이므로 텍스트로만 그립니다 (명세 9.1) */}
          <h1 className="break-words text-heading font-bold text-ink">{doc.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={doc.status} />
            {doc.currentVersionNo > 0 ? <Chip tone="soft">현재 v{doc.currentVersionNo}</Chip> : null}
            {doc.uploadedByName ? <span className="text-caption text-muted">등록자 {doc.uploadedByName}</span> : null}
          </div>
        </div>
        {actionRow}
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
    uploadedByName: PropTypes.string,
    owned: PropTypes.bool,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  actions: PropTypes.node,
};
