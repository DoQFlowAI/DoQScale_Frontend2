# KJH 가이드 – 로그인·회원가입, 문서 목록, 생성·초대 모달, 초대 알림창

01 계획서 담당: 로그인·회원가입, 문서 목록, 생성·초대 모달, 초대 알림창 (+ 토큰 갱신).
전체 규칙과 담당 간 약속은 `00_전체_구현_가이드.md`를 먼저 봅니다. 아래 파일 외에는 고치지 않습니다.

## 1. 맡은 파일

| 파일 | 지금 상태 | 쓰는 곳 |
|------|-----------|---------|
| `pages/LoginPage.jsx` | 최소 로그인 | |
| `pages/SignupPage.jsx` | 빈 화면 | |
| `services/tokenRefresh.js` | 바로 로그아웃하는 임시 코드 | 베이스 api.js, WJH chatService |
| `utils/useDocumentList.js` | 첫 페이지만 받음 | WJH Layout |
| `components/document/DocumentTabList.jsx` | 새로 | WJH Sidebar |
| `components/document/DocumentCreateModal.jsx` | 새로 | WJH Sidebar |
| `components/document/PermissionPanel.jsx` | 새로 | JJW 문서 상세 |
| `components/common/InviteeEmailInput.jsx` | 새로 | 자기 DocumentCreateModal, PermissionPanel |
| `components/common/InvitationMenu.jsx` | 새로 | WJH Header |

권한 규칙 (명세 4.1): 읽기 = 등록자 본인 + 초대를 수락한 사람 / 문서 만들기 = 팀장(`rankLevel === 2`) / 쓰기(초대·회수 등) = 등록자 본인(`owned`).

## 2. 구현 순서

### 1단계. 토큰 갱신 (`services/tokenRefresh.js`)

모두가 영향을 받으므로 가장 먼저 합니다. 명세 9.3.

- `refreshAccessToken()`: `POST /auth/refresh { refreshToken }` → `useAuthStore.getState().setTokens(새 access, 새 refresh)` → 새 accessToken 반환
- 동시에 여러 요청이 401이어도 refresh는 한 번만 보냅니다. 진행 중인 Promise를 모듈 변수에 두고, 있으면 그걸 돌려주고, 끝나면(`finally`) 비웁니다.
- refresh 요청은 인터셉터가 없는 별도 axios 인스턴스(`axios.create({ baseURL: API_URL })`)로 보냅니다. 그래야 refresh의 401이 다시 refresh를 부르지 않습니다.
- 실패하면 `expireSession()`(이미 import됨) 후 throw
- 폐기된 Refresh Token을 다시 쓰면 서버가 그 사용자의 토큰을 전부 폐기합니다(API-A-3). 그래서 "한 번만"이 중요합니다.
- 이름과 동작(성공 → 새 토큰 반환, 실패 → throw)은 약속이라 바꾸지 않습니다.

완료 기준: `MOCK_TOKEN_TTL_SEC=20`으로 목 서버를 켜고 20초 넘게 기다린 뒤 화면을 이동해도 로그인이 유지됩니다.

### 2단계. 로그인 (`pages/LoginPage.jsx`)

명세 4.4 로그인.

- 이미 있는 것: 로그인 → 토큰 저장 → `/users/me` → 대화 비우기 → `login()`. 이후 `PublicOnlyRoute`가 원래 화면으로 보냅니다.
- 추가할 것
  - 빈 칸 검사 ("이메일과 비밀번호를 입력해 주세요")
  - 401·423은 서버 문구 그대로 (`getErrorMessage`가 처리)
  - 가입 직후 들어오면 "가입이 완료되었습니다. 로그인해 주세요." (`location.state.signedUp`)
  - 반응형 (명세 8.1)
- 확인: 로그아웃 뒤 다른 계정으로 로그인하면 이전 사람이 보던 화면이 아니라 `/`로 가야 합니다. 로그아웃 순간 `ProtectedRoute`가 현재 주소를 기억할 수 있으니 실제로 확인하고, 문제가 있으면 베이스(라우팅) 수정이 필요하므로 WJH에게 요청합니다.

### 3단계. 회원가입 (`pages/SignupPage.jsx`)

명세 4.4 회원가입, API 설계서 2.6.

| 입력 | 규칙 |
|------|------|
| 이메일 | 형식, 최대 255자 |
| 비밀번호 | 8~64자, 영문·숫자·특수문자 중 2종 이상 |
| 이름 | 1~50자 |
| 직급 | 사원(1) / 팀장(2) 중 필수 → `rankLevel` |
| 직급 인증키 | 팀장을 고를 때만 보이고 필수. `type="password"`. 사원이면 보내지 않음 |

- `authService.signup({ email, password, name, rankLevel, signupKey })` → `navigate('/login', { state: { signedUp: true } })`
- 화면에서 먼저 막고, 서버 문구도 입력 아래에 보여 줍니다. 409는 "이미 가입된 이메일입니다".
- 인증키가 틀려도 서버는 일반 400을 줍니다. 화면도 따로 구분하지 않습니다. 키 값은 코드·문서에 넣지 않습니다.

### 4단계. 문서 목록 (`useDocumentList`, `DocumentTabList`)

명세 4.4 공통 레이아웃 "문서 목록", 6장.

`utils/useDocumentList.js` — 반환 `{ documents, hasMore, loading, error, loadMore, refresh }` (이름 유지)

- `documentService.list({ page, size: 20 })`. 응답 `content`, `totalElements`
- `loadMore`: 다음 페이지를 받아 이어 붙임. `hasMore` = 받은 수 < `totalElements`
- `refresh`: 지금까지 받은 페이지 전체를 다시 받아 교체. 늦게 도착한 이전 응답은 무시(요청 번호 비교)
- `loading`, `error`(문구는 `getErrorMessage`)

`components/document/DocumentTabList.jsx` — props `documents`(필수), `hasMore`, `loading`, `error`, `onLoadMore`, `onRetry`

- 문서 이름 + `StatusBadge`. 누르면 `/documents/:id`, 지금 보는 문서는 강조(`NavLink`)
- 빈 목록이면 별도 문구 없음 (명세 4.3). 오류면 `ErrorMessage` + 다시 시도. `hasMore`면 [더 보기]
- 문서 이름은 텍스트로만

### 5단계. 이메일 입력 (`InviteeEmailInput`)

명세 5.1. 생성 모달과 열람자 패널에서 같이 씁니다.

- props: `invitees`(필수, `[{ uuid, name, email }]`), `onChange(invitees)`(필수), `excludeEmails`, `disabled`
- 이메일 전체를 입력하고 [확인]을 눌러야 `userService.lookup(email)` 호출 (부분 검색 없음)
- 찾으면 목록에 추가(이름·이메일, [빼기]), 404·429는 서버 문구를 입력란 아래에
- 자기 이메일, 이미 추가한 이메일, `excludeEmails`는 막음. 최대 50명
- 사원은 조회 권한이 없음(403). 이 입력은 팀장·등록자 화면에만 나옵니다.

### 6단계. 문서 만들기 (`DocumentCreateModal`)

명세 4.4 공통 레이아웃 "문서 만들기". props `open`, `onClose`, `onCreated(documentId, flash)` (약속)

- 한 화면에서 이름(1~200자)·설명(0~500자), 첫 버전 파일(WJH의 `VersionUploadPanel`, `startVersionNo` 1), 열람자(`InviteeEmailInput`). 파일과 열람자는 선택
- [만들기] → ① `documentService.create({ name, description, inviteeEmails })` 성공 후 ② 파일이 있으면 `versionService.upload(documentId, files)`
- ① 실패: 문서가 안 만들어졌으므로 모달 유지, 오류 표시
- ② 실패: 문서는 만들어졌으므로 `onCreated(id, { error: '파일 업로드에 실패했습니다. 다시 올려 주세요' })`
- 응답 `notFound`에 이메일이 있으면 `flash.notice`에 "가입되지 않은 이메일: …"
- 진행 중에는 닫기와 버튼을 막음
- WJH의 `VersionUploadPanel`이 아직 없으면 그 자리는 주석으로 두고 이름·설명·열람자부터 완성합니다.

### 7단계. 열람자 관리 (`PermissionPanel`)

명세 4.4 문서 상세 "열람자 목록·초대·회수". props `documentId`(필수), `owned`(필수), `uploadedByName`, `onClose`(필수). `Modal`로 그립니다(열고 닫는 상태는 JJW).

- `documentService.permissions(id)` → `permissionId, uuid, name, email, rankLevel, status, grantedAt, respondedAt`
- 등록자(`owned`): 전체 목록(이름, 이메일, 직급 `RankBadge`, 상태 `StatusBadge` 대기·수락·거절, 날짜) + `InviteeEmailInput`으로 초대(`documentService.invite`) + 대기 중 취소·수락한 사람 회수(`documentService.revoke(id, uuid)`, `ConfirmDialog`)
- 등록자가 아닌 열람자: 서버가 수락한 사람만 줌. 이름·직급·이메일 보기 전용
- 책임자(등록자)는 `uploadedByName`으로 맨 위에 표시. 등록자 본인은 목록에 없음
- 초대 응답의 `notFound`가 있으면 안내. 거절한 사람을 다시 초대하면 대기로 돌아감

### 8단계. 초대 알림 (`InvitationMenu`)

명세 4.4 공통 레이아웃, 5.1. props `onAccepted`

- 알림 버튼과 대기 중인 초대 개수 배지. 누르면 목록(문서 이름, 초대자 이름, 받은 날짜 `formatDate`)과 [수락]·[거절]
- `invitationService.list()`는 처음 그려질 때와 화면 이동 때마다 다시 받습니다(`useLocation`의 `pathname` 변화).
- 수락 성공 → `onAccepted()`(사이드바 목록 갱신). 거절 성공 → 목록에서 뺌. 400(이미 응답한 초대)이면 목록을 다시 받음
- 처리 중 버튼 잠금, 빈 목록 "받은 초대가 없습니다", 바깥 클릭·Esc로 닫힘
- 알림에는 문서 링크를 두지 않습니다(응답에 documentId 없음). 수락하면 사이드바에서 엽니다.

## 3. 넘겨주기 (연동)

| 만든 것 | 받는 사람 | 할 일 |
|---------|-----------|-------|
| `useDocumentList`, `DocumentTabList`, `DocumentCreateModal`, `InvitationMenu` | WJH | 완성되면 WJH에게 알림. 레이아웃 연결은 WJH가 함 |
| `PermissionPanel` | JJW | 완성되면 JJW에게 알림. 문서 상세 연결은 JJW가 함 |
| `refreshAccessToken` | 모두 | 이미 연결돼 있으니 완성만 하면 됨 |
| 받는 것: WJH `VersionUploadPanel` | KJH | DocumentCreateModal에 직접 연결 |

## 4. 혼자 확인하기

새로고침이나 주소 입력 때는 다시 로그인해야 합니다(토큰은 메모리에만, 명세 9.2). 로그인 후 원래 주소로 돌아가는지도 확인 항목입니다.

미리보기 (내 PC의 `src/preview/LocalPreview.jsx` → `/preview`, git에 올라가지 않음, 설명은 전체 가이드 6장): `InvitationMenu`·`DocumentTabList`·`DocumentCreateModal`은 WJH의 레이아웃에, `PermissionPanel`은 JJW의 문서 상세에 들어갑니다. 그 화면에 연결되기 전에는 LocalPreview.jsx에 올려 확인하고, 완성되면 화면 주인에게 알립니다. 예: `<PermissionPanel documentId={1} owned onClose={() => {}} />`와 `owned={false}`를 나란히 두면 등록자·열람자 화면을 한 번에 비교할 수 있습니다.

| 확인할 것 | 방법 |
|-----------|------|
| 로그인 실패·잠금 | 틀린 비밀번호 1번 → 401 문구, 5번 → 423 문구(목 서버 재시작으로 풀림) |
| 토큰 갱신 | `MOCK_TOKEN_TTL_SEC=20 npm run mock` (PowerShell: `$env:MOCK_TOKEN_TTL_SEC=20; npm run mock`) |
| 팀장 가입 | 인증키 `LEAD-KEY`(목 서버 전용). 비우거나 틀리면 400 |
| 중복 가입 | `member@example.com`으로 가입 → 409 |
| 문서 목록 | `leader` 5개, `member` 2개, `member2` 0개 |
| 초대 알림 | `member` 로그인 → 초대 1건(장애 대응 매뉴얼) → 수락하면 목록에 나타남. `member2`는 빈 문구 |
| 문서 만들기 | `leader`로 이름만 / 파일까지 / 열람자 `nobody@example.com` 포함(notFound) / 파일명에 `dup`(업로드만 실패) |
| 열람자 패널 | `leader`로 문서 1(대기·수락·거절이 모두 있음) / `member`로 문서 1(보기 전용, 수락한 사람만) |
| 조회 제한 | 이메일 조회를 1분에 30번 넘게 → 429 문구 |

## 5. 완료 체크리스트

- [ ] 동시에 401이 여러 개 와도 refresh 요청은 1번, 실패하면 로그인 화면·대화 비움
- [ ] 로그인 후 원래 화면으로 복귀, 로그아웃 후 다른 계정은 `/`로
- [ ] 가입 검증이 API 설계서 2.6과 같음, 사원은 인증키를 보내지 않음
- [ ] 문서 목록 페이징·오류·강조, 생성 후 목록 갱신
- [ ] 문서 만들기: 생성 → 업로드 → 상세 이동, 업로드만 실패한 경우 안내
- [ ] 열람자: 등록자와 열람자 화면 차이, 초대·취소·회수
- [ ] 초대 수락하면 사이드바에 바로 보임
- [ ] 토큰·비밀번호·인증키를 console에 남기지 않음, 토큰을 localStorage에 저장하지 않음
