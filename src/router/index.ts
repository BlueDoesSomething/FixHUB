import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import ClientTabs from '../views/client/ClientTabs.vue';
import TechnicianTabs from '../views/technician/TechnicianTabs.vue';
import AdminTabs from '../views/admin/AdminTabs.vue';

import SplashPage from '../views/auth/SplashPage.vue';
import ProfilePage from '../views/shared/ProfilePage.vue';

import LandingPage from '../views/landing/LandingClean.vue';

import HomePage from '../views/client/HomePage.vue';
import HistoryPage from '../views/client/HistoryPage.vue';
import RequestRepairPage from '../views/client/RequestRepairPage.vue';
import LocationPage from '../views/client/LocationPage.vue';
import MatchingPage from '../views/client/MatchingPage.vue';
import TechnicianProfilePage from '../views/client/TechnicianProfilePage.vue';
import TrackingPage from '../views/client/TrackingPage.vue';
import RepairStatusPage from '../views/client/RepairStatusPage.vue';
import MessagesPage from '../views/client/MessagesPage.vue';
import ChatPage from '../views/client/ChatPage.vue';
import MorePage from '../views/client/MorePage.vue';
import CarePage from '../views/client/CarePage.vue';
import CareGuidePage from '../views/client/CareGuidePage.vue';

import TechDashboardPage from '../views/technician/TechDashboardPage.vue';
import TechRequestsPage from '../views/technician/TechRequestsPage.vue';
import TechActivePage from '../views/technician/TechActivePage.vue';
import BecomeTechnicianPage from '../views/technician/BecomeTechnicianPage.vue';

import AdminDashboardPage from '../views/admin/AdminDashboardPage.vue';
import AdminUsersPage from '../views/admin/AdminUsersPage.vue';
import AdminTechniciansPage from '../views/admin/AdminTechniciansPage.vue';
import AdminApplicationsPage from '../views/admin/AdminApplicationsPage.vue';
import AdminReportsPage from '../views/admin/AdminReportsPage.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'landing', component: LandingPage },
  { path: '/app', redirect: '/splash' },
  { path: '/splash', name: 'splash', component: SplashPage },
  { path: '/become-a-technician', name: 'become-technician', component: BecomeTechnicianPage },

  {
    path: '/client',
    component: ClientTabs,
    children: [
      { path: '', redirect: '/client/home' },
      { path: 'home', name: 'client-home', component: HomePage, meta: { title: 'Home' } },
      { path: 'history', name: 'client-history', component: HistoryPage, meta: { title: 'Repair History' } },
      { path: 'request', name: 'client-request', component: RequestRepairPage, meta: { title: 'Request a Repair' } },
      { path: 'request/location', name: 'client-location', component: LocationPage, meta: { title: 'Service Location' } },
      { path: 'request/matching', name: 'client-matching', component: MatchingPage, meta: { title: 'Matching Technicians' } },
      { path: 'request/technician', name: 'client-technician', component: TechnicianProfilePage, meta: { title: 'Technician Profile' } },
      { path: 'home/tracking', name: 'client-tracking', component: TrackingPage, meta: { title: 'Live Tracking' } },
      { path: 'home/status', name: 'client-status', component: RepairStatusPage, meta: { title: 'Repair Status' } },
      { path: 'messages', name: 'client-messages', component: MessagesPage, meta: { title: 'Messages' } },
      { path: 'messages/chat', name: 'client-chat', component: ChatPage, meta: { title: 'Chat' } },
      { path: 'more', name: 'client-more', component: MorePage, meta: { title: 'More' } },
      { path: 'care', name: 'client-care', component: CarePage, meta: { title: 'FIXHUB Care' } },
      { path: 'care/:issueId', name: 'client-care-guide', component: CareGuidePage, meta: { title: 'Guided Troubleshooting' } },
      { path: 'profile', name: 'client-profile', component: ProfilePage, meta: { title: 'Profile' } },
    ],
  },

  {
    path: '/technician',
    component: TechnicianTabs,
    children: [
      { path: '', redirect: '/technician/dashboard' },
      { path: 'dashboard', name: 'technician-dashboard', component: TechDashboardPage, meta: { title: 'Dashboard' } },
      { path: 'requests', name: 'technician-requests', component: TechRequestsPage, meta: { title: 'New Requests' } },
      { path: 'active', name: 'technician-active', component: TechActivePage, meta: { title: 'Active Repairs' } },
      { path: 'messages', name: 'technician-messages', component: MessagesPage, meta: { title: 'Messages' } },
      { path: 'messages/chat', name: 'technician-chat', component: ChatPage, meta: { title: 'Chat' } },
      { path: 'profile', name: 'technician-profile', component: ProfilePage, meta: { title: 'Profile' } },
    ],
  },

  {
    path: '/admin',
    component: AdminTabs,
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'admin-dashboard', component: AdminDashboardPage, meta: { title: 'Dashboard' } },
      { path: 'users', name: 'admin-users', component: AdminUsersPage, meta: { title: 'Users' } },
      { path: 'technicians', name: 'admin-technicians', component: AdminTechniciansPage, meta: { title: 'Verify Technicians' } },
      { path: 'applications', name: 'admin-applications', component: AdminApplicationsPage, meta: { title: 'Technician Applications' } },
      { path: 'reports', name: 'admin-reports', component: AdminReportsPage, meta: { title: 'Reports' } },
      { path: 'profile', name: 'admin-profile', component: ProfilePage, meta: { title: 'Profile' } },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/splash' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
