<script>
  import { projectStore } from '$lib/stores/projects.js';
  import { generateId, parseDate, toISO, MONTHS_SHORT, monthList, totalDays } from '$lib/utils/dates.js';
  import TaskPanel    from '$lib/components/TaskPanel.svelte';
  import GanttPanel   from '$lib/components/GanttPanel.svelte';
  import LegendFooter from '$lib/components/LegendFooter.svelte';
  import AiSidebar    from '$lib/components/AiSidebar.svelte';
  import { goto } from '$app/navigation';

  let { data } = $props();

  // Derive project from store reactively
  let allProjects = $state([]);
  projectStore.subscribe(v => { allProjects = v; });
  let project = $derived(allProjects.find(p => p.id === data.id) ?? null);

  let aiOpen = $state(false);

  // Milestone drag-from-footer state
  let draggingLegendMs = $state(null);  // { code, color, text } while dragging
  let dropDate         = $state(null);  // ISO date string shown as drop indicator in Gantt
  let highlightTaskId  = $state(null);  // briefly highlights a Gantt row on click-to-link

  // Gantt geometry for date-from-x computation
  const COL_W = 72;
  let ganttMonths = $derived(project ? monthList(parseDate(project.viewStart), parseDate(project.viewEnd)) : []);
  let ganttWidth  = $derived(ganttMonths.length * COL_W);

  const TASK_COL_W = 252;

  function xToDate(clientX) {
    if (!schScrollEl || !project) return null;
    const rect = schScrollEl.getBoundingClientRect();
    const relX  = clientX - rect.left - TASK_COL_W + schScrollEl.scrollLeft;
    const vs    = parseDate(project.viewStart);
    const ve    = parseDate(project.viewEnd);
    const ms    = vs.getTime() + (relX / ganttWidth) * (ve - vs);
    const d     = new Date(ms);
    return toISO(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  function isOverGantt(clientX, clientY) {
    if (!schScrollEl) return false;
    const r = schScrollEl.getBoundingClientRect();
    return clientX >= r.left + TASK_COL_W && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  function startMilestoneDrag(ms) {
    draggingLegendMs = ms;

    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position:fixed; z-index:9999; pointer-events:none;
      display:flex; align-items:center; gap:6px;
      background:#fff; border:1px solid #ddd; border-radius:4px;
      padding:5px 10px; box-shadow:0 4px 14px rgba(0,0,0,.18);
      font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
      transform:translate(-50%,-50%);
    `;
    const dot = document.createElement('div');
    dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${ms.color};flex-shrink:0;`;
    ghost.appendChild(dot);
    ghost.appendChild(document.createTextNode(ms.text || ms.code));
    document.body.appendChild(ghost);

    function onMove(e) {
      ghost.style.left = e.clientX + 'px';
      ghost.style.top  = e.clientY + 'px';
      dropDate = isOverGantt(e.clientX, e.clientY) ? xToDate(e.clientX) : null;
    }

    function onUp(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      ghost.remove();

      if (isOverGantt(e.clientX, e.clientY) && dropDate && project) {
        const newTask = {
          id:    Date.now(),
          name:  draggingLegendMs.text || draggingLegendMs.code,
          type:  'milestone',
          date:  dropDate,
          msRef: { code: draggingLegendMs.code, color: draggingLegendMs.color },
        };
        projectStore.addTask(data.id, newTask);
      }
      draggingLegendMs = null;
      dropDate = null;
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function linkToGantt(msCode) {
    if (!project) return;
    const task = project.tasks.find(t => t.msRef?.code === msCode || t.delRef === msCode);
    if (!task) return;
    highlightTaskId = task.id;
    // Scroll the row into view (task panel list)
    const idx = project.tasks.indexOf(task);
    if (schScrollEl) schScrollEl.scrollTop = idx * 34;
    setTimeout(() => { highlightTaskId = null; }, 1800);
  }

  let schScrollEl = $state(null);

  // Store callbacks
  function handleTaskUpdate(taskId, patch) {
    projectStore.updateTask(data.id, taskId, patch);
  }
  function handleRename(taskId, name) {
    projectStore.updateTask(data.id, taskId, { name });
  }
  function handleDelete(taskId) {
    projectStore.deleteTask(data.id, taskId);
  }
  function handleReorder(fromIdx, toIdx) {
    projectStore.reorderTasks(data.id, fromIdx, toIdx);
  }
  function handleAdd() {
    if (!project) return;
    const task = {
      id:    (project.nextTaskId ?? Date.now()),
      name:  'New Task',
      type:  'bar',
      color: '#20ABE2',
      start: project.viewStart,
      end:   project.viewEnd,
    };
    projectStore.addTask(data.id, task);
  }

  function updateMeta(field, val) {
    projectStore.updateMeta(data.id, { meta: { ...project.meta, [field]: val } });
  }
  function updateTitle(val) {
    projectStore.updateMeta(data.id, { title: val });
  }
  function updateSubtitle(val) {
    projectStore.updateMeta(data.id, { subtitle: val });
  }

  function handleLegendUpdate(section, items) {
    projectStore.updateLegendSection(data.id, section, items);
  }

  // Called from GanttPanel when overlay milestone/deliverable is dragged to a new date
  function handleLegendItemUpdate(section, idx, patch) {
    projectStore.updateLegendItem(data.id, section, idx, patch);
  }

  // Gantt bar drag → highlight corresponding TaskPanel row
  let draggingTaskId = $state(null);
  function handleDraggingChange(id) { draggingTaskId = id; }

  // Timeline range controls
  function adjustView(startDelta, endDelta) {
    if (!project) return;
    const vs = parseDate(project.viewStart);
    const ve = parseDate(project.viewEnd);
    vs.setMonth(vs.getMonth() + startDelta);
    ve.setMonth(ve.getMonth() + endDelta);
    const monthSpan = (ve.getFullYear() - vs.getFullYear()) * 12 + ve.getMonth() - vs.getMonth();
    if (monthSpan < 2) return;
    projectStore.updateMeta(data.id, { viewStart: toISO(vs), viewEnd: toISO(ve) });
  }

  function fmtMonthYear(dateStr) {
    const d = parseDate(dateStr);
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  let duration = $derived.by(() => {
    if (!project) return 0;
    const vs = parseDate(project.viewStart);
    const ve = parseDate(project.viewEnd);
    return (ve.getFullYear() - vs.getFullYear()) * 12 + ve.getMonth() - vs.getMonth();
  });

  function handleAiChanges(changes) {
    for (const c of changes) {
      if (c.type === 'updateTask')       projectStore.updateTask(data.id, c.taskId, c.patch);
      if (c.type === 'addTask')          projectStore.addTask(data.id, c.task, c.insertAfterId ?? null);
      if (c.type === 'deleteTask')       projectStore.deleteTask(data.id, c.taskId);
      if (c.type === 'updateView')       projectStore.updateMeta(data.id, c.patch);
      if (c.type === 'updateLegendItem') projectStore.updateLegendItem(data.id, c.section, c.index, c.patch);
    }
  }

  function printSchedule() { window.print(); }
</script>

{#if !project}
  <div class="not-found">
    <p>Project not found.</p>
    <button onclick={() => goto('/')}>← Back to Projects</button>
  </div>
{:else}
  <div class="schedule-page" class:ai-open={aiOpen}>

    <!-- Page header -->
    <header class="sch-hdr no-print-border">
      <div class="hdr-left">
        <a class="back-btn no-print" href="/" onclick={(e) => { e.preventDefault(); goto('/'); }}>← Projects</a>
        <div class="hdr-titles">
          <div
            class="hdr-title"
            contenteditable="true"
            spellcheck="false"
            onblur={(e) => updateTitle(e.target.textContent.trim() || project.title)}
            onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
          >{project.title}</div>
          <div
            class="hdr-sub"
            contenteditable="true"
            spellcheck="false"
            onblur={(e) => updateSubtitle(e.target.textContent.trim() || project.subtitle)}
            onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
          >{project.subtitle}</div>
        </div>
      </div>

      <div class="hdr-meta">
        <div
          class="meta-field"
          contenteditable="true"
          spellcheck="false"
          onblur={(e) => updateMeta('date', e.target.textContent.trim())}
        >{project.meta.date || 'Date'}</div>
        <div
          class="meta-field"
          contenteditable="true"
          spellcheck="false"
          onblur={(e) => updateMeta('number', e.target.textContent.trim())}
        >{project.meta.number || 'Project Number'}</div>
        <div
          class="meta-field"
          contenteditable="true"
          spellcheck="false"
          onblur={(e) => updateMeta('client', e.target.textContent.trim())}
        >{project.meta.client || 'Client'}</div>
        <div
          class="meta-field"
          contenteditable="true"
          spellcheck="false"
          onblur={(e) => updateMeta('name', e.target.textContent.trim())}
        >{project.meta.name || 'Project Name'}</div>
      </div>

      <div class="hdr-actions no-print">
        <button class="action-btn" onclick={printSchedule} title="Print / Export PDF">
          Print
        </button>
        <button class="action-btn action-btn-ai" onclick={() => aiOpen = !aiOpen} title="AI Schedule Assistant">
          AI
        </button>
      </div>
    </header>

    <!-- Timeline range control strip -->
    <div class="timeline-bar no-print">
      <div class="tl-end">
        <span class="tl-lbl">Start</span>
        <div class="tl-ctrl">
          <button class="tl-btn" onclick={() => adjustView(-1, 0)} title="Add one month to the start">←</button>
          <span class="tl-date">{fmtMonthYear(project.viewStart)}</span>
          <button class="tl-btn" onclick={() => adjustView(1, 0)} title="Remove one month from the start">→</button>
        </div>
      </div>

      <div class="tl-center">
        <button class="tl-shift" onclick={() => adjustView(-1, -1)} title="Shift entire timeline earlier">◀</button>
        <span class="tl-dur">{duration} months</span>
        <button class="tl-shift" onclick={() => adjustView(1, 1)} title="Shift entire timeline later">▶</button>
      </div>

      <div class="tl-end tl-end-right">
        <div class="tl-ctrl">
          <button class="tl-btn" onclick={() => adjustView(0, -1)} title="Remove one month from the end">←</button>
          <span class="tl-date">{fmtMonthYear(project.viewEnd)}</span>
          <button class="tl-btn" onclick={() => adjustView(0, 1)} title="Add one month to the end">→</button>
        </div>
        <span class="tl-lbl">End</span>
      </div>
    </div>

    <!-- Main schedule area -->
    <div class="sch-body">
      <div class="sch-main">
        <div class="sch-scroll" bind:this={schScrollEl}>
          <div class="sch-inner" style:width="{TASK_COL_W + ganttWidth}px">

            <TaskPanel
              tasks={project.tasks}
              onRename={handleRename}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onAdd={handleAdd}
              highlightId={draggingTaskId}
            />

            <GanttPanel
              tasks={project.tasks}
              viewStart={project.viewStart}
              viewEnd={project.viewEnd}
              todayMark={project.todayMark}
              legend={project.legend}
              dropDate={dropDate}
              highlightTaskId={highlightTaskId}
              onTaskUpdate={handleTaskUpdate}
              onLegendItemUpdate={handleLegendItemUpdate}
              onDraggingChange={handleDraggingChange}
            />

          </div>
        </div>
      </div>

      <LegendFooter
        legend={project.legend}
        tasks={project.tasks}
        onUpdate={handleLegendUpdate}
        onMilestoneDrag={startMilestoneDrag}
        onLinkClick={linkToGantt}
      />
    </div>

    <!-- R3A wordmark (print only) -->
    <div class="r3a-mark no-screen">R3A</div>

    <AiSidebar open={aiOpen} project={project} onApplyChanges={handleAiChanges} onClose={() => aiOpen = false} />

  </div>
{/if}

<style>
  .not-found {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100vh; gap: 16px; font-family: 'Barlow', sans-serif; color: #aaa;
  }
  .not-found button {
    background: var(--blue); color: #fff; border: none; border-radius: 3px;
    padding: 10px 20px; cursor: pointer; font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  }

  .schedule-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: #fff;
    transition: padding-right .22s ease;
  }
  .schedule-page.ai-open { padding-right: 310px; }

  /* Header */
  .sch-hdr {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px 18px 8px;
    border-bottom: 2px solid var(--black);
    flex-shrink: 0;
    gap: 16px;
    background: #fff;
  }
  .hdr-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
  }
  .back-btn {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #aaa;
    text-decoration: none;
    padding-top: 2px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: color .12s;
  }
  .back-btn:hover { color: var(--blue); }
  .hdr-titles { min-width: 0; }
  .hdr-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 22px;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--black);
    outline: none;
    cursor: text;
    line-height: 1.1;
  }
  .hdr-title:focus { background: rgba(32,171,226,.06); border-radius: 2px; padding: 0 4px; }
  .hdr-sub {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 400;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #aaa;
    outline: none;
    cursor: text;
    margin-top: 2px;
  }
  .hdr-sub:focus { background: rgba(32,171,226,.06); border-radius: 2px; padding: 0 4px; }
  .hdr-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    gap: 1px;
  }
  .meta-field {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10.5px;
    color: #888;
    outline: none;
    cursor: text;
    text-align: right;
    min-width: 40px;
  }
  .meta-field:focus { background: rgba(32,171,226,.06); border-radius: 2px; padding: 0 4px; }
  .hdr-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
    padding-top: 2px;
  }
  .action-btn {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .1em;
    border: 1px solid var(--lgray);
    background: #fff;
    color: var(--black);
    border-radius: 3px;
    padding: 6px 13px;
    cursor: pointer;
    transition: border-color .12s, background .12s;
  }
  .action-btn:hover { border-color: var(--blue); background: rgba(32,171,226,.05); }
  .action-btn-ai { border-color: var(--blue); color: var(--blue); }
  .action-btn-ai:hover { background: var(--blue); color: #fff; }

  /* Timeline control strip */
  .timeline-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    height: 32px;
    background: var(--off);
    border-bottom: 1px solid var(--lgray);
    flex-shrink: 0;
    gap: 12px;
  }
  .tl-end {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tl-end-right { flex-direction: row-reverse; }
  .tl-lbl {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: #bbb;
  }
  .tl-ctrl {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid var(--lgray);
    border-radius: 3px;
    overflow: hidden;
  }
  .tl-btn {
    background: none;
    border: none;
    padding: 0 8px;
    height: 22px;
    cursor: pointer;
    font-size: 11px;
    color: #aaa;
    transition: background .1s, color .1s;
    line-height: 1;
  }
  .tl-btn:hover { background: var(--blue); color: #fff; }
  .tl-date {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 600;
    font-size: 11px;
    color: var(--black);
    padding: 0 6px;
    border-left: 1px solid var(--lgray);
    border-right: 1px solid var(--lgray);
    white-space: nowrap;
    line-height: 22px;
  }
  .tl-center {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tl-dur {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #bbb;
    white-space: nowrap;
  }
  .tl-shift {
    background: none;
    border: none;
    font-size: 10px;
    color: #ccc;
    cursor: pointer;
    padding: 2px 4px;
    transition: color .1s;
    line-height: 1;
  }
  .tl-shift:hover { color: var(--black); }

  /* Body */
  .sch-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
  .sch-main {
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }
  .sch-scroll { width: 100%; height: 100%; overflow: auto; }
  .sch-inner  { display: flex; min-height: 100%; }

  /* R3A print mark */
  .r3a-mark {
    display: none;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 22px;
    color: var(--black);
    letter-spacing: .04em;
    position: fixed;
    bottom: 0.45in;
    right: 0.55in;
  }

  @media screen {
    .no-screen { display: none !important; }
  }

  @media print {
    .no-print { display: none !important; }
    .schedule-page { padding-right: 0 !important; height: auto; overflow: visible; }
    .sch-hdr { border-bottom-width: 1.5px; }
    .hdr-title { font-size: 20px; }
    .sch-body { overflow: visible; }
    .sch-main { overflow: visible; }
    .r3a-mark { display: block; }
  }
</style>
