# DoQFlow AI – Frontend 베이스

세 사람이 함께 쓰는 최소한의 기반입니다. 혼자 실행해서 로그인하고 화면 사이를 이동할 수 있는 정도까지만 들어 있고, 기능 화면은 담당이 만듭니다. 모든 소스 파일 첫 줄에 `// 소유: ...`가 있고, 자기 소유 파일만 고칩니다.

- 담당 분배: `ROLES.md`
- 구현 안내: `docs/00_전체_구현_가이드.md` (구조, 규칙, 담당 간 props 약속, 진행 순서)
- 사람별 단계: `docs/KJH_로그인_문서목록_초대_가이드.md`, `docs/JJW_문서상세_이력_비교_가이드.md`, `docs/WJH_채팅_레이아웃_업로드_가이드.md`
- 기능 기준은 `Frontend 개발 명세서 v1.3`이고, 디자인(Figma)과 충돌하면 문서를 따릅니다.

## 실행

Node 20.19 이상 또는 22.12 이상이 필요합니다 (`node -v`로 확인). 버전이 낮으면 `npm ci`에서 경고가, `npm run dev`에서 안내 메시지가 나옵니다.

```sh
npm ci          # package-lock.json 그대로 설치 (npm install 은 lock 파일을 바꿀 수 있음)
npm run mock    # 목 Backend :8080
npm run dev     # 화면 http://localhost:5173 (/api 는 Vite 프록시가 8080 으로 전달)
npm run lint
npm run build
```

- 실제 Backend 를 쓸 때는 목 서버를 끄고 `.env.local` 에 `DEV_PROXY_TARGET` 만 맞춥니다 (`.env.example` 참고). 코드는 바꾸지 않습니다.
- 미리보기: 각자 PC에 `src/preview/LocalPreview.jsx`를 만들고 로그인 후 `/preview` (개발 서버에서만, 배포 빌드에는 없음, git에 올라가지 않음). 서로의 작업을 기다리지 않고 셋이 동시에 개발하도록, 남의 화면에 들어갈 내 컴포넌트를 혼자 띄워 보는 연습장입니다. 자세한 설명은 `docs/00_전체_구현_가이드.md` 6장

### 매번 로그인이 필요한 경우

새로고침(F5)하거나 주소창에 주소를 직접 입력하면 로그인이 풀립니다. 토큰을 메모리에만 두기 때문이며(명세 9.2), 버그가 아닙니다.

- 다시 로그인하면 처음 입력한 주소로 돌아갑니다. 예: `/documents/1/compare?from=1&to=4` 입력 → 로그인 → 비교 결과 페이지
- 코드를 저장할 때(Vite 화면 갱신)는 풀리지 않습니다.
- 계속 로그인 상태로 확인하려면 주소를 치지 말고 화면 안의 링크·버튼으로 이동합니다. 아직 링크가 없는 화면은 내 `LocalPreview.jsx`에 임시 링크를 두면 됩니다.
- 개발 편의를 위해 토큰을 localStorage 등에 저장하지 않습니다.

## 테스트 계정 (목 서버 전용)

비밀번호는 모두 `Passw0rd!` 입니다.

| 이메일 | 직급 | 볼 수 있는 문서 | 받은 초대 |
|--------|------|-----------------|-----------|
| `leader@example.com` | 팀장 | 1~4 (등록자), 5 (수락) | 6 |
| `leader2@example.com` | 팀장 | 5·6 (등록자) | 1 |
| `leader3@example.com` | 팀장 | 0 | 0 |
| `member@example.com` | 사원 | 1·5 (수락) | 6 |
| `member2@example.com` | 사원 | 없음 (1 거절) | 없음 |

| 문서 | 상태 | 확인할 수 있는 것 |
|------|------|-------------------|
| 1 배포 가이드 | v1~v4 READY | 변천사 OK·FAILED, 비교 DELETE·INSERT·CHANGE, 열람자 대기·수락·거절 |
| 2 보안 점검 체크리스트 | v2 PROCESSING | 처음 조회 8초 뒤 READY (폴링) |
| 3 회의록 양식 | v2 FAILED | 실패 버전, 비교 제외 |
| 4 개인정보 처리 지침 | 버전 없음 (EMPTY) | 첫 업로드 |
| 5 신입 온보딩 안내 | v1 | 등록자가 아닌 열람자 화면 |
| 6 장애 대응 매뉴얼 | v1 | 초대 수락·거절 |

- 팀장 가입 인증키: `LEAD-KEY` (목 서버 전용 더미 값. 실제 키는 Backend 팀에 받고 코드·문서에 넣지 않음)
- 질문에 넣는 단어로 상황 확인: `429` 요청 초과, `502` AI 오류, `없음` 근거 없음, `끊김` 답변 도중 연결 끊김, `가림` 다음 기록 조회 때 가려진 답변
- 업로드 파일 이름에 `dup` 이 있으면 "직전 버전과 같은 내용" 400
- 버전 단건 `GET /documents/{id}/versions/{no}` 는 버전 본문(`contentText`)도 줍니다(READY 버전만). 버전을 누르면 버전 정보와 본문을 보여 주는 필수 기능용입니다. 04 API 설계서 반영과 Backend 구현은 아직이라 실제 Backend 와 다를 수 있습니다
- 로그인 5번 실패하면 15분 잠김(423)
- 토큰 수명은 기본 하루라 개발 중에는 만료되지 않습니다. 토큰 갱신을 확인할 때만 `MOCK_TOKEN_TTL_SEC=20` 으로 목 서버를 켭니다 (PowerShell: `$env:MOCK_TOKEN_TTL_SEC=20; npm run mock`)
- 데이터는 메모리에만 있어 목 서버를 다시 켜면 처음 상태로 돌아갑니다

## 들어 있는 것

| 구분 | 파일 | 상태 |
|------|------|------|
| 설정 | `vite.config.js`, `eslint.config.js`, `.env.example`, `.gitignore` | 완료 |
| 팀 공통 환경 | `.gitattributes`(커밋할 때 줄바꿈을 LF 로 통일), `package.json`의 `engines`(Node 버전) | 완료 |
| 디자인 토큰 | `src/index.css` | 완료 |
| 공통 UI | `components/common/` Button, TextField, Modal, ConfirmDialog, Chip, StatusBadge, RankBadge, LoadingSpinner, ErrorMessage, PageError, Card | 완료 |
| 라우팅 | `routes/` AppRouter, ProtectedRoute, PublicOnlyRoute | 완료 |
| API | `services/api.js`, `session.js`, 서비스 5개 | 완료 |
| 상태·유틸 | `store/authStore.js`, `utils/errors.js`, `utils/format.js` | 완료 |
| 목 서버 | `mock/server.js` | API 설계서 v1.4 전체 |

위는 모두 "공통 베이스"이고 원종현(WJH)이 관리합니다. 아래는 사람별 소유 파일 중 베이스에 미리 자리를 만들어 둔 것입니다.

| 소유 | 파일 | 상태 |
|------|------|------|
| KJH | LoginPage, `services/tokenRefresh.js`, `utils/useDocumentList.js` | 최소 동작 |
| KJH | SignupPage | 빈 화면 |
| JJW | DocumentDetailPage, CompareResultPage | 빈 화면 |
| WJH | Layout, Header, Sidebar, `services/chatService.js`, `store/chatStore.js` | 최소 동작 |
| WJH | DashboardPage | 빈 화면 |

`TODO(KJH)`, `TODO(JJW)`, `TODO(WJH)` 로 검색하면 사람별로 남겨 둔 할 일이 나옵니다. 전체 소유표는 `ROLES.md`에 있습니다.
