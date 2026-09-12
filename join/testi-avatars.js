/* 유저 코멘트 전용 미니미 (2026-09-12 빠불로: 채용 공고 프리셋과 겹치지 않게 각 유저 캐릭터에 맞춰).
   키 = 코멘트 카드의 data-preset 값 (index.html / ko/index.html / join/nachsun.html 공용). 파츠 규격 = 앱 AvatarParts v1. */
window.BEARK_TESTI_AVATARS = {
  /* 기획자 Kyu — 차분한 터틀넥 + 하프림 안경 */
  founder:    { v: 1, face: "slim",   hair: "side",   eyes: "normal", mouth: "line",  glasses: "half-rim",      hat: "none",       acc: "none",   cloth: "turtleneck", bg: "dots",
                colors: { skin: "#f1c9a5", hair: "#2a2530", cloth: "#1f1a24", glasses: "#b9bcc6", hat: "#23202a", acc: "#c9a24a", iris: "#3d5a8a", bg: "#F59E0B" } },
  /* 프로듀서 Hyung — 헤드폰 + 멜빵, 현장형 */
  accountant: { v: 1, face: "square", hair: "curly",  eyes: "happy",  mouth: "grin",  glasses: "none",          hat: "headphones", acc: "none",   cloth: "overalls",   bg: "stripes",
                colors: { skin: "#e8b48c", hair: "#1f1a24", cloth: "#3b6ea5", glasses: "#2a2530", hat: "#23202a", acc: "#c9a24a", iris: "#5c3a24", bg: "#0EA5E9" } },
  /* 마케터 Ar — 긴 머리 + 꽃, 밝은 스웨터 */
  marketer:   { v: 1, face: "round",  hair: "long",   eyes: "wink",   mouth: "smile", glasses: "none",          hat: "none",       acc: "flower", cloth: "sweater",    bg: "gradient",
                colors: { skin: "#f6d3b5", hair: "#b5651d", cloth: "#d94f70", glasses: "#2a2530", hat: "#23202a", acc: "#ffd166", iris: "#2f7a5a", bg: "#EC4899" } },
  /* 프리랜서 Dong — 비니 + 후디, 고양이 눈 */
  researcher: { v: 1, face: "soft",   hair: "pixie",  eyes: "cat",    mouth: "pout",  glasses: "none",          hat: "beanie",     acc: "none",   cloth: "hoodie",     bg: "window",
                colors: { skin: "#e3b48f", hair: "#6b4f3a", cloth: "#444c5c", glasses: "#2a2530", hat: "#8b5cf6", acc: "#c9a24a", iris: "#3d5a8a", bg: "#22C55E" } },
  /* 디자이너 Mei — 베레모 + 동그란 안경 + 땋은 머리 */
  everyday:   { v: 1, face: "slim",   hair: "braid",  eyes: "wide",   mouth: "smile", glasses: "round-glasses", hat: "beret",      acc: "none",   cloth: "tee",        bg: "stars",
                colors: { skin: "#f1c9a5", hair: "#1f1a24", cloth: "#f0f0f2", glasses: "#2a2530", hat: "#e63946", acc: "#c9a24a", iris: "#5c3a24", bg: "#F97316" } },
  /* 크리에이터 Saf — 헤어밴드 + 초커 + 망토, 웨이브 금발 */
  writer:     { v: 1, face: "round",  hair: "wavy",   eyes: "sleepy", mouth: "open",  glasses: "none",          hat: "headband",   acc: "choker", cloth: "cloak",      bg: "city",
                colors: { skin: "#f6d3b5", hair: "#e3c27a", cloth: "#2f3e46", glasses: "#2a2530", hat: "#c49c4d", acc: "#c49c4d", iris: "#2f4f6f", bg: "#06B6D4" } }
};
