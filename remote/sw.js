/* sw.js — BE.ARK REMOTE 서비스워커 (폰 알림)
   SSOT: docs/MOBILE_PUSH_NOTIFY_2026-07-21.md
   페이로드 = 데스크탑이 RFC 8291로 암호화해 보낸 {title, body, tag} JSON —
   푸시 서비스(애플/구글)는 내용 못 읽음, 브라우저가 복호해 여기로 전달. */
'use strict';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { /* 형식 불량 = 기본값 */ }
  // tag = 에이전트별 — 같은 에이전트 연속 알림은 교체 (스팸 방지)
  e.waitUntil(self.registration.showNotification(data.title || 'BE.ARK', {
    body: data.body || '',
    tag: data.tag || 'beark',
    icon: 'apple-touch-icon.png', // sw 기준 상대경로 = /remote/apple-touch-icon.png
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      try { await w.focus(); return; } catch { /* 다음 창 시도 */ }
    }
    try { await self.clients.openWindow('/remote'); } catch { /* best-effort */ }
  })());
});
