export function load({ url }) {
  return {
    paper:      url.searchParams.get('paper')     ?? 'letter',
    autoprint:  url.searchParams.get('autoprint') === '1',
    showToday:  url.searchParams.get('today')     !== '0',
    showLegend: url.searchParams.get('legend')    !== '0',
    title:      url.searchParams.get('title')     ?? '',
  };
}
