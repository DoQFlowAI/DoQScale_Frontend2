# 역할 분배

`DoQFlowAI_01_프로젝트계획서_v1.3.md` 2장 팀 구성의 담당 업무를 기준으로 나눕니다. 01에 적히지 않은 항목은 분량을 맞춰 배정했습니다(표의 "01에 없음").
단계별 구현 방법은 `docs/` 폴더의 사람별 가이드를 봅니다.

| 이름 (브랜치) | 01 계획서 담당 | 01에 없음 (배정) | 추정 분량 | 가이드 |
| :---- | :---- | :---- | :---- | :---- |
| 김정현 (`KJH`) | 로그인·회원가입, 문서 목록, 생성·초대 모달, 초대 알림창 | 토큰 갱신 | 약 1,090줄 | `docs/KJH_로그인_문서목록_초대_가이드.md` |
| 장지웅 (`JJW`) | 문서 상세, 이력 탭 타임라인, 비교 탭 diff 뷰어 | 버전 선택 모달, 폴링 | 약 1,250줄 | `docs/JJW_문서상세_이력_비교_가이드.md` |
| 원종현 (`WJH`) | 채팅 UI | 대시보드, 공통 레이아웃 틀, 업로드 패널, 베이스 관리 | 약 1,030줄 + 베이스 관리 | `docs/WJH_채팅_레이아웃_업로드_가이드.md` |

- 추정 분량은 같은 기능을 전부 구현했던 기존 코드의 줄 수입니다. 배포(Dockerfile·Compose·Actions·EC2)는 원종현이 자발적으로 맡은 일이라 분량에 넣지 않았습니다.
- 01에 "담당 업무는 초안이며 조정한다"고 되어 있으므로, 바꾸면 이 표와 01을 함께 고칩니다.

## 원칙

1. 한 파일은 한 사람만 고칩니다. 모든 소스 파일 첫 줄에 `// 소유: ...`가 있습니다.
2. 남은 할 일은 `TODO(KJH)`, `TODO(JJW)`, `TODO(WJH)`로 표시했고, TODO는 항상 그 파일 소유자의 이름입니다.
3. 다른 사람 컴포넌트를 화면에 끼우는 일은 그 화면(파일) 주인이 합니다. 만드는 사람은 약속한 props대로 만들기만 합니다.
4. 약속한 props·함수 이름은 `docs/00_전체_구현_가이드.md` 5장에 있습니다. 바꾸려면 쓰는 쪽과 먼저 이야기합니다.
5. 베이스 파일(`소유: 공통 베이스`)은 원종현이 관리합니다. 다른 사람이 바꿔야 하면 팀 채팅에 요청합니다.

## 김정현 (KJH) — 로그인·회원가입, 문서 목록, 생성·초대 모달, 초대 알림창

| 구분 | 파일 | 지금 상태 |
| :---- | :---- | :---- |
| 페이지 | `pages/LoginPage.jsx` | 최소 로그인 동작 |
| | `pages/SignupPage.jsx` | 빈 화면 |
| 토큰 갱신 | `services/tokenRefresh.js` | 바로 로그아웃하는 임시 코드 |
| 문서 목록 | `utils/useDocumentList.js` | 첫 페이지만 받는 최소 코드 |
| | `components/document/DocumentTabList.jsx` | 새로 |
| 생성·초대 모달 | `components/document/DocumentCreateModal.jsx` | 새로 |
| | `components/document/PermissionPanel.jsx` (열람자 초대·회수) | 새로 |
| | `components/common/InviteeEmailInput.jsx` | 새로 |
| 초대 알림창 | `components/common/InvitationMenu.jsx` | 새로 |

## 장지웅 (JJW) — 문서 상세, 이력 탭 타임라인, 비교 탭 diff 뷰어

| 구분 | 파일 | 지금 상태 |
| :---- | :---- | :---- |
| 문서 상세 | `pages/DocumentDetailPage.jsx` | 빈 화면 |
| | `components/document/DocumentInfoPanel.jsx` (정보 표시·수정·삭제) | 새로 |
| | `components/document/VersionPeekPanel.jsx` (버전 정보·본문 사이드 패널, 필수 기능) | 새로 |
| | `components/document/VersionTable.jsx` | 새로 |
| | `utils/usePolling.js` | 새로 |
| 이력 탭 | `components/document/HistoryTimeline.jsx` | 새로 |
| 비교 탭 | `pages/CompareResultPage.jsx` | 빈 화면 |
| | `components/document/DiffViewer.jsx`, `utils/diffAlign.js` | 새로 |
| | `components/common/VersionSelectModal.jsx` | 새로 |

## 원종현 (WJH) — 채팅 UI (+ 대시보드, 레이아웃 틀, 업로드 패널, 베이스 관리)

| 구분 | 파일 | 지금 상태 |
| :---- | :---- | :---- |
| 채팅 | `pages/DashboardPage.jsx` | 빈 화면 |
| | `components/chat/ChatInterface.jsx`, `ChatMessage.jsx`, `ChatInput.jsx`, `ChatWidget.jsx` | 새로 |
| | `services/chatService.js`(stream), `store/chatStore.js`, `utils/useStreamingText.js` | 스트리밍은 새로 |
| 레이아웃 틀 | `components/common/Layout.jsx`, `Header.jsx`, `Sidebar.jsx` | 최소 동작 |
| 업로드 패널 | `components/common/VersionUploadPanel.jsx` | 새로 |
| 베이스 | `소유: 공통 베이스` 파일 전부, `mock/server.js` | 완료. 요청을 받아 고침 |

## 누가 누구 것을 끼우나

| 화면 (주인) | 끼우는 다른 사람의 것 |
| :---- | :---- |
| Layout·Sidebar·Header (WJH) | KJH: `useDocumentList`, `DocumentTabList`, `DocumentCreateModal`, `InvitationMenu` |
| DocumentCreateModal (KJH) | WJH: `VersionUploadPanel` |
| DocumentDetailPage (JJW) | KJH: `PermissionPanel` / WJH: `VersionUploadPanel`, `ChatWidget` |
| api.js (베이스), chatService (WJH) | KJH: `refreshAccessToken` |
| LoginPage (KJH), session.js (베이스) | WJH: `chatStore`의 `clear` (이미 연결됨) |

## 테스트 계정

README의 "테스트 계정" 절을 봅니다 (목 서버 전용, 비밀번호 `Passw0rd!`).

## 작업 방식

```sh
npm ci         # 처음 한 번, 그리고 package-lock.json 이 바뀌었을 때
npm run mock   # 목 서버 :8080
npm run dev    # 화면 :5173
npm run lint
npm run build
```

- 본인 이니셜 브랜치에서 작업하고 `develop`으로 PR을 올립니다.
- PR 전에 `npm run lint`와 `npm run build`가 통과하는지 확인합니다.
- 자기 소유가 아닌 파일이 diff에 있으면 PR 전에 빼거나 소유자와 이야기합니다.
- 토큰, 인증키, 비밀번호를 코드나 로그(`console.log`)에 남기지 않습니다.
