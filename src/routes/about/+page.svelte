<script lang="ts">
	import { useApp } from '$lib/app.svelte';
	import { repository } from '../../../package.json';
	const app = useApp();
</script>

<svelte:head><title>{app.msg.about} · partiii</title></svelte:head>
<section class="feed-page">
	<header class="page-heading"><h1>{app.msg.about} partiii</h1></header>
	<div class="about-content stack section-padding">
		<p>{app.msg.aboutIntro}</p>
		<p>{app.msg.aboutExplore}</p>
		<p>{app.msg.aboutAccount}</p>
		<p>{app.msg.aboutPublic}</p>
		<p>{app.msg.aboutOpen}</p>
		<p><a href={repository.url}>{app.msg.sourceCode}</a></p>
	</div>
</section>
