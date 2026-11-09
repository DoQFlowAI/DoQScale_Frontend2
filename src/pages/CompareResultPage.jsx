// 소유: JJW (비교 탭 diff 뷰어)
// TODO(JJW): 문서 비교 결과 (명세 4.4 문서 비교 결과)
//   /documents/:documentId/compare?from=&to= → GET /documents/{id}/compare
//   DiffViewer 로 diffJson 위치대로 색칠, [이전 변경]·[다음 변경], 쿼리 오류면 VersionSelectModal
export default function CompareResultPage() {
  return <p className="p-8 text-body text-muted">문서 비교 결과 (JJW)</p>;
}
