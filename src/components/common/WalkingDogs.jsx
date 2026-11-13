import walkingDogs from '../../assets/walking-dogs.gif';

// 로그인·회원가입 폼 아래에 보이는 강아지 산책 일러스트입니다 (PC 화면(lg, 1024px 이상)에서만 보입니다)
export default function WalkingDogs() {
  return (
    <img
      src={walkingDogs}
      alt=""
      aria-hidden="true"
      draggable={false}
      // 이미지에 흰 격자 배경이 포함되어 있어, 밝게 올린 뒤 multiply 로 페이지 배경과 섞어 배경을 없앱니다
      style={{ mixBlendMode: 'multiply', filter: 'brightness(1.08) contrast(1.05)' }}
      className="pointer-events-none mt-6 hidden w-full max-w-[420px] select-none lg:block"
    />
  );
}
