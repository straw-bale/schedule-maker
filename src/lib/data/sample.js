import { generateId, toISO } from '$lib/utils/dates.js';

// Add N weeks to a Date, returning a new Date
function w(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

// First day of month N months after date
function mEnd(date, n = 2) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function createSampleProject() {
  return {
    id: generateId(),
    title: 'PROJECT TIMELINE',
    subtitle: 'Overall Project Schedule',
    meta: {
      date:   'January 1, 2023',
      number: 'Project No. 00001',
      client: 'Sample Client',
      name:   'Sample Project',
    },
    viewStart:  '2022-07-01',
    viewEnd:    '2024-05-01',
    todayMark:  '2022-12-01',
    nextTaskId: 13,
    tasks: [
      { id:1,  name:'Project Kick-Off',              type:'milestone', date:'2022-08-10' },
      { id:2,  name:'50% Design Submission',         type:'bar', color:'#8B9A3A', start:'2022-08-15', end:'2022-10-28' },
      { id:3,  name:'50% Design Submission Review',  type:'bar', color:'#90D5F1', start:'2022-10-28', end:'2022-12-09' },
      { id:4,  name:'95% Design Submission',         type:'bar', color:'#6B7A2A', start:'2022-12-12', end:'2023-02-17' },
      { id:5,  name:'95% Design Submission Review',  type:'bar', color:'#90D5F1', start:'2023-02-17', end:'2023-03-31' },
      { id:6,  name:'100% Design Submission',        type:'bar', color:'#3D5018', start:'2023-04-03', end:'2023-05-12' },
      { id:7,  name:'100% Design Submission Review', type:'bar', color:'#90D5F1', start:'2023-05-12', end:'2023-06-09' },
      { id:8,  name:'Final Construction Documents',  type:'bar', color:'#282829', start:'2023-06-12', end:'2023-08-04' },
      { id:9,  name:'Bidding & Kick-Off',            type:'bar', color:'#282829', start:'2023-08-07', end:'2023-09-01' },
      { id:10, name:'Construction',                  type:'bar', color:'#3B8FA0', start:'2023-09-05', end:'2024-03-05',
        isEstimate:true, label:'Estimated 6 Month Construction Period' },
      { id:11, name:'As-Built / Closeout Documents', type:'bar', color:'#282829', start:'2024-02-01', end:'2024-03-22' },
      { id:12, name:'Project Occupancy',             type:'milestone', date:'2024-03-15', label:'Occupancy | March 2024' },
    ],
    legend: {
      deliverables: [
        { num:1, text:'50% Design Documents',   label:'October 28, 2022',  date:'2022-10-28' },
        { num:2, text:'95% Design Documents',   label:'February 17, 2023', date:'2023-02-17' },
        { num:3, text:'100% Design Documents',  label:'May 12, 2023',      date:'2023-05-12' },
        { num:4, text:'Construction Documents', label:'August 4, 2023',    date:'2023-08-04' },
      ],
      milestones: [
        { color:'#8B9A3A', code:'50',  text:'50% Design Submission',  date:'2022-10-28' },
        { color:'#6B7A2A', code:'95',  text:'95% Design Submission',  date:'2023-02-17' },
        { color:'#3D5018', code:'100', text:'100% Design Submission', date:'2023-05-12' },
        { color:'#282829', code:'CD',  text:'Construction Documents', date:'2023-08-04' },
      ],
      estimates: [
        { color:'#3B8FA0', code:'EST', text:'Estimated Construction Duration' },
      ],
      approvals: [{ text:'Permit Submission – None Needed' }],
    },
  };
}

export function createBlankProject() {
  const base = new Date();
  base.setDate(1);
  const ys = toISO(base);
  const ye = toISO(mEnd(base, 12));
  return {
    id: generateId(),
    title: 'PROJECT TIMELINE',
    subtitle: 'Overall Project Schedule',
    meta: { date: '', number: '', client: '', name: '' },
    viewStart:  ys,
    viewEnd:    ye,
    todayMark:  toISO(new Date()),
    nextTaskId: 2,
    tasks: [
      { id:1, name:'Project Kick-Off', type:'milestone', date: ys },
    ],
    legend: {
      deliverables: [], milestones: [], estimates: [], approvals: [],
    },
  };
}

// ─── Small template ────────────────────────────────────────────────────────────
// Renovation / Tenant Improvement / Small new construction
// ~11 months: SD → DD → DD Review → CDs → CD Review → Bidding → Construction → Closeout
export function createSmallTemplate() {
  const base = new Date(); base.setDate(1);

  const sdS   = base,          sdE   = w(base, 6);
  const ddS   = sdE,           ddE   = w(ddS, 6);
  const ddrS  = ddE,           ddrE  = w(ddrS, 3);  // client review after DD
  const cdS   = ddrE,          cdE   = w(cdS, 6);
  const cdrS  = cdE,           cdrE  = w(cdrS, 3);  // client review after CDs
  const bidS  = cdrE,          bidE  = w(bidS, 4);
  const conS  = bidE,          conE  = w(conS, 12);
  const clS   = conE,          clE   = w(clS, 3);
  const occ   = clE;

  return {
    id: generateId(),
    title: 'PROJECT TIMELINE',
    subtitle: 'Renovation / Tenant Improvement',
    meta: { date: '', number: '', client: '', name: '' },
    viewStart:  toISO(base),
    viewEnd:    toISO(mEnd(occ, 2)),
    todayMark:  toISO(new Date()),
    nextTaskId: 11,
    tasks: [
      { id:1,  name:'Project Kick-Off',         type:'milestone', date: toISO(base) },
      { id:2,  name:'Schematic Design',          type:'bar', color:'#8B9A3A', start: toISO(sdS),  end: toISO(sdE) },
      { id:3,  name:'Design Development',        type:'bar', color:'#6B7A2A', start: toISO(ddS),  end: toISO(ddE) },
      { id:4,  name:'DD Client Review',          type:'bar', color:'#90D5F1', start: toISO(ddrS), end: toISO(ddrE) },
      { id:5,  name:'Construction Documents',    type:'bar', color:'#3D5018', start: toISO(cdS),  end: toISO(cdE) },
      { id:6,  name:'CD Client Review',          type:'bar', color:'#90D5F1', start: toISO(cdrS), end: toISO(cdrE) },
      { id:7,  name:'Bidding & Procurement',     type:'bar', color:'#282829', start: toISO(bidS), end: toISO(bidE) },
      { id:8,  name:'Construction',              type:'bar', color:'#3B8FA0', start: toISO(conS), end: toISO(conE),
        isEstimate: true, label: 'Estimated Construction Period' },
      { id:9,  name:'As-Built / Closeout',       type:'bar', color:'#282829', start: toISO(clS),  end: toISO(clE) },
      { id:10, name:'Project Occupancy',         type:'milestone', date: toISO(occ) },
    ],
    legend: {
      deliverables: [
        { num:1, text:'Construction Documents', label:'', date: toISO(cdE) },
      ],
      milestones: [
        { color:'#3D5018', code:'CD', text:'Construction Documents', date: toISO(cdE)  },
        { color:'#3B8FA0', code:'CS', text:'Construction Start',     date: toISO(conS) },
      ],
      estimates: [
        { color:'#3B8FA0', code:'EST', text:'Estimated Construction Duration' },
      ],
      approvals: [],
    },
  };
}

// ─── Medium template ───────────────────────────────────────────────────────────
// Commercial / Institutional project
// ~22 months: full SD→50%→95%→100%→CD sequence with standard client reviews
export function createMediumTemplate() {
  const base = new Date(); base.setDate(1);

  const sdS   = base,          sdE   = w(base, 8);
  const r1S   = sdE,           r1E   = w(r1S, 4);
  const d50S  = r1E,           d50E  = w(d50S, 10);
  const r2S   = d50E,          r2E   = w(r2S, 4);
  const d95S  = r2E,           d95E  = w(d95S, 8);
  const r3S   = d95E,          r3E   = w(r3S, 4);
  const d100S = r3E,           d100E = w(d100S, 6);
  const fcdS  = d100E,         fcdE  = w(fcdS, 4);
  const bidS  = fcdE,          bidE  = w(bidS, 4);
  const conS  = bidE,          conE  = w(conS, 26);
  const clS   = conE,          clE   = w(clS, 6);
  const occ   = clE;

  return {
    id: generateId(),
    title: 'PROJECT TIMELINE',
    subtitle: 'Commercial / Institutional Project',
    meta: { date: '', number: '', client: '', name: '' },
    viewStart:  toISO(base),
    viewEnd:    toISO(mEnd(occ, 2)),
    todayMark:  toISO(new Date()),
    nextTaskId: 14,
    tasks: [
      { id:1,  name:'Project Kick-Off',              type:'milestone', date: toISO(base) },
      { id:2,  name:'Schematic Design',              type:'bar', color:'#8B9A3A', start: toISO(sdS),   end: toISO(sdE) },
      { id:3,  name:'SD Client Review',              type:'bar', color:'#90D5F1', start: toISO(r1S),   end: toISO(r1E) },
      { id:4,  name:'50% Design Development',        type:'bar', color:'#8B9A3A', start: toISO(d50S),  end: toISO(d50E) },
      { id:5,  name:'50% Design Review',             type:'bar', color:'#90D5F1', start: toISO(r2S),   end: toISO(r2E) },
      { id:6,  name:'95% Construction Documents',    type:'bar', color:'#6B7A2A', start: toISO(d95S),  end: toISO(d95E) },
      { id:7,  name:'95% Design Review',             type:'bar', color:'#90D5F1', start: toISO(r3S),   end: toISO(r3E) },
      { id:8,  name:'100% Construction Documents',   type:'bar', color:'#3D5018', start: toISO(d100S), end: toISO(d100E) },
      { id:9,  name:'Final Construction Documents',  type:'bar', color:'#282829', start: toISO(fcdS),  end: toISO(fcdE) },
      { id:10, name:'Bidding & Procurement',         type:'bar', color:'#282829', start: toISO(bidS),  end: toISO(bidE) },
      { id:11, name:'Construction',                  type:'bar', color:'#3B8FA0', start: toISO(conS),  end: toISO(conE),
        isEstimate: true, label: 'Estimated Construction Period' },
      { id:12, name:'As-Built / Closeout Documents', type:'bar', color:'#282829', start: toISO(clS),   end: toISO(clE) },
      { id:13, name:'Project Occupancy',             type:'milestone', date: toISO(occ) },
    ],
    legend: {
      deliverables: [
        { num:1, text:'50% Design Documents',   label:'', date: toISO(d50E) },
        { num:2, text:'95% Design Documents',   label:'', date: toISO(d95E) },
        { num:3, text:'100% Design Documents',  label:'', date: toISO(d100E) },
        { num:4, text:'Construction Documents', label:'', date: toISO(fcdE) },
      ],
      milestones: [
        { color:'#8B9A3A', code:'50',  text:'50% Design Submission',  date: toISO(d50E) },
        { color:'#6B7A2A', code:'95',  text:'95% Design Submission',  date: toISO(d95E) },
        { color:'#3D5018', code:'100', text:'100% Design Submission', date: toISO(d100E) },
        { color:'#282829', code:'CD',  text:'Construction Documents', date: toISO(fcdE) },
      ],
      estimates: [
        { color:'#3B8FA0', code:'EST', text:'Estimated Construction Duration' },
      ],
      approvals: [],
    },
  };
}

// ─── Large template ────────────────────────────────────────────────────────────
// Government / Complex institutional project
// ~34 months: government review cycles, permitting, major construction phase
export function createLargeTemplate() {
  const base = new Date(); base.setDate(1);

  const sdS    = base,         sdE    = w(base, 10);
  const r1S    = sdE,          r1E    = w(r1S, 6);
  const d50S   = r1E,          d50E   = w(d50S, 12);
  const r2S    = d50E,         r2E    = w(r2S, 6);
  const d95S   = r2E,          d95E   = w(d95S, 10);
  const r3S    = d95E,         r3E    = w(r3S, 6);
  const d100S  = r3E,          d100E  = w(d100S, 8);
  const r4S    = d100E,        r4E    = w(r4S, 6);
  const fcdS   = r4E,          fcdE   = w(fcdS, 6);
  const pmSub  = fcdE;                              // permit submission milestone
  const pmRvS  = pmSub,        pmRvE  = w(pmRvS, 10);
  const bidS   = pmSub,        bidE   = w(bidS, 4); // bidding overlaps permit start
  const pmApp  = pmRvE;                             // permit approval milestone
  const conS   = pmRvE,        conE   = w(conS, 60);
  const clS    = conE,         clE    = w(clS, 8);
  const occ    = clE;

  return {
    id: generateId(),
    title: 'PROJECT TIMELINE',
    subtitle: 'Large / Complex Project',
    meta: { date: '', number: '', client: '', name: '' },
    viewStart:  toISO(base),
    viewEnd:    toISO(mEnd(occ, 2)),
    todayMark:  toISO(new Date()),
    nextTaskId: 18,
    tasks: [
      { id:1,  name:'Project Kick-Off',                type:'milestone', date: toISO(base) },
      { id:2,  name:'Schematic Design',                type:'bar', color:'#8B9A3A', start: toISO(sdS),   end: toISO(sdE) },
      { id:3,  name:'SD Owner Review',            type:'bar', color:'#90D5F1', start: toISO(r1S),   end: toISO(r1E) },
      { id:4,  name:'50% Design Development',          type:'bar', color:'#8B9A3A', start: toISO(d50S),  end: toISO(d50E) },
      { id:5,  name:'50% Owner Review',           type:'bar', color:'#90D5F1', start: toISO(r2S),   end: toISO(r2E) },
      { id:6,  name:'95% Construction Documents',      type:'bar', color:'#6B7A2A', start: toISO(d95S),  end: toISO(d95E) },
      { id:7,  name:'95% Owner Review',           type:'bar', color:'#90D5F1', start: toISO(r3S),   end: toISO(r3E) },
      { id:8,  name:'100% Construction Documents',     type:'bar', color:'#3D5018', start: toISO(d100S), end: toISO(d100E) },
      { id:9,  name:'100% Owner Review',          type:'bar', color:'#90D5F1', start: toISO(r4S),   end: toISO(r4E) },
      { id:10, name:'Final Construction Documents',    type:'bar', color:'#282829', start: toISO(fcdS),  end: toISO(fcdE) },
      { id:11, name:'Permit Submission',               type:'milestone', date: toISO(pmSub) },
      { id:12, name:'Permit Review',                   type:'bar', color:'#A0522D', start: toISO(pmRvS), end: toISO(pmRvE) },
      { id:13, name:'Bidding & Procurement',           type:'bar', color:'#282829', start: toISO(bidS),  end: toISO(bidE) },
      { id:14, name:'Permit Approval',                 type:'milestone', date: toISO(pmApp) },
      { id:15, name:'Construction',                    type:'bar', color:'#3B8FA0', start: toISO(conS),  end: toISO(conE),
        isEstimate: true, label: 'Estimated Construction Period' },
      { id:16, name:'As-Built / Closeout Documents',   type:'bar', color:'#282829', start: toISO(clS),   end: toISO(clE) },
      { id:17, name:'Project Occupancy',               type:'milestone', date: toISO(occ) },
    ],
    legend: {
      deliverables: [
        { num:1, text:'50% Design Documents',   label:'', date: toISO(d50E) },
        { num:2, text:'95% Design Documents',   label:'', date: toISO(d95E) },
        { num:3, text:'100% Design Documents',  label:'', date: toISO(d100E) },
        { num:4, text:'Construction Documents', label:'', date: toISO(fcdE) },
      ],
      milestones: [
        { color:'#8B9A3A', code:'50',  text:'50% Design Submission',  date: toISO(d50E) },
        { color:'#6B7A2A', code:'95',  text:'95% Design Submission',  date: toISO(d95E) },
        { color:'#3D5018', code:'100', text:'100% Design Submission', date: toISO(d100E) },
        { color:'#282829', code:'CD',  text:'Construction Documents', date: toISO(fcdE) },
        { color:'#A0522D', code:'PA',  text:'Permit Approval',        date: toISO(pmApp) },
      ],
      estimates: [
        { color:'#3B8FA0', code:'EST', text:'Estimated Construction Duration' },
      ],
      approvals: [
        { text:'Permit Approval' },
      ],
    },
  };
}
