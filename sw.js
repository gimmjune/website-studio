'use strict';

const CACHE_NAME = 'studio-pwa-v1.2.0';

// 9종 모델 및 스튜디오 핵심 자산 목록 (오프라인 필수 자산 97개)
const PRECACHE_ASSETS = [
  './studio.html',
  './index.html',
  './studio.css',
  './studio.js',
  './studio-storage.js',
  './studio-export.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',

  // 9종 모델 72페이지 및 관련 에셋 전수
  './templates/A-1/index.html',
  './templates/A-1/about.html',
  './templates/A-1/teachers.html',
  './templates/A-1/learning.html',
  './templates/A-1/daily.html',
  './templates/A-1/safety.html',
  './templates/A-1/parents.html',
  './templates/A-1/location.html',
  './templates/A-1/styles.css',
  './templates/A-1/script.js',
  './templates/A-1/demo-data.js',
  './templates/A-1/demo-map.svg',

  './templates/A-2/index.html',
  './templates/A-2/about.html',
  './templates/A-2/teachers.html',
  './templates/A-2/learning.html',
  './templates/A-2/daily.html',
  './templates/A-2/safety.html',
  './templates/A-2/parents.html',
  './templates/A-2/location.html',
  './templates/A-2/styles.css',

  './templates/A-3/index.html',
  './templates/A-3/about.html',
  './templates/A-3/teachers.html',
  './templates/A-3/learning.html',
  './templates/A-3/daily.html',
  './templates/A-3/safety.html',
  './templates/A-3/parents.html',
  './templates/A-3/location.html',
  './templates/A-3/styles.css',

  './templates/B-1/index.html',
  './templates/B-1/about.html',
  './templates/B-1/teachers.html',
  './templates/B-1/learning.html',
  './templates/B-1/daily.html',
  './templates/B-1/safety.html',
  './templates/B-1/parents.html',
  './templates/B-1/location.html',
  './templates/B-1/styles.css',

  './templates/B-2/index.html',
  './templates/B-2/about.html',
  './templates/B-2/teachers.html',
  './templates/B-2/learning.html',
  './templates/B-2/daily.html',
  './templates/B-2/safety.html',
  './templates/B-2/parents.html',
  './templates/B-2/location.html',
  './templates/B-2/styles.css',

  './templates/B-3/index.html',
  './templates/B-3/about.html',
  './templates/B-3/teachers.html',
  './templates/B-3/learning.html',
  './templates/B-3/daily.html',
  './templates/B-3/safety.html',
  './templates/B-3/parents.html',
  './templates/B-3/location.html',
  './templates/B-3/styles.css',
  './templates/B-3/inner.css',

  './templates/C-1/index.html',
  './templates/C-1/about.html',
  './templates/C-1/teachers.html',
  './templates/C-1/learning.html',
  './templates/C-1/daily.html',
  './templates/C-1/safety.html',
  './templates/C-1/parents.html',
  './templates/C-1/location.html',
  './templates/C-1/styles.css',
  './templates/C-1/inner.css',

  './templates/C-2/index.html',
  './templates/C-2/about.html',
  './templates/C-2/teachers.html',
  './templates/C-2/learning.html',
  './templates/C-2/daily.html',
  './templates/C-2/safety.html',
  './templates/C-2/parents.html',
  './templates/C-2/location.html',
  './templates/C-2/styles.css',
  './templates/C-2/inner.css',

  './templates/C-3/index.html',
  './templates/C-3/about.html',
  './templates/C-3/teachers.html',
  './templates/C-3/learning.html',
  './templates/C-3/daily.html',
  './templates/C-3/safety.html',
  './templates/C-3/parents.html',
  './templates/C-3/location.html',
  './templates/C-3/styles.css',
  './templates/C-3/inner.css'
];

// 서비스 워커 설치: 필수 오프라인 자산 엄격 캐싱
// 모든 비동기 캐싱 작업이 완전히 종료된 후 실패 여부를 판단하고,
// 실패 시 진행 중이던 비동기 쓰기가 끝난 상태에서 불완전 캐시를 안전하게 삭제(롤백)합니다.
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 모든 비동기 fetch 및 put 작업이 완전히 종료(settled)될 때까지 대기
      const results = await Promise.allSettled(
        PRECACHE_ASSETS.map(async url => {
          const response = await fetch(url, { cache: 'no-cache' });
          if (!response.ok) {
            throw new Error(`필수 오프라인 자산 캐싱 실패 (${response.status}): ${url}`);
          }
          await cache.put(url, response);
        })
      );

      // 모든 비동기 작업이 종료된 후 실패 항목 감지
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        const firstError = failed[0].reason;
        console.error(`[SW] ${failed.length}개 필수 자산 캐싱 실패로 설치 롤백:`, firstError);
        // 모든 비동기 캐싱 작업이 완전히 종료된 시점에 불완전 캐시를 안전하게 삭제
        try {
          await caches.delete(CACHE_NAME);
        } catch {}
        // install 이벤트를 reject 시켜 새 서비스 워커 설치 거부
        // -> 브라우저가 새 SW를 폐기하고 기존 정상 작동 서비스 워커와 캐시 유지
        throw firstError;
      }

      // 모든 필수 자산이 100% 정상 캐싱 완료된 경우에만 대기 상태 건너뛰기
      await self.skipWaiting();
    })()
  );
});

// 서비스 워커 활성화: 새 버전이 완전히 설치된 경우에만 구버전 캐시 정리
// 주의: 사용자 작업 자료가 보관된 IndexedDB/localStorage/폴더는 절대 건드리지 않음
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter(key => key.startsWith('studio-pwa-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        );
        await self.clients.claim();
      } catch (err) {
        console.error('[SW] 활성화 캐시 정리 오류:', err);
      }
    })()
  );
});

// 요청 가로채기: 오프라인 서빙 및 Stale-While-Revalidate
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // http/https 스킴만 처리
  if (!url.protocol.startsWith('http')) return;

  // 내비게이션 요청 (HTML 페이지 이동)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (err) {
          // 네트워크 실패 시 캐시된 페이지 또는 studio.html / index.html로 안전하게 대체
        }
        const cached = await caches.match(event.request) ||
                       await caches.match('./studio.html') ||
                       await caches.match('./index.html');
        if (cached) return cached;
        return new Response('오프라인 상태입니다.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // 정적 리소스 요청: Stale-While-Revalidate / Cache-First
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request, { ignoreSearch: true });
      if (cached) {
        // 백그라운드 갱신 시도
        fetch(event.request).then(async networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse);
          }
        }).catch(() => {});
        return cached;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        return new Response('리소스를 불러올 수 없습니다.', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })()
  );
});
