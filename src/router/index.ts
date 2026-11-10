import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import ClientTabs from '../views/client/ClientTabs.vue';
import TechnicianTabs from '../views/technician/TechnicianTabs.vue';
import AdminTabs from '../views/admin/AdminTabs.vue';

import SplashPage from '../views/auth/SplashPage.vue';
import AuthCallbackPage from '../views/auth/AuthCallbackPage.vue';
import ResetPasswordPage from '../views/auth/ResetPasswordPage.vue';
import ProfilePage from '../views/shared/ProfilePage.vue';
import { initializeAuth, useAuth } from '../stores/auth';

import LandingPage from '../views/landing/LandingClean.vue';

import HomePage from '../views/client/HomePage.vue';
import HistoryPage from '../views/client/HistoryPage.vue';
import ReviewsPage from '../views/client/ReviewsPage.vue';
import RequestRepairPage from '../views/client/RequestRepairPage.vue';
import RepairReviewPage from '../views/client/RepairReviewPage.vue';
import RepairRequestDetailsPage from '../views/client/RepairRequestDetailsPage.vue';
import LocationPage from '../views/client/LocationPage.vue';
import MatchingPage from '../views/client/MatchingPage.vue';
import TechnicianProfilePage from '../views/client/TechnicianProfilePage.vue';
import TrackingPage from '../views/client/TrackingPage.vue';
import RepairStatusPage from '../views/client/RepairStatusPage.vue';
import MessagesPage from '../views/client/MessagesPage.vue';
import ChatPage from '../views/client/ChatPage.vue';
import MorePage from '../views/shared/MorePage.vue';
import CarePage from '../views/client/CarePage.vue';
import CareGuidePage from '../views/client/CareGuidePage.vue';

import TechDashboardPage from '../views/technician/TechDashboardPage.vue';
import TechRequestsPage from '../views/technician/TechRequestsPage.vue';
import TechSubscriptionPage from '../views/technician/TechSubscriptionPage.vue';
import TechActivePage from '../views/technician/TechActivePage.vue';
import TechReviewsPage from '../views/technician/TechReviewsPage.vue';
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
  { path: '/auth/callback', name: 'auth-callback', component: AuthCallbackPage },
  { path: '/auth/reset-password', name: 'reset-password', component: ResetPasswordPage },
  { path: '/become-a-technician', name: 'become-technician', component: BecomeTechnicianPage },

  {
    path: '/client',
    component: ClientTabs,
    children: [
      { path: '', redirect: '/client/home' },
      { path: 'home', name: 'client-home', component: HomePage, meta: { title: 'Home' } },
      { path: 'history', name: 'client-history', component: HistoryPage, meta: { title: 'Repair History' } },
      { path: 'reviews', name: 'client-reviews', component: ReviewsPage, meta: { title: 'My Reviews' } },
      { path: 'request', name: 'client-request', component: RequestRepairPage, meta: { title: 'Request a Repair' } },
      { path: 'request/location', name: 'client-location', component: LocationPage, meta: { title: 'Service Location' } },
      { path: 'request/review', name: 'client-request-review', component: RepairReviewPage, meta: { title: 'Review Repair Request' } },
      { path: 'requests/:requestId', name: 'client-request-details', component: RepairRequestDetailsPage, meta: { title: 'Repair Request' } },
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
      { path: 'subscription', name: 'technician-subscription', component: TechSubscriptionPage, meta: { title: 'Subscription' } },
      { path: 'active', name: 'technician-active', component: TechActivePage, meta: { title: 'Active Repairs' } },
      { path: 'reviews', name: 'technician-reviews', component: TechReviewsPage, meta: { title: 'Customer Reviews' } },
      { path: 'messages', name: 'technician-messages', component: MessagesPage, meta: { title: 'Messages' } },
      { path: 'messages/chat', name: 'technician-chat', component: ChatPage, meta: { title: 'Chat' } },
      { path: 'profile', name: 'technician-profile', component: ProfilePage, meta: { title: 'Profile' } },
      { path: 'more', name: 'technician-more', component: MorePage, props: { role: 'technician' }, meta: { title: 'More' } },
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
      { path: 'more', name: 'admin-more', component: MorePage, props: { role: 'admin' }, meta: { title: 'More' } },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/splash' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Route guard: redirect to landing if not authenticated for protected routes.
router.beforeEach(async (to) => {
  await initializeAuth();
  const { state } = useAuth();

  const protectedPrefixes = ['/client', '/technician', '/admin'];
  const isProtected = protectedPrefixes.some(prefix => to.path.startsWith(prefix));

  if (isProtected && !state.isAuthenticated) {
    return { name: 'landing' };
  }

  // Role-based route protection.
  if (to.path.startsWith('/technician') && state.role !== 'technician' && state.role !== 'admin') {
    return { name: 'landing' };
  }
  if (to.path.startsWith('/admin') && state.role !== 'admin') {
    return { name: 'landing' };
  }
});

export default router;
