<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { projectStore } from '$lib/stores/projects.js';
  import FeedbackWidget from '$lib/components/FeedbackWidget.svelte';

  let { children } = $props();

  onMount(() => { projectStore.init(); });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link
    href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet"
  >
</svelte:head>

{@render children()}
<FeedbackWidget />
