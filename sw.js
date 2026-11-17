const CACHE = "canteen-v4";
const ASSETS = ["./", "./index.html", "./cards.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

async function cleanResponse(res) {
  if (!res || !res.redirected) return res;
  const buf = await res.arrayBuffer();
  return new Response(buf, { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await Promise.all(ASSETS.map(async url => {
        try {
          const res = await fetch(url, { cache: "reload" });
          if (res && res.ok) await c.put(url, await cleanResponse(res));
        } catch (err) {}
      }));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(async res => {
      const clean = await cleanResponse(res);
      if (clean && clean.status === 200 && clean.type === "basic") {
        const cl = clean.clone();
        caches.open(CACHE).then(c => c.put(e.request, cl));
      }
      return clean;
    }).catch(() => caches.match("./index.html")))
  );
});
