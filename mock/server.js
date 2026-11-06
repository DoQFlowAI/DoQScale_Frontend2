// 로컬 개발용 목(Mock) Backend. 실제 Backend 가 없을 때 `npm run mock` 으로 띄운다 (포트 8080).
// API 설계서 v1.4 / FE 명세서 v1.3 의 경로·필드를 따른다. 데이터는 메모리에만 있고 재시작하면 초기화된다.
//   팀장  leader@example.com / Passw0rd!
//   사원  member@example.com / Passw0rd!
// 환경변수: MOCK_TOKEN_TTL_SEC (액세스 토큰 수명, 기본 600. 20 으로 두면 refresh 흐름을 볼 수 있음)
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT || 8080);
const TTL = Number(process.env.MOCK_TOKEN_TTL_SEC || 600) * 1000;
const rid = () => crypto.randomBytes(12).toString('hex');
const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// ---------- 데이터 ----------
const users = [
  { uuid: 'u-leader', email: 'leader@example.com', password: 'Passw0rd!', name: '장지웅', rankLevel: 2, failed: 0, lockedUntil: 0 },
  { uuid: 'u-member', email: 'member@example.com', password: 'Passw0rd!', name: '김정현', rankLevel: 1, failed: 0, lockedUntil: 0 },
  { uuid: 'u-hong', email: 'hong@example.com', password: 'Passw0rd!', name: '홍서연', rankLevel: 2, failed: 0, lockedUntil: 0 },
  { uuid: 'u-won', email: 'won@example.com', password: 'Passw0rd!', name: '원종현', rankLevel: 1, failed: 0, lockedUntil: 0 },
  { uuid: 'u-son', email: 'son@example.com', password: 'Passw0rd!', name: '손인선', rankLevel: 1, failed: 0, lockedUntil: 0 },
];
const byUuid = (id) => users.find((u) => u.uuid === id);

const LINES = {
  1: ['1. 목적', '배포 절차와 승인 체계를 정의한다.', '승인 요청 후 팀장이 검토한다.', '구버전 스크립트는 수동으로 실행한다.', '2. 배포 창구', '배포 창구는 평일 오후 2시에 연다.', '3. 롤백', '롤백은 당일 안에 요청해야 한다.', '롤백 후에는 결과를 공유한다.'],
  2: ['1. 목적', '배포 절차와 승인 체계를 정의한다.', '승인 요청 후 팀장과 부서장이 차례로 검토한다.', '구버전 스크립트는 수동으로 실행한다.', '2. 배포 창구', '배포 창구는 평일 오후 2시에 연다.', '3. 롤백', '롤백은 당일 안에 요청해야 한다.', '롤백 후에는 결과를 공유한다.'],
  3: ['1. 목적', '배포 절차와 승인 체계를 정의한다.', '승인 요청 후 팀장과 부서장이 차례로 검토한다.', '2. 배포 창구', '배포 창구는 평일 오후 2시에 연다.', '3. 롤백', '롤백은 배포 후 2시간 안에 요청해야 한다.', '롤백 후에는 결과를 공유한다.'],
  4: ['1. 목적', '배포 절차와 승인 체계를 정의한다.', '승인 요청 후 팀장과 부서장이 차례로 검토한다.', '2. 배포 창구', '배포 창구는 평일 오후 2시에 연다.', '배포 전 자동 점검을 통과해야 한다.', '실패 시 알림 채널로 즉시 공유한다.', '3. 롤백', '롤백은 배포 후 2시간 안에 요청해야 한다.', '롤백 후에는 결과를 공유한다.'],
};
const mkVersion = (no, name, text, status = 'READY', age = 10) => ({
  versionNo: no, originalFilename: name, status, createdAt: daysAgo(age), text, fileSize: 184320,
});

let nextDocId = 10;
let nextPermId = 100;
const documents = [
  {
    documentId: 1, name: '배포 가이드', description: '서비스 배포 절차와 승인 체계', uploadedBy: 'u-leader', createdAt: daysAgo(10),
    versions: [1, 2, 3, 4].map((n) => mkVersion(n, `deploy_guide_v${n}.${n === 4 ? 'docx' : 'pdf'}`, LINES[n].join('\n'), 'READY', 12 - n * 2)),
  },
  {
    documentId: 2, name: '보안 점검 체크리스트', description: '분기별 보안 점검 항목', uploadedBy: 'u-leader', createdAt: daysAgo(8),
    versions: [mkVersion(1, 'security_v1.pdf', LINES[1].join('\n'), 'READY', 8), mkVersion(2, 'security_v2.pdf', LINES[2].join('\n'), 'PROCESSING', 0)],
    readyAt: Date.now() + 9000,
  },
  {
    documentId: 3, name: '신입 온보딩 안내', description: '입사 첫 주 안내', uploadedBy: 'u-hong', createdAt: daysAgo(6),
    versions: [mkVersion(1, 'onboarding.docx', LINES[4].join('\n'), 'READY', 6)],
  },
  { documentId: 4, name: '개인정보 처리 지침', description: '', uploadedBy: 'u-leader', createdAt: daysAgo(3), versions: [] },
  {
    documentId: 5, name: '장애 대응 매뉴얼', description: '장애 등급별 대응', uploadedBy: 'u-hong', createdAt: daysAgo(2),
    versions: [mkVersion(1, 'incident.pdf', LINES[3].join('\n'), 'READY', 2)],
  },
];
const permissions = [
  { permissionId: 1, documentId: 1, uuid: 'u-member', status: 'ACCEPTED', grantedAt: daysAgo(9), respondedAt: daysAgo(9) },
  { permissionId: 2, documentId: 1, uuid: 'u-hong', status: 'PENDING', grantedAt: daysAgo(1), respondedAt: null },
  { permissionId: 3, documentId: 1, uuid: 'u-son', status: 'REJECTED', grantedAt: daysAgo(5), respondedAt: daysAgo(4) },
  { permissionId: 4, documentId: 3, uuid: 'u-leader', status: 'ACCEPTED', grantedAt: daysAgo(5), respondedAt: daysAgo(5) },
  { permissionId: 5, documentId: 3, uuid: 'u-won', status: 'ACCEPTED', grantedAt: daysAgo(5), respondedAt: daysAgo(5) },
  { permissionId: 6, documentId: 5, uuid: 'u-leader', status: 'PENDING', grantedAt: daysAgo(1), respondedAt: null },
];

const tokens = new Map(); // access -> { uuid, exp }
const refreshTokens = new Map(); // refresh -> { uuid, revoked }
const sessions = new Map(); // sessionId -> { uuid, messages: [] }
let nextSession = 1;
let nextMsg = 1;
const rate = new Map(); // uuid -> [timestamps]

// ---------- 유틸 ----------
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
function send(res, status, body) {
  if (status === 204) {
    res.writeHead(204, cors);
    return res.end();
  }
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...cors });
  res.end(JSON.stringify(body));
}
const ok = (res, data, status = 200) => send(res, status, { success: true, data, message: 'OK' });
const fail = (res, status, code, message) =>
  send(res, status, { success: false, error: { code, message, traceId: rid().slice(0, 9) } });
const notFoundDoc = (res) => fail(res, 404, 'DOCUMENT_NOT_FOUND', '문서를 찾을 수 없습니다');
const validation = (res, message = '입력값이 올바르지 않습니다') => fail(res, 400, 'VALIDATION_ERROR', message);

const readBody = (req) => new Promise((resolve) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
});
const parseJson = (buf) => { try { return JSON.parse(buf.toString('utf8') || '{}'); } catch { return null; } };

function auth(req) {
  const h = req.headers.authorization || '';
  const t = tokens.get(h.replace(/^Bearer /, ''));
  if (!t || t.exp < Date.now()) return null;
  return byUuid(t.uuid);
}
function issue(user) {
  const access = rid() + rid();
  const refresh = rid() + rid();
  tokens.set(access, { uuid: user.uuid, exp: Date.now() + TTL });
  refreshTokens.set(refresh, { uuid: user.uuid, revoked: false });
  return { accessToken: access, refreshToken: refresh };
}

const canRead = (doc, me) =>
  doc.uploadedBy === me.uuid || permissions.some((p) => p.documentId === doc.documentId && p.uuid === me.uuid && p.status === 'ACCEPTED');
const docStatus = (doc) => {
  if (doc.versions.length === 0) return 'EMPTY';
  if (doc.versions.some((v) => v.status === 'PROCESSING')) return 'PROCESSING';
  const last = doc.versions[doc.versions.length - 1];
  return last.status === 'FAILED' ? 'FAILED' : 'READY';
};
const currentNo = (doc) => (doc.versions.length ? Math.max(...doc.versions.map((v) => v.versionNo)) : 0);

function tick() {
  for (const d of documents) {
    if (d.readyAt && Date.now() >= d.readyAt) {
      d.versions.forEach((v) => { if (v.status === 'PROCESSING') v.status = 'READY'; });
      d.readyAt = null;
    }
  }
}

// 줄 단위 LCS diff → diffJson (java-diff-utils 형식 흉내)
function diffBlocks(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const blocks = [];
  let i = 0, j = 0, cur = null;
  const flush = () => { if (cur) { blocks.push(cur); cur = null; } };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { flush(); i++; j++; continue; }
    if (!cur) cur = { fromLine: i, fromCount: 0, toLine: j, toCount: 0 };
    if (j >= m || (i < n && dp[i + 1][j] >= dp[i][j + 1])) { cur.fromCount++; i++; } else { cur.toCount++; j++; }
  }
  flush();
  return blocks.map((x) => ({ type: x.fromCount && x.toCount ? 'CHANGE' : x.fromCount ? 'DELETE' : 'INSERT', ...x }));
}

function historyOf(doc) {
  const vs = [...doc.versions].sort((x, y) => x.versionNo - y.versionNo);
  const segments = [];
  for (let k = 0; k < vs.length - 1; k++) {
    const blocks = diffBlocks(vs[k].text.split('\n'), vs[k + 1].text.split('\n'));
    const f = vs[k].versionNo, t = vs[k + 1].versionNo;
    if (blocks.length === 0) segments.push({ from: f, to: t, changeType: null, summary: null, changeCount: 0, summaryStatus: 'SKIPPED' });
    else if (k === 2) segments.push({ from: f, to: t, changeType: null, summary: null, changeCount: blocks.length, summaryStatus: 'FAILED' });
    else segments.push({ from: f, to: t, changeType: k === 1 ? 'NUMERIC' : 'PROCEDURE', summary: k === 1 ? '롤백 제한 시간이 당일에서 2시간으로 줄어듦' : '승인 절차에 부서장 검토 단계가 추가됨', changeCount: blocks.length, summaryStatus: 'OK' });
  }
  return { documentId: doc.documentId, versions: vs.map(({ versionNo, originalFilename, createdAt }) => ({ versionNo, originalFilename, createdAt })), segments };
}

const docSummary = (d, me) => ({
  documentId: d.documentId, name: d.name, description: d.description, currentVersionNo: currentNo(d),
  status: docStatus(d), owned: d.uploadedBy === me.uuid, updatedAt: d.createdAt,
});

// ---------- 라우터 ----------
async function handle(req, res) {
  tick();
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/^\/api/, '');
  const method = req.method;
  if (method === 'OPTIONS') return send(res, 204);
  let m;

  // --- 인증 ---
  if (method === 'POST' && path === '/auth/signup') {
    const b = parseJson(await readBody(req));
    if (!b || !b.email || !b.name || !b.password || ![1, 2].includes(b.rankLevel)) return validation(res);
    if (users.some((u) => u.email === b.email)) return fail(res, 409, 'CONFLICT', '이미 가입된 이메일입니다');
    if (b.rankLevel === 2 && b.signupKey !== 'LEAD-KEY') return validation(res); // 키: LEAD-KEY (SEC-B 조치 후 동작 흉내)
    const u = { uuid: `u-${rid().slice(0, 6)}`, email: b.email, password: b.password, name: b.name, rankLevel: b.rankLevel, failed: 0, lockedUntil: 0 };
    users.push(u);
    return ok(res, { uuid: u.uuid }, 201);
  }
  if (method === 'POST' && path === '/auth/login') {
    const b = parseJson(await readBody(req)) || {};
    const u = users.find((x) => x.email === b.email);
    if (u && u.lockedUntil > Date.now()) return fail(res, 423, 'ACCOUNT_LOCKED', '계정이 잠겼습니다. 잠시 후 다시 시도하세요.');
    if (!u || u.password !== b.password) {
      if (u && ++u.failed >= 5) { u.lockedUntil = Date.now() + 15 * 60000; u.failed = 0; }
      return fail(res, 401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다');
    }
    u.failed = 0;
    return ok(res, { ...issue(u), name: u.name, rankLevel: u.rankLevel });
  }
  if (method === 'POST' && path === '/auth/refresh') {
    const b = parseJson(await readBody(req)) || {};
    const r = refreshTokens.get(b.refreshToken);
    if (!r) return fail(res, 401, 'UNAUTHORIZED', '인증이 필요합니다');
    if (r.revoked) {
      for (const v of refreshTokens.values()) if (v.uuid === r.uuid) v.revoked = true;
      return fail(res, 401, 'UNAUTHORIZED', '인증이 필요합니다');
    }
    r.revoked = true;
    return ok(res, issue(byUuid(r.uuid)));
  }
  if (method === 'POST' && path === '/auth/logout') {
    const b = parseJson(await readBody(req)) || {};
    const r = refreshTokens.get(b.refreshToken);
    if (r) r.revoked = true;
    return ok(res, null);
  }

  // --- 이하 인증 필요 ---
  const me = auth(req);
  if (!me) { await readBody(req); return fail(res, 401, 'UNAUTHORIZED', '인증이 필요합니다'); }

  if (method === 'GET' && path === '/users/me') {
    return ok(res, { uuid: me.uuid, email: me.email, name: me.name, rankLevel: me.rankLevel, createdAt: daysAgo(30) });
  }
  if (method === 'GET' && path === '/users/lookup') {
    if (me.rankLevel !== 2) return fail(res, 403, 'FORBIDDEN', '권한이 없습니다');
    const arr = (rate.get(me.uuid) || []).filter((t) => Date.now() - t < 60000);
    arr.push(Date.now()); rate.set(me.uuid, arr);
    if (arr.length > 30) return fail(res, 429, 'RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다. 잠시 후 다시 시도하세요');
    const email = url.searchParams.get('email') || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return validation(res, '이메일 형식이 올바르지 않습니다');
    const u = users.find((x) => x.email === email);
    if (!u) return fail(res, 404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');
    return ok(res, { uuid: u.uuid, name: u.name, email: u.email });
  }

  // --- 초대 ---
  if (method === 'GET' && path === '/invitations') {
    return ok(res, permissions.filter((p) => p.uuid === me.uuid && p.status === 'PENDING').map((p) => {
      const d = documents.find((x) => x.documentId === p.documentId);
      return { invitationId: p.permissionId, documentName: d.name, invitedByName: byUuid(d.uploadedBy).name, grantedAt: p.grantedAt };
    }));
  }
  if (method === 'POST' && (m = path.match(/^\/invitations\/(\d+)\/(accept|reject)$/))) {
    const p = permissions.find((x) => x.permissionId === Number(m[1]) && x.uuid === me.uuid);
    if (!p) return notFoundDoc(res);
    if (p.status !== 'PENDING') return validation(res, '이미 응답한 초대입니다');
    p.status = m[2] === 'accept' ? 'ACCEPTED' : 'REJECTED';
    p.respondedAt = now();
    return ok(res, null);
  }

  // --- 문서 ---
  if (method === 'GET' && path === '/documents') {
    const page = Number(url.searchParams.get('page') || 0);
    const size = Number(url.searchParams.get('size') || 20);
    const all = documents.filter((d) => canRead(d, me)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ok(res, { content: all.slice(page * size, page * size + size).map((d) => docSummary(d, me)), page, size, totalElements: all.length });
  }
  if (method === 'POST' && path === '/documents') {
    if (me.rankLevel !== 2) return fail(res, 403, 'FORBIDDEN', '권한이 없습니다');
    const b = parseJson(await readBody(req));
    if (!b || typeof b.name !== 'string' || b.name.trim().length < 1 || b.name.length > 200 || (b.description || '').length > 500) return validation(res);
    const emails = [...new Set(b.inviteeEmails || [])];
    if (emails.length > 50) return validation(res);
    const doc = { documentId: nextDocId++, name: b.name.trim(), description: b.description || '', uploadedBy: me.uuid, createdAt: now(), versions: [] };
    documents.push(doc);
    const notFound = [];
    let invited = 0;
    for (const e of emails) {
      const u = users.find((x) => x.email === e);
      if (!u) { notFound.push(e); continue; }
      if (u.uuid === me.uuid) continue;
      permissions.push({ permissionId: nextPermId++, documentId: doc.documentId, uuid: u.uuid, status: 'PENDING', grantedAt: now(), respondedAt: null });
      invited++;
    }
    return ok(res, { documentId: doc.documentId, currentVersionNo: 0, status: 'EMPTY', invited, notFound }, 201);
  }

  if ((m = path.match(/^\/documents\/(\d+)(\/.*)?$/))) {
    const doc = documents.find((d) => d.documentId === Number(m[1]));
    const sub = m[2] || '';
    if (!doc || !canRead(doc, me)) { await readBody(req); return notFoundDoc(res); }
    const owner = doc.uploadedBy === me.uuid;

    if (sub === '' && method === 'GET') {
      return ok(res, {
        documentId: doc.documentId, name: doc.name, description: doc.description, currentVersionNo: currentNo(doc),
        status: docStatus(doc), uploadedByName: byUuid(doc.uploadedBy).name, owned: owner,
        versions: doc.versions.map(({ versionNo, originalFilename, status, createdAt }) => ({ versionNo, originalFilename, status, createdAt })),
      });
    }
    if (sub === '' && method === 'PATCH') {
      const b = parseJson(await readBody(req));
      if (!owner) return fail(res, 403, 'FORBIDDEN', '권한이 없습니다');
      if (!b || (b.name === undefined && b.description === undefined)) return validation(res);
      if (b.name !== undefined && (typeof b.name !== 'string' || b.name.trim().length < 1 || b.name.length > 200)) return validation(res);
      if (b.description !== undefined && String(b.description).length > 500) return validation(res);
      if (b.name !== undefined) doc.name = b.name.trim();
      if (b.description !== undefined) doc.description = b.description;
      return ok(res, { documentId: doc.documentId, name: doc.name, description: doc.description, updatedAt: now() });
    }
    if (sub === '' && method === 'DELETE') {
      if (!owner) return fail(res, 403, 'FORBIDDEN', '권한이 없습니다');
      documents.splice(documents.indexOf(doc), 1);
      for (let i = permissions.length - 1; i >= 0; i--) if (permissions[i].documentId === doc.documentId) permissions.splice(i, 1);
      return send(res, 204);
    }

    if (sub === '/permissions' && method === 'GET') {
      const list = permissions.filter((p) => p.documentId === doc.documentId && (owner || p.status === 'ACCEPTED'));
      return ok(res, list.map((p) => { const u = byUuid(p.uuid); return { permissionId: p.permissionId, uuid: u.uuid, name: u.name, email: u.email, rankLevel: u.rankLevel, status: p.status, grantedAt: p.grantedAt, respondedAt: p.respondedAt }; }));
    }
    if (sub === '/permissions' && method === 'POST') {
      const b = parseJson(await readBody(req));
      if (!owner) return fail(res, 403, 'FORBIDDEN', '권한이 없습니다');
      if (!b || !Array.isArray(b.inviteeEmails) || b.inviteeEmails.length === 0 || b.inviteeEmails.length > 50) return validation(res);
      let invited = 0; const notFound = [];
      for (const e of new Set(b.inviteeEmails)) {
        const u = users.find((x) => x.email === e);
        if (!u) { notFound.push(e); continue; }
        if (u.uuid === me.uuid) continue;
        const ex = permissions.find((p) => p.documentId === doc.documentId && p.uuid === u.uuid);
        if (ex) { if (ex.status === 'REJECTED') { ex.status = 'PENDING'; ex.grantedAt = now(); ex.respondedAt = null; invited++; } continue; }
        permissions.push({ permissionId: nextPermId++, documentId: doc.documentId, uuid: u.uuid, status: 'PENDING', grantedAt: now(), respondedAt: null });
        invited++;
      }
      return ok(res, { invited, notFound }, 201);
    }
    if ((m = sub.match(/^\/permissions\/([^/]+)$/)) && method === 'DELETE') {
      if (!owner) return fail(res, 403, 'FORBIDDEN', '권한이 없습니다');
      const uuid = decodeURIComponent(m[1]);
      if (uuid === me.uuid) return validation(res, '등록자 본인은 회수할 수 없습니다');
      const i = permissions.findIndex((p) => p.documentId === doc.documentId && p.uuid === uuid);
      if (i < 0) return notFoundDoc(res);
      permissions.splice(i, 1);
      return send(res, 204);
    }

    if (sub === '/versions' && method === 'POST') {
      const buf = await readBody(req);
      if (!owner) return fail(res, 403, 'FORBIDDEN', '권한이 없습니다');
      const names = [...buf.toString('latin1').matchAll(/filename="([^"]*)"/g)].map((x) => Buffer.from(x[1], 'latin1').toString('utf8'));
      if (names.length < 1 || names.length > 10 || names.some((n) => !/\.(pdf|docx)$/i.test(n) || /[\\/]/.test(n))) return validation(res, '파일 형식이 올바르지 않습니다');
      if (names.some((n) => /dup/i.test(n))) return validation(res, '직전 버전과 내용이 같은 파일입니다');
      const created = [];
      for (const n of names) {
        const no = currentNo(doc) + 1;
        const base = doc.versions.length ? doc.versions[doc.versions.length - 1].text : LINES[1].join('\n');
        doc.versions.push(mkVersion(no, n, `${base}\n(v${no} 에서 추가된 문장)`, 'PROCESSING', 0));
        created.push({ versionNo: no, status: 'PROCESSING' });
      }
      doc.readyAt = Date.now() + 6000;
      return ok(res, { documentId: doc.documentId, currentVersionNo: currentNo(doc), versions: created }, 201);
    }
    if (sub === '/versions' && method === 'GET') {
      return ok(res, doc.versions.map(({ text: _t, ...v }) => ({ ...v, changeType: null, changeSummary: null })));
    }
    if ((m = sub.match(/^\/versions\/(\d+)$/)) && method === 'DELETE') {
      if (!owner) return fail(res, 403, 'FORBIDDEN', '권한이 없습니다');
      if (doc.versions.length <= 1) return validation(res, '마지막 버전은 삭제할 수 없습니다');
      const i = doc.versions.findIndex((v) => v.versionNo === Number(m[1]));
      if (i < 0) return notFoundDoc(res);
      doc.versions.splice(i, 1);
      return send(res, 204);
    }
    if (sub === '/history' && method === 'GET') return ok(res, historyOf(doc));
    if (sub === '/compare' && method === 'GET') {
      const f = Number(url.searchParams.get('from')), t = Number(url.searchParams.get('to'));
      if (!url.searchParams.get('from') || !url.searchParams.get('to') || !Number.isInteger(f) || !Number.isInteger(t) || f === t) return validation(res, '비교할 두 버전을 올바르게 선택해 주세요');
      const a = doc.versions.find((v) => v.versionNo === f), b = doc.versions.find((v) => v.versionNo === t);
      if (!a || !b) return notFoundDoc(res);
      const diffJson = diffBlocks(a.text.split('\n'), b.text.split('\n'));
      return ok(res, { fromVersionNo: f, toVersionNo: t, fromText: a.text, toText: b.text, changeCount: diffJson.length, diffJson });
    }
    await readBody(req);
    return fail(res, 404, 'NOT_FOUND', '경로를 찾을 수 없습니다');
  }

  // --- 채팅 ---
  if (method === 'POST' && path === '/chat/sessions') {
    await readBody(req);
    const id = nextSession++;
    sessions.set(id, { uuid: me.uuid, messages: [] });
    return ok(res, { sessionId: id, title: '새 대화' }, 201);
  }
  if (method === 'GET' && (m = path.match(/^\/chat\/sessions\/(\d+)\/messages$/))) {
    const s = sessions.get(Number(m[1]));
    if (!s || s.uuid !== me.uuid) return notFoundDoc(res);
    return ok(res, s.messages);
  }
  if (method === 'POST' && path === '/ai/chat') {
    const b = parseJson(await readBody(req)) || {};
    const s = sessions.get(Number(b.sessionId));
    if (!s || s.uuid !== me.uuid) return notFoundDoc(res);
    const q = String(b.question || '');
    if (q.length < 1 || q.length > 1000) return validation(res);
    if (q.includes('429')) return fail(res, 429, 'RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다.');
    if (q.includes('502')) return fail(res, 502, 'AI_UNAVAILABLE', 'AI 모듈 오류');
    const none = q.includes('없음');
    const answer = none ? '찾지 못했습니다' : '배포 승인은 팀장과 부서장이 차례로 검토한 뒤 확정합니다. 롤백은 배포 후 2시간 안에 요청해야 합니다.';
    const sources = none ? [] : [
      { documentId: 1, documentName: '배포 가이드', versionNo: 4, pageNumber: 12, chunkText: '승인 요청 후 팀장과 부서장이 차례로 검토한다.' },
      { documentId: 3, documentName: '신입 온보딩 안내', versionNo: 1, pageNumber: null, chunkText: '배포 창구는 평일 오후 2시에 연다.' },
    ];
    s.messages.push({ messageId: nextMsg++, role: 'USER', content: q, createdAt: now() });
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', ...cors });
    await new Promise((r) => setTimeout(r, 700)); // 근거 확인 후 첫 토큰이 늦게 온다
    const tokensArr = answer.match(/.{1,4}/gs) || [];
    for (const [i, t] of tokensArr.entries()) {
      const line = `data: ${JSON.stringify({ token: t })}\n\n`;
      // 일부러 줄 중간에서 끊어 보내 FE 의 버퍼 처리를 확인한다
      if (i % 5 === 0) { res.write(line.slice(0, 9)); await new Promise((r) => setTimeout(r, 30)); res.write(line.slice(9)); } else res.write(line);
      await new Promise((r) => setTimeout(r, 60));
    }
    if (sources.length) res.write(`data: ${JSON.stringify({ sources })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    s.messages.push({ messageId: nextMsg++, role: 'ASSISTANT', content: answer, masked: false, sources, createdAt: now() });
    return undefined;
  }

  await readBody(req);
  return fail(res, 404, 'NOT_FOUND', '경로를 찾을 수 없습니다');
}

http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error(e);
    if (!res.headersSent) fail(res, 500, 'INTERNAL', '서버 오류');
    else res.end();
  });
}).listen(PORT, () => console.log(`[mock] http://localhost:${PORT}  (leader@example.com / Passw0rd!)`));
