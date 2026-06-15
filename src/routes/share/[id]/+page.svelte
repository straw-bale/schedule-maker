<script>
  import { onMount } from 'svelte';
  import TaskPanel    from '$lib/components/TaskPanel.svelte';
  import GanttPanel   from '$lib/components/GanttPanel.svelte';
  import LegendFooter from '$lib/components/LegendFooter.svelte';
  import { supabase }  from '$lib/supabase.js';
  import { parseDate, toISO, monthList } from '$lib/utils/dates.js';

  let { data } = $props();

  const TASK_COL_W = 252;
  const noop = () => {};

  let project  = $state(null);
  let loading  = $state(true);
  let notFound = $state(false);

  let ganttMonths = $derived(project
    ? monthList(parseDate(project.viewStart), parseDate(project.viewEnd))
    : []);

  // Fit the schedule to the window width, respecting a min column width
  let windowW  = $state(typeof window !== 'undefined' ? window.innerWidth : 1200);
  let colW     = $derived(ganttMonths.length > 0
    ? Math.max(36, Math.floor((windowW - TASK_COL_W) / ganttMonths.length))
    : 72);
  let contentW = $derived(TASK_COL_W + ganttMonths.length * colW);

  onMount(async () => {
    window.addEventListener('resize', () => { windowW = window.innerWidth; });

    const { data: rows, error } = await supabase
      .from('projects')
      .select('data')
      .eq('id', data.id)
      .single();

    loading = false;
    if (error || !rows) { notFound = true; return; }
    project = rows.data;
  });
</script>

<svelte:head>
  <title>{project?.title ? `${project.title} — Schedule` : 'Schedule'}</title>
</svelte:head>

{#if loading}
  <div class="state-screen">Loading…</div>
{:else if notFound}
  <div class="state-screen">Schedule not found.</div>
{:else if project}
  <div class="share-page">

    <header class="share-hdr">
      <div class="hdr-left">
        <div class="share-title">{project.title || 'Project Schedule'}</div>
        {#if project.subtitle}
          <div class="share-sub">{project.subtitle}</div>
        {/if}
        <div class="share-meta">
          {#each [project.date, project.number, project.client].filter(Boolean) as v, i}
            {#if i > 0}<span class="meta-sep">·</span>{/if}
            <span class="meta-item">{v}</span>
          {/each}
        </div>
      </div>
      <div class="share-badge">Draft</div>
    </header>

    <div class="share-body">
      <div class="share-inner" style:width="{contentW}px">
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
          colWOverride={colW}
          showTodayLine={true}
        />
      </div>
    </div>

    <LegendFooter
      legend={project.legend}
      tasks={project.tasks}
      notes={project.notes ?? ''}
      onUpdate={noop}
    />

    <!-- Blocks all editing interaction -->
    <div class="blocker"></div>

  </div>
{/if}

<style>
  :global(html, body) { margin: 0; padding: 0; background: #fff; }

  .state-screen {
    display: flex; align-items: center; justify-content: center;
    height: 100vh;
    font-family: 'Barlow Condensed', sans-serif; font-size: 14px; color: #aaa;
  }

  .share-page {
    display: flex; flex-direction: column;
    min-height: 100vh;
    background: #fff;
    overflow-x: auto;
  }

  .share-hdr {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 10px 18px 8px;
    border-bottom: 2px solid var(--black);
    flex-shrink: 0;
    background: #fff;
    gap: 16px;
  }
  .hdr-left { min-width: 0; }
  .share-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 22px;
    text-transform: uppercase; letter-spacing: .06em;
    color: var(--black); line-height: 1.1;
  }
  .share-sub {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 400; font-size: 11px;
    text-transform: uppercase; letter-spacing: .1em;
    color: #aaa; margin-top: 2px;
  }
  .share-meta {
    display: flex; align-items: center; gap: 2px;
    margin-top: 5px; flex-wrap: wrap;
  }
  .meta-sep {
    font-size: 9px; color: #ccc; padding: 0 4px;
  }
  .meta-item {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10.5px; color: #999;
  }
  .share-badge {
    flex-shrink: 0;
    background: var(--off, #f5f5f5);
    border: 1px solid var(--lgray, #e0e0e0);
    border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 9px;
    text-transform: uppercase; letter-spacing: .12em;
    color: #aaa;
    padding: 4px 10px;
    align-self: center;
  }

  .share-body { overflow-x: auto; flex: 1; }
  .share-inner { display: flex; }

  .blocker {
    position: fixed; inset: 0; z-index: 9999; background: transparent;
  }
</style>
