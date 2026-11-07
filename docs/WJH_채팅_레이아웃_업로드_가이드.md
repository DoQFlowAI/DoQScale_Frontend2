# WJH 가이드 – 채팅 UI, 대시보드, 공통 레이아웃 틀, 업로드 패널

01 계획서 담당: 채팅 UI (+ 01에 없는 대시보드, 공통 레이아웃 틀, 업로드 패널, 베이스 관리). 배포(Dockerfile·Compose·Actions·EC2)는 별도 문서에서 다룹니다.
전체 규칙과 담당 간 약속은 `00_전체_구현_가이드.md`를 먼저 봅니다. 아래 파일 외에는 고치지 않습니다.

## 1. 맡은 파일

| 파일 | 지금 상태 | 쓰는 곳 |
|------|-----------|---------|
| `pages/DashboardPage.jsx` | 빈 화면 | |
| `components/chat/ChatInterface.jsx`, `ChatMessage.jsx`, `ChatInput.jsx` | 새로 | 대시보드, ChatWidget |
| `components/chat/ChatWidget.jsx` | 새로 | JJW 문서 상세 |
| `services/chatService.js`(stream), `store/chatStore.js`, `utils/useStreamingText.js` | 스트리밍은 새로 | |
| `components/common/Layout.jsx`, `Header.jsx`, `Sidebar.jsx` | 최소 동작 | 모든 화면 |
| `components/common/VersionUploadPanel.jsx` | 새로 | KJH 문서 만들기, JJW 문서 상세 |
| `소유: 공통 베이스` 파일, `mock/server.js` | 완료 | 다른 사람 요청을 받아 고침 |

## 2. 구현 순서

### 1단계. `VersionUploadPanel` (다른 두 사람이 기다리는 부품이라 먼저)

명세 4.4 "업로드 규칙", 5.1. props(약속): `files`(필수), `onChange(files)`(필수), `startVersionNo`(필수), `disabled`

- 클릭과 드래그앤드롭으로 여러 파일 선택. 전송은 하지 않고 고른 목록만 부모에게 올림
- 목록에 순서 번호와 붙을 버전 번호(`startVersionNo + 순서`), [위]·[아래]·[빼기]. 바꾸면 번호를 바로 다시 매김

```
1. 배포가이드_수정.docx   → v4   [위] [아래] [빼기]
2. 배포가이드_최종.pdf    → v5   [위] [아래] [빼기]
```

- 사전 검증: 한 번에 1~10개, PDF·DOCX, 파일당 20MB 이하, 빈 파일(0바이트) 제외. 걸린 파일은 이유를 알리고 목록에 넣지 않음
- 파일 이름은 텍스트로만. 버튼 영역은 44px 이상
- 완성되면 KJH·JJW에게 알립니다.

### 2단계. 레이아웃 틀 (`Layout`, `Header`, `Sidebar`)

명세 4.4 공통 레이아웃, 8.1.

- Sidebar: 데스크톱(768px 이상) 왼쪽 고정, 모바일은 Header의 메뉴 버튼으로 여는 서랍(바깥 클릭·화면 이동 시 닫힘)
- Header: 모바일 메뉴 버튼, 로그아웃 중 버튼 잠금
- KJH 부품이 오면 연결 (props는 전체 가이드 5장)
  - Layout: `const list = useDocumentList();`는 이미 있음
  - Sidebar: 단순 목록을 `DocumentTabList`로 교체, 팀장에게만 [문서 만들기] → `DocumentCreateModal`. `onCreated(documentId, flash)`: 모달 닫기 → `list.refresh()` → `navigate('/documents/' + id, { state: { flash } })`
  - Header: `<InvitationMenu onAccepted={refreshDocuments} />` (Layout에서 `onInvitationAccepted`로 넘김)

### 3단계. `chatStore` 확인

명세 6장의 상태·액션이 있습니다. 필요하면 추가(예: `setLoading`, `setSources`). `clear`는 KJH 로그인과 베이스 `session.js`가 쓰므로 이름·동작 유지.

메시지 형태: `{ id, role: 'user' | 'assistant', content, sources?, masked?, streaming?, error? }`

### 4단계. `chatService.stream` (핵심)

명세 7.2. `stream({ sessionId, question, signal, onToken, onSources })` — 끝까지 읽으면 resolve

- `fetch(`${API_URL}/ai/chat`, { method: 'POST', headers: { Authorization, 'Content-Type', Accept: 'text/event-stream' }, body, signal })` — `EventSource`는 POST·헤더를 못 써서 쓰지 않음
- 401이면 KJH의 `refreshAccessToken()`(`services/tokenRefresh.js`) 후 한 번 재시도
- `res.ok`가 아니면 본문 JSON으로 `toApiError(status, body)` throw (429·502·400·404)
- `res.body.getReader()` + `TextDecoder`, 받은 문자열을 버퍼에 붙여 `\n`으로 자름. 마지막 조각은 덜 온 줄이라 버퍼에 남김
- `data: {"token"}` → `onToken`, `data: {"sources"}` → `onSources`, `data: [DONE]` → 끝
- 중단하면 `AbortError`를 그대로 던짐 (호출한 쪽이 무시)
- 목 서버는 일부러 줄 중간에서 끊어 보냅니다. 버퍼 처리가 틀리면 글자가 빠집니다.

### 5단계. `useStreamingText`

명세 5.5: `useStreamingText()` → `{ isStreaming, error, start, stop }`

- `start({ sessionId, question, onToken, onSources, onDone, onError })`: 새 `AbortController`로 `chatService.stream` 호출
- `stop()` 중단, 화면을 떠나면 자동 중단, AbortError는 오류로 보지 않음

### 6단계. `ChatMessage`, `ChatInput`

명세 5.2.

`ChatMessage` — props `role`(필수), `content`(필수), `sources`, `masked`, `streaming`

- 사용자 말풍선 오른쪽, 답변 왼쪽
- 내용이 아직 없고 `streaming`이면 "답변을 찾는 중…"
- `masked`면 "이 답변은 현재 볼 수 없습니다"
- 근거: "문서명 · v4 · 12쪽" + 인용 조각, `pageNumber`가 없으면(DOCX) 쪽 표시 빼기. 문서명 → `/documents/{documentId}`
- 전부 텍스트로만, 줄바꿈은 `whitespace-pre-wrap`

`ChatInput` — props `onSend`(필수), `disabled`

- 1~1000자, 글자 수 표시. Enter 전송, Shift+Enter 줄바꿈, 한글 조합 중 Enter는 전송하지 않음(`e.nativeEvent.isComposing`)

### 7단계. `ChatInterface` + `DashboardPage`

명세 4.4 대시보드. `ChatInterface`는 props 없음.

- 첫 질문 때 `chatService.createSession()` → `setSession`
- 질문 → 사용자 메시지 → 빈 답변(`streaming: true`) → `start` → 토큰마다 `appendToken` → 끝나면 `finishMessage`
- 오류: 502 "일시적으로 답변할 수 없습니다", 429 "요청이 너무 많습니다." + 입력 잠시 차단, 그 밖은 `getErrorMessage(e, { chat: true })`
- 근거 없음("찾지 못했습니다")은 서버 문구 그대로
- 들어오거나 챗봇 패널을 열 때 `sessionId`가 있으면 `chatService.messages`로 기록을 다시 받아 `masked` 반영. 받는 중(`isLoading`)에는 다시 받지 않음. 404면 대화 비움
- 화면을 떠날 때 받는 중이면: 내용 없는 답변 말풍선은 지우고, 받던 답변은 받은 데까지 남기고, `isLoading` 해제
- 새 메시지가 오면 맨 아래로, 목록에 `role="log"`·`aria-live="polite"`, 빈 대화 "문서에 대해 질문해 보세요"
- DashboardPage: 본문은 질의응답만. 높이가 정해진 카드(`flex min-h-0 flex-1`) 안에 `ChatInterface`. 대시보드에는 ChatWidget을 두지 않음

### 8단계. `ChatWidget` (JJW 문서 상세에 들어감)

명세 5.2. props 없음.

- 오른쪽 아래 고정 56px 아이콘, `aria-label="챗봇 열기"`·`aria-expanded`
- 누르면 패널(`role="dialog"`) + 입력창 포커스. 닫기 버튼·Esc·아이콘으로 닫힘
- 모바일 전체 화면, 데스크톱 아이콘 위 약 380×560px
- 패널 안에 `ChatInterface` 그대로. 패널을 닫아도 받는 중인 답변은 유지(숨기기만 하고 언마운트하지 않음)
- JJW의 버전 본문 패널(화면 오른쪽 절반)이 열려 있을 때 챗봇 아이콘·패널이 가리지 않는지 함께 확인
- 완성되면 JJW에게 알립니다.

### 9단계. 베이스 관리

- 다른 사람이 공통 컴포넌트·토큰·서비스·목 서버 변경을 요청하면 반영하고 팀에 알립니다.
- 11/12에 06 명세서를 코드에 맞춰 갱신합니다(Props 표, Card·PageError 추가, 미리보기).

## 3. 넘겨주기·받기 (연동)

| 방향 | 내용 |
|------|------|
| WJH → KJH | `VersionUploadPanel` (문서 만들기) |
| WJH → JJW | `VersionUploadPanel`, `ChatWidget` (문서 상세) |
| KJH → WJH | `useDocumentList`, `DocumentTabList`, `DocumentCreateModal`, `InvitationMenu` — 레이아웃에 WJH가 연결 |
| KJH → WJH | `refreshAccessToken` (스트림 401) |

## 4. 혼자 확인하기

새로고침하면 로그인과 대화가 모두 사라집니다(토큰·대화는 메모리에만, 명세 9.2). `가림` 확인도 새로고침이 아니라 화면 이동으로 합니다.

미리보기 (내 PC의 `src/preview/LocalPreview.jsx` → `/preview`, git에 올라가지 않음, 설명은 전체 가이드 6장): `ChatWidget`은 JJW의 문서 상세에, `VersionUploadPanel`은 JJW의 문서 상세와 KJH의 문서 만들기에 들어갑니다. 그 화면들은 남의 파일이라 직접 넣어 볼 수 없으므로, LocalPreview.jsx에 올려 확인하고 완성되면 화면 주인에게 알립니다. 예: `const [files, setFiles] = useState([]);` 후 `<VersionUploadPanel files={files} onChange={setFiles} startVersionNo={4} />`, 그 아래 `<ChatWidget />`.

채팅 (질문에 단어를 넣어 상황을 만듦)

| 질문 | 기대 결과 |
|------|-----------|
| 아무 질문 | "답변을 찾는 중…" → 글자가 조금씩 → 근거 2개(두 번째는 쪽 표시 없음) |
| `없음` 포함 | "찾지 못했습니다", 근거 없음 |
| `429` 포함 | 요청 초과 문구 + 입력 잠시 막힘 |
| `502` 포함 | "일시적으로 답변할 수 없습니다" |
| `끊김` 포함 | 답변 도중 끊김 → 받은 데까지 표시, 화면이 멈추지 않음 |
| `가림` 포함 | 다른 화면에 갔다 오면 "이 답변은 현재 볼 수 없습니다" |

- 답변 도중 다른 화면으로 이동 → 빈 말풍선이 남지 않음
- 로그아웃 → 다른 계정 로그인 → 이전 대화 없음

업로드 패널: 11개 선택, `.txt`, 20MB 넘는 파일, 0바이트 파일 → 각각 걸러지고 이유 표시. 순서를 바꾸면 버전 번호가 바로 바뀜.

레이아웃: 390px에서 메뉴 버튼 → 서랍 → 문서 클릭 시 닫힘. `leader`는 [문서 만들기]가 보이고 `member`는 안 보임.

## 5. 완료 체크리스트

- [ ] 잘린 SSE 줄을 버퍼로 처리 (글자 빠짐 없음)
- [ ] 화면 이탈 시 연결 끊김, 빈 말풍선 정리
- [ ] 502·429·근거 없음·masked 문구
- [ ] AI 답변·인용 조각을 텍스트로만, 질문 원문을 console에 남기지 않음
- [ ] 업로드 패널 검증·순서·버전 번호
- [ ] 모바일 사이드바 서랍, KJH 부품 연결
