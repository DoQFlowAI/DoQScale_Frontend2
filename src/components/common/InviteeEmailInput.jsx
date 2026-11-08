// 소유: KJH (생성·초대 모달)
import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';

export const MAX_INVITEES = 50;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 이메일 전체를 입력하고 [확인]을 눌러야 userService.lookup(email)을 호출합니다 (부분 검색 없음).
 * invitees: [{ uuid, name, email }]
 */
export default function InviteeEmailInput({
  invitees,
  onChange,
  excludeEmails = [],
  disabled = false,
  label = '초대할 열람자 (선택, 최대 50명)',
}) {
  const inputId = useId();
  const myEmail = useAuthStore((s) => s.user?.email);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    const email = value.trim();
    if (!email || checking || disabled) return;
    setError('');

    if (email.length > 255 || !EMAIL_RE.test(email)) {
      setError('이메일 형식이 올바르지 않습니다');
      return;
    }
    const lower = email.toLowerCase();
    if (myEmail && myEmail.toLowerCase() === lower) {
      setError('본인은 초대할 수 없습니다');
      return;
    }
    if (invitees.some((i) => i.email.toLowerCase() === lower)) {
      setError('이미 추가한 이메일입니다');
      return;
    }
    if (excludeEmails.some((e) => e.toLowerCase() === lower)) {
      setError('이미 초대한 사용자입니다');
      return;
    }
    if (invitees.length >= MAX_INVITEES) {
      setError(`열람자는 최대 ${MAX_INVITEES}명까지 초대할 수 있습니다`);
      return;
    }

    setChecking(true);
    try {
      const user = await userService.lookup(email);
      onChange([...invitees, { uuid: user.uuid, name: user.name, email: user.email }]);
      setValue('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      verify();
    }
  };

  const remove = (email) => onChange(invitees.filter((i) => i.email !== email));

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label font-medium text-ink-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={onKeyDown}
          disabled={disabled || checking}
          placeholder="이메일 전체를 입력하세요"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          className={`min-h-11 min-w-0 flex-1 rounded-xl border bg-white px-3.5 py-3 text-body text-ink placeholder:text-placeholder disabled:bg-th ${
            error ? 'border-danger' : 'border-line'
          }`}
        />
        <Button variant="outline" onClick={verify} disabled={disabled || checking || !value.trim()}>
          {checking ? '확인 중…' : '확인'}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      ) : null}
      {invitees.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {invitees.map((i) => (
            <li key={i.email} className="flex items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5">
              <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-chip" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body font-medium text-ink">{i.name}</span>
                <span className="truncate text-caption text-muted">{i.email}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                aria-label={`${i.name} 제거`}
                onClick={() => remove(i.email)}
                disabled={disabled}
              >
                제거
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

InviteeEmailInput.propTypes = {
  invitees: PropTypes.arrayOf(
    PropTypes.shape({
      uuid: PropTypes.string,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  excludeEmails: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  label: PropTypes.string,
};
