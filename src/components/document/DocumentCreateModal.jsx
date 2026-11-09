// 소유: KJH (생성·초대 모달)
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import InviteeEmailInput from '../common/InviteeEmailInput';
import Modal from '../common/Modal';
import TextField from '../common/TextField';
import VersionUploadPanel from '../common/VersionUploadPanel';
import { documentService } from '../../services/documentService';
import { versionService } from '../../services/versionService';
import { getErrorMessage } from '../../utils/errors';

const NAME_MAX = 200;
const DESC_MAX = 500;

function CreateModalBody({ onClose, onCreated }) {
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

    const trimmedName = name.trim();
    const found = {};
    if (trimmedName.length < 1 || name.length > NAME_MAX) {
      found.name = `이름은 1~${NAME_MAX}자로 입력해 주세요`;
    }
    if (description.length > DESC_MAX) {
      found.description = `설명은 ${DESC_MAX}자까지 입력할 수 있습니다`;
    }
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setPending(true);
    let created;
    try {
      // ① 문서 생성 + 열람자 초대. 실패하면 문서가 안 만들어졌으므로 모달을 유지합니다
      created = await documentService.create({
        name: trimmedName,
        description,
        inviteeEmails: invitees.map((i) => i.email),
      });
    } catch (err) {
      setFormError(getErrorMessage(err));
      setPending(false);
      return;
    }

    const flash = {};
    if (created?.notFound?.length) {
      flash.notice = `가입되지 않은 이메일: ${created.notFound.join(', ')}`;
    }

    // ② 첫 버전 파일이 있으면 업로드. 실패해도 문서는 이미 만들어졌으므로 에러 문구를 담아 완료 처리합니다
    if (files.length > 0) {
      try {
        await versionService.upload(created.documentId, files);
      } catch {
        flash.error = '파일 업로드에 실패했습니다. 다시 올려 주세요';
      }
    }

    onCreated(created.documentId, flash);
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
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          maxLength={NAME_MAX}
          disabled={pending}
          autoFocus
        />
        <TextField
          label="설명 (0~500자)"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          error={errors.description}
          maxLength={DESC_MAX}
          disabled={pending}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-ink-2">첫 버전 파일 (선택)</span>
          <VersionUploadPanel files={files} onChange={setFiles} startVersionNo={1} disabled={pending} />
        </div>
        <InviteeEmailInput invitees={invitees} onChange={setInvitees} disabled={pending} />
        {formError ? (
          <p role="alert" className="rounded-btn-sm bg-danger-bg px-3 py-2.5 text-label text-danger">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

CreateModalBody.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};

/**
 * 문서 만들기 모달 (명세 4.4 공통 레이아웃 "문서 만들기").
 * 약속 props: open(필수), onClose(필수), onCreated(documentId, flash)(필수)
 */
export default function DocumentCreateModal({ open, onClose, onCreated }) {
  if (!open) return null;
  return <CreateModalBody onClose={onClose} onCreated={onCreated} />;
}

DocumentCreateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};
