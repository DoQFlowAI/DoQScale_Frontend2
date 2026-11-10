// 로컬 개발용 목 Backend (http://localhost:8080). API 설계서 v1.4 의 경로·필드를 고정 데이터로 흉내 냅니다.
// 데이터는 메모리에만 있고 재시작하면 초기화됩니다. 계정·테스트 방법은 README 의 "테스트 계정" 절.
// 환경변수: MOCK_TOKEN_TTL_SEC (액세스 토큰 수명. 기본 하루라 개발 중 로그아웃되지 않음. 20 으로 두면 토큰 갱신 흐름 확인)
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT || 8080);
const TTL = Number(process.env.MOCK_TOKEN_TTL_SEC || 24 * 60 * 60) * 1000;
const SIGNUP_KEY = 'LEAD-KEY'; // 목 서버 전용 더미 키. 실제 키는 Backend 팀에 받음
const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 고정 데이터 ----------
const users = [
  { uuid: 'u-leader', email: 'leader@example.com', name: '테스트 팀장', rankLevel: 2 },
  { uuid: 'u-leader2', email: 'leader2@example.com', name: '테스트 팀장2', rankLevel: 2 },
  { uuid: 'u-member', email: 'member@example.com', name: '테스트 사원', rankLevel: 1 },
  { uuid: 'u-member2', email: 'member2@example.com', name: '테스트 사원2', rankLevel: 1 },
].map((u) => ({ ...u, password: 'Passw0rd!', createdAt: daysAgo(30), failed: 0, lockedUntil: 0 }));
const byUuid = (uuid) => users.find((u) => u.uuid === uuid);

// 문장 단위 줄바꿈 본문 (DB 설계서 4.3)
const TEXT = {
  1: ['1. 목적', '배포 절차와 승인 체계를 정의한다.', '승인 요청 후 팀장이 검토한다.', '구버전 스크립트는 수동으로 실행한다.', '2. 배포 창구', '배포 창구는 평일 오후 2시에 연다.', '3. 롤백', '롤백은 당일 안에 요청해야 한다.', '롤백 후에는 결과를 공유한다.'],
  2: ['1. 목적', '배포 절차와 승인 체계를 정의한다.', '승인 요청 후 팀장과 부서장이 차례로 검토한다.', '구버전 스크립트는 수동으로 실행한다.', '2. 배포 창구', '배포 창구는 평일 오후 2시에 연다.', '3. 롤백', '롤백은 당일 안에 요청해야 한다.', '롤백 후에는 결과를 공유한다.'],
  3: ['1. 목적', '배포 절차와 승인 체계를 정의한다.', '승인 요청 후 팀장과 부서장이 차례로 검토한다.', '2. 배포 창구', '배포 창구는 평일 오후 2시에 연다.', '3. 롤백', '롤백은 배포 후 2시간 안에 요청해야 한다.', '롤백 후에는 결과를 공유한다.'],
  4: ['1. 목적', '배포 절차와 승인 체계를 정의한다.', '승인 요청 후 팀장과 부서장이 차례로 검토한다.', '2. 배포 창구', '배포 창구는 평일 오후 2시에 연다.', '배포 전 자동 점검을 통과해야 한다.', '실패 시 알림 채널로 즉시 공유한다.', '3. 롤백', '롤백은 배포 후 2시간 안에 요청해야 한다.', '롤백 후에는 결과를 공유한다.'],
};
const text = (n) => TEXT[n].join('\n');

const TEXT_EXT = /\.(txt|md|csv|json|xml|yaml|yml|log)$/i;

const ver = (versionNo, originalFilename, body, status = 'READY', age = 5) => ({
  versionNo, originalFilename, status, createdAt: daysAgo(age), uploadedBy: null, text: body, readyAt: null,
});

// 구간 요약 (from 버전 기준). 없으면 "OK + 일반 문구", 'FAILED' 면 요약 실패
const SUMMARY = {
  '1:1': { changeType: 'PROCEDURE', summary: '승인 절차에 부서장 검토 단계가 추가됨' },
  '1:2': { changeType: 'NUMERIC', summary: '롤백 제한 시간이 당일에서 2시간으로 줄어듦' },
  '1:3': 'FAILED',
};

let nextDocId = 10;
let nextPermId = 100;
const documents = [
  {
    documentId: 1, name: '배포 가이드', description: '서비스 배포 절차와 승인 체계', ownerUuid: 'u-leader', createdAt: daysAgo(10),
    versions: [1, 2, 3, 4].map((n) => ver(n, `deploy_guide_v${n}.${n === 4 ? 'docx' : 'pdf'}`, text(n), 'READY', 12 - n * 2))
  },
  {
    documentId: 2, name: '보안 점검 체크리스트', description: '분기별 보안 점검 항목', ownerUuid: 'u-leader', createdAt: daysAgo(8),
    versions: [ver(1, 'security_v1.pdf', text(1), 'READY', 8), ver(2, 'security_v2.pdf', text(2), 'PROCESSING', 0)]
  },
  {
    documentId: 3, name: '회의록 양식', description: '', ownerUuid: 'u-leader', createdAt: daysAgo(7),
    versions: [ver(1, 'minutes_v1.docx', text(1), 'READY', 7), ver(2, 'minutes_v2.docx', text(2), 'FAILED', 6)]
  },
  { documentId: 4, name: '개인정보 처리 지침', description: '', ownerUuid: 'u-leader', createdAt: daysAgo(3), versions: [] },
  {
    documentId: 5, name: '신입 온보딩 안내', description: '입사 첫 주 안내', ownerUuid: 'u-leader2', createdAt: daysAgo(6),
    versions: [ver(1, 'onboarding.docx', text(4), 'READY', 6)]
  },
  {
    documentId: 6, name: '장애 대응 매뉴얼', description: '장애 등급별 대응', ownerUuid: 'u-leader2', createdAt: daysAgo(2),
    versions: [ver(1, 'incident.pdf', text(3), 'READY', 2)]
  },
].map((d) => ({ ...d, updatedAt: d.createdAt }));

const perm = (documentId, uuid, status, age) => ({
  permissionId: nextPermId++, documentId, uuid, status, grantedAt: daysAgo(age), respondedAt: status === 'PENDING' ? null : daysAgo(age - 1),
});
const permissions = [
  perm(1, 'u-member', 'ACCEPTED', 9), perm(1, 'u-leader2', 'PENDING', 1), perm(1, 'u-member2', 'REJECTED', 5),
  perm(5, 'u-leader', 'ACCEPTED', 5), perm(5, 'u-member', 'ACCEPTED', 5),
  perm(6, 'u-leader', 'PENDING', 1), perm(6, 'u-member', 'PENDING', 1),
];

const accessTokens = new Map(); // token -> { uuid, exp }
const refreshTokens = new Map(); // token -> { uuid, revoked }
const sessions = new Map(); // sessionId -> { uuid, messages }
let nextSessionId = 1;
let nextMessageId = 1;
const hits = new Map(); // `${uuid}:${kind}` -> 최근 1분 요청 시각

// ---------- 도우미 ----------
const ok = (data, status = 200) => ({ status, body: { success: true, data, message: 'OK' } });
const noContent = () => ({ status: 204 });
const fail = (status, code, message) => ({
  status, body: { success: false, error: { code, message, traceId: crypto.randomBytes(4).toString('hex') } },
});
const invalid = (message = '입력값이 올바르지 않습니다') => fail(400, 'VALIDATION_ERROR', message);
const forbidden = () => fail(403, 'FORBIDDEN', '권한이 없습니다');
const notFoundDoc = () => fail(404, 'DOCUMENT_NOT_FOUND', '문서를 찾을 수 없습니다');

function issueTokens(user) {
  const accessToken = crypto.randomUUID();
  const refreshToken = crypto.randomUUID();
  accessTokens.set(accessToken, { uuid: user.uuid, exp: Date.now() + TTL });
  refreshTokens.set(refreshToken, { uuid: user.uuid, revoked: false });
  return { accessToken, refreshToken };
}

function overLimit(uuid, kind, perMinute) {
  const key = `${uuid}:${kind}`;
  const list = (hits.get(key) ?? []).filter((t) => Date.now() - t < 60000);
  list.push(Date.now());
  hits.set(key, list);
  return list.length > perMinute;
}

// 분석 중(PROCESSING) 버전은 처음 조회되고 8초 뒤 READY 가 됩니다
function tick(doc) {
  for (const v of doc.versions) {
    if (v.status !== 'PROCESSING') continue;
    v.readyAt ??= Date.now() + 8000;
    if (Date.now() >= v.readyAt) v.status = 'READY';
  }
}

const canRead = (doc, me) =>
  doc.ownerUuid === me.uuid || permissions.some((p) => p.documentId === doc.documentId && p.uuid === me.uuid && p.status === 'ACCEPTED');
const currentNo = (doc) => doc.versions.at(-1)?.versionNo ?? 0;
function docStatus(doc) {
  if (doc.versions.length === 0) return 'EMPTY';
  if (doc.versions.some((v) => v.status === 'PROCESSING')) return 'PROCESSING';
  return doc.versions.at(-1).status;
}
const summaryOf = (doc, me) => ({
  documentId: doc.documentId, name: doc.name, description: doc.description, currentVersionNo: currentNo(doc),
  status: docStatus(doc), owned: doc.ownerUuid === me.uuid, updatedAt: doc.updatedAt,
});
const versionOf = ({ versionNo, originalFilename, status, createdAt }) => ({ versionNo, originalFilename, status, createdAt });

// 줄 단위 LCS diff → diffJson (java-diff-utils 형식 흉내, DB 설계서 4.3)
function diffJson(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const blocks = [];
  let cur = null;
  for (let i = 0, j = 0; i < n || j < m;) {
    if (i < n && j < m && a[i] === b[j]) {
      if (cur) blocks.push(cur);
      cur = null;
      i++;
      j++;
      continue;
    }
    cur ??= { fromLine: i, fromCount: 0, toLine: j, toCount: 0 };
    if (j >= m || (i < n && dp[i + 1][j] >= dp[i][j + 1])) { cur.fromCount++; i++; } else { cur.toCount++; j++; }
  }
  if (cur) blocks.push(cur);
  return blocks.map((x) => ({ type: x.fromCount && x.toCount ? 'CHANGE' : x.fromCount ? 'DELETE' : 'INSERT', ...x }));
}

function historyOf(doc) {
  const vs = doc.versions;
  const segments = vs.slice(0, -1).map((v, k) => {
    const next = vs[k + 1];
    const changeCount = diffJson(v.text.split('\n'), next.text.split('\n')).length;
    const base = { from: v.versionNo, to: next.versionNo, changeCount };
    const s = SUMMARY[`${doc.documentId}:${v.versionNo}`];
    if (changeCount === 0) return { ...base, changeType: null, summary: null, summaryStatus: 'SKIPPED' };
    if (s === 'FAILED') return { ...base, changeType: null, summary: null, summaryStatus: 'FAILED' };
    return { ...base, changeType: s?.changeType ?? 'WORDING', summary: s?.summary ?? `문장 ${changeCount}곳이 바뀜`, summaryStatus: 'OK' };
  });
  return { documentId: doc.documentId, versions: vs.map(versionOf), segments };
}

// 버전 목록·단건 응답 (API-V-02·V-03, 04 5.11). changeType·changeSummary 는 직전 버전 대비 구간 요약.
function versionDetailOf(doc, v) {
  const seg = historyOf(doc).segments.find((s) => s.to === v.versionNo);
  const ok = seg?.summaryStatus === 'OK' && v.status === 'READY'; // 분석이 끝난 버전만 요약이 있음
  return {
    ...versionOf(v),
    fileSize: Buffer.byteLength(v.text, 'utf8'),
    changeType: ok ? seg.changeType : null,
    changeSummary: ok ? seg.summary : null,
  };
}

// ---------- 질의응답 (SSE) ----------
const SOURCES = [
  { documentId: 1, documentName: '배포 가이드', versionNo: 4, pageNumber: 2, chunkText: '승인 요청 후 팀장과 부서장이 차례로 검토한다.' },
  { documentId: 5, documentName: '신입 온보딩 안내', versionNo: 1, pageNumber: null, chunkText: '배포 창구는 평일 오후 2시에 연다.' },
];

// 질문에 넣는 단어로 상황을 흉내 냅니다: 429 / 502 / 없음(근거 없음) / 끊김(스트림 중단) / 가림(다음 기록 조회 때 masked)
async function streamAnswer(res, session, question) {
  const none = question.includes('없음');
  const answer = none ? '찾지 못했습니다' : '배포 승인은 팀장과 부서장이 차례로 검토한 뒤 확정합니다. 롤백은 배포 후 2시간 안에 요청해야 합니다.';
  const sources = none ? [] : SOURCES;
  session.messages.push({ messageId: nextMessageId++, role: 'USER', content: question, masked: false, sources: [], createdAt: now() });

  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' });
  await sleep(700); // Backend 가 근거를 확인한 뒤 흘려보내므로 첫 토큰이 늦습니다
  const pieces = answer.match(/.{1,4}/gs) ?? [];
  for (const [i, t] of pieces.entries()) {
    if (question.includes('끊김') && i === 6) return res.end();
    const line = `data: ${JSON.stringify({ token: t })}\n\n`;
    if (i % 5 === 0) {
      // 줄 중간에서 끊어 보내 FE 의 버퍼 처리를 확인합니다
      res.write(line.slice(0, 9));
      await sleep(30);
      res.write(line.slice(9));
    } else res.write(line);
    await sleep(60);
  }
  if (sources.length) res.write(`data: ${JSON.stringify({ sources })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
  session.messages.push({
    messageId: nextMessageId++, role: 'ASSISTANT', content: answer, masked: question.includes('가림'), sources, createdAt: now(),
  });
}

// ---------- 라우팅 ----------
async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}
function parseJson(buf) {
  try {
    return JSON.parse(buf.toString('utf8') || '{}');
  } catch {
    return {};
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordOk = (p) =>
  typeof p === 'string' && p.length >= 8 && p.length <= 64 && [/[A-Za-z]/, /\d/, /[^A-Za-z\d]/].filter((r) => r.test(p)).length >= 2;

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/^\/api/, '');
  const { method } = req;
  const raw = await readBody(req);
  const body = parseJson(raw);
  let m;

  // --- 인증 (API-A) ---
  if (method === 'POST' && path === '/auth/signup') {
    const { email, password, name, rankLevel, signupKey } = body;
    if (!EMAIL_RE.test(email ?? '') || email.length > 255) return invalid('이메일 형식이 올바르지 않습니다');
    if (!passwordOk(password)) return invalid('비밀번호는 8~64자, 영문·숫자·특수문자 중 2종 이상이어야 합니다');
    if (typeof name !== 'string' || name.trim().length < 1 || name.length > 50) return invalid('이름은 1~50자로 입력해 주세요');
    if (![1, 2].includes(rankLevel)) return invalid();
    if (rankLevel === 2 && signupKey !== SIGNUP_KEY) return invalid(); // 키 오류도 일반 입력 오류와 같은 400
    if (users.some((u) => u.email === email)) return fail(409, 'EMAIL_DUPLICATED', '이미 가입된 이메일입니다');
    const user = { uuid: `u-${crypto.randomBytes(3).toString('hex')}`, email, password, name: name.trim(), rankLevel, createdAt: now(), failed: 0, lockedUntil: 0 };
    users.push(user);
    return ok({ uuid: user.uuid }, 201);
  }
  if (method === 'POST' && path === '/auth/login') {
    const user = users.find((u) => u.email === body.email);
    if (user && user.lockedUntil > Date.now()) return fail(423, 'ACCOUNT_LOCKED', '계정이 잠겼습니다. 잠시 후 다시 시도하세요');
    if (!user || user.password !== body.password) {
      if (user && ++user.failed >= 5) Object.assign(user, { failed: 0, lockedUntil: Date.now() + 15 * 60000 });
      return fail(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다');
    }
    user.failed = 0;
    return ok({ ...issueTokens(user), name: user.name, rankLevel: user.rankLevel });
  }
  if (method === 'POST' && path === '/auth/refresh') {
    const r = refreshTokens.get(body.refreshToken);
    if (!r) return fail(401, 'UNAUTHORIZED', '다시 로그인해 주세요');
    if (r.revoked) {
      // 폐기된 토큰을 다시 쓰면 그 사용자의 토큰을 전부 폐기 (API-A-3)
      for (const t of refreshTokens.values()) if (t.uuid === r.uuid) t.revoked = true;
      return fail(401, 'UNAUTHORIZED', '다시 로그인해 주세요');
    }
    r.revoked = true;
    return ok(issueTokens(byUuid(r.uuid)));
  }

  // 이 아래는 로그인 필요
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  const t = accessTokens.get(token);
  const me = t && t.exp > Date.now() ? byUuid(t.uuid) : null;
  if (!me) return fail(401, 'UNAUTHORIZED', '로그인이 필요합니다');

  if (method === 'POST' && path === '/auth/logout') {
    accessTokens.delete(token);
    const r = refreshTokens.get(body.refreshToken);
    if (r) r.revoked = true;
    return ok(null);
  }

  // --- 사용자 ---
  if (method === 'GET' && path === '/users/me') {
    const { uuid, email, name, rankLevel, createdAt } = me;
    return ok({ uuid, email, name, rankLevel, createdAt });
  }
  if (method === 'GET' && path === '/users/lookup') {
    if (me.rankLevel !== 2) return forbidden();
    if (overLimit(me.uuid, 'lookup', 30)) return fail(429, 'RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다. 잠시 후 다시 시도하세요');
    const email = url.searchParams.get('email') ?? '';
    if (!EMAIL_RE.test(email)) return invalid('이메일 형식이 올바르지 않습니다');
    const user = users.find((u) => u.email === email);
    if (!user) return fail(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');
    return ok({ uuid: user.uuid, name: user.name, email: user.email });
  }

  // --- 받은 초대 (API-P-5~7) ---
  if (method === 'GET' && path === '/invitations') {
    const mine = permissions.filter((p) => p.uuid === me.uuid && p.status === 'PENDING');
    return ok(mine.map((p) => {
      const doc = documents.find((d) => d.documentId === p.documentId);
      return { invitationId: p.permissionId, documentName: doc.name, invitedByName: byUuid(doc.ownerUuid).name, grantedAt: p.grantedAt };
    }));
  }
  if (method === 'POST' && (m = path.match(/^\/invitations\/(\d+)\/(accept|reject)$/))) {
    const p = permissions.find((x) => x.permissionId === Number(m[1]) && x.uuid === me.uuid);
    if (!p) return notFoundDoc();
    if (p.status !== 'PENDING') return invalid('이미 응답한 초대입니다');
    Object.assign(p, { status: m[2] === 'accept' ? 'ACCEPTED' : 'REJECTED', respondedAt: now() });
    return ok(null);
  }

  // --- 문서 (API-D) ---
  if (method === 'GET' && path === '/documents') {
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 20);
    const all = documents.filter((d) => canRead(d, me)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    all.forEach(tick);
    return ok({ content: all.slice(page * size, (page + 1) * size).map((d) => summaryOf(d, me)), page, size, totalElements: all.length });
  }
  if (method === 'POST' && path === '/documents') {
    if (me.rankLevel !== 2) return forbidden();
    const { name, description = '', inviteeEmails = [] } = body;
    if (typeof name !== 'string' || !name.trim() || name.length > 200 || description.length > 500 || inviteeEmails.length > 50) return invalid();
    const doc = { documentId: nextDocId++, name: name.trim(), description, ownerUuid: me.uuid, createdAt: now(), updatedAt: now(), versions: [] };
    documents.push(doc);
    const { invited, notFound } = invite(doc, me, inviteeEmails);
    return ok({ documentId: doc.documentId, currentVersionNo: 0, status: 'EMPTY', invited, notFound }, 201);
  }

  if (!(m = path.match(/^\/documents\/(\d+)(\/.*)?$/))) return fail(404, 'NOT_FOUND', '경로를 찾을 수 없습니다');
  const doc = documents.find((d) => d.documentId === Number(m[1]));
  if (!doc || !canRead(doc, me)) return notFoundDoc(); // 권한 밖도 없는 문서와 같은 응답
  tick(doc);
  const sub = m[2] ?? '';
  const owner = doc.ownerUuid === me.uuid;

  if (sub === '' && method === 'GET') {
    const u = byUuid(doc.ownerUuid);
    return ok({ ...summaryOf(doc, me), uploadedBy: { name: u.name, email: u.email, rankLevel: u.rankLevel }, versions: doc.versions.map(versionOf) });
  }
  if (sub === '' && method === 'PATCH') {
    if (!owner) return forbidden();
    const { name, description } = body;
    if (name === undefined && description === undefined) return invalid('수정할 항목이 없습니다');
    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 200)) return invalid();
    if (description !== undefined && String(description).length > 500) return invalid();
    Object.assign(doc, name !== undefined && { name: name.trim() }, description !== undefined && { description }, { updatedAt: now() });
    return ok({ documentId: doc.documentId, name: doc.name, description: doc.description, updatedAt: doc.updatedAt });
  }
  if (sub === '' && method === 'DELETE') {
    if (!owner) return forbidden();
    documents.splice(documents.indexOf(doc), 1);
    for (let i = permissions.length - 1; i >= 0; i--) if (permissions[i].documentId === doc.documentId) permissions.splice(i, 1);
    return noContent();
  }

  // --- 열람자 (API-P-1~4) ---
  if (sub === '/permissions' && method === 'GET') {
    // 등록자: 전체 / 그 외 열람자: 수락한 사람만 (DB 설계서 4.2)
    const list = permissions.filter((p) => p.documentId === doc.documentId && (owner || p.status === 'ACCEPTED'));
    return ok(list.map((p) => {
      const { uuid, name, email, rankLevel } = byUuid(p.uuid);
      if (!owner) return { name, rankLevel, email };
      return { permissionId: p.permissionId, uuid, name, email, rankLevel, status: p.status, grantedAt: p.grantedAt, respondedAt: p.respondedAt };
    }));
  }
  if (sub === '/permissions' && method === 'POST') {
    if (!owner) return forbidden();
    const emails = body.inviteeEmails;
    if (!Array.isArray(emails) || emails.length < 1 || emails.length > 50) return invalid();
    return ok(invite(doc, me, emails), 201);
  }
  if ((m = sub.match(/^\/permissions\/([^/]+)$/)) && method === 'DELETE') {
    if (!owner) return forbidden();
    const uuid = decodeURIComponent(m[1]);
    if (uuid === me.uuid) return invalid('등록자 본인은 회수할 수 없습니다');
    const i = permissions.findIndex((p) => p.documentId === doc.documentId && p.uuid === uuid);
    if (i < 0) return notFoundDoc();
    permissions.splice(i, 1);
    return noContent();
  }

  // --- 버전 (API-V) ---
  if (sub === '/versions' && method === 'POST') {
    if (!owner) return forbidden();
    // multipart 본문에서 파일 이름만 꺼냅니다. 이름에 dup 이 들어가면 "직전 버전과 같은 내용" 으로 거부
    const names = [...raw.toString('latin1').matchAll(/filename="([^"]*)"/g)].map((x) => Buffer.from(x[1], 'latin1').toString('utf8'));
    if (names.length < 1 || names.length > 10) return invalid('파일은 한 번에 1~10개까지 올릴 수 있습니다');
    if (names.some((n) => !(/\.(pdf|docx)$/i.test(n) || TEXT_EXT.test(n)) || /[\\/]/.test(n))) return invalid('지원하지 않는 파일 형식입니다');
    if (names.some((n) => /dup/i.test(n))) return invalid('직전 버전과 내용이 같은 파일입니다');
    const created = names.map((n) => {
      const no = currentNo(doc) + 1;
      const prev = doc.versions.at(-1)?.text ?? text(1);
      const status = TEXT_EXT.test(n) ? 'READY' : 'PROCESSING';
      doc.versions.push({ ...ver(no, n, `${prev}\nv${no} 에서 추가된 문장이다.`, status, 0), uploadedBy: me.uuid });
      return { versionNo: no, status };
    });
    doc.updatedAt = now();
    return ok({ documentId: doc.documentId, currentVersionNo: currentNo(doc), versions: created }, 201);
  }
  if (sub === '/versions' && method === 'GET') return ok(doc.versions.map((v) => versionDetailOf(doc, v)));
  if ((m = sub.match(/^\/versions\/(\d+)\/content$/)) && method === 'GET') {
    const v = doc.versions.find((x) => x.versionNo === Number(m[1]));
    if (!v) return notFoundDoc();
    const kind = /\.(pdf|docx)$/i.test(v.originalFilename) ? 'DOC' : 'TEXT';
    return ok({
      versionNo: v.versionNo, originalFilename: v.originalFilename, kind,
      content: v.status === 'READY' ? v.text : null, truncated: /long/i.test(v.originalFilename)
    });
  }
  if ((m = sub.match(/^\/versions\/(\d+)$/))) {
    const i = doc.versions.findIndex((v) => v.versionNo === Number(m[1]));
    if (i < 0) return notFoundDoc();
    if (method === 'GET') return ok(versionDetailOf(doc, doc.versions[i]));
    if (method === 'DELETE') {
      if (!owner) return forbidden();
      if (doc.versions.length <= 1) return invalid('마지막 버전은 삭제할 수 없습니다');
      doc.versions.splice(i, 1);
      return noContent();
    }
  }
  if (sub === '/history' && method === 'GET') return ok(historyOf(doc));

  // --- 비교 (API-C-01) ---
  if (sub === '/compare' && method === 'GET') {
    const from = Number(url.searchParams.get('from'));
    const to = Number(url.searchParams.get('to'));
    if (!Number.isInteger(from) || !Number.isInteger(to) || from <= 0 || to <= 0 || from === to) {
      return invalid('비교할 두 버전을 올바르게 선택해 주세요');
    }
    const a = doc.versions.find((v) => v.versionNo === from);
    const b = doc.versions.find((v) => v.versionNo === to);
    if (!a || !b) return notFoundDoc();
    if (a.status !== 'READY' || b.status !== 'READY') return invalid('준비 완료된 버전만 비교할 수 있습니다');
    const blocks = diffJson(a.text.split('\n'), b.text.split('\n'));
    return ok({ fromVersionNo: from, toVersionNo: to, fromText: a.text, toText: b.text, changeCount: blocks.length, diffJson: blocks });
  }

  return fail(404, 'NOT_FOUND', '경로를 찾을 수 없습니다');
}

function invite(doc, me, emails) {
  let invited = 0;
  const notFound = [];
  for (const email of new Set(emails)) {
    const user = users.find((u) => u.email === email);
    if (!user) {
      notFound.push(email);
      continue;
    }
    if (user.uuid === me.uuid) continue;
    const existing = permissions.find((p) => p.documentId === doc.documentId && p.uuid === user.uuid);
    if (existing) {
      // 대기·수락 중이면 무시, 거절했으면 다시 대기로 (DB 설계서 재초대 규칙)
      if (existing.status === 'REJECTED') {
        Object.assign(existing, { status: 'PENDING', grantedAt: now(), respondedAt: null });
        invited++;
      }
      continue;
    }
    permissions.push({ permissionId: nextPermId++, documentId: doc.documentId, uuid: user.uuid, status: 'PENDING', grantedAt: now(), respondedAt: null });
    invited++;
  }
  return { invited, notFound };
}

// --- 질의응답 (API-Q) --- 문서 경로 앞에서 처리
async function handleChat(req, res, path) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  const t = accessTokens.get(token);
  const me = t && t.exp > Date.now() ? byUuid(t.uuid) : null;
  if (!me) return fail(401, 'UNAUTHORIZED', '로그인이 필요합니다');
  const body = parseJson(await readBody(req));
  let m;

  if (req.method === 'POST' && path === '/chat/sessions') {
    const sessionId = nextSessionId++;
    sessions.set(sessionId, { uuid: me.uuid, messages: [] });
    return ok({ sessionId, title: '새 대화' }, 201);
  }
  if (req.method === 'GET' && (m = path.match(/^\/chat\/sessions\/(\d+)\/messages$/))) {
    const s = sessions.get(Number(m[1]));
    if (!s || s.uuid !== me.uuid) return notFoundDoc(); // 남의 대화도 404
    return ok(s.messages);
  }
  if (req.method === 'POST' && path === '/ai/chat') {
    const s = sessions.get(Number(body.sessionId));
    if (!s || s.uuid !== me.uuid) return notFoundDoc();
    const question = String(body.question ?? '');
    if (question.trim().length < 1 || question.length > 1000) return invalid('질문은 1~1000자로 입력해 주세요');
    if (question.includes('429') || overLimit(me.uuid, 'chat', 20)) return fail(429, 'RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다.');
    if (question.includes('502')) return fail(502, 'AI_UNAVAILABLE', 'AI 모듈 오류');
    await streamAnswer(res, s, question);
    return null; // 응답을 직접 썼음
  }
  return fail(404, 'NOT_FOUND', '경로를 찾을 수 없습니다');
}

http
  .createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname.replace(/^\/api/, '');
      const out = /^\/(chat|ai)\//.test(path) ? await handleChat(req, res, path) : await handle(req, res);
      if (!out) return;
      if (out.status === 204) return res.writeHead(204).end();
      res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(out.body));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  })
  .listen(PORT, () => console.log(`[mock] http://localhost:${PORT}  (계정은 README "테스트 계정")`));
