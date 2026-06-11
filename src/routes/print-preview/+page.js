export function load({ url }) {
  return { paper: url.searchParams.get('paper') ?? 'letter' };
}
