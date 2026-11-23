// /api/dl?os=win|mac|intel — Be.Ark 설치 파일 내려받기 중계 (2026-11-09)
//   왜: GitHub 릴리스의 **익명 다운로드 주소**(github.com/.../releases/download/...)가 간헐적으로 504를 낸다
//   (GitHub 장애 "Increased timeouts due to surge in anonymous users", 11-09 실측: v1.9.4 .exe·.dmg 전부 504, 로그인한 사용자는 정상).
//   같은 파일을 GitHub **API 자산 주소**(api.github.com/.../releases/assets/<id>, Accept: octet-stream)로 부르면 서명된 실제 파일 주소로 302가 온다 → 그걸 사용자에게 넘긴다.
//   원본 주소는 api/_dl.json에서 읽는다(릴리스마다 그 파일만 바꾼다). API가 막히면(한도 60/h) 원래 주소로 보낸다.

// 11-13: 사이트 분리로 루트 index.html이 없어졌다 → 원본 주소는 api/_dl.json에 둔다(릴리스마다 이 파일만 바꾼다).
function readSources() {
  return require('./_dl.json');
}

async function signedUrl(direct) {
  // https://github.com/<owner>/<repo>/releases/download/<tag>/<file>
  const m = /github\.com\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/.exec(direct);
  if (!m) return null;
  const [, owner, repo, tag, file] = m;
  const headers = { 'User-Agent': 're-be.world-dl', Accept: 'application/vnd.github+json' };
  const rel = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, { headers });
  if (!rel.ok) return null;
  const j = await rel.json();
  const asset = (j.assets || []).find((a) => a.name === decodeURIComponent(file));
  if (!asset) return null;
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`, { headers: { 'User-Agent': 're-be.world-dl', Accept: 'application/octet-stream' }, redirect: 'manual' });
  const loc = r.headers.get('location');
  return (r.status >= 300 && r.status < 400 && loc) ? loc : null;
}

// 11-23 내려받기 횟수 (빠불로 결정 A): 날짜·운영체제·버전별 횟수만 센다. 누가 받았는지(IP·기기·계정)는 어디에도 적지 않는다.
//   자리 = Supabase `download_daily` (함수 incr_download만 올릴 수 있다 — 표는 익명 읽기·쓰기 ❌). 열쇠는 사이트 페이지에 이미 공개된 것과 같다.
//   세는 일이 실패하거나 느려도 내려받기는 그대로 간다(1.2초 안에 안 끝나면 버린다).
const SB = 'https://fkggbfqfgsgsacokjuqa.supabase.co';
const SB_KEY = 'sb_publishable_t3TDevoknYi9XDmspshfBQ_xKZCQI9v';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|headless|monitor|uptime/i;
async function countClick(req, os, direct) {
  try {
    const ua = String((req.headers && req.headers['user-agent']) || '');
    if (!ua || BOT.test(ua) || (req.method && req.method !== 'GET')) return;   // 미리보기·크롤러·HEAD는 세지 않는다
    const m = /\/releases\/download\/v?(\d+\.\d+\.\d+)\//.exec(direct);
    if (!m) return;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1200);
    await fetch(`${SB}/rest/v1/rpc/incr_download`, {
      method: 'POST', signal: ctl.signal,
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_os: os, p_version: m[1] }),
    }).catch(() => {});
    clearTimeout(t);
  } catch (_) { /* 세는 일 때문에 내려받기가 막히면 안 된다 */ }
}

// 서명 주소는 1시간 유효 → 이 함수 인스턴스 안에서 5분 기억한다(GitHub 익명 한도 60/h 보호).
//   11-23 전에는 응답 자체를 엣지에 5분 캐시했는데, 그러면 캐시가 답한 클릭은 이 함수에 오지 않아 셀 수 없다 → 응답은 캐시하지 않고 주소만 기억한다.
const signedMemo = new Map();   // direct → { url, at }
async function signedUrlCached(direct) {
  const hit = signedMemo.get(direct);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.url;
  const url = await signedUrl(direct);
  if (url) signedMemo.set(direct, { url, at: Date.now() });
  return url;
}

module.exports = async (req, res) => {
  const os = String((req.query && req.query.os) || 'win').toLowerCase();
  const src = readSources();
  const direct = src[os === 'mac' ? 'mac' : os === 'intel' ? 'intel' : 'win'] || src.win;
  if (!direct) { res.statusCode = 404; res.end('no download configured'); return; }
  let target = null;
  const key = os === 'mac' ? 'mac' : os === 'intel' ? 'intel' : 'win';
  const [t0] = await Promise.all([signedUrlCached(direct).catch(() => null), countClick(req, key, direct)]);
  target = t0;
  res.setHeader('Cache-Control', 'no-store');   // 클릭마다 이 함수에 와야 셀 수 있다
  res.setHeader('X-DL-Mode', target ? 'api-signed' : 'direct-fallback');
  res.statusCode = 302;
  res.setHeader('Location', target || direct);
  res.end();
};
