import { generateId } from '$lib/utils/dates.js';

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
  const start = new Date(2026, 5, 1);  // June 2026
  const end   = new Date(2027, 5, 1);  // June 2027
  const ys = '2026-06-01';
  const ye = '2027-06-01';
  return {
    id: generateId(),
    title: 'PROJECT TIMELINE',
    subtitle: 'Overall Project Schedule',
    meta: { date: '', number: '', client: '', name: '' },
    viewStart:  ys,
    viewEnd:    ye,
    todayMark:  ys,
    nextTaskId: 2,
    tasks: [
      { id:1, name:'Project Kick-Off', type:'milestone', date: ys },
    ],
    legend: {
      deliverables: [], milestones: [], estimates: [], approvals: [],
    },
  };
}
