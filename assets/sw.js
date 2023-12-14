{{- if not hugo.IsProduction -}}
const DEVEL_MODE = true;
{{- end }}
const APP_VERSION = '{{ .Scratch.Get "version" }}';
const CACHE_STATIC = 'static.' + APP_VERSION; // basic resources which are installed with app
const CACHE_DYNAMIC = 'dynamic.' + APP_VERSION; // any other network resource

{{- $self := . }}

const staticFiles =
[
	'/',
{{- range where .Site.AllPages "Kind" "home" }}
	'{{ .RelPermalink }}',
{{- end }}
{{- range readDir "/static/css" }}
	'/css/{{ .Name }}?v={{ $self.Scratch.Get "version" }}',
{{- end }}
{{- range readDir "/static/leaflet" }}
	{{- if .IsDir }}
		{{- $parent := . }}
		{{- range readDir (printf "/static/leaflet/%s" .Name) }}
	'/leaflet/{{ $parent.Name }}/{{ .Name }}',
		{{- end }}
	{{- else }}
	'/leaflet/{{ .Name }}',
	{{- end }}
{{- end }}
{{- range readDir "/static/img" }}
	'/img/{{ .Name }}',
{{- end }}
	'/js/main.js?v={{ $self.Scratch.Get "version" }}',
	'/js/scripts.min.js?v={{ $self.Scratch.Get "version" }}',
	'/manifest.json'
];

function isSameOrigin(url)
{
	try
	{
		const BASE_URI = serviceWorker.scriptURL;

		return new URL(BASE_URI).origin === new URL(url, BASE_URI).origin;
	}
	catch
	{
		return false;
	}
};

const deleteCache = async(key) =>
{
	await caches.delete(key);
};

const deleteOldCaches = async() =>
{
	const cacheKeepList = [CACHE_STATIC, CACHE_DYNAMIC];
	const keyList = await caches.keys();
	const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
	await Promise.all(cachesToDelete.map(deleteCache));
};

self.addEventListener('install', function(e)
{
	console.log('[ServiceWorker] Install');

	e.waitUntil
	(
		caches.open(CACHE_STATIC).then(function(cache)
		{
			console.log('[ServiceWorker] Caching app shell');
			return cache.addAll(staticFiles);
		})
	);
});

self.addEventListener('activate', event =>
{
	event.waitUntil(deleteOldCaches());
});

// fetch a resource
self.addEventListener('fetch', event =>
{
	event.respondWith
	(
		// search in static cache first
		caches.match(event.request, {cacheName: CACHE_STATIC}).then(cacheResponse =>
		{
			return cacheResponse ||

			// if not found, check dynamic cache
			caches.match(event.request, {ignoreSearch:true}).then(cacheResponse =>
			{
				// check for newer copy in background
				let nr = fetch(event.request).then(async (netResponse) =>
				{
					// keep in cache if url from same origin
					if (isSameOrigin(event.request.url))
					{
						const cache = await caches.open(CACHE_DYNAMIC);
						cache.put(event.request, netResponse.clone());
					}
					return netResponse;
				});

				// return cached copy or wait for network response
				return cacheResponse || nr;
			})
		})
	);
});
