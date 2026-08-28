const CACHE_NAME = "welcome-hub-shell-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/config.js",
  "./js/sheet-data.js",
  "./js/app.js",
  "./icons/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {
      /* ถ้าไอคอนยังไม่มีไฟล์ อย่าให้การติดตั้งล้มเหลวทั้งหมด */
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ข้อมูล Google Sheet / Drive / Form: ปล่อยให้แอปจัดการเอง (network + localStorage cache
  // ใน sheet-data.js อยู่แล้ว) — service worker ไม่ยุ่งกับคำขอข้ามโดเมนเหล่านี้
  if (url.origin !== self.location.origin) return;

  // App shell: cache-first, แล้ว refresh เบื้องหลัง
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
