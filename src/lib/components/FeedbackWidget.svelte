<script>
  import { supabase } from '$lib/supabase.js';

  let open    = $state(false);
  let message = $state('');
  let status  = $state('idle'); // 'idle' | 'sending' | 'sent' | 'error'

  async function submit() {
    if (!message.trim()) return;
    status = 'sending';
    const { error } = await supabase.from('feedback').insert({
      message: message.trim(),
      page:    typeof window !== 'undefined' ? window.location.pathname : '',
    });
    if (error) {
      console.error('[feedback]', error.message);
      status = 'error';
    } else {
      status = 'sent';
      message = '';
      setTimeout(() => { open = false; status = 'idle'; }, 1800);
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') { open = false; status = 'idle'; message = ''; }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fb-root" onkeydown={handleKeydown}>

  {#if open}
    <div class="fb-card">
      <div class="fb-hdr">
        <span class="fb-title">Feedback</span>
        <button class="fb-close" onclick={() => { open = false; status = 'idle'; message = ''; }}>✕</button>
      </div>

      {#if status === 'sent'}
        <div class="fb-sent">Thanks — got it.</div>
      {:else}
        <textarea
          class="fb-msg"
          bind:value={message}
          placeholder="Bug, idea, or request…"
          rows="4"
          disabled={status === 'sending'}
        ></textarea>
        {#if status === 'error'}
          <div class="fb-err">Couldn't send — try again.</div>
        {/if}
        <div class="fb-foot">
          <button
            class="fb-submit"
            onclick={submit}
            disabled={!message.trim() || status === 'sending'}
          >{status === 'sending' ? 'Sending…' : 'Submit →'}</button>
        </div>
      {/if}
    </div>
  {/if}

  <button class="fb-trigger" onclick={() => open = !open}>
    Share Feedback
  </button>

</div>

<style>
  .fb-root {
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 400;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    font-family: 'Barlow Condensed', sans-serif;
  }

  /* Trigger button */
  .fb-trigger {
    background: #FFD200;
    border: none;
    border-radius: 3px;
    padding: 7px 14px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--black);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,.15);
    transition: background .15s, box-shadow .15s;
  }
  .fb-trigger:hover { background: #ffe033; box-shadow: 0 3px 12px rgba(0,0,0,.2); }

  /* Card */
  .fb-card {
    background: #fff;
    border: 1px solid var(--lgray);
    border-radius: 4px;
    box-shadow: 0 4px 20px rgba(0,0,0,.12);
    width: 230px;
    display: flex; flex-direction: column;
  }
  .fb-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px 8px;
    border-bottom: 1px solid var(--lgray);
  }
  .fb-title {
    font-weight: 700; font-size: 11px;
    text-transform: uppercase; letter-spacing: .1em;
    color: var(--black);
  }
  .fb-close {
    background: none; border: none; cursor: pointer;
    color: #bbb; font-size: 12px; line-height: 1; padding: 0;
    transition: color .1s;
  }
  .fb-close:hover { color: var(--black); }

  .fb-msg {
    margin: 10px 10px 0;
    border: 1px solid var(--lgray);
    border-radius: 3px;
    padding: 7px 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    color: var(--black);
    resize: none;
    outline: none;
    line-height: 1.4;
    transition: border-color .12s;
  }
  .fb-msg:focus { border-color: var(--blue); }
  .fb-msg::placeholder { color: #ccc; }
  .fb-msg:disabled { opacity: .5; }

  .fb-err {
    margin: 4px 10px 0;
    font-size: 10px; color: #c0392b;
  }

  .fb-foot {
    display: flex; justify-content: flex-end;
    padding: 8px 10px 10px;
  }
  .fb-submit {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 10px;
    text-transform: uppercase; letter-spacing: .1em;
    background: var(--black); border: none;
    color: #fff; border-radius: 3px;
    padding: 6px 12px; cursor: pointer;
    transition: background .12s;
  }
  .fb-submit:hover:not(:disabled) { background: var(--blue); }
  .fb-submit:disabled { opacity: .4; cursor: default; }

  .fb-sent {
    padding: 18px 12px;
    font-size: 12px; color: #3B8FA0;
    text-align: center; font-weight: 600;
    letter-spacing: .04em;
  }

  @media print { .fb-root { display: none !important; } }
</style>
