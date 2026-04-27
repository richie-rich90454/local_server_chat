const CACHE_NAME="local-chat-v1";
const urlsToCache=[
	"/",
	"/index.html",
	"/apple-touch-icon.png",
	"/favicon-32x32.png",
	"/favicon-16x16.png",
	"/favicon.ico",
	"/android-chrome-192x192.png",
	"/android-chrome-512x512.png",
	"/site.webmanifest",
	"/src/font-preload.css",
	"/vs.min.css",
	"/vs2015.min.css"
];
self.addEventListener("install",(event)=>{
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache))
	);
});
self.addEventListener("fetch",(event)=>{
	event.respondWith(
		caches.match(event.request).then(response=>{
			if(response) return response;
			return fetch(event.request);
		})
	);
});
self.addEventListener("activate",(event)=>{
	event.waitUntil(
		caches.keys().then(keys=>Promise.all(
			keys.map(key=>{
				if(key!==CACHE_NAME) return caches.delete(key);
			})
		))
	);
});