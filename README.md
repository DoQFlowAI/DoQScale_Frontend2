# DoQFlow AI – Frontend

React + Vite + Tailwind CSS(v4) + Zustand + React Router + Axios. 디자인은 Figma(Page Final Ver), 기능은 `Frontend 개발 명세서 v1.3`을 따릅니다. 둘이 충돌하면 Figma가 우선입니다.

## 실행

```bash
npm install
npm run mock   # (선택) 목 Backend: http://localhost:8080  — 팀장 leader@example.com / 사원 member@example.com, 비밀번호 Passw0rd!
npm run dev    # http://localhost:5173  (/api 는 Vite 프록시가 8080 으로 전달)
npm run lint
npm run build
```

실제 Backend 를 쓸 때는 목 서버를 끄고 `DEV_PROXY_TARGET`(기본 `http://localhost:8080`)만 맞추면 됩니다 (`.env.example` 참고).

## 구조

`src/pages` · `src/components/{common,document,chat}` · `src/services`(API 호출은 여기서만) · `src/store`(authStore, chatStore) · `src/routes` · `src/utils`(hooks·포맷·에러 문구)

## 명세와 다르게 처리한 점 (Figma 우선 / 명세 간 충돌)

- **비교 하이라이트**: API 설계서 5.14는 "하이라이트는 화면에서 그린다"지만 FE 명세서 4.4는 서버가 주는 `diffJson` 위치대로 칠한다고 되어 있어 후자를 따랐습니다. `diffJson`이 없으면 강조 없이 본문만 보입니다.
- **문서 만들기 알림**: 명세 "가입되지 않은 이메일: …" 대신 Figma 문구 "`이메일` 사용자를 찾을 수 없습니다"를 썼습니다.
- **업로드 파일 순서**: Figma의 드래그 핸들 방식에 더해, 키보드·모바일용 ▲▼ 버튼을 뒀습니다.
- 열람자 패널(읽기 전용)의 책임자는 이름만 표시합니다 (문서 단건 응답에 등록자 이메일이 없음).
- 토큰은 메모리에만 있어 새로고침하면 다시 로그인해야 합니다 (명세 9.2).
