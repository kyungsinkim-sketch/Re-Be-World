#!/usr/bin/env python3
"""사이트 페이지 생성기 (2026-11-13 페이지 분할).
원본 = _src/beark.html · _src/world.html (한글, 전체 구역). 여기서만 고친다 — beark/*.html · world/*.html은 생성물.
  <!--@home--> … <!--@/-->          그 페이지에만 들어가는 덩어리 (쉼표로 여러 페이지: @home,formats). 표시 없는 곳은 모든 페이지 공통.
영문 = _src/en-<site>.json {한글: 영어}. 번역이 빠진 한글이 있으면 실패한다.
쓰기: python3 _src/build.py   (저장소 루트 어디서든)
주소: 한글 /ko · /ko/<page>, 영문 / · /<page>  (vercel.json rewrites가 <site>/ko-<page>.html · <site>/<page>.html로 연결)
"""
import re, json, sys, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = {
    'beark': {'host': 'https://be.ark.works', 'pages': ['home', 'formats', 'tutorial']},
    'world': {'host': 'https://www.re-be.world', 'pages': ['home', 'tutorial']},
}
RAW = {'world': [('<h1 class="d1">창작 바깥의 일은<br><span class="grad">에이전트</span>에게 맡겨요</h1>',
                  '<h1 class="d1">Leave everything outside your craft<br>to your <span class="grad">agent</span></h1>')], 'beark': []}
STRIP = r'<style[\s\S]*?</style>|<script[\s\S]*?</script>|<!--[\s\S]*?-->'


def strings(h):
    body = re.sub(STRIP, '', h); seen = []
    for m in re.finditer(r'>([^<>]+)<', body):
        t = m.group(1).strip()
        if re.search('[가-힣]', t) and t not in seen: seen.append(t)
    for m in re.finditer(r'content="([^"]*[가-힣][^"]*)"', body):
        if m.group(1) not in seen: seen.append(m.group(1))
    return seen


def select(src, page):
    def blk(m):
        return m.group(2) if page in m.group(1).split(',') else ''
    out = src
    while True:   # 안쪽 덩어리부터 (겹친 표시 허용)
        nxt = re.sub(r'<!--@([a-z,]+)-->\n?((?:(?!<!--@)[\s\S])*?)<!--@/-->\n?', blk, out)
        if nxt == out: break
        out = nxt
    assert '<!--@' not in out, '닫히지 않은 표시'
    return out


def path(page, ko):
    if page == 'home': return '/ko' if ko else '/'
    return ('/ko/' if ko else '/') + page


def localize(h, site, page, pages):
    """한글 페이지 기준: 이 페이지에 없는 #구역 링크를 그 구역이 있는 페이지로 돌리고, 머리 정보·언어 전환을 이 페이지 주소로."""
    ids = set(re.findall(r'\bid="([A-Za-z0-9_-]+)"', h))
    def anchor(m):
        a = m.group(1)
        if a == '': return m.group(0) if page == 'home' else 'href="/ko"'
        if a in ids: return m.group(0)
        return 'href="/ko/%s"' % a if a in pages else 'href="/ko#%s"' % a
    h = re.sub(r'href="#([A-Za-z0-9_-]*)"', anchor, h)
    host = SITES[site]['host']
    head, rest = h.split('</head>', 1)
    head = head.replace('href="%s/ko"' % host, 'href="%s%s"' % (host, path(page, True))).replace('href="%s/"' % host, 'href="%s%s"' % (host, path(page, False)))
    h = head + '</head>' + rest
    tg = '<a href="/ko" class="on" aria-current="true">KO</a><a href="/">EN</a>'
    assert tg in h
    return h.replace(tg, '<a href="%s" class="on" aria-current="true">KO</a><a href="%s">EN</a>' % (path(page, True), path(page, False)))


def to_en(h, site, page, d):
    for a, b in RAW[site]:
        if a in h: h = h.replace(a, b)
    for k in sorted(strings(h), key=lambda x: -len(x)):
        if k not in d: continue
        e = d[k]; e = e.replace('&', '&amp;') if '&' in e and '&amp;' not in e else e
        h = re.sub(r'(>\s*)' + re.escape(k) + r'(\s*<)', lambda m: m.group(1) + e + m.group(2), h)
        h = h.replace('content="' + k + '"', 'content="' + e.replace('"', '&quot;') + '"')
    h = h.replace('<html lang="ko">', '<html lang="en">')
    tg = '<a href="%s" class="on" aria-current="true">KO</a><a href="%s">EN</a>' % (path(page, True), path(page, False))
    assert tg in h; h = h.replace(tg, '%%TG%%')
    # 내부 링크: /ko… → 영문 주소
    h = re.sub(r'href="/ko(/[a-z-]+)?(#[A-Za-z0-9_-]+)?"', lambda m: 'href="%s%s"' % (m.group(1) or '/', m.group(2) or ''), h)
    h = h.replace('%%TG%%', '<a href="%s">KO</a><a href="%s" class="on" aria-current="true">EN</a>' % (path(page, True), path(page, False)))
    def vid(m):
        return m.group(1) + m.group(2) + '-en' + m.group(3) if os.path.exists('%s/%s/media/%s-en%s' % (R, site, m.group(2), m.group(3))) else m.group(0)
    h = re.sub(r'(/' + site + r'/media/)([a-z-]+?)(-poster\.jpg|\.webm|\.mp4|\.jpg)', vid, h)
    h = h.replace('poster="/beark/media/beark-estimate-en-poster.jpg" width="1440" height="1220"', 'poster="/beark/media/beark-estimate-en-poster.jpg" width="1440" height="900"')  # 영문 엑셀 영상은 1440×900
    h = h.replace("filter(function(a){return hasKo(a.title)||hasKo(a.body)})", "filter(function(a){return !hasKo(a.title)&&!hasKo(a.body)})")  # 소식: 영문 공지만
    body = re.sub(STRIP, '', h)
    left = [m.group(0) for m in re.finditer(r'[^<>"\n]*[가-힣][^<>"\n]*', body) if m.group(0).strip() != '한국어']
    return h, left


bad = 0
for site, cfg in SITES.items():
    src = open('%s/_src/%s.html' % (R, site)).read()
    d = json.load(open('%s/_src/en-%s.json' % (R, site)))
    miss = [k for k in strings(src) if k not in d]
    if miss: bad += 1; print(site, '번역 없음:', miss)
    for page in cfg['pages']:
        ko = localize(select(src, page), site, page, cfg['pages'])
        en, left = to_en(ko, site, page, d)
        if left: bad += 1; print(site, page, '남은 한글:', left[:10])
        kf = 'ko.html' if page == 'home' else 'ko-%s.html' % page
        ef = 'index.html' if page == 'home' else '%s.html' % page
        open('%s/%s/%s' % (R, site, kf), 'w').write(ko); open('%s/%s/%s' % (R, site, ef), 'w').write(en)
        print(site, page, 'ok', len(ko), len(en))
sys.exit(1 if bad else 0)
