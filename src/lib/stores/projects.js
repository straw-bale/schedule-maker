import { writable } from 'svelte/store';
import { createSampleProject } from '$lib/data/sample.js';

const { subscribe, update } = writable([createSampleProject()]);

export const projectStore = {
  subscribe,

  addProject(project) {
    update(ps => [...ps, project]);
  },

  deleteProject(id) {
    update(ps => ps.filter(p => p.id !== id));
  },

  updateMeta(id, patch) {
    update(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
  },

  updateTask(projectId, taskId, patch) {
    update(ps => ps.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) };
    }));
  },

  addTask(projectId, task, insertAfterId = null) {
    update(ps => ps.map(p => {
      if (p.id !== projectId) return p;
      const tasks = [...p.tasks];
      const idx = insertAfterId != null ? tasks.findIndex(t => t.id === insertAfterId) : -1;
      if (idx !== -1) tasks.splice(idx + 1, 0, task);
      else tasks.push(task);
      return { ...p, tasks, nextTaskId: (p.nextTaskId || 1) + 1 };
    }));
  },

  deleteTask(projectId, taskId) {
    update(ps => ps.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
    }));
  },

  reorderTasks(projectId, fromIdx, toIdx) {
    update(ps => ps.map(p => {
      if (p.id !== projectId) return p;
      const tasks = [...p.tasks];
      const [task] = tasks.splice(fromIdx, 1);
      tasks.splice(toIdx, 0, task);
      return { ...p, tasks };
    }));
  },

  updateLegendItem(projectId, section, idx, patch) {
    update(ps => ps.map(p => {
      if (p.id !== projectId) return p;
      const items = (p.legend[section] ?? []).map((item, i) =>
        i === idx ? { ...item, ...patch } : item
      );
      return { ...p, legend: { ...p.legend, [section]: items } };
    }));
  },

  updateLegendSection(projectId, section, items) {
    update(ps => ps.map(p => {
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
    }));
  },
};
