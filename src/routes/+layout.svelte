<script>
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link
    href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet"
  >
</svelte:head>

{@render children()}
