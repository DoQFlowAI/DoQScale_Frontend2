// 소유: 공통 베이스
import PageError from '../components/common/PageError';
import { MESSAGES } from '../utils/errors';

// 렌더링 오류 화면 (errorElement). 오류 내용은 사용자에게 보여 주지 않습니다 (명세 9.6)
export default function ErrorPage() {
  return <PageError message={MESSAGES.SERVER} />;
}
