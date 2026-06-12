<script>
  import { onMount } from 'svelte';
  import TaskPanel    from '$lib/components/TaskPanel.svelte';
  import GanttPanel   from '$lib/components/GanttPanel.svelte';
  import LegendFooter from '$lib/components/LegendFooter.svelte';
  import { parseDate, toISO, monthList } from '$lib/utils/dates.js';

  let { data } = $props();

  const COL_W      = 72;
  const TASK_COL_W = 252;
  const USABLE_W   = { letter: 979, tabloid: 1555 };

  let project    = $state(null);
  let showToday  = $state(true);
  let showLegend = $state(true);

  let ganttMonths = $derived(project
    ? monthList(parseDate(project.viewStart), parseDate(project.viewEnd))
    : []);
  let contentW = $derived(TASK_COL_W + ganttMonths.length * COL_W);

  const noop = () => {};

  onMount(() => {
    const raw = sessionStorage.getItem('r3a_preview');
    if (raw) {
      try { project = JSON.parse(raw); } catch {}
    }
    window.addEventListener('message', (e) => {
      if (typeof e.data?.showToday  === 'boolean') showToday  = e.data.showToday;
      if (typeof e.data?.showLegend === 'boolean') showLegend = e.data.showLegend;
    });
  });

  $effect(() => {
    if (!project) return;
    const usableW = USABLE_W[data.paper] ?? 979;
    const scale   = Math.min(1, usableW / contentW);
    document.documentElement.style.zoom = scale.toFixed(4);
    return () => { document.documentElement.style.zoom = ''; };
  });
</script>

{#if project}
  <div class="preview-pg">

    <header class="preview-hdr">
      <div class="preview-left">
        <div class="preview-title">{project.title || 'Project Title'}</div>
        {#if project.subtitle}
          <div class="preview-sub">{project.subtitle}</div>
        {/if}
      </div>
      <div class="preview-meta">
        {#each [project.date, project.number, project.client].filter(Boolean) as v}
          <div class="preview-meta-item">{v}</div>
        {/each}
      </div>
    </header>

    <div class="preview-body">
      <div class="preview-inner" style:width="{contentW}px" style:min-width="{contentW}px">
        <TaskPanel
          tasks={project.tasks}
          onRename={noop}
          onDelete={noop}
          onReorder={noop}
          onAdd={noop}
          highlightId={null}
          zoom="month"
        />
        <GanttPanel
          tasks={project.tasks}
          viewStart={project.viewStart}
          viewEnd={project.viewEnd}
          todayMark={toISO(new Date())}
          legend={project.legend}
          dropDate={null}
          highlightTaskId={null}
          onTaskUpdate={noop}
          onLegendItemUpdate={noop}
          onDraggingChange={noop}
          zoom="month"
          showTodayLine={showToday}
        />
      </div>
    </div>

    {#if showLegend}
      <LegendFooter
        legend={project.legend}
        tasks={project.tasks}
        notes={project.notes ?? ''}
        onUpdate={noop}
      />
    {/if}

  </div>
  <!-- Block all interaction so preview is read-only -->
  <div class="blocker"></div>

{:else}
  <div class="loading">Loading preview…</div>
{/if}

<style>
  :global(html, body) { margin: 0; padding: 0; background: #fff; overflow: hidden; }

  .preview-pg {
    display: inline-flex;
    flex-direction: column;
    background: #fff;
    min-width: max-content;
  }

  .preview-hdr {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px 18px 8px;
    border-bottom: 2px solid var(--black);
    background: #fff;
    flex-shrink: 0;
  }
  .preview-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 22px;
    text-transform: uppercase; letter-spacing: .06em;
    color: var(--black); line-height: 1.1;
  }
  .preview-sub {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 400; font-size: 11px;
    text-transform: uppercase; letter-spacing: .1em;
    color: #aaa; margin-top: 2px;
  }
  .preview-meta {
    display: flex; flex-direction: column; align-items: flex-end; gap: 1px;
  }
  .preview-meta-item {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10.5px; color: #888; text-align: right;
  }

  .preview-body { overflow: visible; }
  .preview-inner { display: flex; }

  .blocker {
    position: fixed; inset: 0; z-index: 9999;
    background: transparent;
  }

  .loading {
    display: flex; align-items: center; justify-content: center;
    height: 300px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px; color: #aaa;
  }
</style>
