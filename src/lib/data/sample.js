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
    viewStart:  '2022-08-01',
    viewEnd:    '2023-11-30',
    todayMark:  '2022-12-20',
    nextTaskId: 15,
    tasks: [
      { id:1,  name:'Project Kick-Off',              type:'milestone', date:'2022-08-10' },
      { id:2,  name:'Field Verification',            type:'milestone', date:'2022-09-08' },
      { id:3,  name:'Hazardous Material Survey',     type:'milestone', date:'2022-12-15', label:'Scheduling' },
      { id:4,  name:'50% Design Submission',         type:'bar', color:'#8B9A3A', start:'2022-08-15', end:'2022-10-28',
        delRef:1, msRef:{ color:'#8B9A3A', code:'50' } },
      { id:5,  name:'50% Design Submission Review',  type:'bar', color:'#90D5F1', start:'2022-09-25', end:'2022-11-28',
        hold:true, msRef:{ color:'#90D5F1', code:'50' }, label:'Hold' },
      { id:6,  name:'95% Design Submission',         type:'bar', color:'#6B7A2A', start:'2022-11-10', end:'2023-01-22',
        delRef:2, msRef:{ color:'#6B7A2A', code:'95' } },
      { id:7,  name:'95% Design Submission Review',  type:'bar', color:'#90D5F1', start:'2023-01-08', end:'2023-03-05' },
      { id:8,  name:'100% Design Submission',        type:'bar', color:'#3D5018', start:'2023-02-01', end:'2023-03-12',
        delRef:3, msRef:{ color:'#3D5018', code:'100' } },
      { id:9,  name:'100% Design Submission Review', type:'bar', color:'#90D5F1', start:'2023-03-05', end:'2023-03-30' },
      { id:10, name:'Final Construction Documents',  type:'bar', color:'#282829', start:'2023-03-15', end:'2023-06-07',
        delRef:4, msRef:{ color:'#282829', code:'CD' } },
      { id:11, name:'Bidding & Kick-Off',            type:'bar', color:'#282829', start:'2023-04-01', end:'2023-04-28' },
      { id:12, name:'Construction Stage',            type:'bar', color:'#3B8FA0', start:'2023-04-20', end:'2023-09-20',
        isEstimate:true, label:'Estimated 5 Month Construction Period' },
      { id:13, name:'As-Built / Closeout Documents', type:'bar', color:'#282829', start:'2023-09-01', end:'2023-10-20' },
      { id:14, name:'Project Occupancy',             type:'milestone', date:'2023-10-01', label:'Occupancy | October 2023' },
    ],
    legend: {
      deliverables: [
        { num:1, text:'50% Design Documents',   label:'September 30, 2022', date:'2022-09-30' },
        { num:2, text:'95% Design Documents',   label:'February 8th, 2023', date:'2023-02-08' },
        { num:3, text:'100% Design Documents',  label:'March 30th, 2023',   date:'2023-03-30' },
        { num:4, text:'Construction Documents', label:'June 7th, 2023',     date:'2023-06-07' },
      ],
      milestones: [
        { color:'#8B9A3A', code:'50',  text:'50% Design Submission',   date:'2022-10-28' },
        { color:'#6B7A2A', code:'95',  text:'95% Design Submission',   date:'2023-01-22' },
        { color:'#3D5018', code:'100', text:'100% Design Submission',  date:'2023-03-12' },
        { color:'#282829', code:'CD',  text:'Construction Documents',  date:'2023-06-07' },
      ],
      estimates: [
        { color:'#8B9A3A', code:'50', text:'50% Design Submission Estimate' },
        { color:'#6B7A2A', code:'95', text:'95% Design Submission Estimates' },
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
