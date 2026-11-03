import type { Role } from '../stores/auth';

export interface NavItem {
  id: string;
  label: string;
  tab: string;
  route: string;
  icon: string;
  fab?: boolean;
  section?: string;
  desktopOnly?: boolean;
  mobileOnly?: boolean;
  mobileLabel?: string;
  matchRoutes?: string[];
}

const icon = (paths: string, width = 18) =>
  `<svg width="${width}" height="${width}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const navConfig: Record<Role, NavItem[]> = {
  client: [
    { id: 'home', label: 'Home', tab: 'client-home', route: '/client/home', section: 'Menu', icon: icon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>') },
    { id: 'history', label: 'Repairs', tab: 'client-history', route: '/client/history', matchRoutes: ['/client/requests'], section: 'Menu', icon: icon('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>') },
    { id: 'reviews', label: 'My Reviews', tab: 'client-reviews', route: '/client/reviews', section: 'Menu', desktopOnly: true, icon: icon('<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.6 5.8 21 7 14 2 9.3 9 8.5 12 2"/>') },
    { id: 'care', label: 'FIXHUB Care', tab: 'client-care', route: '/client/care', section: 'Menu', desktopOnly: true, icon: icon('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>') },
    { id: 'request', label: 'Request', tab: 'client-request', route: '/client/request', section: 'Menu', fab: true, icon: icon('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', 22) },
    { id: 'messages', label: 'Messages', tab: 'client-messages', route: '/client/messages', section: 'Menu', icon: icon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') },
    { id: 'status', label: 'Repair Status', tab: 'client-status', route: '/client/home/status', section: 'Account', desktopOnly: true, icon: icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>') },
    { id: 'tracking', label: 'Live Tracking', tab: 'client-tracking', route: '/client/home/tracking', section: 'Account', desktopOnly: true, icon: icon('<polygon points="3 11 22 2 13 21 11 13 3 11"/>') },
    { id: 'location', label: 'Location', tab: 'client-location', route: '/client/request/location', section: 'Account', desktopOnly: true, icon: icon('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>') },
    { id: 'become-tech', label: 'Become a Technician', tab: 'become-technician', route: '/become-a-technician', section: 'Account', desktopOnly: true, icon: icon('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>') },
    { id: 'profile', label: 'Profile', tab: 'client-profile', route: '/client/profile', section: 'Account', desktopOnly: true, icon: icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
    { id: 'more', label: 'More', tab: 'client-more', route: '/client/more', mobileOnly: true, icon: icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>') },
  ],
  technician: [
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Home', tab: 'technician-dashboard', route: '/technician/dashboard', icon: icon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>') },
    { id: 'requests', label: 'Requests', tab: 'technician-requests', route: '/technician/requests', icon: icon('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>') },
    { id: 'active', label: 'Active', tab: 'technician-active', route: '/technician/active', fab: true, icon: icon('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', 22) },
    { id: 'messages', label: 'Messages', tab: 'technician-messages', route: '/technician/messages', icon: icon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') },
    { id: 'reviews', label: 'Reviews', tab: 'technician-reviews', route: '/technician/reviews', desktopOnly: true, icon: icon('<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.6 5.8 21 7 14 2 9.3 9 8.5 12 2"/>') },
    { id: 'profile', label: 'Profile', tab: 'technician-profile', route: '/technician/profile', desktopOnly: true, icon: icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
    { id: 'more', label: 'More', tab: 'technician-more', route: '/technician/more', mobileOnly: true, icon: icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>') },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Overview', tab: 'admin-dashboard', route: '/admin/dashboard', icon: icon('<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>') },
    { id: 'users', label: 'Users', tab: 'admin-users', route: '/admin/users', icon: icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>') },
    { id: 'technicians', label: 'Verify', tab: 'admin-technicians', route: '/admin/technicians', fab: true, icon: icon('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', 22) },
    { id: 'applications', label: 'Applications', tab: 'admin-applications', route: '/admin/applications', desktopOnly: true, icon: icon('<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>') },
    { id: 'reports', label: 'Reports', tab: 'admin-reports', route: '/admin/reports', icon: icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>') },
    { id: 'profile', label: 'Profile', tab: 'admin-profile', route: '/admin/profile', desktopOnly: true, icon: icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
    { id: 'more', label: 'More', tab: 'admin-more', route: '/admin/more', mobileOnly: true, icon: icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>') },
  ],
};

export function mobileNavItems(items: readonly NavItem[]) {
  return items.filter(item => !item.desktopOnly);
}

export function moreNavItems(items: readonly NavItem[]) {
  return items.filter(item => item.desktopOnly);
}

export function activeMobileNavItem(items: readonly NavItem[], path: string): NavItem | undefined {
  const matches = (item: NavItem) => [item.route, ...(item.matchRoutes ?? [])]
    .some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  // Repair steps and nested chats remain in their primary tab, even when linked from More.
  const primary = mobileNavItems(items).filter(matches).sort((a, b) => b.route.length - a.route.length)[0];
  return primary ?? (moreNavItems(items).some(matches) ? items.find(item => item.id === 'more') : undefined);
}
