# JJW 가이드 – 문서 상세, 이력 탭 타임라인, 비교 탭 diff 뷰어

01 계획서 담당: 문서 상세, 이력 탭 타임라인, 비교 탭 diff 뷰어 (+ 버전 선택 모달, 폴링).
전체 규칙과 담당 간 약속은 `00_전체_구현_가이드.md`를 먼저 봅니다. 아래 파일 외에는 고치지 않습니다.

## 1. 맡은 파일

| 파일 | 지금 상태 |
|------|-----------|
| `pages/DocumentDetailPage.jsx` | 빈 화면 |
| `pages/CompareResultPage.jsx` | 빈 화면 |
| `components/document/DocumentInfoPanel.jsx` | 새로 |
| `components/document/VersionPeekPanel.jsx` (버전 본문 사이드 패널) | 새로 |
| `components/document/VersionTable.jsx` | 새로 |
| `components/document/HistoryTimeline.jsx` | 새로 |
| `components/document/DiffViewer.jsx` | 새로 |
| `components/common/VersionSelectModal.jsx` | 새로 |
| `utils/usePolling.js`, `utils/diffAlign.js` | 새로 |

다른 사람이 만들어 주는 것(직접 고치지 않고 끼우기만): KJH `PermissionPanel`, WJH `VersionUploadPanel`·`ChatWidget`. props는 전체 가이드 5장.

권한 규칙 (명세 4.1): 읽기 = 등록자 본인 + 초대를 수락한 사람 / 쓰기(업로드, 버전 삭제, 정보 수정, 문서 삭제, 열람자 관리) = 등록자 본인(`owned === true`).

## 2. 구현 순서

### 1단계. `VersionTable`

명세 4.3·4.4 "버전 목록". 자기 화면에서만 쓰므로 props는 자유롭게 정해도 되지만, 아래를 추천합니다: `versions`(필수), `currentVersionNo`, `owned`, `onDelete(version)`, `onSelect(version)`, `selectedVersionNo`, `children`.

- 줄을 누르면 `onSelect(version)` → 페이지가 버전 본문 패널을 엶 (9단계). 지금 열린 버전(`selectedVersionNo`)은 강조. [삭제]를 누를 때는 패널이 열리지 않게 이벤트 전파를 막음
- 줄 전체를 버튼처럼 쓰므로 키보드(Enter)로도 열리게 하고 `aria-label="v3 본문 보기"`처럼 붙임

- 최신이 위로 오게 `versionNo` 내림차순. `[...versions].sort()`로 복사 후 정렬
- 각 줄: 버전, `currentVersionNo`면 "최신" 칩, 파일 이름, `StatusBadge`, 등록일 `formatShortDate`
- 상태 필터: 전체 / 준비 완료 / 분석 중 / 실패
- 버전 0개: "아직 올라간 버전이 없습니다"
- `owned`일 때만 [삭제]. 버전이 1개뿐이면 비활성(서버도 400). 누르면 `onDelete(version)` → 페이지가 확인창
- `children` 자리에 업로드 영역

### 2단계. `HistoryTimeline` (이력 탭)

명세 4.4 "변천사".

- `versionService.history(id)` → `versions`, `segments[]`(`from`, `to`, `changeType`, `summary`, `changeCount`, `summaryStatus`)
- 버전을 오래된 순으로 세로 타임라인, 버전 사이에 구간 카드(`segments`에서 `from`이 같은 것)
- `changeType`: PROCEDURE 절차, NUMERIC 수치, WORDING 표현
- `summaryStatus`: OK면 요약, FAILED면 변경 건수만, SKIPPED면 "내용 변경 없음"
- 구간 카드를 누르면 `/documents/{id}/compare?from=&to=`
- 버전 2개 미만: "버전이 2개 이상이어야 변천사를 볼 수 있습니다"
- 제목 옆 [버전 비교] → 버전 선택 모달

### 3단계. `VersionSelectModal`

명세 5.1. 베이스 `Modal` 사용. 추천 props: `open`, `versions`, `initialFrom`, `initialTo`, `onConfirm(from, to)`, `onClose`, `error`.

- READY 버전만, 서로 다른 두 개. 이전 버전 열 / 이후 버전 열(라디오), 날짜 `formatMonthDay`
- 확인하면 `onConfirm(작은 번호, 큰 번호)` (거꾸로 골라도 오래된 버전이 `from`)
- READY가 2개 미만이거나 같은 버전이면 안내 문구, 버튼 비활성
- `error`가 있으면 위쪽에 표시(비교 결과에서 400일 때)
- 열 때마다 초기값으로 다시 시작 (열려 있을 때만 그리는 내부 컴포넌트로 나누면 쉬움)
- 모바일에서는 두 열을 위아래로

### 4단계. `utils/diffAlign.js` (비교 탭의 핵심 로직)

명세 4.4 "문서 비교 결과". 차이는 화면에서 계산하지 않습니다. 서버가 준 `diffJson` 위치대로 줄을 맞추고 색만 칠합니다.

```json
"diffJson": [
  { "type": "DELETE", "fromLine": 5,  "fromCount": 1, "toLine": 5,  "toCount": 0 },
  { "type": "INSERT", "fromLine": 9,  "fromCount": 0, "toLine": 8,  "toCount": 2 },
  { "type": "CHANGE", "fromLine": 12, "fromCount": 1, "toLine": 13, "toCount": 1 }
]
```

- 줄 번호는 `fromText`·`toText`를 줄바꿈으로 나눈 순서(0부터). 바뀌지 않은 부분은 블록에 없음

만들 함수 `buildDiffRows(fromText, toText, diffJson)` → 좌우 한 쌍씩의 행 배열

```
{ left: { no, text, tone }, right: { no, text, tone }, blockIndex, type }
tone: same | del(빨강) | add(초록) | chg(노랑) | filler(줄 맞춤용 빈 줄)
blockIndex: 바뀐 블록 번호, 바뀌지 않은 줄은 -1
```

1. 두 본문을 줄로 나누고(`\r\n` 정리), 블록을 `fromLine` 순으로 정렬
2. 왼쪽 위치 `i`, 오른쪽 위치 `j`를 0에서 시작
3. 블록마다: 블록 시작(`fromLine`, `toLine`)까지 바뀌지 않은 줄을 좌우 한 쌍씩
4. 블록 안: `max(fromCount, toCount)`줄, 짧은 쪽은 filler. DELETE 왼쪽 빨강, INSERT 오른쪽 초록, CHANGE 양쪽 노랑
5. 마지막 블록 뒤 남은 줄

테스트: 문서 1의 v1→v4는 블록 3개(CHANGE 2줄→1줄, INSERT 2줄, CHANGE)입니다. 순수 함수라 화면 없이 확인할 수 있습니다.

### 5단계. `DiffViewer`

- 추천 props: `fromLabel`, `toLabel`, `fromText`, `toText`, `diffJson`, `activeBlock`, `scrollKey`
- 데스크톱: 좌우 2열이 같은 행 높이로 함께 스크롤 (한 grid 안에 좌우 칸을 번갈아 넣으면 높이가 자동으로 맞음)
- 모바일(768px 미만): 이전 버전 전체가 위, 이후 버전 전체가 아래 (`order`로 순서 바꾸기)
- 줄 번호 표시, filler는 줄 번호 없음. 본문은 텍스트로만(강조는 감싸는 요소의 배경색)
- `activeBlock`이 바뀌면 그 블록 첫 줄로 `scrollIntoView`
- 주의: 모바일에서 INSERT 블록은 왼쪽이 filler라 왼쪽을 기준으로 스크롤하면 위쪽 빈 줄로 갑니다. INSERT면 오른쪽 칸을 기준으로 합니다.

### 6단계. `CompareResultPage` (비교 탭)

명세 4.4 "문서 비교 결과".

- 쿼리 검사: 양의 정수, 서로 다름. 아니면 `VersionSelectModal`을 바로 엶. `from > to`면 바꾼 주소로 `replace`
- `documentService.get(id)`(문서 이름, 버전 목록)과 `versionService.compare(id, from, to)` → `fromVersionNo`, `toVersionNo`, `fromText`, `toText`, `changeCount`, `diffJson`
- 위쪽: 문서 이름, "v1 → v4", "변경 N건"(서버 `changeCount`), [이전 변경]·[다음 변경](블록 순서), [다른 버전 선택]
- `changeCount` 0이면 "두 버전의 내용이 같습니다"
- 400이면 모달을 다시 열고 서버 문구 표시. 모달에서 고르면 쿼리만 바꿈(`replace`)
- 404면 `PageError`. 쿼리가 잘못된 채로 모달을 닫으면 문서 상세로

### 7단계. `usePolling`

명세 5.5: `usePolling(fn, intervalMs, enabled)`. `enabled`일 때만 `intervalMs`마다 `fn`. 앞 요청이 끝난 뒤 다음을 예약(`setTimeout`). 화면을 떠나거나 `enabled`가 false면 멈춤.

### 8단계. `DocumentDetailPage` + `DocumentInfoPanel`

명세 4.4 문서 상세.

- `documentService.get(id)`와 `versionService.history(id)`를 `Promise.allSettled`로. 변천사만 실패하면 상세는 보이고 변천사 자리만 오류
- 문서가 404면 `PageError`("문서를 찾을 수 없습니다"), 권한 밖과 구분하지 않음
- `location.state.flash`(문서 만들기 안내)가 있으면 한 번 보여 주고 state를 비움
- 주소의 `documentId`가 바뀔 때 늦게 온 이전 응답이 화면을 덮지 않게
- 레이아웃: 데스크톱 2열(버전 | 변천사), 모바일 1열, 아래쪽 여백 `pb-24`(챗봇 아이콘)

| 기능 | API | 규칙 |
|------|-----|------|
| 정보 표시·수정 `DocumentInfoPanel` | `documentService.update(id, patch)` | 등록자만 [정보 수정], 그 자리에서 고침. 바뀐 필드만 보내고 바뀐 게 없으면 요청 없음. 성공 시 다시 조회 + `refreshDocuments()` |
| 문서 삭제 | `documentService.remove(id)` (204) | 등록자만, `ConfirmDialog`. 성공 시 `refreshDocuments()` 후 `/` |
| 업로드 | `versionService.upload(id, files)` | 등록자만. `VersionTable`의 `children`에 WJH의 `VersionUploadPanel`(`startVersionNo` = `currentVersionNo + 1`) + [vN~vM, k개 버전 올리기] → 한 번 더 확인 → 업로드 중 비활성 → 성공 시 다시 조회 |
| 버전 삭제 | `versionService.remove(id, no)` | `ConfirmDialog` → 삭제 → 다시 조회 |
| 폴링 | `usePolling` | 문서나 버전 중 PROCESSING이 있으면 3초마다 다시 조회 + `refreshDocuments()` |
| 열람자 | KJH의 `PermissionPanel` | [열람자] 버튼으로 열고 닫음. props `documentId`, `owned`, `uploadedByName`, `onClose` |
| 챗봇 | WJH의 `ChatWidget` | 페이지 맨 끝에 `<ChatWidget />` |

업로드 오류: 413은 "파일은 20MB 이하만 올릴 수 있습니다", 400은 서버 문구. 서버는 하나라도 걸리면 전체를 거부합니다.

### 9단계. 버전 본문 사이드 패널 (`VersionPeekPanel`)

버전 표의 줄을 누르면 노션의 사이드 피크처럼 화면 오른쪽 절반에 패널이 나와 그 버전의 본문을 보여 줍니다. 페이지는 이동하지 않습니다.

버전을 누르면 버전 정보와 본문을 함께 보여 주는 필수 기능입니다(2026-11-07 확정). 본문은 버전 단건 API(V-03) 응답의 `contentText`로 받습니다. 이 필드는 아직 04 API 설계서와 Backend에 반영되지 않았지만(요청 예정), 목 서버는 주므로 지금 만들 수 있습니다. 실제 Backend 연결 때 필드가 아직 없으면 패널에 버전 정보는 보이고 본문 자리에 "본문을 불러올 수 없습니다"가 나오게 둡니다.

```
[문서 상세]
 버전 목록              │  v3 · deploy_guide_v3.pdf          [비교] [닫기]
  v4 최신               │  2026-11-03 · 준비 완료 · 180KB
 ▶v3  ← 클릭            │  변경 요약(수치): 롤백 제한 시간이 2시간으로 줄어듦
  v2                    │  ──────────────────────────────────
  v1                    │  1. 목적
                        │  배포 절차와 승인 체계를 정의한다.
 변천사 ...             │  ...(스크롤)
```

- API: `versionService.get(documentId, versionNo)` → `versionNo`, `originalFilename`, `fileSize`, `status`, `changeType`, `changeSummary`, `createdAt`, `contentText`
- 추천 props: `documentId`(필수), `versionNo`(필수), `onClose`(필수), `onCompare(versionNo)`
- 열림 상태는 주소 쿼리 `?version=3`으로 관리합니다(명세 6장 "선택 상태는 URL"). 새로고침·링크 공유 때 같은 패널이 열리고, 닫으면 쿼리를 지웁니다(`setSearchParams`, `replace`).
- 다른 버전을 누르면 패널을 닫지 않고 내용만 바꿉니다. 늦게 도착한 이전 버전 응답이 덮지 않게 합니다.
- 표시
  - 위쪽: 버전, 파일 이름, 날짜(`formatDate`), 상태(`StatusBadge`), 크기(`formatFileSize`)
  - 변경 요약: `changeSummary`가 있으면 `changeType` 라벨(절차·수치·표현)과 함께. v1이거나 요약이 없으면 생략
  - 본문: `contentText`를 텍스트로만(문장마다 줄바꿈, `whitespace-pre-wrap`). 길면 패널 안에서만 스크롤
  - 상태가 READY가 아니거나 `contentText`가 없으면 "아직 본문을 볼 수 없습니다"
  - 로딩·오류(`ErrorMessage` + 다시 시도), 404는 "문서를 찾을 수 없습니다"
- 크기: 데스크톱은 화면 오른쪽 절반(`fixed right-0 top-16 bottom-0 w-1/2`, `shadow-modal`), 모바일(768px 미만)은 전체 화면
- 닫기 버튼, Esc로 닫힘. `role="dialog"`, `aria-labelledby`(제목). 열면 패널로 포커스, 닫으면 누른 줄로 포커스 복귀
- 뒤 화면은 그대로 보이고 스크롤도 됩니다(모달처럼 어둡게 막지 않음). 단, 모바일 전체 화면일 때는 뒤 화면 스크롤을 막습니다.
- [비교] 버튼(선택): 이 버전과 직전 READY 버전으로 비교 결과 이동 (`/compare?from=직전&to=이 버전`). v1이면 숨김
- 챗봇 아이콘(WJH `ChatWidget`)과 겹치지 않게 패널이 열려 있는 동안 아이콘이 패널 바깥에 오는지 확인하고, 겹치면 WJH와 이야기합니다.

## 3. 받기 (연동)

| 받는 것 | 만드는 사람 | 오기 전에는 |
|---------|-------------|-------------|
| `PermissionPanel` | KJH | [열람자] 버튼만 두고 `{/* KJH: PermissionPanel */}` |
| `VersionUploadPanel` | WJH | 업로드 영역에 `{/* WJH: VersionUploadPanel */}` |
| `ChatWidget` | WJH | `{/* WJH: ChatWidget */}` |

## 4. 혼자 확인하기

새로고침이나 주소 입력 때는 다시 로그인해야 합니다(토큰은 메모리에만, 명세 9.2). 폴링은 새로고침하지 말고 화면을 그대로 둔 채 봅니다.

미리보기 (내 PC의 `src/preview/LocalPreview.jsx` → `/preview`, git에 올라가지 않음, 설명은 전체 가이드 6장): JJW의 컴포넌트는 대부분 자기 화면에 들어가므로, 미리보기는 주로 두 가지로 씁니다.

- 문서 상세 화면이 완성되기 전에 `VersionTable`·`HistoryTimeline`·`VersionSelectModal`·`DiffViewer`를 따로 띄워 보기 (예: `documentService.get(1)`로 받은 `versions`를 넘김)
- 아래 비교 주소들을 `Link`로 모아 두고 눌러서 이동하기 (주소창 입력과 달리 로그인이 유지됨)

문서 상세

| 계정 | 문서 | 확인할 것 |
|------|------|-----------|
| leader | 1 배포 가이드 | 등록자 화면 전체, 변천사 구간 3개(OK·OK·FAILED), 버전 삭제 |
| leader | 2 보안 점검 체크리스트 | PROCESSING → 처음 조회 8초 뒤 READY, 사이드바 배지도 같이 |
| leader | 3 회의록 양식 | FAILED 버전 (비교 모달에서 빠짐) |
| leader | 4 개인정보 처리 지침 | 버전 없음(EMPTY), 변천사 빈 문구 |
| leader | 5 신입 온보딩 안내 | 등록자가 아닌 열람자 화면(쓰기 영역 없음) |
| member2 | 1번 주소 직접 입력 | 404 문구 |

버전 본문 패널 (leader)

| 누를 버전 | 기대 결과 |
|-----------|-----------|
| 문서 1의 v1 | 본문만, 변경 요약 없음 |
| 문서 1의 v2, v3 | 변경 요약(절차, 수치) + 본문 |
| 문서 1의 v4 | 요약 실패 구간이라 변경 요약 없음 + 본문 |
| 문서 2의 v2 (분석 중) | "아직 본문을 볼 수 없습니다" → 8초 뒤 다시 누르면 본문 |
| 문서 3의 v2 (실패) | "아직 본문을 볼 수 없습니다" |
| v3 패널이 열린 상태에서 v2 클릭 | 패널은 그대로, 내용만 v2로 |
| 패널 열고 새로고침 | 다시 로그인 후 같은 패널이 열림 (`?version=`) |
| 390px | 전체 화면 패널, 닫으면 원래 위치 |

비교 (leader)

| 주소 | 기대 결과 |
|------|-----------|
| `/documents/1/compare?from=1&to=4` | 블록 3개, 빨강·초록·노랑과 빈 줄 맞춤 |
| `/documents/1/compare?from=4&to=1` | `from=1&to=4`로 바뀜 |
| `/documents/1/compare`, `?from=2&to=2` | 모달이 바로 열림 |
| `/documents/3/compare?from=1&to=2` | v2가 FAILED라 400 → 모달 + 서버 문구 |
| `/documents/99/compare?from=1&to=2` | 404 문구 |
| 위 주소를 390px로 | 이전 위·이후 아래, [다음 변경]이 INSERT 블록에서 아래쪽 초록 줄로 |

## 5. 완료 체크리스트

- [ ] 차이를 화면에서 계산하지 않고 `diffJson` 위치만 사용
- [ ] DELETE 왼쪽 빨강, INSERT 오른쪽 초록, CHANGE 양쪽 노랑, 짧은 쪽 빈 줄로 높이 맞춤
- [ ] 모바일 비교 순서와 블록 이동 위치
- [ ] 변천사 OK·FAILED·SKIPPED 표시, 구간 카드 → 비교
- [ ] 정보 수정은 바뀐 필드만 PATCH
- [ ] PROCESSING 동안만 폴링, 끝나면 멈춤
- [ ] 등록자와 열람자 화면 차이, 404와 권한 밖을 같은 문구로
- [ ] 비교 본문·요약·파일 이름을 텍스트로만 그림
- [ ] 버전 본문 패널: 클릭·Enter로 열림, `?version=`으로 유지, 버전 전환, READY 아닌 버전 안내, Esc·포커스 복귀, 모바일 전체 화면
