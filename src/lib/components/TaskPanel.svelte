<script>
  const ROW_H = 34;

  let { tasks, onRename, onDelete, onReorder, onAdd, highlightId = null } = $props();

  function initRowDrag(handle, taskIdx) {
    handle.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();

      const list    = handle.closest('.task-list');
      const rowEl   = handle.closest('.t-row');
      const rowRect = rowEl.getBoundingClientRect();

      const ghost = document.createElement('div');
      ghost.className = 't-ghost';
      ghost.style.cssText = `top:${rowRect.top}px;left:${rowRect.left}px;width:${rowRect.width}px;height:${ROW_H}px;`;
      ghost.textContent = tasks[taskIdx].name;
      document.body.appendChild(ghost);

      const spacer = document.createElement('div');
      spacer.className = 't-drop-spacer';

      rowEl.classList.add('dragging');
      rowEl.after(spacer);

      let insertAt = taskIdx;

      function visibleRows() {
        return [...list.querySelectorAll('.t-row')].filter(el => el !== rowEl);
      }

      function updateSpacerPos(clientY) {
        const rows = visibleRows();
        let newInsert = rows.length;
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i].getBoundingClientRect();
          if (clientY < r.top + r.height / 2) { newInsert = i; break; }
        }
        if (newInsert === insertAt) return;
        insertAt = newInsert;
        spacer.remove();
        if (insertAt >= rows.length) list.appendChild(spacer);
        else rows[insertAt].before(spacer);
      }

      function onMove(ev) {
        ghost.style.top = (rowRect.top + ev.clientY - e.clientY) + 'px';
        updateSpacerPos(ev.clientY);
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        ghost.remove();
        spacer.remove();
        rowEl.classList.remove('dragging');
        if (insertAt !== taskIdx) onReorder(taskIdx, insertAt);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function mountDrag(el, idx) {
    initRowDrag(el, idx);
  }
</script>

<div class="task-panel">
  <div class="col-hdr-lbl">Milestones, Tasks &amp; Deliverables</div>

  <div class="task-list">
    {#each tasks as task, i (task.id)}
      <div class="t-row" class:t-highlight={task.id === highlightId}>
        <div class="t-drag" title="Drag to reorder" use:mountDrag={i}>⠿</div>
        <div
          class="t-name"
          contenteditable="true"
          spellcheck="false"
          onblur={(e) => onRename(task.id, e.target.textContent.trim() || task.name)}
          onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
        >{task.name}</div>
        <div class="t-del" title="Remove" onclick={() => onDelete(task.id)}>✕</div>
      </div>
    {/each}
  </div>

  <div class="add-btn no-print" onclick={onAdd}>+ Add Task</div>
</div>

<style>
  .task-panel {
    width: 252px;
    flex-shrink: 0;
    border-right: 2px solid var(--black);
    display: flex;
    flex-direction: column;
    background: #fff;
    z-index: 20;
    position: sticky;
    left: 0;
  }
  .col-hdr-lbl {
    height: 68px; /* matches GanttPanel time header: year(18) + month(28) + markers(22) */
    display: flex;
    align-items: flex-end;
    padding: 0 12px 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 600;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .13em;
    color: #999;
    border-bottom: 1px solid var(--lgray);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 21;
    background: #fff;
  }
  .task-list {
    position: relative;
  }
  .t-row {
    height: 34px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    border-bottom: 1px solid var(--lgray);
    gap: 5px;
    transition: background .1s;
  }
  .t-row:hover { background: rgba(32,171,226,.04); }
  .t-row.dragging { display: none; }
  .t-highlight { background: rgba(0,0,0,.06) !important; }
  .t-drag {
    opacity: 0;
    color: #bbb;
    font-size: 13px;
    cursor: grab;
    flex-shrink: 0;
    padding: 0 2px 0 0;
    transition: opacity .12s;
    user-select: none;
    letter-spacing: -1px;
  }
  .t-row:hover .t-drag { opacity: 1; }
  .t-drag:hover { color: #888; }
  .t-drag:active { cursor: grabbing; }
  .t-name {
    flex: 1;
    font-family: 'Barlow', sans-serif;
    font-weight: 700;
    font-size: 10.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    outline: none;
    cursor: text;
    line-height: 1;
  }
  .t-name:focus {
    white-space: nowrap;
    overflow: visible;
    background: rgba(32,171,226,.1);
    border-radius: 2px;
    padding: 1px 4px;
  }
  .t-del {
    opacity: 0;
    font-size: 12px;
    color: #ccc;
    cursor: pointer;
    flex-shrink: 0;
    padding: 2px 3px;
    transition: opacity .12s, color .12s;
  }
  .t-row:hover .t-del { opacity: 1; }
  .t-del:hover { color: var(--mag); }
  .add-btn {
    padding: 7px 12px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--blue);
    cursor: pointer;
    border-top: 1px solid var(--lgray);
    flex-shrink: 0;
    transition: background .12s;
  }
  .add-btn:hover { background: rgba(32,171,226,.06); }

  /* Ghost + drop indicator (injected imperatively during drag) */
  :global(.t-ghost) {
    position: fixed;
    background: #fff;
    border-left: 3px solid var(--blue);
    box-shadow: 0 4px 16px rgba(0,0,0,.18);
    pointer-events: none;
    z-index: 999;
    display: flex;
    align-items: center;
    padding: 0 10px;
    font-family: 'Barlow', sans-serif;
    font-weight: 700;
    font-size: 10.5px;
  }
  :global(.t-drop-spacer) {
    height: 34px;
    background: rgba(32,171,226,.08);
    border-left: 3px solid var(--blue);
    border-bottom: 1px solid var(--lgray);
    pointer-events: none;
    flex-shrink: 0;
  }
</style>
