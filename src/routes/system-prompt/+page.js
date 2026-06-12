import raw from '$lib/data/system-prompt.md?raw';

export const prerender = true;

export function load() {
  return { markdown: raw };
}
