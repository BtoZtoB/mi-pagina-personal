'use strict';
importScripts('./offline-config.js', './offline-db.js');
const VERSION = 'v2-offline-first';
const PREFIX = 'bryan-pwa-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + VERSION;
const BASE = self.registration.scope;
const CORE = ["./", "index.html", "style.css", "script.js", "pwa.js", "offline-config.js", "offline-db.js", "diagnostico.html", "manifest.json", "vendor/bootstrap.bundle.min.js", "vendor/jquery.min.js", "vendor/poppins.css", "vendor/bootstrap.min.css", "vendor/chart.umd.min.js", "vendor/bootstrap-icons.css", "icons/icon-192.png", "icons/icon-512.png", "vendor/fonts/bootstrap-icons.woff2", "vendor/fonts/poppins-5.ttf", "vendor/fonts/poppins-0.ttf", "vendor/fonts/poppins-3.ttf", "vendor/fonts/bootstrap-icons.woff", "vendor/fonts/poppins-2.ttf", "vendor/fonts/poppins-1.ttf", "vendor/fonts/poppins-4.ttf"];
const IMAGES = ["img/perfil.jpg", "img/foto1.jpg", "img/foto2.jpg", "img/foto3.jpg", "img/artistas/coldplay.jpg", "img/artistas/imagine-dragons.jpg", "img/artistas/maroon-5.jpg", "img/artistas/travis-scott.jpg", "img/artistas/future.jpg", "img/artistas/21-savage.jpg", "img/artistas/eminem.jpg", "img/artistas/kendrick-lamar.jpg", "img/artistas/j-cole.jpg", "img/juegos/valorant.jpg", "img/juegos/rocket-league.jpg", "img/juegos/fortnite.jpg", "img/juegos/counter-strike-2.jpg", "img/juegos/apex-legends.jpg", "img/juegos/overwatch-2.jpg", "img/juegos/ea-sports-fc.jpg", "img/juegos/nba-2k.jpg", "img/juegos/efootball.jpg", "img/juegos/minecraft.jpg", "img/juegos/gta-v.jpg", "img/juegos/spider-man.jpg", "img/juegos/forza-horizon-5.jpg", "img/juegos/need-for-speed.jpg", "img/juegos/mario-kart.jpg", "img/juegos/clash-royale.jpg", "img/juegos/league-of-legends.jpg", "img/juegos/age-of-empires.jpg", "img/juegos/resident-evil.jpg", "img/juegos/outlast.jpg", "img/juegos/phasmophobia.jpg"];
const urlFor = path => new URL(path, BASE).href;
let syncing = null;

async function publishQueueState() {
    const clients = await self.clients.matchAll({type:'window'});
    clients.forEach(client => client.postMessage({type:'CONTACTS_UPDATED'}));
}

async function synchronize() {
    if (!self.PWA_CONTACT_ENDPOINT) return;
    const endpoint = new URL(self.PWA_CONTACT_ENDPOINT, BASE);
    if (endpoint.protocol !== 'https:' && endpoint.hostname !== 'localhost' && endpoint.hostname !== '127.0.0.1') {
        throw new Error('El servicio receptor debe usar HTTPS.');
    }
    const items = await OfflineDB.all();
    for (const item of items.filter(item => item.status === 'pending')) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(endpoint.href, {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({id:item.id, createdAt:item.createdAt, data:item.data}),
                signal:controller.signal
            });
            if (!response.ok) throw new Error('El receptor no confirmó el mensaje.');
            const confirmation = await response.json();
            if (confirmation.accepted !== true || confirmation.id !== item.id) {
                throw new Error('Respuesta sin confirmación válida.');
            }
            await OfflineDB.put({...item, status:'sent', sentAt:new Date().toISOString()});
            await publishQueueState();
        } finally {
            clearTimeout(timer);
        }
    }
}
function syncOnce() {
    if (!syncing) syncing = synchronize().finally(() => { syncing = null; });
    return syncing;
}
self.addEventListener('sync', event => {
    if (event.tag === 'bryan-contactos') event.waitUntil(syncOnce());
});
self.addEventListener('message', event => {
    if (event.data?.type === 'SYNC_CONTACTS') {
        event.waitUntil(syncOnce().catch(error => console.info('Envíos pendientes:', error.message)));
    }
});
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        await cache.addAll(CORE.map(path => new Request(urlFor(path), {cache:'reload'})));
        await Promise.allSettled(IMAGES.map(async path => {
            const response = await fetch(urlFor(path), {cache:'reload'});
            if (response.ok) await cache.put(urlFor(path), response);
        }));
    })());
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE)
            .map(key => caches.delete(key)));
        await self.clients.claim();
    })());
});
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(BASE)) return;
    const canonical = new URL(request.url);
    canonical.search = '';
    if (canonical.href === BASE) canonical.pathname += 'index.html';
    // Offline-first: leer primero la copia local de esta versión.
    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const saved = await cache.match(canonical.href);
        if (saved) return saved;
        try {
            const response = await fetch(request);
            if (response.ok) await cache.put(canonical.href, response.clone());
            return response;
        } catch (_) {
            if (request.destination === 'image') {
                return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260"><rect width="100%" height="100%" fill="#102a56"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-family="sans-serif" font-size="18">Imagen no guardada</text></svg>', {headers:{'Content-Type':'image/svg+xml'}});
            }
            return new Response('Recurso no guardado. Abre primero la aplicación con Internet.', {
                status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}
            });
        }
    })());
});
