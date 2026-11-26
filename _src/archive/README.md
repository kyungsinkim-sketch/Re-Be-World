# 보관한 사이트 판

- `world-2026-11-23/` — re-be.world "나의 데이터를 내가 소유하는 AI 에이전트" 판 (네 페이지: 소개·기능·비전·튜토리얼). 2026-11-27에 크리에이터 판(5d782c8, 11-16)으로 되돌리면서 보관.
  - 통째로 보기 = git 태그 `world-2026-11-23-data-owner` (생성 페이지·그림 포함).
  - 되살리기 = 이 폴더의 `world.html`·`en-world.json`을 `_src/`로 복사 → `build.py` SITES world pages에 `features`·`vision` 추가 → vercel.json `/features`·`/vision` 목적지를 `/world/features`·`/world/vision`(+ko)로 → `python3 _src/build.py`.
