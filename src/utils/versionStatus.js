// 소유: JJW (문서 상세 - 변천사의 버전 상태)

/**
 * 변천사 응답(API 설계서 5.13)의 versions 에는 status 가 없습니다. 어느 버전이 READY 인지는
 * 문서 단건(GET /documents/{id})의 versions[].status 에 있으므로 거기서 채워 넘깁니다.
 *
 *  - 변천사 응답이 status 를 이미 주면(목 서버 등) 그 값을 그대로 씁니다.
 *  - 변천사 응답에 versions 가 없으면 문서의 버전 목록을 그대로 씁니다.
 *  - 문서 쪽에도 없는 버전은 status 가 undefined 로 남고, HistoryTimeline 은 이를 "모름"으로 보고 비교를 막지 않습니다.
 * 원본 배열과 객체는 바꾸지 않고 새로 만들어 돌려줍니다.
 */
export function withStatus(historyVersions, docVersions) {
  const statusByNo = new Map((docVersions ?? []).map((v) => [v.versionNo, v.status]));
  return (historyVersions ?? docVersions ?? []).map((v) => ({ ...v, status: v.status ?? statusByNo.get(v.versionNo) }));
}
