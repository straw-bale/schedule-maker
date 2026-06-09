<script>
  const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY ?? '';

  let { open = false, project = null, onApplyChanges, onClose } = $props();

  let messages  = $state([]);
  let inputVal  = $state('');
  let loading   = $state(false);
  let msgList   = $state(null); // scroll ref

  function buildSystemPrompt() {
    return `You are a project schedule assistant for R3A Architecture. You manage Gantt chart project schedules.

When the user asks you to modify the schedule, respond with ONLY a valid JSON object:
{
  "message": "Brief, friendly description of what you changed.",
  "changes": [
    { "type": "updateTask",  "taskId": <number>,  "patch": { ...fields to update } },
    { "type": "addTask",     "task":  { "id": <unique int>, "name": "...", "type": "bar"|"milestone", "color": "#hex", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" } },
    { "type": "deleteTask",  "taskId": <number> },
    { "type": "updateView",  "patch": { "viewStart": "YYYY-MM-DD", "viewEnd": "YYYY-MM-DD" } }
  ]
}

Rules:
- All dates must be YYYY-MM-DD format. Colors must be hex.
- Bar tasks use "start" and "end". Milestone tasks use "date" instead.
- Preserve task duration when shifting dates unless told otherwise.
- Use existing task IDs for updateTask. For addTask, pick an integer not already in use.
- For informational questions that require no schedule change, reply as plain text (not JSON).

Current project JSON:
${JSON.stringify(project, null, 2)}`;
  }

  async function send() {
    const text = inputVal.trim();
    if (!text || loading) return;

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'bot')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    messages  = [...messages, { role: 'user', text }];
    inputVal  = '';
    loading   = true;
    scrollToBottom();

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: buildSystemPrompt(),
          messages: [...history, { role: 'user', content: text }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const raw  = data.content?.[0]?.text ?? '';

      // Try to extract JSON patch from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          messages = [...messages, { role: 'bot', text: parsed.message ?? 'Done.' }];
          if (parsed.changes?.length && onApplyChanges) {
            onApplyChanges(parsed.changes);
          }
        } catch {
          messages = [...messages, { role: 'bot', text: raw }];
        }
      } else {
        messages = [...messages, { role: 'bot', text: raw }];
      }
    } catch (err) {
      messages = [...messages, { role: 'bot', text: `Could not reach the API: ${err.message}`, error: true }];
    } finally {
      loading = false;
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    setTimeout(() => { if (msgList) msgList.scrollTop = msgList.scrollHeight; }, 30);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }
</script>

<div class="ai-sidebar" class:open>
  <div class="ai-hdr">
    <span class="ai-title">Schedule Assistant</span>
    <button class="ai-close-btn" onclick={onClose}>✕</button>
  </div>

  <div class="ai-msgs" bind:this={msgList}>
    <div class="ai-bubble ai-hint">
      Try: "Push the 95% submission back 3 weeks" or "Add a 2-week client review in April 2023."
    </div>
    {#each messages as msg}
      <div
        class="ai-bubble"
        class:ai-user={msg.role === 'user'}
        class:ai-bot={msg.role === 'bot'}
        class:ai-error={msg.error}
      >{msg.text}</div>
    {/each}
    {#if loading}
      <div class="ai-bubble ai-bot ai-loading">
        <span></span><span></span><span></span>
      </div>
    {/if}
  </div>

  <div class="ai-foot">
    <textarea
      class="ai-input"
      placeholder="Describe a schedule change…"
      rows="2"
      bind:value={inputVal}
      onkeydown={handleKey}
    ></textarea>
    <button class="ai-send-btn" onclick={send} disabled={loading}>↑</button>
  </div>
</div>

<style>
  .ai-sidebar {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: 310px;
    background: #fff;
    border-left: 1px solid var(--lgray);
    box-shadow: -6px 0 28px rgba(0,0,0,.1);
    display: flex;
    flex-direction: column;
    z-index: 400;
    transform: translateX(100%);
    transition: transform .22s ease;
  }
  .ai-sidebar.open { transform: translateX(0); }

  .ai-hdr {
    background: var(--black);
    padding: 14px 18px;
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ai-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #fff;
  }
  .ai-close-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,.4);
    font-size: 17px;
    line-height: 1;
    cursor: pointer;
    transition: color .12s;
    padding: 0;
  }
  .ai-close-btn:hover { color: #fff; }

  .ai-msgs {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ai-bubble {
    padding: 10px 13px;
    border-radius: 4px;
    font-family: 'Barlow', sans-serif;
    font-size: 12px;
    line-height: 1.6;
    max-width: 93%;
  }
  .ai-hint  { background: var(--off); color: #888; font-style: italic; border-left: 3px solid var(--blue); font-size: 11px; }
  .ai-user  { background: var(--blue); color: #fff; align-self: flex-end; }
  .ai-bot   { background: var(--off); color: var(--black); align-self: flex-start; border-left: 3px solid #D4B040; }
  .ai-error { border-left-color: var(--mag); color: var(--mag); }

  /* Typing indicator */
  .ai-loading { display: flex; align-items: center; gap: 4px; padding: 12px 14px; }
  .ai-loading span {
    width: 6px; height: 6px; border-radius: 50%;
    background: #bbb; animation: bounce .9s infinite;
  }
  .ai-loading span:nth-child(2) { animation-delay: .15s; }
  .ai-loading span:nth-child(3) { animation-delay: .30s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-5px); }
  }

  .ai-foot {
    display: flex;
    border-top: 1px solid var(--lgray);
    padding: 10px;
    gap: 8px;
    flex-shrink: 0;
    align-items: flex-end;
  }
  .ai-input {
    flex: 1;
    border: 1px solid var(--lgray);
    border-radius: 3px;
    padding: 7px 11px;
    font-family: 'Barlow', sans-serif;
    font-size: 12px;
    outline: none;
    transition: border-color .12s;
    resize: none;
    line-height: 1.5;
  }
  .ai-input:focus { border-color: var(--blue); }
  .ai-send-btn {
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 3px;
    padding: 8px 14px;
    font-size: 15px;
    cursor: pointer;
    transition: background .12s;
    flex-shrink: 0;
  }
  .ai-send-btn:hover:not(:disabled) { background: #1A93C8; }
  .ai-send-btn:disabled { opacity: .45; cursor: default; }
</style>
