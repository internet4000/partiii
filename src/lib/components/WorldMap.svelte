<script lang="ts">
	import { onMount } from 'svelte';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import type { Post } from '$lib/atproto';
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
			el.addEventListener('click', () => onpost(post));
			return new maplibregl.Marker({ element: el }).setLngLat([post.place!.longitude, post.place!.latitude]).addTo(map!);
		});
		if (selected) {
			const el = document.createElement('span'); el.className = 'map-marker selected-marker'; el.setAttribute('aria-hidden', 'true');
			markerList.push(new maplibregl.Marker({ element: el }).setLngLat([selected.longitude, selected.latitude]).addTo(map));
		}
	}
	let maplibregl: typeof import('maplibre-gl');
	let resizeObserver: ResizeObserver | undefined;

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
				const variant = 'light_all';
				const mapInstance = new maplibregl.Map({
					container: target,
					style: {
						version: 8,
						sources: { carto: { type: 'raster', tiles: ['a', 'b', 'c'].map((host) => `https://${host}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}{r}.png`), tileSize: 256, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' } },
						layers: [{ id: 'carto', type: 'raster', source: 'carto' }]
					},
					center: selected ? [selected.longitude, selected.latitude] : [0, 18],
					zoom: selected ? 3 : 1.4,
					attributionControl: { compact: true }
				});
				map = mapInstance;
				mapInstance.on('load', () => { mapInstance.setProjection({ type: 'globe' }); ready = true; renderMarkers(); mapInstance.resize(); });
				mapInstance.on('click', (event) => { if (selectable) onselect({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }); });
				resizeObserver = new ResizeObserver(() => requestAnimationFrame(() => mapInstance.resize()));
				resizeObserver.observe(target);
				requestAnimationFrame(() => mapInstance.resize());
			} catch { error = true; }
		})();
		return () => { disposed = true; resizeObserver?.disconnect(); markerList.forEach((marker) => marker.remove()); map?.remove(); };
	});
</script>

<div class="map-shell" class:selectable>
	<div class="map-canvas" bind:this={target} role="application" aria-label={selectable ? 'Map. Tap to choose an approximate place.' : 'Globe showing posts with an approximate place.'}></div>
	{#if error}<div class="map-error">Map unavailable</div>{/if}
</div>

<style>
	.map-shell{position:relative;overflow:hidden;border-radius:20px;background:#e9eee9;min-height:260px;height:100%;width:100%}
	.map-canvas{position:absolute;inset:0}
	.map-shell :global(.maplibregl-ctrl-attrib){font-size:10px}
	.map-shell :global(.maplibregl-ctrl-group){border-radius:10px;box-shadow:0 2px 10px #26352e18}
	:global(.map-marker){border:0;border-radius:50%;width:16px;height:16px;background:#386b54;box-shadow:0 0 0 5px #386b5430;cursor:pointer}
	:global(.map-marker:hover),:global(.map-marker:focus-visible){transform:scale(1.3);outline:3px solid #fff}
	:global(.selected-marker){display:block;background:#d17638;box-shadow:0 0 0 6px #d1763838;width:18px;height:18px}
	.map-error{position:absolute;inset:0;display:grid;place-items:center;font-size:14px;color:#394b41}
</style>
