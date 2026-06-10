<script>
  import { projectStore } from '$lib/stores/projects.js';
  import { createBlankProject, createSmallTemplate, createMediumTemplate, createLargeTemplate } from '$lib/data/sample.js';
  import { goto } from '$app/navigation';

  let projects = $state([]);
  projectStore.subscribe(v => { projects = v; });

  let templateModal = $state(false);

  // Preview bar definitions for each template card.
  // Each bar: { l: left%, w: width%, c: color } — one bar per task row.
  const TEMPLATES = [
    {
      key:  'blank',
      type: 'Blank',
      name: 'Empty Project',
      desc: 'Start from scratch. No tasks, no dates — just an empty timeline ready for your input.',
      meta: '1 task · Custom duration',
      bars: [],
    },
    {
      key:  'small',
      type: 'Small',
      name: 'Renovation / TI',
      desc: 'SD through construction for smaller scopes. Standard client review, single CD submission.',
      meta: '~11 months · 10 tasks',
      bars: [
        { l:0,  w:14, c:'#8B9A3A' },  // SD
        { l:14, w:14, c:'#6B7A2A' },  // DD
        { l:28, w:7,  c:'#90D5F1' },  // DD Review
        { l:35, w:14, c:'#3D5018' },  // CDs
        { l:49, w:7,  c:'#90D5F1' },  // CD Review
        { l:56, w:9,  c:'#282829' },  // Bidding
        { l:65, w:28, c:'#3B8FA0' },  // Construction
        { l:93, w:7,  c:'#282829' },  // Closeout
      ],
    },
    {
      key:  'medium',
      type: 'Medium',
      name: 'Commercial / Institutional',
      desc: 'Full AE phase sequence — SD, 50%, 95%, 100%, CDs — with client review cycles at each milestone.',
      meta: '~22 months · 13 tasks',
      bars: [
        { l:0,  w:9,  c:'#8B9A3A' },
        { l:9,  w:5,  c:'#90D5F1' },
        { l:14, w:12, c:'#8B9A3A' },
        { l:26, w:5,  c:'#90D5F1' },
        { l:31, w:9,  c:'#6B7A2A' },
        { l:40, w:5,  c:'#90D5F1' },
        { l:45, w:7,  c:'#3D5018' },
        { l:52, w:5,  c:'#282829' },
        { l:57, w:5,  c:'#282829' },
        { l:62, w:30, c:'#3B8FA0' },
        { l:92, w:7,  c:'#282829' },
      ],
    },
    {
      key:  'large',
      type: 'Large',
      name: 'Large / Complex',
      desc: 'Extended owner review cycles at each submission, permitting phase, and major construction period.',
      meta: '~34 months · 17 tasks',
      bars: [
        { l:0,  w:7,  c:'#8B9A3A' },
        { l:7,  w:4,  c:'#90D5F1' },
        { l:11, w:8,  c:'#8B9A3A' },
        { l:19, w:4,  c:'#90D5F1' },
        { l:23, w:7,  c:'#6B7A2A' },
        { l:30, w:4,  c:'#90D5F1' },
        { l:34, w:5,  c:'#3D5018' },
        { l:39, w:4,  c:'#90D5F1' },
        { l:43, w:4,  c:'#282829' },
        { l:47, w:7,  c:'#A0522D' },
        { l:54, w:39, c:'#3B8FA0' },
        { l:93, w:5,  c:'#282829' },
      ],
    },
  ];

  function openProject(id) { goto(`/project/${id}`); }

  function createProject(key) {
    const fn = { blank: createBlankProject, small: createSmallTemplate, medium: createMediumTemplate, large: createLargeTemplate }[key];
    const p = fn();
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
        <button class="btn-primary" onclick={() => templateModal = true}>+ New Project</button>
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
          {#if projects.length > 1}
            <button class="card-delete" title="Delete project" onclick={(e) => deleteProject(e, project.id)}>✕</button>
          {/if}
        </div>
      {/each}

      {#if projects.length === 0}
        <div class="empty-state">
          <p>No projects yet.</p>
          <button class="btn-primary" onclick={() => templateModal = true}>Create your first project</button>
        </div>
      {/if}
    </div>
  </main>

  <footer class="home-foot">
    <span class="foot-r3a">R3A</span>
    <span class="foot-copy">R3A Solutions · Schedule Maker</span>
  </footer>
</div>

<!-- Template picker modal -->
{#if templateModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="tm-overlay" onclick={() => templateModal = false}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="tm-panel" onclick={(e) => e.stopPropagation()}>

      <div class="tm-hdr">
        <span class="tm-hdr-title">New Project</span>
        <button class="tm-x" onclick={() => templateModal = false}>✕</button>
      </div>

      <div class="tm-body">
        <div class="tm-cards">
          {#each TEMPLATES as tpl}
            <button class="tm-card" onclick={() => createProject(tpl.key)}>
              <div class="tm-type">{tpl.type}</div>

              <!-- Mini Gantt preview -->
              <div class="tm-preview" style:height="{tpl.bars.length > 0 ? tpl.bars.length * 7 + 4 : 52}px">
                {#if tpl.bars.length === 0}
                  <div class="tm-blank-lines">
                    <div class="tm-blank-line" style:width="40%"></div>
                    <div class="tm-blank-line" style:width="65%"></div>
                    <div class="tm-blank-line" style:width="55%"></div>
                  </div>
                {:else}
                  {#each tpl.bars as bar, i}
                    <div
                      class="tm-bar"
                      style:left="{bar.l}%"
                      style:width="{bar.w}%"
                      style:top="{i * 7}px"
                      style:background={bar.c}
                    ></div>
                  {/each}
                {/if}
              </div>

              <div class="tm-info">
                <div class="tm-name">{tpl.name}</div>
                <div class="tm-desc">{tpl.desc}</div>
                <div class="tm-meta">{tpl.meta}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>

    </div>
  </div>
{/if}

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

  /* ── Template picker modal ────────────────────────────────────── */
  .tm-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.52);
    display: flex; align-items: center; justify-content: center;
    z-index: 800;
  }
  .tm-panel {
    background: #fff;
    border-radius: 4px;
    width: min(980px, 94vw);
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,.3);
  }
  .tm-hdr {
    background: var(--black);
    padding: 14px 20px;
    display: flex; align-items: center; justify-content: space-between;
    border-radius: 4px 4px 0 0;
    position: sticky; top: 0;
  }
  .tm-hdr-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 15px;
    text-transform: uppercase; letter-spacing: .06em;
    color: #fff;
  }
  .tm-x {
    background: none; border: none;
    color: rgba(255,255,255,.4); font-size: 17px; line-height: 1;
    cursor: pointer; transition: color .12s; padding: 0;
  }
  .tm-x:hover { color: #fff; }

  .tm-body { padding: 20px; }
  .tm-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .tm-card {
    background: none;
    border: 1.5px solid var(--lgray);
    border-radius: 4px;
    padding: 16px 14px 14px;
    cursor: pointer; text-align: left;
    display: flex; flex-direction: column;
    transition: border-color .15s, transform .12s, box-shadow .15s;
  }
  .tm-card:hover {
    border-color: var(--blue);
    transform: translateY(-2px);
    box-shadow: 0 6px 22px rgba(0,0,0,.1);
  }

  /* Type label */
  .tm-type {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 10px;
    text-transform: uppercase; letter-spacing: .16em;
    color: #bbb; margin-bottom: 10px;
    transition: color .15s;
  }
  .tm-card:hover .tm-type { color: var(--blue); }

  /* Mini gantt preview */
  .tm-preview {
    position: relative; width: 100%;
    background: rgba(0,0,0,.04);
    border-radius: 2px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .tm-bar {
    position: absolute; height: 4px; border-radius: 2px;
  }
  .tm-blank-lines {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    justify-content: center; gap: 7px;
    padding: 10px 12px;
  }
  .tm-blank-line {
    height: 4px; border-radius: 2px;
    background: rgba(0,0,0,.1);
  }

  /* Card info */
  .tm-info { display: flex; flex-direction: column; flex: 1; }
  .tm-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 14px;
    color: var(--black); margin-bottom: 5px;
  }
  .tm-desc {
    font-family: 'Barlow', sans-serif;
    font-size: 10.5px; color: #888; line-height: 1.55;
    flex: 1; margin-bottom: 10px;
  }
  .tm-meta {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
    color: #bbb;
    border-top: 1px solid var(--lgray); padding-top: 8px;
  }
</style>
