import { writable } from 'svelte/store';
import { createSampleProject } from '$lib/data/sample.js';
import { supabase } from '$lib/supabase.js';

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
      set([createSampleProject()]);
      return;
    }

    if (!data?.length) {
      const sample = createSampleProject();
      set([sample]);
      _saveProject(sample);
    } else {
      set(data.map(row => row.data));
    }
  },

  addProject(project) {
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
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t),
    }));
  },

  addTask(projectId, task, insertAfterId = null) {
    _updateAndSave(projectId, p => {
      const tasks = [...p.tasks];
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
        i === idx ? { ...item, ...patch } : item
      );
      return { ...p, legend: { ...p.legend, [section]: items } };
    });
  },

  undo(projectId) {
    const snapshot = _popHistory(projectId);
    if (!snapshot) return;
    update(ps => ps.map(p => p.id === projectId ? snapshot : p));
    _saveProject(snapshot);
  },

  updateLegendSection(projectId, section, items) {
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
