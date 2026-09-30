import { writable } from 'svelte/store';
import { createSampleProject } from '$lib/data/sample.js';
import { supabase } from '$lib/supabase.js';
import { toWeekday } from '$lib/utils/dates.js';

const { subscribe, update, set } = writable([]);

// Undo history: Map<projectId, snapshot[]>, capped at 50 entries per project.
const HISTORY_LIMIT = 50;
const _history = new Map();
const { subscribe: subscribeHistoryDepth, update: updateHistoryDepth } = writable({});

function _pushHistory(projectId, project) {
  const stack = _history.get(projectId) ?? [];
  stack.push(JSON.parse(JSON.stringify(project)));
  if (stack.length > HISTORY_LIMIT) stack.shift();
  _history.set(projectId, stack);
  updateHistoryDepth(d => ({ ...d, [projectId]: stack.length }));
}

function _popHistory(projectId) {
  const stack = _history.get(projectId) ?? [];
  if (!stack.length) return null;
  const snapshot = stack.pop();
  _history.set(projectId, stack);
  updateHistoryDepth(d => ({ ...d, [projectId]: stack.length }));
  return snapshot;
}

export const historyDepth = { subscribe: subscribeHistoryDepth };

// Debounced upserts — coalesces rapid updates (e.g. dragging bars).
const _saveTimers = new Map();

function _saveProject(project) {
  clearTimeout(_saveTimers.get(project.id));
  _saveTimers.set(project.id, setTimeout(async () => {
    const { error } = await supabase
      .from('projects')
      .upsert({ id: project.id, title: project.title ?? '', data: project }, { onConflict: 'id' });
    if (error) console.error('[projects] save failed:', error.message);
  }, 800));
}

async function _deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('[projects] delete failed:', error.message);
}

// Point-in-time markers (milestones, deliverables, approvals, estimates) can't land on weekends.
function _weekdayDate(obj) {
  return obj?.date ? { ...obj, date: toWeekday(obj.date) } : obj;
}

// Brings previously saved projects up to the current color conventions:
//  - olive (#8B9A3A) was retired in favour of lime
//  - blue review bars (client / owner / design reviews, not permit/AHJ) moved to 50% gray
//    (runs once, so later picks stick)
const isReviewBar = t =>
  t.type === 'bar' && /review/i.test(t.name ?? '') && !/permit|ahj|regulatory/i.test(t.name ?? '') &&
  /^#(20ABE2|90D5F1)$/i.test(t.color ?? '');
export function normalizeProject(project) {
  const p = JSON.parse(JSON.stringify(project).replace(/#8B9A3A/gi, '#00914D'));
  if ((p.colorVersion ?? 1) < 2) {
    p.tasks = (p.tasks ?? []).map(t => isReviewBar(t) ? { ...t, color: '#949494' } : t);
    p.colorVersion = 2;
  }
  p.legend = _sortLegend(p.legend);
  return p;
}

// Legend sections are always kept in ascending date order (undated items last).
const LEGEND_SECTIONS = ['deliverables', 'milestones', 'estimates', 'approvals'];
function _byDate(items) {
  return [...(items ?? [])].sort((a, b) =>
    !a.date ? (b.date ? 1 : 0) : !b.date ? -1 : a.date.localeCompare(b.date)
  );
}
function _sortLegend(legend) {
  if (!legend) return legend;
  const out = { ...legend };
  for (const k of LEGEND_SECTIONS) if (out[k]) out[k] = _byDate(out[k]);
  return out;
}

function _updateAndSave(projectId, fn) {
  let saved = null;
  update(ps => ps.map(p => {
    if (p.id !== projectId) return p;
    _pushHistory(projectId, p);
    saved = fn(p);
    return saved;
  }));
  if (saved) _saveProject(saved);
}

export const projectStore = {
  subscribe,

  async init() {
    const { data, error } = await supabase
      .from('projects')
      .select('data')
      .order('created_at', { ascending: true });

    // If the user added a project while the fetch was in flight, don't overwrite.
    let current = [];
    const unsub = subscribe(ps => { current = ps; });
    unsub();
    if (current.length > 0) return;

    if (error) {
      console.error('[projects] init failed:', error.message);
      set([normalizeProject(createSampleProject())]);
      return;
    }

    if (!data?.length) {
      const sample = normalizeProject(createSampleProject());
      set([sample]);
      _saveProject(sample);
    } else {
      set(data.map(row => normalizeProject(row.data)));
    }
  },

  addProject(project) {
    project = { ...project, colorVersion: 2, legend: _sortLegend(project.legend) };
    update(ps => [...ps, project]);
    _saveProject(project);
  },

  deleteProject(id) {
    update(ps => ps.filter(p => p.id !== id));
    _deleteProject(id);
  },

  updateProject(id, patch) {
    _updateAndSave(id, p => ({ ...p, ...patch }));
  },

  updateTask(projectId, taskId, patch) {
    _updateAndSave(projectId, p => ({
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, ..._weekdayDate(patch) } : t),
    }));
  },

  addTask(projectId, task, insertAfterId = null) {
    _updateAndSave(projectId, p => {
      const tasks = [...p.tasks];
      task = _weekdayDate(task);
      const idx = insertAfterId != null ? tasks.findIndex(t => t.id === insertAfterId) : -1;
      if (idx !== -1) tasks.splice(idx + 1, 0, task);
      else tasks.push(task);
      return { ...p, tasks, nextTaskId: (p.nextTaskId || 1) + 1 };
    });
  },

  deleteTask(projectId, taskId) {
    _updateAndSave(projectId, p => ({
      ...p,
      tasks: p.tasks.filter(t => t.id !== taskId),
    }));
  },

  reorderTasks(projectId, fromIdx, toIdx) {
    _updateAndSave(projectId, p => {
      const tasks = [...p.tasks];
      const [task] = tasks.splice(fromIdx, 1);
      tasks.splice(toIdx, 0, task);
      return { ...p, tasks };
    });
  },

  updateLegendItem(projectId, section, idx, patch) {
    _updateAndSave(projectId, p => {
      const items = (p.legend[section] ?? []).map((item, i) =>
        i === idx ? { ...item, ..._weekdayDate(patch) } : item
      );
      return { ...p, legend: { ...p.legend, [section]: _byDate(items) } };
    });
  },

  undo(projectId) {
    const snapshot = _popHistory(projectId);
    if (!snapshot) return;
    update(ps => ps.map(p => p.id === projectId ? snapshot : p));
    _saveProject(snapshot);
  },

  updateLegendSection(projectId, section, items) {
    items = _byDate(items.map(_weekdayDate));
    _updateAndSave(projectId, p => {
      let tasks = p.tasks;
      if (section === 'milestones') {
        tasks = p.tasks.map(t => {
          if (!t.msRef) return t;
          const m = items.find(m => m.code === t.msRef.code);
          return m ? { ...t, msRef: { code: m.code, color: m.color } } : t;
        });
      }
      return { ...p, legend: { ...p.legend, [section]: items }, tasks };
    });
  },
};
