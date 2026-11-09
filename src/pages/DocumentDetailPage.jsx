// 소유: JJW (문서 상세)
// TODO(JJW): 문서 상세 (명세 4.4 문서 상세)
//   자기 컴포넌트: DocumentInfoPanel, VersionTable, VersionPeekPanel(버전 본문 사이드 패널), HistoryTimeline, VersionSelectModal, usePolling
//   다른 담당 컴포넌트 배치(가이드 "담당 간 약속"): KJH 의 PermissionPanel, WJH 의 VersionUploadPanel·ChatWidget
//   사이드바 갱신: const { refreshDocuments } = useOutletContext();
export default function DocumentDetailPage() {
  return <p className="p-8 text-body text-muted">문서 상세 (JJW)</p>;
}
