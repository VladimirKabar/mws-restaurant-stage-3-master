const staticCacheName = 'restaurant-cache-v2';
const OFFLINE_URL = 'offline.min.html';
const filesToCache = [

    '/',
    './manifest.json',
    './index.html',
    './restaurant.min.html',
    './404.min.html',
    './offline.min.html',
    './css/styles.min.css',
    './js/min/lazyload.min.js',
    './js/min/idb.min.js',
    './js/min/dbhelper.min.js',
    './js/min/main.min.js',
    './js/restaurant_info.js',
    './data/restaurants.json',
    './img/1.jpg',
    './img/2.jpg',
    './img/3.jpg',
    './img/4.jpg',
    './img/5.jpg',
    './img/6.jpg',
    './img/7.jpg',
    './img/8.jpg',
    './img/9.jpg',
    './img/10.jpg',
    './img/large/1.jpg',
    './img/large/2.jpg',
    './img/large/3.jpg',
    './img/large/4.jpg',
    './img/large/5.jpg',
    './img/large/6.jpg',
    './img/large/7.jpg',
    './img/large/8.jpg',
    './img/large/9.jpg',
    './img/large/10.jpg',
    './img/small/1.jpg',
    './img/small/2.jpg',
    './img/small/3.jpg',
    './img/small/4.jpg',
    './img/small/5.jpg',
    './img/small/6.jpg',
    './img/small/7.jpg',
    './img/small/8.jpg',
    './img/small/9.jpg',
    './img/small/10.jpg',
    './img/medium/1.jpg',
    './img/medium/2.jpg',
    './img/medium/3.jpg',
    './img/medium/4.jpg',
    './img/medium/5.jpg',
    './img/medium/6.jpg',
    './img/medium/7.jpg',
    './img/medium/8.jpg',
    './img/medium/9.jpg',
    './img/medium/10.jpg',
    './img/restaurant-icon.png'
];

self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(caches.open(staticCacheName).then(function (cache) {
        console.log('Cache is opened');
        return cache.addAll(filesToCache);
    })
    );
});

self.addEventListener('active', function (e) {
    e.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    //console.log(cacheName); too many junk to show
                    return cacheName.startsWith('restaurant-') && cacheName != staticCacheName;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        }))
});

self.addEventListener('message', function (e) {
    if (e.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(function (resp) {
            return resp || fetch(event.request).then(function (response) {
                if (response.status === 404) {
                    return caches.match('404.min.html');
                }
                return response;
            });
        }).catch(function () {
            return caches.match(OFFLINE_URL);
            //return offline site when offline and no-cache stored   
        })
    );
});
