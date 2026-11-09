// 소유: JJW (변경 유형 라벨)
// 변천사 구간·버전 본문 패널이 같은 문구를 쓰도록 한 곳에 둡니다 (명세 4.4, 데이터베이스 설계서 4.3)
export const CHANGE_TYPE_LABELS = {
  PROCEDURE: '절차',
  NUMERIC: '수치',
  WORDING: '표현',
};

export const changeTypeLabel = (type) => CHANGE_TYPE_LABELS[type] ?? '';
