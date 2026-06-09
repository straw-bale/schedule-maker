export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Parse an ISO string (YYYY-MM-DD) or Date into a local-time Date */
export function parseDate(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date as YYYY-MM-DD */
export function toISO(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : parseDate(d);
  const y  = dt.getFullYear();
  const m  = String(dt.getMonth() + 1).padStart(2, '0');
  const dy = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
}

/** Array of the first day of each month between viewStart and viewEnd */
export function monthList(viewStart, viewEnd) {
  const list = [];
  let d = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1);
  const end = new Date(viewEnd.getFullYear(), viewEnd.getMonth(), 1);
  while (d <= end) {
    list.push(new Date(d));
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return list;
}

/** Total calendar days between two dates */
export function totalDays(viewStart, viewEnd) {
  return (viewEnd - viewStart) / 864e5;
}

/** Convert a date string to a pixel offset within the Gantt */
export function dateToPx(dateStr, viewStart, viewEnd, ganttWidth) {
  const d = parseDate(dateStr);
  if (!d) return 0;
  return ((d - viewStart) / (totalDays(viewStart, viewEnd) * 864e5)) * ganttWidth;
}

/** True if hex colour is light enough to need dark text */
export function isLightColor(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

/** Compact random ID for project records */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Column width (px) for each zoom level */
export const ZOOM_COL_W = { month: 72, biweek: 54, week: 40 };

/** Array of column start Dates for the given zoom level */
export function timeColumns(viewStart, viewEnd, zoom) {
  const cols = [];
  const d = new Date(viewStart.getFullYear(), viewStart.getMonth(), viewStart.getDate());
  if (zoom === 'biweek') {
    while (d < viewEnd) { cols.push(new Date(d)); d.setDate(d.getDate() + 14); }
  } else if (zoom === 'week') {
    while (d < viewEnd) { cols.push(new Date(d)); d.setDate(d.getDate() + 7); }
  } else {
    const end = new Date(viewEnd.getFullYear(), viewEnd.getMonth(), 1);
    const cur = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1);
    while (cur <= end) { cols.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }
  }
  return cols;
}
