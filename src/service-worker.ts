/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = new Set([...build, ...files]);

self.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...ASSETS]))
			.then(() => (self as unknown as ServiceWorkerGlobalScope).skipWaiting())
	);
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE) await caches.delete(key);
			}
			(self as unknown as ServiceWorkerGlobalScope).clients.claim();
		})
	);
});

self.addEventListener('fetch', (event: FetchEvent) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Only cache-first for known static assets (build output + static files).
	// Everything else (pages, API calls, data fetches) goes network-first
	// so users always see fresh data.
	if (ASSETS.has(url.pathname)) {
		event.respondWith(
			caches.open(CACHE).then(async (cache) => {
				const cached = await cache.match(event.request);
				return cached ?? fetch(event.request);
			})
		);
		return;
	}

	// Network-first for pages and data
	event.respondWith(
		fetch(event.request).catch(() => {
			return caches.match(event.request).then((cached) => {
				return cached ?? new Response('Offline', { status: 503 });
			});
		})
	);
});
