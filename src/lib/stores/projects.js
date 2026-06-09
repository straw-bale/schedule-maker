import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { createSampleProject } from '$lib/data/sample.js';

const KEY = 'r3a-schedule-projects';

// Migrate old data: deliverable date string → label, add ISO date field to milestones/deliverables
function migrate(projects) {
  return projects.map(p => {
    if (!p.legend) return p;
    const deliverables = (p.legend.deliverables ?? []).map(d => {
      if ('label' in d) return d; // already migrated
      return { ...d, label: d.date ?? '', date: null };
    });
    const milestones = (p.legend.milestones ?? []).map(m => ({
      ...m,
      date: m.date ?? null,
    }));
    return { ...p, legend: { ...p.legend, deliverables, milestones } };
  });
}

function loadFromStorage() {
  if (!browser) return [createSampleProject()];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return migrate(parsed);
    }
  } catch {}
  return [createSampleProject()];
}

function persist(projects) {
  if (browser) localStorage.setItem(KEY, JSON.stringify(projects));
  return projects;
}

const { subscribe, update } = writable(loadFromStorage());

export const projectStore = {
  subscribe,

  addProject(project) {
    update(ps => persist([...ps, project]));
  },

  deleteProject(id) {
    update(ps => persist(ps.filter(p => p.id !== id)));
  },

  updateMeta(id, patch) {
    update(ps => persist(ps.map(p =>
      p.id === id ? { ...p, ...patch } : p
    )));
  },

  updateTask(projectId, taskId, patch) {
    update(ps => persist(ps.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) };
    })));
  },

  addTask(projectId, task, insertAfterId = null) {
    update(ps => persist(ps.map(p => {
      if (p.id !== projectId) return p;
      const tasks = [...p.tasks];
      const idx = insertAfterId != null ? tasks.findIndex(t => t.id === insertAfterId) : -1;
      if (idx !== -1) tasks.splice(idx + 1, 0, task);
      else tasks.push(task);
      return { ...p, tasks, nextTaskId: (p.nextTaskId || 1) + 1 };
    })));
  },

  deleteTask(projectId, taskId) {
    update(ps => persist(ps.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
    })));
  },

  reorderTasks(projectId, fromIdx, toIdx) {
    update(ps => persist(ps.map(p => {
      if (p.id !== projectId) return p;
      const tasks = [...p.tasks];
      const [task] = tasks.splice(fromIdx, 1);
      tasks.splice(toIdx, 0, task);
      return { ...p, tasks };
    })));
  },

  // Update a single legend item by index
  updateLegendItem(projectId, section, idx, patch) {
    update(ps => persist(ps.map(p => {
      if (p.id !== projectId) return p;
      const items = (p.legend[section] ?? []).map((item, i) =>
        i === idx ? { ...item, ...patch } : item
      );
      return { ...p, legend: { ...p.legend, [section]: items } };
    })));
  },

  // Replace an entire legend section; syncs task msRef colors when milestones change
  updateLegendSection(projectId, section, items) {
    update(ps => persist(ps.map(p => {
      if (p.id !== projectId) return p;
      let tasks = p.tasks;
      if (section === 'milestones') {
        tasks = p.tasks.map(t => {
          if (!t.msRef) return t;
          const m = items.find(m => m.code === t.msRef.code);
          return m ? { ...t, msRef: { code: m.code, color: m.color } } : t;
        });
      }
      return { ...p, legend: { ...p.legend, [section]: items }, tasks };
    })));
  },
};
