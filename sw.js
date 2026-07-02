// zzZ FM Service Worker
// ページ本体(index.html)は「ネット優先」= 更新がすぐ届く
// 音源・アイコンなどの静的ファイルは「キャッシュ優先」= 2回目から高速&オフラインでも鳴る
var CACHE_NAME = 'zzzfm-v1';
var PRECACHE = [
  './',
  'index.html',
  'manifest.json',
  'note-piano.mp3',
  'note-trumpet.mp3',
  'note-violin.mp3',
  'note-musicbox.mp3',
  'note-epiano.mp3',
  'note-flute.mp3',
  'icon-32.png',
  'icon-180.png',
  'og-image.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // 1つ失敗しても全体は止めない
      return Promise.all(PRECACHE.map(function(url){
        return cache.add(url).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return; // FirebaseやCDNには触らない

  if(req.mode === 'navigate'){
    // ページ本体: ネット優先(最新版を取りに行き、オフライン時のみキャッシュ)
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put('index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match('index.html');
      })
    );
    return;
  }

  // 静的ファイル: キャッシュ優先
  e.respondWith(
    caches.match(req).then(function(cached){
      if(cached) return cached;
      return fetch(req).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
