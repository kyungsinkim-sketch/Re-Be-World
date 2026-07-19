# 웹사이트 인수인계 — 제이 → 미니제이 (2026-07-19)

빠불로 지시로 re-be.world 웹사이트 개발을 미니제이에게 완전 이관한다.
이 문서가 시작점이고, 이 repo(`kyungsinkim-sketch/Re-Be-World`)가 작업 대상이다.

---

## 1. 웹사이트 기본 사항

### 역할 & 전략
- **re-be.world = Be.Ark 공식 홈** — 제품 소개 + 다운로드 배포 + 업데이트 공지 + 개인정보처리방침.
- **도메인은 re-be.world 올인** (빠불로 2026-07-19 확정). ark.works는 별개 옛 제품이며 폐쇄 예정 — 절대 참조하지 말 것.
- 포지셔닝: **"오직 나만의 AI 에이전트"** (히어로 키카피, 빠불로 직접 작성). 로컬 우선 / 데이터는 내 기기에만 / BYOK. 이 정체성을 훼손하는 카피 금지 (예: "클라우드로 더 강력하게" 같은 뉘앙스 ❌).
- 타겟: 크리에이터/일반인. 과장 없는 사실 기반 문구 ("100% local", "전송 전 승인").

### Repo & 배포 파이프라인
- **라이브 소스 = 이 repo (`Re-Be-World`, public)** → main push 시 Vercel 자동 배포.
- ⚠️ 함정: `kyungsinkim-sketch/re-be.world` repo의 `landing.html`은 **stale** — 고쳐도 반영 안 됨. 손대지 말 것.
- git author = `Kyungsin Kim <kyungsin.kim@paulus.pro>` 고정.
- **빠불로가 카피를 직접 커밋하는 repo다** (예: 02b8990 한국어 문구 개선). push 전 `git pull --rebase` 습관 필수.

### 구조 (정적, 프레임워크 없음)
- `index.html` (EN) + `ko/index.html` (KO) — **내용 수정은 항상 두 파일 세트로**.
- `privacy.html` + `ko/privacy.html` — 구글·애플 심사 공용 필수물. Limited Use 문구 포함, 함부로 수정 금지 (수정 시 빠불로+제이 컨펌).
- `public/announcements.json` — **공지 SSOT**. 앱 인앱 What's New 패널과 웹 `/ko/` "업데이트 소식" 섹션이 같은 raw URL을 fetch해 자동 동기화. 공지는 이 파일 하나만 고치면 끝.
  - raw: `https://raw.githubusercontent.com/kyungsinkim-sketch/Re-Be-World/main/public/announcements.json`
  - 항목 형식: `{ id(고유·불변, 읽음처리 기준), date, title, body(평문+\n, 이모지 불릿), tag }`
- 다운로드 링크: `index.html` / `ko/index.html` 하단 스크립트의 `DL_MAC` / `DL_WIN` 변수 — 릴리스마다 **둘 다** 교체 + "Beta X.Y" 라벨 일괄 교체 (nav/버튼/ver-badge/버그신고 mailto까지).
- 릴리스 에셋(dmg/exe)은 이 repo의 GitHub Releases에 게시됨 (Be.Ark 코드 repo는 private이라 여기서 배포).

### 디자인 정책
- 다크 단일 테마: 배경 `#070a0f`, 텍스트 `#f6f8fb`, **키컬러 = 올드골드 `#c49c4d`** (accent 계열 전부 이 컬러에서 파생).
- 폰트 Inter/system-ui. 절제된 미니멀 — 장식/애니메이션 남발 금지, 아이콘·이모지도 최소.
- features 상설 카드(제품 핵심 기능 소개)는 **릴리스 노트가 아님** — 매 릴리스마다 손대지 말고, 정말 큰 기능만 가끔 수동 반영.

---

## 2. Beta 1.2 (v1.2.0-beta.1, 2026-07-19) — 사이트에 반영할 기능

beta.8(7/13) 이후 70커밋 분량. 유저 관점 핵심:

- **👤 계정 & Pro 구독** — 이메일 가입/로그인(Supabase Auth), Stripe 결제로 Pro 구독 오픈 (달러 단일).
- **🔗 구글 연결 (Connections)** — Gmail 요약(EmailDigest), 메일 발송은 **전송 전 유저 승인 2단계**(ConfirmSendEmail), 캘린더 일정 요약(읽기 전용), 구글 독스·시트 읽기. 전부 로컬 처리 — 구글 데이터는 서버로 안 감.
- **⏰ 스케줄 자동화** — "매일 아침 9시에 브리핑해줘" → 에이전트가 정기 실행(도구 사용 포함)하고 등록한 채팅방으로 보고.
- **💬 헬프데스크** — 앱 안에서 팀에 직접 문의, 첫 사용 시 열람 동의 게이트.
- **🛡️ 개인정보처리방침 공개** — /privacy + /ko/privacy.
- **⚡ 안정성** — 채팅 전환 검은 화면/과거 점프 해결 등 60개 이상 픽스.

(공지 문구는 announcements.json `2026-07-19-beta-1-2` 항목에 이미 작성돼 있음 — 그걸 기준으로.)

---

## 3. 추가 과제 (빠불로 지시): Pro / Enterprise 섹션

사이트에 요금/제공 형태 설명 섹션 신설 필요:

- **Free** — 로컬 모델(Ollama 번들) + BYOK로 핵심 기능 전부. "무료여도 본질은 다 된다"가 우리 정체성이니 Free를 초라하게 그리지 말 것.
- **Pro** — 구독 (Stripe, 달러). 정확한 가격·혜택 목록은 **Be.Ark repo `docs/BILLING_ACCOUNT_A4*.md`(SSOT) 확인 후** 표기. 임의로 지어내지 말 것.
- **Enterprise** — **기업용 서버형 에이전트 구축** (기업 서버/온프레미스에 에이전트 환경을 구축해주는 형태). 아직 제품화 전 단계이므로:
  - 가격 표기 ❌, 기능 나열 최소.
  - "Contact us" 문의 기반: `ark@re-be.world`.
  - 문구 예시 방향: "귀사 서버에, 귀사 데이터로만 학습하는 전용 에이전트를 구축합니다."
- ⚠️ 가격·약속이 들어가는 문구는 **게시 전 반드시 빠불로 컨펌**.

---

## 4. 제이가 남기는 말

- **SSOT 지도**: 공지 = `public/announcements.json` 한 곳 / 제품·릴리스 전략 = Be.Ark repo `docs/RELEASE_STRATEGY_2026-06-13.md` / 결제 = `docs/BILLING_ACCOUNT_A4*.md` / 구글 심사 = `docs/CONNECTIONS_FRAMEWORK_2026-07-18.md`. 기억보다 문서를 믿어.
- **릴리스 때 DL 링크·공지는 제이도 만진다** (릴리스 절차의 일부). 충돌 방지: 작업 전 pull, 릴리스 당일엔 제이와 타이밍 맞추기.
- **다운로드 링크 바꾸면 반드시 익명(curl, 토큰 없이) 200 검증** 후 push. draft 릴리스 링크 걸면 유저는 404를 본다.
- 빠불로 스타일: 답은 결론부터 짧게, 스샷/로그 실측 기반. 빠불로가 "실패"라고 하면 실패다. 추측으로 "됐습니다" 금지.
- EN/KO 두 파일이 항상 쌍으로 움직인다는 것만 기억해도 사고의 절반은 예방된다.
- 웹은 Be.Ark의 첫인상이다. 화려함보다 "믿을 수 있어 보이는 것"이 목표. 잘 부탁해 🐣

— 제이 (2026-07-19)
