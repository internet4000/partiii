<script lang="ts">
	import { useApp } from '$lib/app.svelte';
	import { onMount } from 'svelte';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import type { Place, Post } from '$lib/atproto';
	import { precisePlace } from '$lib/place';
	const app = useApp();
	let { posts = [], selectable = false, selected, focus, onselect = () => {}, onpost = () => {} }: {
		posts?: Post[]; selectable?: boolean; selected?: Place; focus?: Place;
		onselect?: (point: Place) => void; onpost?: (post: Post) => void;
	} = $props();
	let target: HTMLDivElement;
	let error = $state(false);
	let map: import('maplibre-gl').Map | undefined;
	let maplibregl: typeof import('maplibre-gl');
	let ready = $state(false);
	let markers: import('maplibre-gl').Marker[] = [];
	let selectedMarker: import('maplibre-gl').Marker | undefined;
	let resizeObserver: ResizeObserver | undefined;
	let resizeFrame = 0;

	$effect(() => {
		const contributions = posts;
		if (!ready || !map) return;
		markers.forEach((marker) => marker.remove());
		markers = contributions.filter((post) => post.place).map((post) => {
			const element = document.createElement('button');
			element.type = 'button'; element.className = 'map-marker'; element.setAttribute('aria-label', post.place?.label || post.text.slice(0, 100));
			element.addEventListener('click', (event) => { event.stopPropagation(); onpost(post); });
			return new maplibregl.Marker({ element }).setLngLat([post.place!.longitude, post.place!.latitude]).addTo(map!);
		});
	});
	$effect(() => {
		const point = selected;
		if (!ready || !map) return;
		if (!point) { selectedMarker?.remove(); selectedMarker = undefined; return; }
		if (!selectedMarker) {
			const element = document.createElement(selectable ? 'button' : 'span');
			element.className = 'map-marker selected-marker';
			if (element instanceof HTMLButtonElement) {
				element.type = 'button';
				element.addEventListener('click', (event) => event.stopPropagation());
				element.addEventListener('keydown', (event) => {
				const offsets: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
				const direction = offsets[event.key];
				if (!direction || !map || !selectedMarker) return;
				event.preventDefault(); event.stopPropagation();
				const screen = map.project(selectedMarker.getLngLat());
				const distance = event.shiftKey ? 50 : 10;
				const position = map.unproject([screen.x + direction[0] * distance, screen.y + direction[1] * distance]);
				if (Number.isFinite(position.lat) && Number.isFinite(position.lng)) onselect(precisePlace(position.lat, position.lng));
			});
			} else element.setAttribute('aria-hidden', 'true');
			selectedMarker = new maplibregl.Marker({ element, draggable: selectable }).setLngLat([point.longitude, point.latitude]).addTo(map);
			selectedMarker.on('dragend', () => {
				const position = selectedMarker!.getLngLat();
				onselect(precisePlace(position.lat, position.lng));
			});
		}
		selectedMarker.getElement().setAttribute('aria-label', app.msg.dragPlace);
		selectedMarker.setLngLat([point.longitude, point.latitude]);
	});
	$effect(() => {
		const destination = focus;
		if (ready && map && destination) map.jumpTo({ center: [destination.longitude, destination.latitude], zoom: Math.max(map.getZoom(), 15) });
	});

	onMount(() => {
		let disposed = false;
		void (async () => {
			try {
				maplibregl = await import('maplibre-gl');
				if (disposed) return;
				maplibregl.setWorkerUrl(maplibreWorkerUrl);
				const instance = new maplibregl.Map({
					container: target,
					style: {
						version: 8,
						projection: { type: 'globe' },
						sources: { opentopomap: { type: 'raster', tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 17, attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)' } },
						layers: [{ id: 'opentopomap', type: 'raster', source: 'opentopomap' }]
					},
					center: selected ? [selected.longitude, selected.latitude] : [0, 18],
					zoom: selected ? (selectable ? 15 : 12) : 1.4,
					attributionControl: { compact: false }
				});
				map = instance;
				instance.on('style.load', () => { ready = true; instance.resize(); });
				instance.on('click', (event) => { if (selectable) onselect(precisePlace(event.lngLat.lat, event.lngLat.lng)); });
				resizeObserver = new ResizeObserver(() => {
					cancelAnimationFrame(resizeFrame);
					resizeFrame = requestAnimationFrame(() => { if (!disposed) instance.resize(); });
				});
				resizeObserver.observe(target);
			} catch { error = true; }
		})();
		return () => { disposed = true; cancelAnimationFrame(resizeFrame); resizeObserver?.disconnect(); markers.forEach((marker) => marker.remove()); selectedMarker?.remove(); map?.remove(); };
	});
</script>

<div class="map-shell" class:selectable>
	<div class="map-canvas" bind:this={target} role="application" aria-label={selectable ? app.msg.choosePlace : app.msg.map}></div>
	{#if error}<div class="map-error" role="alert">{app.msg.mapUnavailable}</div>
	{:else}<div class="map-zoom"><button type="button" disabled={!ready} aria-label={app.msg.zoomIn} onclick={() => map?.zoomIn({ duration: 0 })}>+</button><button type="button" disabled={!ready} aria-label={app.msg.zoomOut} onclick={() => map?.zoomOut({ duration: 0 })}>−</button></div>{/if}
</div>
