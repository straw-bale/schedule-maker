<script>
  import { projectStore } from '$lib/stores/projects.js';
  import { createBlankProject, createSampleProject } from '$lib/data/sample.js';
  import { goto } from '$app/navigation';

  let projects = $state([]);
  projectStore.subscribe(v => { projects = v; });

  function openProject(id) { goto(`/project/${id}`); }

  function newProject() {
    const p = createBlankProject();
    projectStore.addProject(p);
    goto(`/project/${p.id}`);
  }

  function addSample() {
    const p = createSampleProject();
    projectStore.addProject(p);
    goto(`/project/${p.id}`);
  }

  function deleteProject(e, id) {
    e.stopPropagation();
    if (projects.length <= 1) return;
    if (confirm('Delete this project? This cannot be undone.')) {
      projectStore.deleteProject(id);
    }
  }

  function fmtDate(str) {
    if (!str) return '';
    const [y, m] = str.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[Number(m)-1]} ${y}`;
  }
</script>

<div class="home">
  <header class="home-hdr">
    <div class="logo">R3A</div>
    <div class="hdr-right">
      <h1 class="app-name">Schedule Maker</h1>
      <p class="app-sub">R3A Architecture Project Schedules</p>
    </div>
  </header>

  <main class="home-main">
    <div class="top-bar">
      <h2 class="section-hdr">Projects</h2>
      <div class="top-actions">
        <button class="btn-secondary" onclick={addSample}>+ Sample Project</button>
        <button class="btn-primary" onclick={newProject}>+ New Project</button>
      </div>
    </div>

    <div class="project-grid">
      {#each projects as project (project.id)}
        <div class="project-card" onclick={() => openProject(project.id)} role="button" tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && openProject(project.id)}>

          <div class="card-accent" style:background="var(--blue)"></div>
          <div class="card-body">
            <div class="card-title">{project.title || 'Untitled Project'}</div>
            {#if project.meta?.name}
              <div class="card-name">{project.meta.name}</div>
            {/if}
            {#if project.meta?.client}
              <div class="card-client">{project.meta.client}</div>
            {/if}
            {#if project.meta?.number}
              <div class="card-num">{project.meta.number}</div>
            {/if}
            <div class="card-meta">
              {#if project.viewStart}
                <span class="card-dates">{fmtDate(project.viewStart)} – {fmtDate(project.viewEnd)}</span>
              {/if}
              <span class="card-tasks">{project.tasks?.length || 0} tasks</span>
            </div>
          </div>
          <button class="card-delete" title="Delete project" onclick={(e) => deleteProject(e, project.id)}>✕</button>
        </div>
      {/each}

      {#if projects.length === 0}
        <div class="empty-state">
          <p>No projects yet.</p>
          <button class="btn-primary" onclick={newProject}>Create your first project</button>
        </div>
      {/if}
    </div>
  </main>

  <footer class="home-foot">
    <span class="foot-r3a">R3A</span>
    <span class="foot-copy">R3A Solutions · Schedule Maker</span>
  </footer>
</div>

<style>
  .home {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--off);
    font-family: 'Barlow', sans-serif;
  }

  /* Header */
  .home-hdr {
    background: var(--black);
    padding: 16px 40px;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
  }
  .logo {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 26px;
    color: var(--blue);
    letter-spacing: .02em;
  }
  .hdr-right { border-left: 1px solid rgba(255,255,255,.1); padding-left: 20px; }
  .app-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 16px;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: .1em;
    margin: 0;
  }
  .app-sub {
    font-size: 11px;
    color: rgba(255,255,255,.35);
    margin: 2px 0 0;
    font-family: 'Barlow', sans-serif;
  }

  /* Main */
  .home-main {
    flex: 1;
    padding: 40px 40px 60px;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  .section-hdr {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: .14em;
    color: #aaa;
    margin: 0;
  }
  .top-actions { display: flex; gap: 10px; }
  .btn-primary {
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 3px;
    padding: 9px 18px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .08em;
    cursor: pointer;
    transition: background .12s;
  }
  .btn-primary:hover { background: #1A93C8; }
  .btn-secondary {
    background: transparent;
    color: var(--black);
    border: 1px solid var(--lgray);
    border-radius: 3px;
    padding: 9px 18px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .08em;
    cursor: pointer;
    transition: border-color .12s, background .12s;
  }
  .btn-secondary:hover { border-color: var(--blue); background: rgba(32,171,226,.04); }

  /* Grid */
  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .project-card {
    background: #fff;
    border: 1px solid var(--lgray);
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    transition: box-shadow .15s, transform .12s;
    outline: none;
  }
  .project-card:hover { box-shadow: 0 6px 22px rgba(0,0,0,.1); transform: translateY(-2px); }
  .project-card:focus-visible { box-shadow: 0 0 0 2px var(--blue); }
  .card-accent { height: 4px; flex-shrink: 0; }
  .card-body { padding: 18px 20px 16px; flex: 1; }
  .card-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--black);
    margin-bottom: 4px;
  }
  .card-name {
    font-family: 'Barlow', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: var(--black);
    margin-bottom: 3px;
  }
  .card-client {
    font-size: 11px;
    color: #888;
    margin-bottom: 2px;
  }
  .card-num {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    color: #bbb;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 12px;
  }
  .card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    border-top: 1px solid var(--lgray);
    padding-top: 10px;
  }
  .card-dates {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    color: #aaa;
  }
  .card-tasks {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #ccc;
  }
  .card-delete {
    position: absolute;
    top: 10px; right: 10px;
    background: none;
    border: none;
    color: #ddd;
    font-size: 13px;
    cursor: pointer;
    opacity: 0;
    transition: opacity .12s, color .12s;
    padding: 3px 5px;
  }
  .project-card:hover .card-delete { opacity: 1; }
  .card-delete:hover { color: var(--mag); }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 0;
    color: #bbb;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  /* Footer */
  .home-foot {
    background: var(--black);
    padding: 10px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .foot-r3a {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 16px;
    color: var(--blue);
  }
  .foot-copy {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    color: rgba(255,255,255,.25);
    text-transform: uppercase;
    letter-spacing: .1em;
  }
</style>
