import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import { authService } from '../services/authService';
import { ApiError, getErrorMessage } from '../utils/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** API 설계서 2.6 공통 검증 규칙: 이메일 ≤255자, 비밀번호 8~64자 + 영문·숫자·특수문자 중 2종 이상, 이름 1~50자 */
function validate({ name, email, password, rankLevel, signupKey }) {
  const errors = {};
  const n = name.trim();
  if (n.length < 1 || n.length > 50) errors.name = '이름은 1~50자로 입력해 주세요';
  if (!EMAIL_RE.test(email.trim()) || email.trim().length > 255) errors.email = '이메일 형식이 올바르지 않습니다';
  const kinds = [/[A-Za-z]/, /\d/, /[^A-Za-z\d]/].filter((re) => re.test(password)).length;
  if (password.length < 8 || password.length > 64 || kinds < 2) {
    errors.password = '8~64자, 영문·숫자·특수문자 중 2종 이상';
  }
  if (![1, 2].includes(rankLevel)) errors.rankLevel = '직급을 선택해 주세요';
  if (rankLevel === 2 && !signupKey) errors.signupKey = '직급 인증키를 입력해 주세요';
  return errors;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', rankLevel: null, signupKey: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const setRank = (rankLevel) => {
    setForm((f) => ({ ...f, rankLevel, signupKey: rankLevel === 2 ? f.signupKey : '' }));
    setErrors((er) => ({ ...er, rankLevel: undefined, signupKey: undefined }));
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
    // 사원이면 입력란을 숨기고 키를 보내지 않는다
    if (form.rankLevel === 2) payload.signupKey = form.signupKey;

    setPending(true);
    try {
      await authService.signup(payload);
      navigate('/login', { replace: true, state: { signedUp: true } });
    } catch (err) {
      const message = getErrorMessage(err);
      if (err instanceof ApiError && err.status === 409) setErrors({ email: message });
      else setFormError(message); // 400 은 서버 문구 그대로 (키 오류도 따로 구분하지 않는다)
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-4 py-10">
      <form
        onSubmit={submit}
        noValidate
        className="flex w-full max-w-[460px] flex-col gap-[18px] rounded-[28px] bg-white p-7 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-9"
      >
        <h1 className="text-[28px] font-bold text-brand">DoQFlow AI</h1>
        <h2 className="text-[20px] font-bold text-ink">회원가입</h2>
        <TextField label="이름" value={form.name} onChange={set('name')} error={errors.name} maxLength={50} autoComplete="name" disabled={pending} />
        <TextField
          label="이메일"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          maxLength={255}
          autoComplete="email"
          disabled={pending}
        />
        <TextField
          label="비밀번호"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="8~64자, 영문·숫자·특수문자 중 2종 이상"
          maxLength={64}
          autoComplete="new-password"
          disabled={pending}
        />
        <fieldset className="flex flex-col gap-1.5" disabled={pending}>
          <legend className="mb-1.5 text-[13px] font-medium text-ink-2">직급</legend>
          <div className="flex gap-3">
            {[
              [1, '사원'],
              [2, '팀장'],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[15px] ${
                  form.rankLevel === value ? 'border-soft-line bg-soft' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  name="rankLevel"
                  checked={form.rankLevel === value}
                  onChange={() => setRank(value)}
                  className="h-4 w-4 accent-[#1b5444]"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.rankLevel ? (
            <p role="alert" className="text-[12px] text-danger">
              {errors.rankLevel}
            </p>
          ) : null}
        </fieldset>
        {form.rankLevel === 2 ? (
          <TextField
            label="직급 인증키"
            type="password"
            value={form.signupKey}
            onChange={set('signupKey')}
            error={errors.signupKey}
            autoComplete="off"
            disabled={pending}
          />
        ) : null}
        {formError ? (
          <p role="alert" className="rounded-[10px] bg-danger-bg px-3 py-2.5 text-[13px] text-danger">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? '가입 중…' : '가입하기'}
        </Button>
        <p className="text-center text-[13px] text-muted">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-bold text-brand">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
