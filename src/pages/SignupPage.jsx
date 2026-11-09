// 소유: KJH (회원가입)
// TODO(KJH): 회원가입 (명세 4.4 회원가입)
//   POST /auth/signup { email, password, name, rankLevel, signupKey } → 성공 시 /login (state: { signedUp: true })
//   직급 사원(1)/팀장(2) 필수, 팀장일 때만 인증키 입력(type="password")·전송
//   검증: 이메일 255자, 비밀번호 8~64자 영문·숫자·특수문자 중 2종 이상, 이름 1~50자. 409·400 은 서버 문구
export default function SignupPage() {
  return <p className="p-8 text-body text-muted">회원가입 (KJH)</p>;
}
