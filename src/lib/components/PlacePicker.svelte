<script lang="ts">
	import { untrack } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import { useApp } from '$lib/app.svelte';
	import type { Place } from '$lib/atproto';
	import type { DeviceLocation } from '$lib/geolocation';
	import { precisePlace } from '$lib/place';
	import NativeDialog from './NativeDialog.svelte';
	import WorldMap from './WorldMap.svelte';
	let { open, value, onclose, onchoose }: { open: boolean; value?: Place; onclose: () => void; onchoose: (place: Place) => void } = $props();
	const app = useApp();
	let selected = $state<Place>();
	let focus = $state<Place>();
	let latitude = $state<number | undefined>();
	let longitude = $state<number | undefined>();
	let accuracy = $state<number>();
	const valid = $derived(latitude !== undefined && longitude !== undefined && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180);
	$effect(() => {
		if (open) {
			const initial = untrack(() => value);
			selected = initial; focus = initial;
			latitude = initial?.latitude; longitude = initial?.longitude;
			accuracy = undefined;
		}
	});
	function choose(point: Place) {
		selected = precisePlace(point.latitude, point.longitude);
		latitude = selected.latitude; longitude = selected.longitude;
		accuracy = undefined;
	}
	function applyCoordinates() {
		if (!valid || latitude === undefined || longitude === undefined) return;
		choose({ latitude, longitude }); focus = selected;
	}
	function locate(result: DeviceLocation) {
		choose(result); focus = selected; accuracy = Math.round(result.accuracy);
	}
	function confirm() {
		if (!valid || latitude === undefined || longitude === undefined) return;
		onchoose(precisePlace(latitude, longitude)); onclose();
	}
</script>

<NativeDialog {open} title={app.msg.location} class="place-dialog" {onclose}>
	<div class="stack place-picker-heading">
		<header class="dialog-heading"><h2>{app.msg.location}</h2><form method="dialog"><button aria-label={app.msg.close}><X aria-hidden="true" /></button></form></header>
		<p class="muted">{app.msg.choosePlace}</p>
		{#if accuracy !== undefined}<p class="muted" role="status">{app.msg.locationAccuracy}: ±{accuracy} m</p>{/if}
	</div>
	<div class="place-picker-map">{#if open}<WorldMap selectable {selected} {focus} onselect={choose} onlocate={locate} />{/if}</div>
	<form class="stack place-picker-footer" onsubmit={(event) => { event.preventDefault(); confirm(); }}>
		<div class="coordinates">
			<label>{app.msg.latitude}<input type="number" min="-90" max="90" step="any" required bind:value={latitude} oninput={() => accuracy = undefined} /></label>
			<label>{app.msg.longitude}<input type="number" min="-180" max="180" step="any" required bind:value={longitude} oninput={() => accuracy = undefined} /></label>
			<button type="button" disabled={!valid} onclick={applyCoordinates}>{app.msg.showPlace}</button>
		</div>
		<p class="muted">{app.msg.placeHelp}</p>
		<div class="form-actions"><button type="submit" formmethod="dialog" formnovalidate>{app.msg.cancel}</button><button type="submit" class="primary" disabled={!valid}>{app.msg.savePlace}</button></div>
	</form>
</NativeDialog>
