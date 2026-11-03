import type { Technician } from '@/data/catalog';
import type { RepairReview, ReviewRepair } from '@/data/reviews';

export const technicians: Technician[] = [
  { id: 1, name: 'Juan Dela Cruz', initials: 'JD', color: '#146344', specialty: 'Apple Specialist', rating: 4.9, reviews: 247, distance: '1.2 km', response: '~15 min', repairs: 382, verified: true, coordinates: { lat: 14.5622, lng: 121.0276 } },
  { id: 2, name: 'Mark Santos', initials: 'MS', color: '#146344', specialty: 'Laptop Specialist', rating: 4.7, reviews: 132, distance: '2.4 km', response: '~22 min', repairs: 210, verified: true, coordinates: { lat: 14.5583, lng: 121.0144 } },
  { id: 3, name: 'Rico Castillo', initials: 'RC', color: '#146344', specialty: 'Android Specialist', rating: 4.8, reviews: 189, distance: '3.1 km', response: '~28 min', repairs: 265, verified: true, coordinates: { lat: 14.5502, lng: 121.0331 } },
];

export const completedReviewRepairs: ReviewRepair[] = [1, 2, 3, 4, 5].map(id => ({
  id: `repair-${id}`, customerId: 'alex.rivera@email.com', customerName: 'Alex Rivera',
  technicianId: id === 2 || id === 5 ? 2 : id === 3 ? 3 : 1,
  technicianName: id === 2 || id === 5 ? 'Mark Santos' : id === 3 ? 'Rico Castillo' : 'Juan Dela Cruz',
  device: 'Test device', problem: 'Test repair issue', date: '2026-10-01', completed: id !== 1,
}));

export function seedReviews(): RepairReview[] {
  return [
    { id: 'test-review-1', repairId: 'test-maria-phone', customerId: 'maria@example.com', customerName: 'Maria Santos', technicianId: 1, device: 'iPhone 12', rating: 5, comment: 'Helpful service.', createdAt: '2026-10-28T09:00:00.000Z' },
    { id: 'test-review-2', repairId: 'test-daniel-tablet', customerId: 'daniel@example.com', customerName: 'Daniel Cruz', technicianId: 1, device: 'iPad Air', rating: 4, comment: 'Battery repaired.', createdAt: '2026-10-24T14:30:00.000Z', reply: { comment: 'Thank you!', createdAt: '2026-10-25T08:00:00.000Z' } },
    { id: 'test-review-3', repairId: 'test-sofia-phone', customerId: 'sofia@example.com', customerName: 'Sofia Lim', technicianId: 1, device: 'iPhone 14', rating: 5, comment: 'Screen repaired.', createdAt: '2026-10-20T10:00:00.000Z' },
    { id: 'test-review-4', repairId: 'test-james-laptop', customerId: 'james@example.com', customerName: 'James Tan', technicianId: 2, device: 'MacBook Pro', rating: 5, comment: 'Keyboard repaired.', createdAt: '2026-10-22T11:00:00.000Z' },
    { id: 'test-review-5', repairId: 'test-bea-phone', customerId: 'bea@example.com', customerName: 'Bea Ramos', technicianId: 3, device: 'Samsung S23', rating: 4, comment: 'Screen repaired.', createdAt: '2026-10-21T13:00:00.000Z' },
  ];
}
