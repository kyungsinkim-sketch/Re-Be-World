// /api/dl?os=win|mac|intel — Be.Ark 설치 파일 내려받기 중계 (2026-11-09)
//   왜: GitHub 릴리스의 **익명 다운로드 주소**(github.com/.../releases/download/...)가 간헐적으로 504를 낸다
//   (GitHub 장애 "Increased timeouts due to surge in anonymous users", 11-09 실측: v1.9.4 .exe·.dmg 전부 504, 로그인한 사용자는 정상).
//   같은 파일을 GitHub **API 자산 주소**(api.github.com/.../releases/assets/<id>, Accept: octet-stream)로 부르면 서명된 실제 파일 주소로 302가 온다 → 그걸 사용자에게 넘긴다.
//   원본 주소는 index.html의 `var DL_* = "https://github.com/..."` 줄에서 읽는다(릴리스마다 index.html만 바꾸면 여기는 손댈 것 없음). API가 막히면(한도 60/h) 원래 주소로 보낸다.
const fs = require('fs');
const path = require('path');

function readSources() {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const pick = (name) => { const m = new RegExp('var\\s+' + name + '\\s*=\\s*"([^"]+)"').exec(html); return m ? m[1] : ''; };
  return { win: pick('DL_WIN'), mac: pick('DL_MAC'), intel: pick('DL_MAC_INTEL') };   // 첫 대입(원본 github 주소)만 잡힌다
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

module.exports = async (req, res) => {
  const os = String((req.query && req.query.os) || 'win').toLowerCase();
  const src = readSources();
  const direct = src[os === 'mac' ? 'mac' : os === 'intel' ? 'intel' : 'win'] || src.win;
  if (!direct) { res.statusCode = 404; res.end('no download configured'); return; }
  let target = null;
  try { target = await signedUrl(direct); } catch (_) { target = null; }
  // 서명 주소는 1시간 유효 → 엣지 캐시 5분(API 호출 = 시간당 12회 안팎, 익명 한도 60 안)
  res.setHeader('Cache-Control', target ? 'public, s-maxage=300, max-age=0' : 'no-store');
  res.setHeader('X-DL-Mode', target ? 'api-signed' : 'direct-fallback');
  res.statusCode = 302;
  res.setHeader('Location', target || direct);
  res.end();
};
