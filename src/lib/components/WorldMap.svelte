<script lang="ts">
	import { useApp } from '$lib/app.svelte';
	import { onMount } from 'svelte';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import type { Post } from '$lib/atproto';
	const app = useApp();
	let { posts = [], selectable = false, selected = undefined, onselect = () => {}, onpost = () => {} }: {
		posts?: Post[]; selectable?: boolean; selected?: { latitude: number; longitude: number };
		onselect?: (point: { latitude: number; longitude: number }) => void; onpost?: (post: Post) => void;
	} = $props();
	let target: HTMLDivElement;
	let error = $state(false);
	let map: import('maplibre-gl').Map | undefined;
	let ready = $state(false);
	let markerList: import('maplibre-gl').Marker[] = [];

	function renderMarkers() {
		if (!map || !ready) return;
		markerList.forEach((marker) => marker.remove());
		markerList = posts.filter((post) => post.place).map((post) => {
			const el = document.createElement('button');
			el.type = 'button'; el.className = 'map-marker'; el.setAttribute('aria-label', post.place?.label || post.text.slice(0, 100));
			el.addEventListener('click', (event) => { event.stopPropagation(); onpost(post); });
			return new maplibregl.Marker({ element: el }).setLngLat([post.place!.longitude, post.place!.latitude]).addTo(map!);
		});
		if (selected) {
			const el = document.createElement('span'); el.className = 'map-marker selected-marker'; el.setAttribute('aria-hidden', 'true');
			markerList.push(new maplibregl.Marker({ element: el }).setLngLat([selected.longitude, selected.latitude]).addTo(map));
		}
	}
	let maplibregl: typeof import('maplibre-gl');
	let resizeObserver: ResizeObserver | undefined;
	let resizeFrame = 0;

	$effect(() => {
		posts; selected; ready;
		renderMarkers();
	});

	onMount(() => {
		let disposed = false;
		(async () => {
			try {
				maplibregl = await import('maplibre-gl');
				if (disposed) return;
				maplibregl.setWorkerUrl(maplibreWorkerUrl);
				const mapInstance = new maplibregl.Map({
					container: target,
					style: {
						version: 8,
						sources: { opentopomap: { type: 'raster', tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 17, attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)' } },
						layers: [{ id: 'opentopomap', type: 'raster', source: 'opentopomap' }]
					},
					center: selected ? [selected.longitude, selected.latitude] : [0, 18],
					zoom: selected ? 3 : 1.4,
					attributionControl: { compact: false }
				});
				map = mapInstance;
				mapInstance.on('load', () => { mapInstance.setProjection({ type: 'globe' }); ready = true; renderMarkers(); mapInstance.resize(); });
				mapInstance.on('click', (event) => { if (selectable) onselect({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }); });
				resizeObserver = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => mapInstance.resize()); });
				resizeObserver.observe(target);
				resizeFrame = requestAnimationFrame(() => mapInstance.resize());
			} catch { error = true; }
		})();
		return () => { disposed = true; cancelAnimationFrame(resizeFrame); resizeObserver?.disconnect(); markerList.forEach((marker) => marker.remove()); map?.remove(); };
	});
</script>

<div class="map-shell" class:selectable>
	<div class="map-canvas" bind:this={target} role="application" aria-label={selectable ? app.msg.choosePlace : app.msg.map}></div>
	{#if error}<div class="map-error">{app.msg.mapUnavailable}</div>{/if}
</div>
