<script>
  import { projectStore } from '$lib/stores/projects.js';
  import { generateId, parseDate, toISO, MONTHS_SHORT, monthList, totalDays, ZOOM_COL_W } from '$lib/utils/dates.js';
  import TaskPanel    from '$lib/components/TaskPanel.svelte';
  import GanttPanel   from '$lib/components/GanttPanel.svelte';
  import LegendFooter from '$lib/components/LegendFooter.svelte';
  import AiSidebar    from '$lib/components/AiSidebar.svelte';
  import PrintPanel   from '$lib/components/PrintPanel.svelte';
  import { goto } from '$app/navigation';
  import { tick } from 'svelte';

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
  const TASK_COL_W = 252;
  let schW        = $state(0);
  let ganttMonths = $derived(project ? monthList(parseDate(project.viewStart), parseDate(project.viewEnd)) : []);
  let fitColW     = $derived(ganttMonths.length > 0 ? Math.max(20, Math.floor((schW - TASK_COL_W) / ganttMonths.length)) : 72);
  let printColW   = $state(null); // non-null during print: forces fit-to-paper column width
  let effectiveColW = $derived(
    printColW !== null ? printColW :
    zoom === 'fit' ? fitColW : (ZOOM_COL_W[zoom] ?? 72)
  );
  let ganttWidth  = $derived(ganttMonths.length * effectiveColW);
  let displayZoom = $derived(zoom === 'fit' ? 'month' : zoom);

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

  // Shared drag engine: hold-and-drag OR click-to-attach (click again to drop).
  // If the mouse moves before release it's a standard drag; a quick click switches to
  // sticky mode where the ghost follows the cursor until the next click or Escape.
  function startLegendDrag(ghost, initX, initY, onDrop) {
    let moved = false;
    ghost.style.left = initX + 'px';
    ghost.style.top  = initY + 'px';
    document.body.appendChild(ghost);

    function onMove(e) {
      ghost.style.left = e.clientX + 'px';
      ghost.style.top  = e.clientY + 'px';
      dropDate = isOverGantt(e.clientX, e.clientY) ? xToDate(e.clientX) : null;
      moved = true;
    }

    function cleanup() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      document.removeEventListener('mousedown', onStickyDrop);
      document.removeEventListener('keydown',   onKey);
      ghost.remove();
      dropDate         = null;
      draggingLegendMs = null;
    }

    function onUp(e) {
      if (moved) {
        // Hold-and-drag completed — drop where released.
        const date = dropDate;
        cleanup();
        if (isOverGantt(e.clientX, e.clientY) && date && project) onDrop(date);
      } else {
        // Quick click — switch to sticky mode; next mousedown drops.
        document.removeEventListener('mouseup', onUp);
        requestAnimationFrame(() => {
          document.addEventListener('mousedown', onStickyDrop);
          document.addEventListener('keydown',   onKey);
        });
      }
    }

    function onStickyDrop(e) {
      const date = dropDate;
      cleanup();
      if (isOverGantt(e.clientX, e.clientY) && date && project) onDrop(date);
    }

    function onKey(e) {
      if (e.key === 'Escape') cleanup();
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  const GHOST_CSS = `
    position:fixed; z-index:9999; pointer-events:none;
    display:flex; align-items:center; gap:6px;
    background:#fff; border:1px solid #ddd; border-radius:4px;
    padding:5px 10px; box-shadow:0 4px 14px rgba(0,0,0,.18);
    font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
    transform:translate(-50%,-50%);
  `;

  // Sticky-only drag for "+ Add" buttons: ghost immediately follows cursor,
  // next click places it (on Gantt for date-positioned items). Escape cancels.
  // Uses 'click' (not 'mousedown') as the drop trigger so it never catches
  // the same click that launched the drag. For items with no Gantt position,
  // pass anyDrop: true.
  function startStickyDrag(ghost, x, y, onDrop, { anyDrop = false } = {}) {
    ghost.style.left = x + 'px';
    ghost.style.top  = y + 'px';
    document.body.appendChild(ghost);

    function onMove(e) {
      ghost.style.left = e.clientX + 'px';
      ghost.style.top  = e.clientY + 'px';
      if (!anyDrop) dropDate = isOverGantt(e.clientX, e.clientY) ? xToDate(e.clientX) : null;
    }
    function cleanup() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click',     onClick);
      document.removeEventListener('keydown',   onKey);
      ghost.remove();
      dropDate         = null;
      draggingLegendMs = null;
    }
    function onClick(e) {
      const date = dropDate;
      cleanup();
      if (anyDrop || (isOverGantt(e.clientX, e.clientY) && date && project)) onDrop(date);
    }
    function onKey(e) { if (e.key === 'Escape') cleanup(); }

    document.addEventListener('mousemove', onMove);
    // RAF ensures this listener is added after the launching click has fully propagated.
    requestAnimationFrame(() => {
      document.addEventListener('click',   onClick);
      document.addEventListener('keydown', onKey);
    });
  }

  function makeMilestoneGhost(ms) {
    const g = document.createElement('div');
    g.style.cssText = GHOST_CSS;
    const dot = document.createElement('div');
    dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${ms.color};flex-shrink:0;`;
    g.appendChild(dot);
    g.appendChild(document.createTextNode(ms.text || ms.code));
    return g;
  }

  function makeDeliverableGhost(n) {
    const g = document.createElement('div');
    g.style.cssText = GHOST_CSS;
    const badge = document.createElement('div');
    badge.style.cssText = `width:18px;height:18px;border-radius:50%;background:#D4804A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;`;
    badge.textContent = String(n);
    g.appendChild(badge);
    g.appendChild(document.createTextNode('New Deliverable'));
    return g;
  }

  function makeApprovalGhost(a) {
    const g = document.createElement('div');
    g.style.cssText = GHOST_CSS;
    const diamond = document.createElement('div');
    diamond.style.cssText = `width:10px;height:10px;background:#3B8FA0;transform:rotate(45deg);flex-shrink:0;`;
    g.appendChild(diamond);
    g.appendChild(document.createTextNode(a.text || 'New Approval'));
    return g;
  }

  function makeEstimateGhost(est) {
    const g = document.createElement('div');
    g.style.cssText = GHOST_CSS;
    const circle = document.createElement('div');
    circle.style.cssText = `width:18px;height:18px;border-radius:50%;background:${est.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;`;
    circle.textContent = est.code || 'E';
    g.appendChild(circle);
    g.appendChild(document.createTextNode(est.text));
    return g;
  }

  // Reposition an existing legend milestone by dragging its footer pill.
  function startMilestoneDrag(ms) {
    draggingLegendMs = ms;
    startLegendDrag(makeMilestoneGhost(ms), 0, 0, (date) => {
      const idx = project.legend.milestones.findIndex(m => m.code === ms.code);
      if (idx >= 0) projectStore.updateLegendItem(data.id, 'milestones', idx, { date });
    });
  }

  function startApprovalDrag(a) {
    startLegendDrag(makeApprovalGhost(a), 0, 0, (date) => {
      const idx = project.legend.approvals.findIndex(ap => ap.text === a.text);
      if (idx >= 0) projectStore.updateLegendItem(data.id, 'approvals', idx, { date });
    });
  }

  function startEstimateDrag(est) {
    startLegendDrag(makeEstimateGhost(est), 0, 0, (date) => {
      const idx = project.legend.estimates.findIndex(e => e.code === est.code);
      if (idx >= 0) projectStore.updateLegendItem(data.id, 'estimates', idx, { date });
    });
  }

  function handleAddMilestone(e) {
    if (!project) return;
    const n  = (project.legend.milestones?.length ?? 0) + 1;
    const ms = { code: `M${n}`, text: 'New Milestone', color: '#888888' };
    draggingLegendMs = ms;
    startStickyDrag(makeMilestoneGhost(ms), e.clientX, e.clientY, (date) => {
      projectStore.updateLegendSection(data.id, 'milestones', [
        ...(project.legend.milestones ?? []),
        { ...ms, date },
      ]);
    });
  }

  function handleAddDeliverable(e) {
    if (!project) return;
    const n = (project.legend.deliverables?.length ?? 0) + 1;
    startStickyDrag(makeDeliverableGhost(n), e.clientX, e.clientY, (date) => {
      projectStore.updateLegendSection(data.id, 'deliverables', [
        ...(project.legend.deliverables ?? []),
        { text: 'New Deliverable', label: '', date },
      ]);
    });
  }

  function handleAddApproval(e) {
    if (!project) return;
    const a = { text: 'New Approval' };
    startStickyDrag(makeApprovalGhost(a), e.clientX, e.clientY, (date) => {
      projectStore.updateLegendSection(data.id, 'approvals', [
        ...(project.legend.approvals ?? []),
        { ...a, date },
      ]);
    });
  }

  function handleAddEstimate(e) {
    if (!project) return;
    const n   = (project.legend.estimates?.length ?? 0) + 1;
    const est = { code: `E${n}`, text: 'New Estimate', color: '#8B9A3A' };
    startStickyDrag(makeEstimateGhost(est), e.clientX, e.clientY, (date) => {
      projectStore.updateLegendSection(data.id, 'estimates', [
        ...(project.legend.estimates ?? []),
        { ...est, date },
      ]);
    });
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
    const vs  = parseDate(project.viewStart);
    const ve  = parseDate(project.viewEnd);
    const mid = new Date((vs.getTime() + ve.getTime()) / 2);
    const s   = new Date(mid.getFullYear(), mid.getMonth(), 1);
    const e   = new Date(mid.getFullYear(), mid.getMonth() + 1, 1);
    const task = {
      id:    (project.nextTaskId ?? Date.now()),
      name:  'New Task',
      type:  'bar',
      color: '#20ABE2',
      start: toISO(s),
      end:   toISO(e),
    };
    projectStore.addTask(data.id, task);
  }

  function updateMeta(field, val) {
    projectStore.updateProject(data.id, { [field]: val });
  }
  let titleEl    = $state(null);
  let subtitleEl = $state(null);
  // Only push store value to DOM when element isn't focused — prevents double-render on blur.
  $effect(() => { if (titleEl    && document.activeElement !== titleEl)    titleEl.textContent    = project?.title    ?? ''; });
  $effect(() => { if (subtitleEl && document.activeElement !== subtitleEl) subtitleEl.textContent = project?.subtitle ?? ''; });

  function updateTitle(val) {
    projectStore.updateProject(data.id, { title: val });
  }
  function updateSubtitle(val) {
    projectStore.updateProject(data.id, { subtitle: val });
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

  let reorderDraggingId  = $state(null);
  let reorderInsertIdx   = $state(null);

  let zoom           = $state('month');
  let showTodayLine  = $state(true);
  let printPanelOpen = $state(false);
  let hideLegendPrint = $state(false);

  let footerH = $state(null); // null = auto height

  function startFooterResize(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startH = footerH ?? e.currentTarget.nextElementSibling?.getBoundingClientRect().height ?? 180;
    function onMove(ev) {
      footerH = Math.max(48, Math.min(600, startH + (startY - ev.clientY)));
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // Timeline range controls
  function adjustView(startDelta, endDelta) {
    if (!project) return;
    const vs = parseDate(project.viewStart);
    const ve = parseDate(project.viewEnd);
    vs.setMonth(vs.getMonth() + startDelta);
    ve.setMonth(ve.getMonth() + endDelta);
    const monthSpan = (ve.getFullYear() - vs.getFullYear()) * 12 + ve.getMonth() - vs.getMonth();
    if (monthSpan < 2) return;
    projectStore.updateProject(data.id, { viewStart: toISO(vs), viewEnd: toISO(ve) });
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
      if (c.type === 'updateView')       projectStore.updateProject(data.id, c.patch);
      if (c.type === 'updateLegendItem') projectStore.updateLegendItem(data.id, c.section, c.index, c.patch);
    }
  }

  function openPrintPanel() {
    if (project) sessionStorage.setItem('r3a_preview', JSON.stringify(project));
    printPanelOpen = true;
  }

  async function printSchedule({ showToday = true, showLegend = true, paper = 'tabloid' } = {}) {
    printPanelOpen  = false;
    const prevZoom  = zoom;
    const prevToday = showTodayLine;
    const prevAi    = aiOpen;
    const prevTitle = document.title;

    zoom          = 'month';
    showTodayLine = showToday;
    hideLegendPrint = !showLegend;
    aiOpen        = false;

    const paperUsableW = paper === 'tabloid' ? 1555 : 979;
    const paperUsableH = paper === 'tabloid' ? 979  : 739;

    // Initial column width sized to fill paper width at scale=1
    if (ganttMonths.length > 0) {
      printColW = Math.max(20, Math.round((paperUsableW - TASK_COL_W) / ganttMonths.length));
    }
    await tick();

    // Measure full content height for vertical fit
    const hdrH    = document.querySelector('.sch-hdr')?.offsetHeight ?? 64;
    const legH    = showLegend ? (document.querySelector('.legend-wrap')?.scrollHeight ?? 150) : 0;
    const contentH = hdrH + 68 + (project?.tasks?.length ?? 0) * 34 + legH;
    const scaleH   = Math.min(1, paperUsableH / contentH);
    const scale    = scaleH; // height is always the binding constraint after columns fill width

    // Expand columns to fill the paper width at the final scale (ceil avoids right-edge gap)
    if (ganttMonths.length > 0) {
      printColW = Math.max(20, Math.ceil((paperUsableW / scale - TASK_COL_W) / ganttMonths.length));
    }
    await tick();

    document.documentElement.style.setProperty('--print-scale', scale.toFixed(4));

    // Filename: [number]_[YYYYMMDD]_Project Schedule
    const today    = new Date();
    const yyyymmdd = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
    const num      = project?.number?.trim();
    document.title = [num, yyyymmdd, 'Project Schedule'].filter(Boolean).join('_');

    // margin: 0 on top/bottom suppresses the browser's native URL and date headers
    const pageStyle = document.createElement('style');
    pageStyle.id    = '__r3a_page';
    const paperName = paper === 'tabloid' ? 'tabloid' : 'letter';
    pageStyle.textContent = `@page { size: ${paperName} landscape; margin: 0 0.4in; }`;
    document.head.appendChild(pageStyle);

    window.print();

    document.getElementById('__r3a_page')?.remove();

    document.documentElement.style.removeProperty('--print-scale');
    document.title  = prevTitle;
    printColW       = null;
    zoom            = prevZoom;
    showTodayLine   = prevToday;
    hideLegendPrint = false;
    aiOpen          = prevAi;
  }
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
            bind:this={titleEl}
            class="hdr-title"
            contenteditable="true"
            spellcheck="false"
            onblur={(e) => updateTitle(e.target.textContent.trim() || project.title)}
            onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
          ></div>
          <div
            bind:this={subtitleEl}
            class="hdr-sub"
            contenteditable="true"
            spellcheck="false"
            onblur={(e) => updateSubtitle(e.target.textContent.trim() || project.subtitle)}
            onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(), e.target.blur(); } }}
          ></div>
          <div class="hdr-meta">
            <div
              class="meta-field"
              contenteditable="true"
              spellcheck="false"
              onblur={(e) => updateMeta('date', e.target.textContent.trim())}
            >{project.date || 'Date'}</div>
            <span class="meta-sep">·</span>
            <div
              class="meta-field"
              contenteditable="true"
              spellcheck="false"
              onblur={(e) => updateMeta('number', e.target.textContent.trim())}
            >{project.number || 'Project Number'}</div>
            <span class="meta-sep">·</span>
            <div
              class="meta-field"
              contenteditable="true"
              spellcheck="false"
              onblur={(e) => updateMeta('client', e.target.textContent.trim())}
            >{project.client || 'Client'}</div>
          </div>
        </div>
      </div>

      <div class="hdr-actions no-print">
        <button class="action-btn" onclick={openPrintPanel} title="Print / Export PDF">
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
        <div class="view-opts">
          <div class="zoom-ctrl">
            <button class="zoom-btn" class:zoom-active={zoom === 'fit'}    onclick={() => zoom = 'fit'}   >Fit</button>
            <button class="zoom-btn" class:zoom-active={zoom === 'month'}  onclick={() => zoom = 'month'} >Mo</button>
            <button class="zoom-btn" class:zoom-active={zoom === 'biweek'} onclick={() => zoom = 'biweek'}>2W</button>
            <button class="zoom-btn" class:zoom-active={zoom === 'week'}   onclick={() => zoom = 'week'}>Wk</button>
          </div>
          <button
            class="today-toggle"
            class:today-toggle-on={showTodayLine}
            onclick={() => showTodayLine = !showTodayLine}
            title="Toggle today line"
          ><span class="today-pip"></span>Today</button>
        </div>
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
        <div class="sch-scroll" bind:this={schScrollEl} bind:offsetWidth={schW}>
          <div class="sch-inner" style:width="{TASK_COL_W + ganttWidth}px">

            <TaskPanel
              tasks={project.tasks}
              onRename={handleRename}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onAdd={handleAdd}
              onDragChange={(id, idx) => { reorderDraggingId = id; reorderInsertIdx = idx; }}
              highlightId={draggingTaskId}
              zoom={displayZoom}
            />

            <GanttPanel
              tasks={project.tasks}
              viewStart={project.viewStart}
              viewEnd={project.viewEnd}
              todayMark={toISO(new Date())}
              legend={project.legend}
              dropDate={dropDate}
              highlightTaskId={highlightTaskId}
              onTaskUpdate={handleTaskUpdate}
              onLegendItemUpdate={handleLegendItemUpdate}
              onDraggingChange={handleDraggingChange}
              onColorChange={(id, color) => projectStore.updateTask(data.id, id, { color })}
              reorderDraggingId={reorderDraggingId}
              reorderInsertIdx={reorderInsertIdx}
              zoom={displayZoom}
              colWOverride={zoom === 'fit' || printColW !== null ? effectiveColW : null}
              showTodayLine={showTodayLine}
            />

          </div>
        </div>
      </div>

      <div class="footer-resizer no-print" onmousedown={startFooterResize}></div>

      <div class="legend-wrap"
           class:no-print={hideLegendPrint}
           style:height={footerH ? footerH + 'px' : null}
           style:overflow-y={footerH ? 'auto' : null}
           style:flex-shrink="0">
        <LegendFooter
          legend={project.legend}
          tasks={project.tasks}
          onUpdate={handleLegendUpdate}
          onMilestoneDrag={startMilestoneDrag}
          onApprovalDrag={startApprovalDrag}
          onEstimateDrag={startEstimateDrag}
          onAddMilestone={handleAddMilestone}
          onAddDeliverable={handleAddDeliverable}
          onAddApproval={handleAddApproval}
          onAddEstimate={handleAddEstimate}
          onLinkClick={linkToGantt}
          notes={project.notes ?? ''}
          onNotesUpdate={(val) => projectStore.updateProject(data.id, { notes: val })}
        />
      </div>
    </div>

    <!-- R3A wordmark (print only) -->
    <div class="r3a-mark no-screen">R3A</div>

    <AiSidebar open={aiOpen} project={project} onApplyChanges={handleAiChanges} onClose={() => aiOpen = false} />

    <PrintPanel
      open={printPanelOpen}
      projectId={data.id}
      contentWidth={TASK_COL_W + ganttWidth}
      monthCount={ganttMonths.length}
      showTodayDefault={showTodayLine}
      onPrint={printSchedule}
      onClose={() => printPanelOpen = false}
    />

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
  .hdr-title:focus { background: rgba(255,210,0,.25); border-radius: 2px; padding: 0 4px; }
  .hdr-title:empty::before { content: 'Project Title'; color: #ccc; pointer-events: none; }
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
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px 0;
    margin-top: 5px;
  }
  .meta-sep {
    font-size: 9px;
    color: #ccc;
    padding: 0 5px;
    user-select: none;
  }
  .meta-field {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10.5px;
    color: #999;
    outline: none;
    cursor: text;
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

  /* View options group (zoom + today toggle) */
  .view-opts {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 10px;
  }
  .zoom-ctrl {
    display: flex;
    background: #fff;
    border: 1px solid var(--lgray);
    border-radius: 3px;
    overflow: hidden;
  }
  .zoom-btn {
    background: none; border: none; border-right: 1px solid var(--lgray);
    padding: 0 8px; height: 22px;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 10px;
    text-transform: uppercase; letter-spacing: .06em;
    color: #aaa; cursor: pointer; transition: background .1s, color .1s;
    line-height: 1;
  }
  .zoom-btn:last-child { border-right: none; }
  .zoom-btn:hover:not(.zoom-active) { background: rgba(32,171,226,.08); color: var(--blue); }
  .zoom-active { background: var(--blue); color: #fff; }

  /* Today toggle — no button chrome, just a pip + label */
  .today-toggle {
    background: none; border: none; padding: 0;
    display: flex; align-items: center; gap: 4px;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 10px;
    text-transform: uppercase; letter-spacing: .08em;
    color: #ccc; cursor: pointer;
    transition: color .15s;
  }
  .today-toggle:hover { color: #999; }
  .today-toggle-on { color: var(--black); }
  .today-pip {
    width: 7px; height: 7px; border-radius: 50%;
    background: currentColor; flex-shrink: 0;
    transition: background .15s;
  }

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

  .footer-resizer {
    height: 5px;
    flex-shrink: 0;
    cursor: row-resize;
    background: var(--lgray);
    transition: background .15s;
    position: relative;
    z-index: 10;
  }
  .footer-resizer:hover,
  .footer-resizer:active { background: var(--blue); }

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
    @page { size: letter landscape; margin: 0 0.4in; }
    :root { zoom: var(--print-scale, 1); }

    .no-print     { display: none !important; }
    .no-print-border { border-bottom-width: 1.5px !important; }

    .schedule-page {
      padding-top: 0.4in !important;
      padding-bottom: 0.4in !important;
      padding-right: 0 !important;
      height: auto !important;
      overflow: visible !important;
    }
    .sch-hdr { padding: 8px 14px 6px; }
    .hdr-title { font-size: 20px; }

    .sch-body   { overflow: visible !important; height: auto !important; flex: none !important; padding-bottom: 0; }
    .sch-main   { overflow: visible !important; height: auto !important; flex: none !important; }
    .sch-scroll { overflow: visible !important; width: 100% !important; height: auto !important; }
    .sch-inner  { min-height: unset !important; }

    .legend-wrap {
      position: static !important;
      height: auto !important; overflow: visible !important; background: #fff;
      margin-top: 0 !important;
      break-inside: avoid;
    }

    .r3a-mark {
      display: block !important;
      position: static !important;
      text-align: right;
      padding: 4px 0 0;
      font-size: 28px;
    }
  }
</style>
