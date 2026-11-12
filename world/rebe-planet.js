/* rebe-planet.js — Re-Be World "데이터 행성" (2026-09-26, docs/RE_BE_WORLD_MOBILE_NEST §12-10)
   빠불로 레퍼런스: CosmoGraph(구면 위 노드·엣지·성운 = 데이터가 시각화된 행성) + Neurones(가지 뻗기).
   한 레시피로 네 자리를 채운다 — 스플래시(앱 구동: 뉴런 가지가 뻗다가 행성으로 모임) / 온보딩 히어로 /
   설정 상단(에이전트 학습 데이터 행성 — topic_weights·growth로 색·밀도) / 워드마크 옆 로고·런처 아이콘은
   scripts/rebe_planet_icon.py 가 같은 레시피를 PNG로 굽는다.
   ES5 · Canvas 2D · 외부 의존 0 · 결정적(seed → 같은 행성). 구형 웹뷰(KEY2) 고려: 노드 ≤ 220, 프레임당 엣지 ≤ 440. */
(function (root) {
  'use strict';
  var TOPICS = ['politics', 'economy', 'daily', 'culture', 'tech', 'learning', 'inner'];
  var TOPIC_COLOR = { politics: '#FF5C5C', economy: '#FF8A3D', daily: '#FFD23F', culture: '#35E08A', tech: '#38D0FF', learning: '#4C6FFF', inner: '#A86BFF' };
  function hash32(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  function rng(seed) { var a = hash32(seed) || 1; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var RGB = {};
  function rgb(hex) { if (!RGB[hex]) { var v = parseInt(hex.slice(1), 16); RGB[hex] = [(v >> 16) & 255, (v >> 8) & 255, v & 255]; } return RGB[hex]; }
  function rgba(hex, a) { var c = rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* build(seed, {topics, growth, n}) → 행성 모델
     nodes: 피보나치 구면 + 지터. 색 = 경도 구간(관심사 가중치에 비례한 폭) → 회전하면 색 영역이 지나간다.
     edges: 3D 최근접 2개. tree: 모프용 2D 뉴런 트리(관심사별 줄기 → 이진 분기). */
  function build(seed, opts) {
    opts = opts || {};
    var g = rng(String(seed || 'Re-Be World'));
    var growth = clamp(opts.growth == null ? 0.6 : opts.growth);
    var n = opts.n || Math.round((150 + 250 * growth) * 0.75);   // 09-29: 별자리가 읽히게 배경 망 25% 덜어냄   // v2: 밀도 ↑ (150~400)
    var tw = opts.topics || null, w = [], sum = 0, i, j;
    for (i = 0; i < TOPICS.length; i++) { var v = tw && tw[TOPICS[i]] > 0 ? tw[TOPICS[i]] : (tw ? 0.06 : 1); w.push(v); }
    // 09-27 빠불로(스샷: 주황 가지 하나가 절반 차지): 관심사 가중치를 그대로 쓰면 한 색이 트리를 삼킨다 → 순위만 남기고 폭은 눌러 가지 넓이 비슷하게 (최대:최소 ≤ 2)
    var wmax = 0; for (i = 0; i < w.length; i++) if (w[i] > wmax) wmax = w[i];
    for (i = 0; i < w.length; i++) { w[i] = 0.5 + 0.5 * Math.sqrt(w[i] / (wmax || 1)); sum += w[i]; }
    var nodes = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y));
      var th = ga * i + (g() - 0.5) * 0.4;
      var x = Math.cos(th) * r, z = Math.sin(th) * r;
      var lon = (Math.atan2(z, x) / (Math.PI * 2) + 0.5) * sum, acc = 0, topic = TOPICS[6];
      for (j = 0; j < TOPICS.length; j++) { acc += w[j]; if (lon <= acc) { topic = TOPICS[j]; break; } }
      // 09-29 빠불로 "원안(네트워크) + 앱 아이콘과 최대한 비슷하게": 행성 단계 = 아이콘을 구운 9/26 레시피(크기 편차·큰 링 노드).
      //   가지(트리) 단계는 09-27 결정대로 전부 같은 굵기 → 구면이 되며 제 크기로 자란다.
      var big = false; g();   // 09-29: 무작위 큰 노드 없음 — 주인공은 북극성
      nodes.push({ x: x, y: y, z: z, t: j, c: TOPIC_COLOR[topic], r: big ? 3.0 + g() * 1.6 : 0.5 + g() * 0.9, big: big });
    }
    var bigs = 0; for (i = 0; i < n; i++) if (nodes[i].big) bigs++;
    for (i = 0; bigs < 2 && i < n; i += 37) { if (!nodes[i].big) { nodes[i].big = true; nodes[i].r = 3.4; bigs++; } }   // 큰 링 노드 3개 (09-29: 주인공은 북극성)
    // edges: 각 노드 → 3D 최근접 2개 (중복 제거)
    var edges = [], seen = {};
    for (i = 0; i < n; i++) {
      var a = nodes[i], b1 = -1, b2 = -1, b3 = -1, d1 = 9, d2 = 9, d3 = 9;
      for (j = 0; j < n; j++) {
        if (j === i) continue;
        var b = nodes[j], d = (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z);
        if (d < d1) { d3 = d2; b3 = b2; d2 = d1; b2 = b1; d1 = d; b1 = j; } else if (d < d2) { d3 = d2; b3 = b2; d2 = d; b2 = j; } else if (d < d3) { d3 = d; b3 = j; }
      }
      var pair = [b1, b2, b3];
      for (var k = 0; k < 3; k++) { var q = pair[k]; if (q < 0) continue; var key = i < q ? i + ':' + q : q + ':' + i; if (!seen[key]) { seen[key] = 1; edges.push([i, q]); } }
    }
    // tree (§12-12, 빠불로 "레퍼런스처럼"): 덴드라이트 — 관심사별 줄기가 중심에서 부채꼴로 갈라지고(2~3분기), 잎 = 행성 노드.
    //   joints = 내부 마디 {x,y,p(부모 joint, -1=중심),d(깊이),c(색)} / 잎: tx,ty,tp(부모 joint),td. 가지는 짧은 곡선 세그먼트의 연쇄 = 가늘고 유기적.
    // ── 09-29 빠불로: 실제 별자리 (적경 h·적위 °·등급). 북극성 = 가장 밝은 노드(주인공), 오리온 = 정면 가운데.
    //   자전축 = 천구 극축(화면 세로축) → 행성이 돌면 하늘처럼 북극성을 중심으로 돈다. 안에서 올려다본 모양(좌우 반전)으로 배치.
    var ORI = 5.6, TH0 = 0.3;   // 오리온 적경 / 스플래시가 끝날 때의 회전각(그때 정면)
    var CONST = [
      // 10-06 빠불로 "오리온자리 풀버전": 몸통 8 + 곤봉(μ·ξ·ν·χ1·χ2) + 방패(ο2·π1~π6) + η(오른다리). 레퍼런스 = 곤봉 든 사냥꾼 그림
      [[['Betelgeuse', 5.919, 7.41, 0.5, '#FFC08A'], ['Rigel', 5.242, -8.2, 0.13, '#CFE0FF'], ['Bellatrix', 5.419, 6.35, 1.64], ['Saiph', 5.796, -9.67, 2.06], ['Alnitak', 5.679, -1.94, 1.77], ['Alnilam', 5.604, -1.2, 1.69], ['Mintaka', 5.533, -0.3, 2.23], ['Meissa', 5.585, 9.93, 3.39],
        ['Mu Ori', 6.040, 9.65, 4.1], ['Xi Ori', 6.200, 14.21, 4.45], ['Nu Ori', 6.127, 14.77, 4.4], ['Chi1 Ori', 5.907, 20.28, 4.4], ['Chi2 Ori', 6.065, 20.14, 4.6],
        ['Omicron2 Ori', 4.940, 13.51, 4.07], ['Pi1 Ori', 4.915, 10.15, 4.65], ['Pi2 Ori', 4.843, 8.90, 4.35], ['Pi3 Ori', 4.831, 6.96, 3.19], ['Pi4 Ori', 4.853, 5.61, 3.69], ['Pi5 Ori', 4.904, 2.44, 3.72], ['Pi6 Ori', 4.976, 1.71, 4.47],
        ['Eta Ori', 5.408, -2.40, 3.36]],
       [[7, 0], [7, 2], [0, 4], [2, 6], [4, 5], [5, 6], [4, 3], [6, 20], [20, 1],
        [0, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 9],
        [2, 16], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19]]],
      [[['Aldebaran', 4.599, 16.51, 0.87, '#FFB07A'], ['Elnath', 5.438, 28.61, 1.65], ['Tianguan', 5.627, 21.14, 3.0], ['Ain', 4.477, 19.18, 3.5], ['Hyadum', 4.33, 15.63, 3.6], ['Alcyone', 3.791, 24.11, 2.87]], [[4, 0], [0, 2], [4, 3], [3, 1], [4, 5]]],
      [[['Castor', 7.577, 31.89, 1.58], ['Pollux', 7.755, 28.03, 1.14, '#FFD9A8'], ['Alhena', 6.629, 16.4, 1.93], ['Mebsuta', 6.732, 25.13, 3.0], ['Tejat', 6.383, 22.51, 2.9], ['Wasat', 7.335, 21.98, 3.5]], [[0, 3], [3, 4], [1, 5], [5, 2], [0, 1]]],
      [[['Sirius', 6.752, -16.72, -1.46, '#D8E6FF'], ['Mirzam', 6.378, -17.96, 1.98], ['Adhara', 6.977, -28.97, 1.5], ['Wezen', 7.14, -26.39, 1.83], ['Aludra', 7.402, -29.3, 2.45]], [[1, 0], [0, 3], [3, 2], [3, 4]]],
      [[['Procyon', 7.655, 5.22, 0.34, '#FFF4D8'], ['Gomeisa', 7.453, 8.29, 2.9]], [[0, 1]]],
      [[['Capella', 5.278, 46.0, 0.08, '#FFE9B0'], ['Menkalinan', 5.992, 44.95, 1.9], ['Mahasim', 5.995, 37.21, 2.6], ['Hassaleh', 4.95, 33.17, 2.7]], [[0, 1], [1, 2], [3, 0]]],
      [[['Polaris', 2.53, 89.26, -2.2, '#FFFFFF'], ['Yildun', 17.54, 86.59, 4.4], ['Epsilon UMi', 16.77, 82.04, 4.2], ['Zeta UMi', 15.73, 77.79, 4.3], ['Kochab', 14.845, 74.16, 2.08, '#FFD2A0'], ['Pherkad', 15.345, 71.83, 3.05], ['Eta UMi', 16.29, 75.76, 4.9]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]],
      [[['Dubhe', 11.062, 61.75, 1.79], ['Merak', 11.031, 56.38, 2.37], ['Phecda', 11.897, 53.69, 2.44], ['Megrez', 12.257, 57.03, 3.31], ['Alioth', 12.9, 55.96, 1.77], ['Mizar', 13.399, 54.93, 2.23], ['Alkaid', 13.792, 49.31, 1.86]], [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]]],
      [[['Caph', 0.153, 59.15, 2.27], ['Schedar', 0.675, 56.54, 2.24], ['Navi', 0.945, 60.72, 2.15], ['Ruchbah', 1.43, 60.24, 2.66], ['Segin', 1.907, 63.67, 3.35]], [[0, 1], [1, 2], [2, 3], [3, 4]]],
      [[['Deneb', 20.69, 45.28, 1.25], ['Sadr', 20.37, 40.26, 2.2], ['Aljanah', 20.77, 33.97, 2.48], ['Fawaris', 19.75, 45.13, 2.87], ['Albireo', 19.512, 27.96, 3.1]], [[0, 1], [1, 4], [3, 1], [1, 2]]],
      [[['Vega', 18.616, 38.78, 0.03, '#E6EEFF']], []],
      [[['Altair', 19.846, 8.87, 0.76], ['Tarazed', 19.771, 10.61, 2.7], ['Alshain', 19.922, 6.41, 3.7]], [[1, 0], [0, 2]]],
      [[['Regulus', 10.139, 11.97, 1.35], ['Denebola', 11.818, 14.57, 2.13], ['Algieba', 10.333, 19.84, 2.0], ['Zosma', 11.235, 20.52, 2.56], ['Eta Leo', 10.122, 16.76, 3.5], ['Adhafera', 10.278, 23.42, 3.4], ['Ras Elased', 9.764, 23.77, 3.0], ['Chertan', 11.237, 15.43, 3.3]],
       [[0, 4], [4, 2], [2, 5], [5, 6], [2, 3], [3, 1], [1, 7], [7, 0], [3, 7]]],
      [[['Antares', 16.49, -26.43, 1.06, '#FF9A6A'], ['Dschubba', 16.006, -22.62, 2.29], ['Acrab', 16.091, -19.81, 2.6], ['Pi Sco', 15.981, -26.11, 2.9], ['Tau Sco', 16.598, -28.22, 2.8], ['Larawag', 16.836, -34.29, 2.3], ['Mu Sco', 16.864, -38.05, 3.0], ['Zeta Sco', 16.91, -42.36, 3.6], ['Eta Sco', 17.203, -43.24, 3.3], ['Sargas', 17.622, -43.0, 1.86], ['Iota Sco', 17.793, -40.13, 3.0], ['Girtab', 17.708, -39.03, 2.4], ['Shaula', 17.56, -37.1, 1.62]],
       [[2, 1], [1, 3], [1, 0], [0, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12]]],
      [[['Markab', 23.079, 15.21, 2.49], ['Scheat', 23.063, 28.08, 2.42], ['Algenib', 0.22, 15.18, 2.83], ['Alpheratz', 0.14, 29.09, 2.06]], [[0, 1], [1, 3], [3, 2], [2, 0]]],
      [[['Acrux', 12.443, -63.1, 0.77], ['Mimosa', 12.795, -59.69, 1.25], ['Gacrux', 12.519, -57.11, 1.64], ['Imai', 12.252, -58.75, 2.8]], [[0, 2], [1, 3]]],
      [[['Arcturus', 14.261, 19.18, -0.05, '#FFD2A0']], []], [[['Spica', 13.42, -11.16, 0.97, '#D6E4FF']], []]
    ];
    var clines = [];
    function topicOf(x, z) { var lon = (Math.atan2(z, x) / (Math.PI * 2) + 0.5) * sum, acc = 0; for (var q = 0; q < TOPICS.length; q++) { acc += w[q]; if (lon <= acc) return q; } return 6; }
    for (var cI = 0; cI < CONST.length; cI++) {
      var stars = CONST[cI][0], base0 = nodes.length;
      for (var sI = 0; sI < stars.length; sI++) {
        var st = stars[sI], th = TH0 - (st[1] - ORI) * Math.PI / 12, dec = st[2] * Math.PI / 180;   // 안에서 본 하늘 = 적경이 커질수록 왼쪽
        var sx = Math.cos(dec) * Math.sin(th), sz = Math.cos(dec) * Math.cos(th), sy = -Math.sin(dec) * 1.0;   // y+ = 화면 아래 → 북쪽 = 위
        var tt = topicOf(sx, sz), mag = st[3];
        nodes.push({ x: sx, y: sy, z: sz, t: tt, c: TOPIC_COLOR[TOPICS[tt]], star: true, name: st[0], sc: st[4] || '#EEF2FF', hero: st[0] === 'Polaris',
                     r: st[0] === 'Polaris' ? 3.6 : Math.max(0.9, Math.min(2.6, 2.4 - 0.55 * mag)), big: false, glow: mag < 1.0 });
      }
      var ls = CONST[cI][1];
      for (var lI = 0; lI < ls.length; lI++) clines.push([base0 + ls[lI][0], base0 + ls[lI][1]]);
    }
    n = nodes.length;
    var byT = [[], [], [], [], [], [], []];
    for (i = 0; i < n; i++) byT[nodes[i].t].push(i);
    var joints = [], tx = new Array(n), ty = new Array(n), tp = new Array(n), td = new Array(n), maxD = 1;
    var trunks = 0; for (j = 0; j < 7; j++) if (byT[j].length) trunks++;
    function split(list, x, y, ang, depth, len, pIdx, color, spread) {
      if (list.length === 1) {
        var L = len * (0.7 + g() * 0.7), a = ang + (g() - 0.5) * 0.5, id = list[0];
        tx[id] = x + Math.cos(a) * L; ty[id] = y + Math.sin(a) * L; tp[id] = pIdx; td[id] = depth; if (depth > maxD) maxD = depth;
        return;
      }
      var jx = x + Math.cos(ang) * len, jy = y + Math.sin(ang) * len;
      var J = joints.length; joints.push({ x: jx, y: jy, p: pIdx, d: depth, c: color });
      if (depth > maxD) maxD = depth;
      var k = list.length >= 5 && g() < 0.45 ? 3 : 2, parts = [], cut = 0;
      for (var q = 0; q < k; q++) { var take = q === k - 1 ? list.length - cut : Math.max(1, Math.round(list.length / k * (0.7 + g() * 0.6))); take = Math.min(take, list.length - cut - (k - 1 - q)); parts.push(list.slice(cut, cut + take)); cut += take; }
      for (var q2 = 0; q2 < k; q2++) {
        if (!parts[q2].length) continue;
        var a2 = ang + (q2 - (k - 1) / 2) * spread + (g() - 0.5) * spread * 0.6;
        split(parts[q2], jx, jy, a2, depth + 1, len * (0.78 + g() * 0.14), J, color, spread * 0.78);
      }
    }
    var ti = 0;
    for (j = 0; j < 7; j++) {
      var list = byT[j]; if (!list.length) continue;
      var base = (ti / trunks) * Math.PI * 2 - Math.PI / 2 + (g() - 0.5) * 0.6; ti++;
      split(list, 0, 0, base, 1, 0.16 + g() * 0.06, -1, TOPIC_COLOR[TOPICS[j]], 0.62);
    }
    var far = 0.01;
    for (i = 0; i < n; i++) far = Math.max(far, Math.hypot(tx[i], ty[i]));
    for (i = 0; i < joints.length; i++) far = Math.max(far, Math.hypot(joints[i].x, joints[i].y));
    var sc = 1.16 / far;                                    // 트리 최대 반경 = 1.16R (fit 0.8이면 캔버스 안)
    for (i = 0; i < n; i++) { tx[i] *= sc; ty[i] *= sc; }
    for (i = 0; i < joints.length; i++) { joints[i].x *= sc; joints[i].y *= sc; }
    // v2 ③·④: 대원(great circle) 점 사슬 3개(레퍼런스의 점선 궤도) + 굴곡진 외곽(사인 합)
    var rings = [], ringCols = ['#FF5C9E', '#38D0FF', '#FFD23F', '#A86BFF'];   // 09-29: 아이콘의 색 점 사슬 (감싸기 애니는 유지)
    for (var rI = 0; rI < 3; rI++) {
      var tilt = g() * Math.PI, yaw = g() * Math.PI * 2, cnt = 34 + Math.floor(g() * 16), pts = [], ph = g() * 6.28;
      for (var q3 = 0; q3 < cnt; q3++) {
        var a3 = ph + q3 / cnt * Math.PI * 2, px = Math.cos(a3), py = Math.sin(a3) * Math.cos(tilt), pz = Math.sin(a3) * Math.sin(tilt);
        var rx = px * Math.cos(yaw) - pz * Math.sin(yaw), rz = px * Math.sin(yaw) + pz * Math.cos(yaw);
        pts.push([rx * 0.985, py * 0.985, rz * 0.985]);
      }
      rings.push({ pts: pts, c: ringCols[rI % ringCols.length], big: Math.floor(g() * cnt) });
    }
    var wob = [[0.035, 3, g() * 6.28], [0.022, 7, g() * 6.28], [0.012, 13, g() * 6.28], [0.008, 23, g() * 6.28]];
    // ── 10-05 빠불로 인트로 (opts.sky): 가운데 첫 노드에서 가지가 뻗는 대신, 밤하늘에 별이 돋고
    //   ○ 인물 · □ 장소 · △ 이벤트 세 도형으로 이은 별자리 하나가 그려진 뒤 → 그 별들이 지구본의 오리온 자리로 날아가 행성이 된다.
    //   sky 좌표 = tx,ty 재사용(트리 대신), td = 별이 돋는 순서(0..0.7). 별자리 꼭짓점 = 오리온 별 노드(행성 정면에 안착).
    var sky = null;
    if (opts.sky) {
      // 10-06 빠불로 개정: ○□△만 따로 그리면 오징어게임 같다 → 세 도형을 섞어 **오리온 자리**를 그린다(행성 정면의 그 오리온과 같은 모양을 크게).
      //   밤하늘 = 화면 전체(배경 별은 캔버스 전체 좌표 skyUV) → 별자리가 한 획씩 → 그 별들이 지구본의 오리온 자리로 줄어들며 안착.
      var OR = ['Betelgeuse', 'Rigel', 'Bellatrix', 'Saiph', 'Alnitak', 'Alnilam', 'Mintaka', 'Meissa', 'Mu Ori', 'Xi Ori', 'Nu Ori', 'Chi1 Ori', 'Chi2 Ori',
                'Omicron2 Ori', 'Pi1 Ori', 'Pi2 Ori', 'Pi3 Ori', 'Pi4 Ori', 'Pi5 Ori', 'Pi6 Ori', 'Eta Ori'];
      var SHS = ['circle', 'tri', 'square'];   // 세 도형을 고루 섞는다(별마다 순서대로) — 도형만 따로 나열하지 않음(오징어게임 연상 ❌)
      var idx = {}; for (i = 0; i < n; i++) if (nodes[i].star && OR.indexOf(nodes[i].name) >= 0 && idx[nodes[i].name] == null) idx[nodes[i].name] = i;
      var rEnd = 0.35, cR = Math.cos(rEnd), sR = Math.sin(rEnd), px = {}, py = {}, x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (var k in idx) { var nd0 = nodes[idx[k]]; px[k] = (nd0.x * cR - nd0.z * sR) * 0.9; py[k] = nd0.y * 0.9;
        x0 = Math.min(x0, px[k]); x1 = Math.max(x1, px[k]); y0 = Math.min(y0, py[k]); y1 = Math.max(y1, py[k]); }
      var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, S = Math.min((opts.skyBox ? opts.skyBox[0] : 1.25) / Math.max(0.01, x1 - x0), (opts.skyBox ? opts.skyBox[1] : 2.0) / Math.max(0.01, y1 - y0));   // skyBox = 16:9 홍보영상 등 화면비 다를 때   // 화면을 넉넉히 채우는 크기
      var shapes = {}, inC = {}, small = {};
      // 10-06 빠불로: 도형 별이 밤하늘에 하나씩 차례로 떠오른다(grow 0.05~0.6) → 그다음 선이 이어진다(0.6~0.95)
      var nC = 0; for (var k1 in idx) nC++;
      var ord = {};
      for (var k2 in idx) { var id = idx[k2], oi = OR.indexOf(k2); tx[id] = (px[k2] - mx) * S; ty[id] = (py[k2] - my) * S - 0.1;
        ord[id] = oi; td[id] = 0.03 + oi / nC * 0.66; shapes[id] = SHS[oi % 3]; inC[id] = 1; if (oi >= 8) small[id] = 1; }
      // 선 = CONST 오리온 선 그대로(행성의 오리온과 같은 그림), 몸통 → 다리 → 곤봉 → 방패 순으로 한 획씩
      var L = [['Meissa', 'Betelgeuse'], ['Meissa', 'Bellatrix'], ['Betelgeuse', 'Alnitak'], ['Bellatrix', 'Mintaka'], ['Alnitak', 'Alnilam'], ['Alnilam', 'Mintaka'],
               ['Alnitak', 'Saiph'], ['Mintaka', 'Eta Ori'], ['Eta Ori', 'Rigel'],
               ['Betelgeuse', 'Mu Ori'], ['Mu Ori', 'Xi Ori'], ['Xi Ori', 'Nu Ori'], ['Nu Ori', 'Chi1 Ori'], ['Chi1 Ori', 'Chi2 Ori'], ['Chi2 Ori', 'Xi Ori'],
               ['Bellatrix', 'Pi3 Ori'], ['Omicron2 Ori', 'Pi1 Ori'], ['Pi1 Ori', 'Pi2 Ori'], ['Pi2 Ori', 'Pi3 Ori'], ['Pi3 Ori', 'Pi4 Ori'], ['Pi4 Ori', 'Pi5 Ori'], ['Pi5 Ori', 'Pi6 Ori']], lines = [];
      for (var q4 = 0; q4 < L.length; q4++) if (idx[L[q4][0]] != null && idx[L[q4][1]] != null) lines.push([idx[L[q4][0]], idx[L[q4][1]]]);
      var uv = {};
      for (i = 0; i < n; i++) { if (inC[i]) continue; uv[i] = [g() * 2 - 1, g() * 2 - 1]; tx[i] = 0; ty[i] = 0; td[i] = g() * 0.6; tp[i] = -1; }
      sky = { lines: lines, shapes: shapes, uv: uv, small: small, ord: ord, nC: nC };
    }
    return { nodes: nodes, edges: edges, clines: clines, joints: sky ? [] : joints, rings: rings, wob: wob, tx: tx, ty: ty, tp: tp, td: td, maxD: maxD, sky: sky, seed: String(seed || 'Re-Be World') };
  }

  /* draw(ctx, P, cx, cy, R, {rot, morph, grow, alpha}) — morph 0 = 뉴런 트리, 1 = 행성. grow = 트리 뻗기 진행. */
  function draw(ctx, P, cx, cy, R, st) {
    st = st || {};
    var m = ease(st.morph == null ? 1 : st.morph), gr = clamp(st.grow == null ? 1 : st.grow), rot = st.rot || 0;
    var A = st.alpha == null ? 1 : st.alpha;
    var cr = Math.cos(rot), sr = Math.sin(rot), n = P.nodes.length, i;
    var fx = new Array(n), fy = new Array(n), fz = new Array(n), seg = new Array(n);
    var Rs = R * 0.9, tot = P.maxD + 1;
    for (i = 0; i < n; i++) {
      var nd = P.nodes[i];
      var x = nd.x * cr - nd.z * sr, z = nd.x * sr + nd.z * cr;
      var sx = cx + x * Rs, sy = cy + nd.y * Rs;
      var uvi = P.sky && P.sky.uv[i];
      var txx = uvi ? (st.W ? (uvi[0] * 0.5 + 0.5) * st.W : cx + uvi[0] * R * 1.3) : cx + P.tx[i] * R,
          tyy = uvi ? (st.H ? (uvi[1] * 0.5 + 0.5) * st.H : cy + uvi[1] * R * 1.3) : cy + P.ty[i] * R;
      fx[i] = txx + (sx - txx) * m; fy[i] = tyy + (sy - tyy) * m; fz[i] = z;
      seg[i] = P.sky ? clamp((gr - P.td[i]) * (P.sky.ord[i] != null ? 14 : 3.5)) : clamp(gr * tot - P.td[i] + 0.35);   // 가지 진행 / sky = 별이 돋는 정도
    }
    ctx.save();
    ctx.lineCap = 'round';
    // ── 1) 행성 본체: 굴곡진 외곽(④) + 푸른 빛 내부(①) + 대기 ──
    function wavy(r, k) {
      ctx.beginPath();
      for (var q = 0; q <= 120; q++) {
        var a = q / 120 * Math.PI * 2, w = 1;
        for (var wi = 0; wi < P.wob.length; wi++) w += P.wob[wi][0] * k * Math.sin(P.wob[wi][1] * a + P.wob[wi][2] + rot * 0.3);
        var rr = r * w; if (q === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
    }
    if (m > 0.02) {
      ctx.globalAlpha = A * m;
      var atm = ctx.createRadialGradient(cx, cy, Rs * 0.9, cx, cy, Rs * 1.22);
      atm.addColorStop(0, 'rgba(150,130,255,0.45)'); atm.addColorStop(0.45, 'rgba(120,110,255,0.12)'); atm.addColorStop(1, 'rgba(120,110,255,0)');
      ctx.fillStyle = atm; wavy(Rs * 1.22, 1); ctx.fill();
      ctx.save(); wavy(Rs, 1); ctx.clip();
      var base = ctx.createRadialGradient(cx - Rs * 0.2, cy - Rs * 0.25, Rs * 0.05, cx, cy, Rs * 1.05);
      base.addColorStop(0, '#5A48D8'); base.addColorStop(0.45, '#2A2287'); base.addColorStop(0.85, '#100D45'); base.addColorStop(1, '#07062A');
      ctx.fillStyle = base; ctx.fillRect(cx - Rs * 1.1, cy - Rs * 1.1, Rs * 2.2, Rs * 2.2);
      var blobs = [[-0.4, -0.2, 0.7, '#8B5CF6', 0.75], [0.42, 0.3, 0.75, '#3B82F6', 0.7], [0.1, -0.6, 0.45, '#EC4899', 0.4], [-0.15, 0.6, 0.5, '#22D3EE', 0.42], [0.55, -0.45, 0.35, '#C4B5FD', 0.35], [-0.6, 0.25, 0.3, '#60A5FA', 0.4]];
      for (i = 0; i < blobs.length; i++) {
        var b = blobs[i], bx = cx + (b[0] * cr - b[1] * sr * 0.2) * Rs, by = cy + b[1] * Rs;
        var gg = ctx.createRadialGradient(bx, by, 0, bx, by, Rs * b[2]);
        gg.addColorStop(0, rgba(b[3], b[4])); gg.addColorStop(0.5, rgba(b[3], b[4] * 0.35)); gg.addColorStop(1, rgba(b[3], 0));
        ctx.fillStyle = gg; ctx.fillRect(cx - Rs * 1.1, cy - Rs * 1.1, Rs * 2.2, Rs * 2.2);
      }
      // 림 라이트 (가장자리 밝은 테)
      var rim = ctx.createRadialGradient(cx, cy, Rs * 0.86, cx, cy, Rs * 1.02);
      rim.addColorStop(0, 'rgba(170,160,255,0)'); rim.addColorStop(1, 'rgba(190,180,255,0.5)');
      ctx.fillStyle = rim; ctx.fillRect(cx - Rs * 1.1, cy - Rs * 1.1, Rs * 2.2, Rs * 2.2);
      ctx.restore();
      ctx.globalAlpha = A * m * 0.55; ctx.strokeStyle = 'rgba(200,190,255,0.6)'; ctx.lineWidth = 0.8; wavy(Rs, 1); ctx.stroke();
    }
    // ── 2) 가지 (덴드라이트) — 행성이 될수록 사라짐. 마디 위치는 트리 좌표 고정, 잎만 구면으로 lerp ──
    if (m < 0.75 && !P.sky) {
      var lw = Math.max(0.45, 0.62 * (R / 150)), J = P.joints || [], jn = J.length, jx = new Array(jn), jy = new Array(jn);
      for (i = 0; i < jn; i++) { jx[i] = cx + J[i].x * R; jy[i] = cy + J[i].y * R; }
      var fade = Math.pow(1 - m, 2.2);                  // 가지는 제자리에서 빠르게 사라지고, 점만 구면으로 날아간다 (엉킴 방지)
      ctx.lineWidth = lw; ctx.globalAlpha = A * fade * 0.7;
      function branch(x0, y0, x1, y1, s, col, bend) {
        var ex = x0 + (x1 - x0) * s, ey = y0 + (y1 - y0) * s;
        ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + ex) / 2 + (ey - y0) * bend, (y0 + ey) / 2 - (ex - x0) * bend, ex, ey); ctx.stroke();
      }
      for (i = 0; i < jn; i++) {
        var s0 = clamp(gr * tot - J[i].d + 0.35); if (s0 <= 0) continue;
        var pj = J[i].p, x0 = pj < 0 ? cx : jx[pj], y0 = pj < 0 ? cy : jy[pj];
        branch(x0, y0, jx[i], jy[i], s0, J[i].c, (i % 2 ? 0.12 : -0.12));
      }
      for (i = 0; i < n; i++) {
        var s1 = seg[i]; if (s1 <= 0) continue;
        var pl = P.tp[i], x2 = pl < 0 ? cx : jx[pl], y2 = pl < 0 ? cy : jy[pl];
        branch(x2, y2, cx + P.tx[i] * R, cy + P.ty[i] * R, s1, P.nodes[i].c, (i % 2 ? 0.1 : -0.1));
      }
      // 마디 점(작게) — 레퍼런스의 가지 위 점들
      ctx.globalAlpha = A * fade * 0.55;
      for (i = 0; i < jn; i++) { if (clamp(gr * tot - J[i].d + 0.35) < 1) continue; ctx.fillStyle = J[i].c; ctx.beginPath(); ctx.arc(jx[i], jy[i], lw * 0.9, 0, Math.PI * 2); ctx.fill(); }
    }
    // ── 3) 구면 엣지(②) — 연보라 실선, 뒷면은 흐리게 / 링 점 사슬(③) ──
    if (m > 0.05) {
      ctx.lineWidth = Math.max(0.5, 0.6 * (R / 150));
      for (i = 0; i < P.edges.length; i++) {
        var e = P.edges[i], a0 = e[0], a1 = e[1];
        var zz = (fz[a0] + fz[a1]) * 0.5, da = zz > 0 ? 0.42 + zz * 0.3 : 0.1;
        ctx.globalAlpha = A * m * da * Math.min(seg[a0], seg[a1]) * (P.sky ? m * m * m : 1);   // sky = 별이 자리 잡은 뒤에야 망이 보인다(날아가는 동안 긴 선 엉킴 방지)
        ctx.strokeStyle = '#C7C2FF';
        ctx.beginPath(); ctx.moveTo(fx[a0], fy[a0]); ctx.lineTo(fx[a1], fy[a1]); ctx.stroke();
      }
      // 09-29 별자리 선 (앞면 = 또렷, 뒷면 = 아주 흐리게)
      var CL = P.clines || [];
      ctx.strokeStyle = '#E4DEFF'; ctx.lineWidth = Math.max(0.7, 0.9 * (R / 150));
      for (i = 0; i < CL.length; i++) {
        var c0 = CL[i][0], c1 = CL[i][1], zc = (fz[c0] + fz[c1]) * 0.5;
        ctx.globalAlpha = A * m * (zc > 0 ? 0.55 + 0.35 * zc : 0.08) * Math.min(seg[c0], seg[c1]) * (P.sky ? m * m : 1);
        ctx.beginPath(); ctx.moveTo(fx[c0], fy[c0]); ctx.lineTo(fx[c1], fy[c1]); ctx.stroke();
      }
      ctx.lineWidth = Math.max(0.5, 0.6 * (R / 150));
      var rings = P.rings || [];
      for (var ri = 0; ri < rings.length; ri++) {
        var rg = rings[ri], pts = rg.pts, prev = null;
        var wrap = clamp((m - 0.05) * 1.35 - ri * 0.12), vis = Math.ceil(pts.length * wrap), boost = 1 + 1.1 * (1 - m);   // 09-27: 보라 점 사슬이 구면을 감싸며 완성
        for (var pi = 0; pi < vis; pi++) {
          var q0 = pts[pi], qx = q0[0] * cr - q0[2] * sr, qz = q0[0] * sr + q0[2] * cr;
          var sxp = cx + qx * Rs, syp = cy + q0[1] * Rs, back = qz < 0, al = Math.min(1, A * m * boost * (back ? 0.22 : 0.95));
          if (prev && (prev[2] < 0) === back) { ctx.globalAlpha = Math.min(1, al * (0.35 + 0.45 * (1 - m))); ctx.strokeStyle = rg.c; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(sxp, syp); ctx.stroke(); }
          var drI = (pi === rg.big ? 3.2 : 1.1 + 0.5 * Math.sin(pi * 1.7)) * (R / 110) * (back ? 0.8 : 1), drW = 0.85 * (R / 110) * 1.9;
          var dr = drW + (drI - drW) * m;   // 감싸는 동안 굵고 밝게 → 자리 잡으면 아이콘 크기
          ctx.globalAlpha = al; ctx.fillStyle = rg.c; ctx.beginPath(); ctx.arc(sxp, syp, dr, 0, Math.PI * 2); ctx.fill();
          if (pi === rg.big && !back) { ctx.globalAlpha = al * 0.45; ctx.strokeStyle = rg.c; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sxp, syp, dr * 2.4, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = Math.max(0.5, 0.6 * (R / 150)); }
          prev = [sxp, syp, qz];
        }
      }
    }
    // ── 3b) 인트로 별자리 (sky): 선이 한 획씩 그어지고(grow 0.35~0.95), 행성이 되며 사라진다 / 꼭짓점 ○ □ △ ──
    if (P.sky && m < 1) {
      var SL = P.sky.lines, nl2 = SL.length, fadeS = 1 - m;
      ctx.strokeStyle = '#EDE7FF'; ctx.lineWidth = Math.max(0.9, 1.1 * (R / 150));
      for (i = 0; i < nl2; i++) {
        var pr = clamp((gr - 0.72) / 0.25 * nl2 - i); if (pr <= 0) continue;
        var l0 = SL[i][0], l1 = SL[i][1];
        ctx.globalAlpha = A * fadeS * 0.85;
        ctx.beginPath(); ctx.moveTo(fx[l0], fy[l0]); ctx.lineTo(fx[l0] + (fx[l1] - fx[l0]) * pr, fy[l0] + (fy[l1] - fy[l0]) * pr); ctx.stroke();
      }
      for (var sk in P.sky.shapes) {
        var si = +sk, shp = P.sky.shapes[sk], sa = clamp((gr - P.td[si]) * 14);
        if (sa <= 0) continue;
        var flash = Math.max(0, 1 - Math.abs(clamp((gr - P.td[si]) * 7) - 0.5) * 2);   // 떠오르는 순간 반짝(0→1→0)
        var sr2 = (P.sky.small[sk] ? 2.4 : 3.6) * (R / 110) * (1 + 0.5 * flash);
        var glow = ctx.createRadialGradient(fx[si], fy[si], 0, fx[si], fy[si], sr2 * 3.2);
        glow.addColorStop(0, 'rgba(228,222,255,' + (0.5 + 0.4 * flash).toFixed(3) + ')'); glow.addColorStop(1, 'rgba(228,222,255,0)');
        ctx.globalAlpha = A * fadeS * sa; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(fx[si], fy[si], sr2 * 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(1.2, 1.5 * (R / 150)); ctx.beginPath();
        if (shp === 'circle') ctx.arc(fx[si], fy[si], sr2, 0, Math.PI * 2);
        else if (shp === 'square') ctx.rect(fx[si] - sr2 * 0.85, fy[si] - sr2 * 0.85, sr2 * 1.7, sr2 * 1.7);
        else { ctx.moveTo(fx[si], fy[si] - sr2 * 1.15); ctx.lineTo(fx[si] + sr2, fy[si] + sr2 * 0.58); ctx.lineTo(fx[si] - sr2, fy[si] + sr2 * 0.58); ctx.closePath(); }
        ctx.stroke();
      }
    }
    // ── 4) 노드 (뒷면은 흐리게, 큰 노드 = 클러스터 링) ──
    for (i = 0; i < n; i++) {
      var s2 = seg[i]; if (s2 <= 0.05) continue;
      var nd2 = P.nodes[i], back = fz[i] < 0;
      var al = A * s2 * (back ? (1 - m) + m * 0.28 : 1);
      if (!nd2.star && m > 0.5) al *= 0.7;   // 배경 망은 한 톤 낮게 → 별자리가 앞으로
      var baseR = 0.85 + (nd2.r - 0.85) * m;   // 가지 단계 = 전부 같은 굵기(09-27) → 행성이 되며 아이콘 크기로
      var rr = baseR * (1 + 0.35 * fz[i] * m) * (R / 110);   // 행성 단계 원근(아이콘과 동일)
      if (rr < 0.6) rr = 0.6;
      if (nd2.star && m > 0.3) {   // 09-29 별: 등급 = 크기, 밝은 별 = 은은한 빛, 북극성 = 주인공(흰 코어 + 링 + 큰 광채, 늘 앞면 취급)
        if (nd2.hero) { back = false; al = A * s2; }
        var sc2 = nd2.sc, gl = nd2.hero ? rr * 9 : rr * 4;
        if (nd2.glow || nd2.hero) {
          var hg2 = ctx.createRadialGradient(fx[i], fy[i], 0, fx[i], fy[i], gl);
          hg2.addColorStop(0, rgba(sc2, 0.75)); hg2.addColorStop(0.25, rgba(nd2.hero ? '#BFD4FF' : sc2, 0.28)); hg2.addColorStop(1, rgba(sc2, 0));
          ctx.globalAlpha = al * m * (back ? 0.25 : 1); ctx.fillStyle = hg2; ctx.beginPath(); ctx.arc(fx[i], fy[i], gl, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = al * (back ? 0.5 : 1); ctx.fillStyle = sc2; ctx.beginPath(); ctx.arc(fx[i], fy[i], rr, 0, Math.PI * 2); ctx.fill();
        if (nd2.hero) {
          ctx.globalAlpha = al * m * 0.8; ctx.strokeStyle = '#CFE0FF'; ctx.lineWidth = Math.max(1, rr * 0.3);
          ctx.beginPath(); ctx.arc(fx[i], fy[i], rr * 2.2, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = al * m * 0.3; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(fx[i], fy[i], rr * 3.6, 0, Math.PI * 2); ctx.stroke();
          // 십자 광선
          ctx.globalAlpha = al * m * 0.55; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(0.6, rr * 0.18);
          ctx.beginPath(); ctx.moveTo(fx[i] - rr * 5, fy[i]); ctx.lineTo(fx[i] + rr * 5, fy[i]); ctx.moveTo(fx[i], fy[i] - rr * 5); ctx.lineTo(fx[i], fy[i] + rr * 5); ctx.stroke();
        }
        continue;
      }
      ctx.globalAlpha = P.sky && m < 0.5 ? al * (0.35 + 0.4 * ((i * 7) % 10) / 10) : al; ctx.fillStyle = P.sky && m < 0.5 ? '#E8ECFF' : nd2.c;   // sky = 흰 별(밝기 제각각)
      ctx.beginPath(); ctx.arc(fx[i], fy[i], rr, 0, Math.PI * 2); ctx.fill();
      if (nd2.big) {
        var cr1 = rr * 2.3;
        var halo = ctx.createRadialGradient(fx[i], fy[i], 0, fx[i], fy[i], rr * 6);
        halo.addColorStop(0, rgba(nd2.c, 0.55)); halo.addColorStop(0.4, rgba(nd2.c, 0.18)); halo.addColorStop(1, rgba(nd2.c, 0));
        ctx.globalAlpha = al * m * 0.9; ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(fx[i], fy[i], rr * 6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = al * (0.3 + 0.6 * m); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(fx[i], fy[i], rr * (0.45 + 0.3 * m), 0, Math.PI * 2); ctx.fill();
        if (m > 0.05) { ctx.globalAlpha = al * 0.7 * m; ctx.strokeStyle = nd2.c; ctx.lineWidth = Math.max(1, rr * 0.35); ctx.beginPath(); ctx.arc(fx[i], fy[i], cr1, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = al * 0.25 * m; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(fx[i], fy[i], cr1 * 1.7, 0, Math.PI * 2); ctx.stroke(); }
      }
    }
    ctx.globalAlpha = A;
    ctx.restore();
  }

  /* run(canvas, opts) → { stop, setData, redraw }
     opts: seed, topics, growth, n, still(트리 생략), loop(회전 유지), fps(스로틀), growMs(1400), morphMs(1100), onDone, fit(0.82 = R/반폭), bg */
  function run(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d'), P = build(opts.seed, opts), raf = 0, stopped = false;
    var rm = false; try { rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var still = !!opts.still || rm, loop = opts.loop !== false && !rm;
    var growMs = opts.growMs || 1400, morphMs = opts.morphMs || 1100, t0 = 0, w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    var done = false, rot = 0, lastT = 0;
    function size() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width || canvas.width)); h = Math.max(1, Math.round(r.height || canvas.height));
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    var lastDraw = 0;
    function frame(now) {
      if (stopped) return;
      if (!t0) t0 = now;
      if (opts.fps && lastDraw && now - lastDraw < 1000 / opts.fps) { raf = requestAnimationFrame(frame); return; }
      lastDraw = now;
      var el = now - t0, grow, morph;
      if (still) { grow = 1; morph = 1; }
      else { grow = clamp(el / growMs); morph = clamp((el - growMs * (P.sky ? 1.04 : 0.85)) / morphMs); }   // sky = 별자리가 다 그려진 뒤 잠깐 머물렀다 변환
      if (lastT) rot += (now - lastT) * 0.00012; lastT = now;
      var R = Math.min(w, h) * 0.5 * (opts.fit || 0.82), ccx = w / 2, ccy = h / 2;
      if (opts.anchor) {   // 10-06: 캔버스 = 화면 전체(밤하늘), 행성은 anchor 요소 자리·크기에
        var ar = opts.anchor.getBoundingClientRect(), cr2 = canvas.getBoundingClientRect();
        if (ar.width) { ccx = ar.left - cr2.left + ar.width / 2; ccy = ar.top - cr2.top + ar.height / 2; R = ar.width * 0.5 * (opts.fit || 0.82); }
      }
      ctx.clearRect(0, 0, w, h);
      if (opts.bg) { ctx.fillStyle = opts.bg; ctx.fillRect(0, 0, w, h); }
      draw(ctx, P, ccx, ccy, R, { rot: rot - (1 - ease(morph)) * 0.8, morph: morph, grow: grow, W: w, H: h });
      var fin = still || (grow >= 1 && morph >= 1);
      if (fin && !done) { done = true; if (opts.onDone) opts.onDone(); }
      if (!fin || loop) raf = requestAnimationFrame(frame); else raf = 0;
    }
    size();
    raf = requestAnimationFrame(frame);
    return {
      stop: function () { stopped = true; if (raf) cancelAnimationFrame(raf); raf = 0; },
      setData: function (o) { P = build(o.seed || opts.seed, o); },
      redraw: function () { size(); if (!raf && !stopped) { t0 = 0; raf = requestAnimationFrame(frame); } }
    };
  }

  var api = { build: build, draw: draw, run: run, TOPIC_COLOR: TOPIC_COLOR, TOPICS: TOPICS };
  root.RebePlanet = api;
  if (typeof module !== 'undefined' && module.exports) module.exports.RebePlanet = api;
})(typeof window !== 'undefined' ? window : this);
