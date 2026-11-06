import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import Button from '../common/Button';
import TextField from '../common/TextField';
import VersionUploadPanel from '../common/VersionUploadPanel';
import InviteeEmailInput from '../common/InviteeEmailInput';
import { documentService } from '../../services/documentService';
import { versionService } from '../../services/versionService';
import { getErrorMessage } from '../../utils/errors';
import { NAME_MAX, DESC_MAX } from './DocumentInfoPanel';

function Body({ onClose, onCreated }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [invitees, setInvitees] = useState([]);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    if (pending) return;
    const n = name.trim();
    const found = {};
    if (n.length < 1 || n.length > NAME_MAX) found.name = `이름은 1~${NAME_MAX}자로 입력해 주세요`;
    if (description.length > DESC_MAX) found.description = `설명은 ${DESC_MAX}자까지 입력할 수 있습니다`;
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setPending(true);
    let created;
    try {
      // ① 문서 생성 + 열람자 초대. 실패하면 문서가 만들어지지 않으므로 모달을 유지한다
      created = await documentService.create({
        name: n,
        description,
        inviteeEmails: invitees.map((i) => i.email),
      });
    } catch (err) {
      setFormError(getErrorMessage(err));
      setPending(false);
      return;
    }

    const flash = {};
    if (created.notFound?.length) flash.notice = `${created.notFound.join(', ')} 사용자를 찾을 수 없습니다`;

    // ② 첫 버전 업로드 — 파일을 고른 경우에만. 실패해도 문서는 이미 만들어졌으므로 상세로 이동한다
    if (files.length > 0) {
      try {
        await versionService.upload(created.documentId, files);
      } catch {
        flash.error = '파일 업로드에 실패했습니다. 다시 올려 주세요';
      }
    }

    onCreated?.(created);
    navigate(`/documents/${created.documentId}`, { state: { flash } });
  };

  return (
    <Modal
      open
      title="문서 만들기"
      subtitle="파일과 열람자는 나중에 문서 상세에서 추가할 수도 있어요"
      onClose={onClose}
      closeDisabled={pending}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            취소
          </Button>
          <Button type="submit" form="doc-create-form" disabled={pending}>
            {pending ? '만드는 중…' : '만들기'}
          </Button>
        </>
      }
    >
      <form id="doc-create-form" onSubmit={submit} noValidate className="flex flex-col gap-4 pb-2">
        <TextField
          label="이름 (1~200자)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
          }}
          error={errors.name}
          maxLength={NAME_MAX}
          disabled={pending}
          autoFocus
        />
        <TextField
          label="설명 (0~500자)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          maxLength={DESC_MAX}
          disabled={pending}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-2">업로드할 파일 (선택)</span>
          <VersionUploadPanel files={files} onChange={setFiles} startVersionNo={1} disabled={pending} title="파일 올리기" />
        </div>
        <InviteeEmailInput invitees={invitees} onChange={setInvitees} disabled={pending} />
        {formError ? (
          <p role="alert" className="rounded-[10px] bg-danger-bg px-3 py-2.5 text-[13px] text-danger">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

Body.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func,
};

export default function DocumentCreateModal({ open, onClose, onCreated }) {
  if (!open) return null;
  return <Body onClose={onClose} onCreated={onCreated} />;
}

DocumentCreateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func,
};
