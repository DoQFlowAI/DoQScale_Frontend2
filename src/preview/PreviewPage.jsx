// 소유: 공통 베이스
/**
 * 개발 전용 미리보기 (/preview). 배포 빌드에는 들어가지 않습니다.
 * 각자 자기 PC에 src/preview/LocalPreview.jsx 를 만들면 여기에 그려집니다.
 * LocalPreview.jsx 는 .gitignore 에 있어 git 에 올라가지 않습니다 (사람마다 내용이 다르고, 공유할 필요가 없음).
 */
// 파일이 없어도 오류가 나지 않도록 glob 으로 찾습니다 (없으면 빈 객체)
const found = import.meta.glob('./LocalPreview.jsx', { eager: true });
const LocalPreview = found['./LocalPreview.jsx']?.default;

export default function PreviewPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:py-7">
      {LocalPreview ? (
        <LocalPreview />
      ) : (
        <p className="text-body text-muted">
          src/preview/LocalPreview.jsx 를 만들고 확인할 컴포넌트를 넣으면 여기에 보입니다 (git 에 올라가지 않음).
        </p>
      )}
    </div>
  );
}
