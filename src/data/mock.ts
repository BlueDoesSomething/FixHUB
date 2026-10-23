export interface Category {
  name: string;
  icon: string;
}

export interface Device {
  name: string;
  icon: string;
}

export interface HistoryItem {
  id: number;
  device: string;
  problem: string;
  tech: string;
  date: string;
  type: 'Home' | 'Drop-off';
  status: string;
  statusClass: 'progress' | 'completed' | 'pending';
  rating: string;
}

export interface Technician {
  id: number;
  name: string;
  initials: string;
  color: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: string;
  response: string;
  repairs: number;
  verified: boolean;
  best?: boolean;
}

export interface ServiceRequest {
  id: number;
  customer: string;
  initials: string;
  color: string;
  device: string;
  problem: string;
  type: 'Home' | 'Drop-off';
  time: string;
  distance: string;
}

export const categories: Category[] = [
  {
    name: 'Smartphone',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  },
  {
    name: 'Laptop',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="12" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
  },
  {
    name: 'Desktop',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  },
  {
    name: 'Tablet',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  },
  {
    name: 'Console',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/></svg>',
  },
  {
    name: 'Other',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  },
];

export const devices: Device[] = [
  { name: 'Smartphone', icon: '📱' },
  { name: 'Laptop', icon: '💻' },
  { name: 'Desktop', icon: '🖥️' },
  { name: 'Tablet', icon: '📲' },
  { name: 'Console', icon: '🎮' },
  { name: 'Other', icon: '🔧' },
];

export const history: HistoryItem[] = [
  { id: 1, device: 'iPhone 13', problem: 'Not charging', tech: 'Juan Dela Cruz', date: 'Oct 9', type: 'Home', status: 'In Progress', statusClass: 'progress', rating: '' },
  { id: 2, device: 'MacBook Air', problem: 'Keyboard replacement', tech: 'Mark Santos', date: 'Sep 28', type: 'Drop-off', status: 'Completed', statusClass: 'completed', rating: '★★★★★' },
  { id: 3, device: 'Samsung S22', problem: 'Screen replacement', tech: 'Rico Castillo', date: 'Sep 15', type: 'Home', status: 'Completed', statusClass: 'completed', rating: '★★★★★' },
  { id: 4, device: 'iPad Pro', problem: 'Battery replacement', tech: 'Juan Dela Cruz', date: 'Aug 22', type: 'Drop-off', status: 'Completed', statusClass: 'completed', rating: '★★★★☆' },
  { id: 5, device: 'PS5 Controller', problem: 'Stick drift', tech: 'Mark Santos', date: 'Aug 10', type: 'Home', status: 'Completed', statusClass: 'completed', rating: '★★★★★' },
];

export const technicians: Technician[] = [
  { id: 1, name: 'Juan Dela Cruz', initials: 'JD', color: 'linear-gradient(135deg, #146344, #1b7a54)', specialty: 'Apple Specialist', rating: 4.9, reviews: 247, distance: '1.2 km', response: '~15 min', repairs: 382, verified: true, best: true },
  { id: 2, name: 'Mark Santos', initials: 'MS', color: 'linear-gradient(135deg, #A8E6CF, #56C596)', specialty: 'Laptop Specialist', rating: 4.7, reviews: 132, distance: '2.4 km', response: '~22 min', repairs: 210, verified: true },
  { id: 3, name: 'Rico Castillo', initials: 'RC', color: 'linear-gradient(135deg, #C9B6E4, #8B6FC0)', specialty: 'Android Specialist', rating: 4.8, reviews: 189, distance: '3.1 km', response: '~28 min', repairs: 265, verified: true },
];

export const newRequests: ServiceRequest[] = [
  { id: 1, customer: 'Alex Rivera', initials: 'AR', color: 'linear-gradient(135deg, #146344, #1b7a54)', device: 'iPhone 13', problem: 'Not charging', type: 'Home', time: '2 min ago', distance: '1.2 km' },
  { id: 2, customer: 'Maria Santos', initials: 'MS', color: 'linear-gradient(135deg, #A8E6CF, #56C596)', device: 'MacBook Air M1', problem: 'Keyboard issue', type: 'Drop-off', time: '8 min ago', distance: '3.5 km' },
];

export const repairTimeline: { title: string; time: string; state: 'done' | 'active' | 'pending' }[] = [
  { title: 'Request Submitted', time: '9:30 AM', state: 'done' },
  { title: 'Technician Assigned', time: '9:32 AM', state: 'done' },
  { title: 'On the Way', time: '9:41 AM', state: 'active' },
  { title: 'Arrived', time: 'Pending', state: 'pending' },
  { title: 'Repair in Progress', time: 'Pending', state: 'pending' },
  { title: 'Completed', time: 'Pending', state: 'pending' },
];

export const weeklyRepairs = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({
  label,
  height: [40, 65, 50, 80, 70, 95, 60][i],
}));
