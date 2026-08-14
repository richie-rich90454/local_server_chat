const CACHE_NAME="local-chat-v2";
const API_PATHS=["/server-info","/get-client-ip","/check-name","/join-code/","/client-info","/discover","/discovery/events"];
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
	"/manifest.json",
	"/vs.min.css",
	"/vs2015.min.css",
	"/NotoSans-VariableFont_wdth_wght.ttf",
	"/NotoSansMono-VariableFont_wdth_wght.ttf"
];
self.addEventListener("install",(event)=>{
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache)).then(()=>self.skipWaiting())
	);
});
self.addEventListener("activate",(event)=>{
	event.waitUntil(
		caches.keys().then(keys=>Promise.all(
			keys.map(key=>{
				if(key!==CACHE_NAME)return caches.delete(key);
			})
		)).then(()=>self.clients.claim())
	);
});
self.addEventListener("fetch",(event)=>{
	const url=new URL(event.request.url);
	if(event.request.method!=="GET")return;
	if(url.pathname.endsWith("/sw.js")){
		event.respondWith(fetch(event.request));
		return;
	}
	for(const api of API_PATHS){
		if(url.pathname===api||url.pathname.startsWith(api)){
			event.respondWith(fetch(event.request));
			return;
		}
	}
	if(event.request.mode==="navigate"||url.pathname==="/"||url.pathname==="/index.html"){
		event.respondWith(
			fetch(event.request).then(response=>{
				const copy=response.clone();
				caches.open(CACHE_NAME).then(cache=>cache.put("/index.html",copy));
				return response;
			}).catch(()=>caches.match("/index.html"))
		);
		return;
	}
	event.respondWith(
		caches.match(event.request).then(cached=>{
			if(cached)return cached;
			return fetch(event.request).then(response=>{
				if(response.ok){
					const copy=response.clone();
					caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
				}
				return response;
			});
		})
	);
});
