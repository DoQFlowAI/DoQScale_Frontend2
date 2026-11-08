// 소유: KJH (회원가입)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import { authService } from '../services/authService';
import { ApiError, getErrorMessage } from '../utils/errors';
import { LEADER_RANK } from '../utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RANKS = [
  { value: 1, label: '사원' },
  { value: LEADER_RANK, label: '팀장' },
];

function validate({ name, email, password, rankLevel, signupKey }) {
  const errors = {};
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (trimmedName.length < 1 || name.length > 50) {
    errors.name = '이름은 1~50자로 입력해 주세요';
  }
  if (!EMAIL_RE.test(trimmedEmail) || trimmedEmail.length > 255) {
    errors.email = '이메일 형식이 올바르지 않습니다';
  }
  const kinds = [/[A-Za-z]/, /\d/, /[^A-Za-z\d]/].filter((re) => re.test(password)).length;
  if (password.length < 8 || password.length > 64 || kinds < 2) {
    errors.password = '비밀번호는 8~64자, 영문·숫자·특수문자 중 2종 이상이어야 합니다';
  }
  if (![1, LEADER_RANK].includes(rankLevel)) {
    errors.rankLevel = '직급을 선택해 주세요';
  }
  if (rankLevel === LEADER_RANK && !signupKey) {
    errors.signupKey = '직급 인증키를 입력해 주세요';
  }
  return errors;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    rankLevel: null,
    signupKey: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  const setField = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (formError) setFormError('');
  };

  const setRank = (rankLevel) => {
    setForm((prev) => ({
      ...prev,
      rankLevel,
      signupKey: rankLevel === LEADER_RANK ? prev.signupKey : '',
    }));
    setErrors((prev) => ({ ...prev, rankLevel: undefined, signupKey: undefined }));
    if (formError) setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;

    const found = validate(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    const payload = {
      email: form.email.trim(),
      password: form.password,
      name: form.name.trim(),
      rankLevel: form.rankLevel,
    };
    // 사원(1)이면 인증키를 전송하지 않음
    if (form.rankLevel === LEADER_RANK) {
      payload.signupKey = form.signupKey;
    }

    setPending(true);
    try {
      // 서버(현재는 Mock 서버, 연동 시 실제 Backend)에 가입 및 직급키 검증 요청
      await authService.signup(payload);
      navigate('/login', { replace: true, state: { signedUp: true } });
    } catch (err) {
      const message = getErrorMessage(err);
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: message });
      } else if (err instanceof ApiError && err.status === 400 && form.rankLevel === LEADER_RANK) {
        setErrors({ signupKey: '직급키가 올바르지 않습니다.' });
      } else {
        setFormError(message);
      }
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-4 py-10">
      <form
        onSubmit={submit}
        noValidate
        className="flex w-full max-w-[460px] flex-col gap-4 rounded-panel bg-white p-7 shadow-modal sm:p-9"
      >
        <h1 className="text-display font-bold text-brand">DoQFlow AI</h1>
        <h2 className="text-title font-bold text-ink">회원가입</h2>
        <TextField
          label="이름"
          value={form.name}
          onChange={setField('name')}
          error={errors.name}
          maxLength={50}
          autoComplete="name"
          disabled={pending}
        />
        <TextField
          label="이메일"
          type="email"
          value={form.email}
          onChange={setField('email')}
          error={errors.email}
          maxLength={255}
          autoComplete="email"
          placeholder="name@example.com"
          disabled={pending}
        />
        <TextField
          label="비밀번호"
          type="password"
          value={form.password}
          onChange={setField('password')}
          error={errors.password}
          hint="8~64자, 영문·숫자·특수문자 중 2종 이상"
          maxLength={64}
          autoComplete="new-password"
          disabled={pending}
        />
        <fieldset className="flex flex-col gap-1.5 border-0 p-0" disabled={pending}>
          <legend className="mb-1.5 text-label font-medium text-ink-2">직급</legend>
          <div className="flex gap-2.5">
            {RANKS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-body ${
                  form.rankLevel === value ? 'border-soft-line bg-soft font-medium text-brand' : 'border-line text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="rankLevel"
                  checked={form.rankLevel === value}
                  onChange={() => setRank(value)}
                  className="h-4 w-4 accent-brand"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.rankLevel ? (
            <p role="alert" className="text-caption text-danger">
              {errors.rankLevel}
            </p>
          ) : null}
        </fieldset>
        {form.rankLevel === LEADER_RANK ? (
          <TextField
            label="직급 인증키"
            type="password"
            value={form.signupKey}
            onChange={setField('signupKey')}
            error={errors.signupKey}
            autoComplete="off"
            disabled={pending}
          />
        ) : null}
        {formError ? (
          <p role="alert" className="rounded-btn-sm bg-danger-bg px-3 py-2.5 text-label text-danger">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? '가입 중…' : '가입하기'}
        </Button>
        <p className="text-center text-label text-muted">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-bold text-brand hover:underline">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
