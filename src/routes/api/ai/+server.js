// Server-side proxy for the Schedule Assistant. The Anthropic key lives only here
// (a private env var), so it never ships in the browser bundle. The client sends just
// the project and the conversation; the system prompt, model and limits are fixed here.
import Anthropic from '@anthropic-ai/sdk';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import systemPromptTemplate from '$lib/data/system-prompt.md?raw';

const MODEL      = 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;
const MAX_TURNS  = 40;
const MAX_BODY   = 4.4 * 1024 * 1024; // just under Vercel's 4.5 MB request limit

export async function POST({ request }) {
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'AI is not configured on the server (missing ANTHROPIC_API_KEY).' }, { status: 500 });
  }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) {
    return json({ error: 'Request too large — attach a smaller file or a screenshot.' }, { status: 413 });
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid request.' }, { status: 400 }); }

  const { project, messages } = body ?? {};
  const valid = Array.isArray(messages)
    && messages.length > 0
    && messages.length <= MAX_TURNS
    && messages.every(m => (m?.role === 'user' || m?.role === 'assistant') && m.content);
  if (!valid) return json({ error: 'Invalid conversation.' }, { status: 400 });

  const system = `${systemPromptTemplate}

## Current Project
${JSON.stringify(project ?? null, null, 2)}`;

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: messages.map(({ role, content }) => ({ role, content })),
    });
    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');
    return json({ text });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return json({ error: err.message }, { status: err.status ?? 502 });
    }
    return json({ error: 'Could not reach the AI service.' }, { status: 502 });
  }
}
