<script lang="ts">
	import { useApp } from '$lib/app.svelte';
	import { onMount } from 'svelte';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import LocateFixed from '@lucide/svelte/icons/locate-fixed';
	import Info from '@lucide/svelte/icons/info';
	import X from '@lucide/svelte/icons/x';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import type { Place, Post } from '$lib/atproto';
	import { postPath, profilePath } from '$lib/records';
	import { precisePlace } from '$lib/place';
	import { getCurrentLocation, locationErrorKey, type DeviceLocation } from '$lib/geolocation';
	import NativeDialog from './NativeDialog.svelte';
	const app = useApp();
	let { posts = [], selectable = false, selected, focus, activePostUri, onselect = () => {}, onpost = () => {}, onlocate }: {
		posts?: Post[]; selectable?: boolean; selected?: Place; focus?: Place; activePostUri?: string;
		onselect?: (point: Place) => void; onpost?: (post: Post) => void;
		onlocate?: (point: DeviceLocation) => void | Promise<void>;
	} = $props();
	let target: HTMLDivElement;
	let error = $state(false);
	let map: import('maplibre-gl').Map | undefined;
	let maplibregl: typeof import('maplibre-gl');
	let ready = $state(false);
	let markers: import('maplibre-gl').Marker[] = [];
	let popup: import('maplibre-gl').Popup | undefined;
	let selectedMarker: import('maplibre-gl').Marker | undefined;
	let resizeObserver: ResizeObserver | undefined;
	let resizeFrame = 0;
	let locating = $state(false);
	let locationError = $state('');
	let creditsOpen = $state(false);
	let disposed = false;
	async function locate() {
		if (!ready || locating) return;
		locating = true; locationError = '';
		try {
			const result = await getCurrentLocation();
			if (disposed) return;
			map?.jumpTo({ center: [result.longitude, result.latitude], zoom: 15 });
			await onlocate?.(result);
		} catch (cause) { if (!disposed) locationError = app.msg[locationErrorKey(cause)]; }
		finally { if (!disposed) locating = false; }
	}

	function showPopup(post: Post) {
		if (!map || !post.place) return;
		const card = document.createElement('article');
		card.className = 'map-popup-card';
		const heading = document.createElement('a');
		heading.className = 'identity';
		heading.href = profilePath(post.authorDid);
		heading.textContent = post.handle;
		const text = document.createElement('p');
		text.className = 'post-text';
		text.dir = 'auto';
		text.textContent = post.text;
		const link = document.createElement('a');
		link.className = 'reply-link';
		link.href = postPath(post.uri);
		link.textContent = app.msg.openPost;
		card.append(heading, text, link);
		popup?.remove();
		popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, maxWidth: '20rem' })
			.setLngLat([post.place.longitude, post.place.latitude])
			.setDOMContent(card)
			.addTo(map);
	}
	$effect(() => {
		const contributions = posts;
		const active = activePostUri;
		if (!ready || !map) return;
		markers.forEach((marker) => marker.remove());
		markers = contributions.filter((post) => post.place).map((post) => {
			const element = document.createElement('button');
			element.type = 'button'; element.className = 'map-marker'; element.setAttribute('aria-label', post.place?.label || post.text.slice(0, 100));
			element.addEventListener('click', (event) => { event.stopPropagation(); onpost(post); showPopup(post); });
			const marker = new maplibregl.Marker({ element }).setLngLat([post.place!.longitude, post.place!.latitude]).addTo(map!);
			if (post.uri === active) showPopup(post);
			return marker;
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
					attributionControl: false
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
		return () => { disposed = true; cancelAnimationFrame(resizeFrame); resizeObserver?.disconnect(); markers.forEach((marker) => marker.remove()); popup?.remove(); selectedMarker?.remove(); map?.remove(); };
	});
</script>

<div class="map-shell" class:selectable>
	<div class="map-canvas" bind:this={target} role="application" aria-label={selectable ? app.msg.choosePlace : app.msg.map}></div>
	{#if error}<div class="map-error" role="alert">{app.msg.mapUnavailable}</div>
	{:else}<div class="map-controls">
		<button type="button" disabled={!ready} aria-label={app.msg.zoomIn} title={app.msg.zoomIn} onclick={() => map?.zoomIn({ duration: 0 })}><Plus aria-hidden="true" /></button>
		<button type="button" disabled={!ready} aria-label={app.msg.zoomOut} title={app.msg.zoomOut} onclick={() => map?.zoomOut({ duration: 0 })}><Minus aria-hidden="true" /></button>
		<button type="button" disabled={!ready || locating} aria-label={locating ? app.msg.locating : app.msg.useMyLocation} title={app.msg.useMyLocation} aria-busy={locating} onclick={locate}><LocateFixed aria-hidden="true" /></button>
	</div>{/if}
	<button type="button" class="map-credits" aria-label={app.msg.mapCredits} title={app.msg.mapCredits} aria-haspopup="dialog" onclick={() => creditsOpen = true}><Info aria-hidden="true" /></button>
	{#if locationError}<div class="map-notice"><p class="error" role="alert">{locationError}</p><button type="button" aria-label={app.msg.close} onclick={() => locationError = ''}><X aria-hidden="true" /></button></div>{/if}
</div>

<NativeDialog open={creditsOpen} title={app.msg.mapCredits} onclose={() => creditsOpen = false}>
	<header class="dialog-heading"><h2>{app.msg.mapCredits}</h2><form method="dialog"><button aria-label={app.msg.close}><X aria-hidden="true" /></button></form></header>
	<div class="stack">
		<p>{app.msg.mapData}: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, SRTM</p>
		<p>{app.msg.mapStyle}: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)</p>
		<p>{app.msg.mapEngine}: <a href="https://maplibre.org">MapLibre GL JS</a></p>
	</div>
</NativeDialog>
