import { writable } from 'svelte/store';
import { createSampleProject } from '$lib/data/sample.js';

const LS_KEY = 'r3a_projects';

const { subscribe, update, set } = writable([]);

function _persist(projects) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('[projects] localStorage save failed:', e);
  }
}

// Debounced persist — coalesces rapid updates (e.g. dragging bars).
let _saveTimer = null;
function _scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    let current = [];
    const unsub = subscribe(ps => { current = ps; });
    unsub();
    _persist(current);
  }, 400);
}

function _updateAndSave(projectId, fn) {
  update(ps => {
    const next = ps.map(p => p.id === projectId ? fn(p) : p);
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => _persist(next), 400);
    return next;
  });
}

export const projectStore = {
  subscribe,

  init() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const projects = JSON.parse(raw);
        if (Array.isArray(projects) && projects.length > 0) {
          set(projects);
          return;
        }
      }
    } catch (e) {
      console.error('[projects] localStorage load failed:', e);
    }
    const sample = createSampleProject();
    set([sample]);
    _persist([sample]);
  },

  addProject(project) {
    update(ps => {
      const next = [...ps, project];
      _persist(next);
      return next;
    });
  },

  deleteProject(id) {
    update(ps => {
      const next = ps.filter(p => p.id !== id);
      _persist(next);
      return next;
    });
  },

  updateMeta(id, patch) {
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
