/* Service worker do Exame de consciência.
   Estratégia:
   - HTML (navegação): network-first. Online sempre recebe a versão publicada;
     o cache só entra quando a rede falha (offline, sinal fraco na igreja).
   - Demais arquivos: stale-while-revalidate (entrega o cache e atualiza atrás).
   O CACHE é versionado: ao mudar a estratégia, a lista de ASSETS ou o HTML de forma
   estrutural, incremente ("exame-v2" -> "exame-v3"). O activate apaga os caches antigos. */
var CACHE = "exame-v3";
var OFFLINE = "./index.html";
var ASSETS = [
  "./",
  "./index.html",
  "./igrejas.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function ehNavegacao(req) {
  return req.mode === "navigation" || req.destination === "document";
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  if (ehNavegacao(req)) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match(OFFLINE);
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.ok) c.put(req, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      });
    })
  );
});
