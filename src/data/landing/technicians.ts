export interface LandingTechnician {
  id: number;
  name: string;
  initials: string;
  specialization: string;
  rating: number;
  reviews: number;
  distance: string;
  completed: number;
  available: boolean;
  avatarBg: string;
  location: string;
  mapX: number;
  mapY: number;
  markerColor: string;
}

export const technicians: LandingTechnician[] = [
  { id: 1, name: 'Juan Dela Cruz', initials: 'JD', specialization: 'Apple Specialist', rating: 4.9, reviews: 247, distance: '1.2 km', completed: 382, available: true, avatarBg: 'bg-gradient-to-br from-brand-primary to-green-700', location: '123 Rizal St., Brgy. Poblacion, Quezon City', mapX: 120, mapY: 90, markerColor: '#146344' },
  { id: 2, name: 'Mark Santos', initials: 'MS', specialization: 'Laptop Expert', rating: 4.8, reviews: 189, distance: '2.5 km', completed: 256, available: true, avatarBg: 'bg-gradient-to-br from-brand-accent to-amber-600', location: '88 Katipunan Ave., Brgy. Loyola Heights, Quezon City', mapX: 300, mapY: 120, markerColor: '#146344' },
  { id: 3, name: 'Maria Reyes', initials: 'MR', specialization: 'Android & Tablet', rating: 4.9, reviews: 312, distance: '0.8 km', completed: 410, available: false, avatarBg: 'bg-gradient-to-br from-slate-600 to-slate-800', location: '45 Aurora Blvd., Brgy. Cubao, Quezon City', mapX: 90, mapY: 210, markerColor: '#146344' },
  { id: 4, name: 'Rico Castillo', initials: 'RC', specialization: 'Gaming Consoles', rating: 4.7, reviews: 156, distance: '3.1 km', completed: 198, available: true, avatarBg: 'bg-gradient-to-br from-brand-primary to-teal-700', location: '210 Timog Ave., Brgy. Laging Handa, Quezon City', mapX: 320, mapY: 210, markerColor: '#146344' },
  { id: 5, name: 'Sofia Lim', initials: 'SL', specialization: 'Smart Devices & IoT', rating: 4.8, reviews: 98, distance: '1.5 km', completed: 145, available: true, avatarBg: 'bg-gradient-to-br from-brand-accent to-orange-600', location: '77 Tomas Morato Ave., Brgy. Kamuning, Quezon City', mapX: 200, mapY: 70, markerColor: '#146344' },
  { id: 6, name: 'David Tan', initials: 'DT', specialization: 'Desktop & PC', rating: 4.6, reviews: 204, distance: '4.0 km', completed: 276, available: false, avatarBg: 'bg-gradient-to-br from-slate-500 to-slate-700', location: '315 E. Rodriguez Ave., Brgy. Kalusugan, Quezon City', mapX: 260, mapY: 240, markerColor: '#146344' },
];
