// 소유: 공통 베이스
import PageError from '../components/common/PageError';

export default function NotFoundPage() {
  return <PageError code="404" message="페이지를 찾을 수 없습니다" />;
}
