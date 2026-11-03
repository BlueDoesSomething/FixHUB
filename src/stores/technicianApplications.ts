import { reactive } from 'vue';
import {
  type ApplicationStatus,
  type TechnicianApplication,
  type TechnicianApplicationPayload,
} from '../data/technicianApplication';

const STORAGE_KEY = 'fixhub.technicianApplications.v1';

function storage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    return null;
  }
  return null;
}

function save(list: TechnicianApplication[]) {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    ls.removeItem(STORAGE_KEY);
  }
}

function load(): TechnicianApplication[] {
  const ls = storage();
  if (ls) {
    try {
      const raw = ls.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as TechnicianApplication[];
        return saved.filter(application => !/^app-demo-/.test(application.id));
      }
    } catch {
      ls.removeItem(STORAGE_KEY);
    }
  }
  return [];
}

const state = reactive<{ applications: TechnicianApplication[] }>({
  applications: load(),
});

function persist() {
  save(state.applications);
}

function uid() {
  return `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export type ReviewAction = 'start-review' | 'request-info' | 'approve' | 'reject';

export function useTechnicianApplications() {
  function all() {
    return state.applications;
  }

  function byId(id: string) {
    return state.applications.find((a) => a.id === id) ?? null;
  }

  function mine(userId: string) {
    const key = userId.trim().toLowerCase();
    if (!key) return null;
    return state.applications.find((a) => a.applicant.userId.toLowerCase() === key) ?? null;
  }

  function submit(payload: TechnicianApplicationPayload) {
    const now = new Date().toISOString();
    const app: TechnicianApplication = {
      id: uid(),
      createdAt: now,
      updatedAt: now,
      status: 'Pending',
      ...payload,
      review: {},
      history: [
        { at: now, by: payload.applicant.fullName || 'Applicant', status: 'Pending', note: 'Application submitted' },
      ],
    };
    state.applications.unshift(app);
    persist();
    return app;
  }

  function resubmit(id: string, payload: TechnicianApplicationPayload) {
    const app = byId(id);
    if (!app) return null;
    const now = new Date().toISOString();
    app.applicant = payload.applicant;
    app.professional = payload.professional;
    app.service = payload.service;
    app.documents = payload.documents;
    app.status = 'Pending';
    app.review = {};
    app.updatedAt = now;
    app.history.push({
      at: now,
      by: payload.applicant.fullName || 'Applicant',
      status: 'Pending',
      note: 'Application updated and resubmitted',
    });
    persist();
    return app;
  }

  function review(id: string, action: ReviewAction, note = '', reviewer = 'Admin User') {
    const app = byId(id);
    if (!app) return null;
    const now = new Date().toISOString();
    const statusMap: Record<ReviewAction, ApplicationStatus> = {
      'start-review': 'Under Review',
      'request-info': 'Needs Information',
      approve: 'Approved',
      reject: 'Rejected',
    };
    const status = statusMap[action];
    app.status = status;
    app.updatedAt = now;
    app.review = {
      reviewer,
      reviewedAt: now,
      feedback: note || undefined,
      allowReapply: status === 'Rejected' ? true : undefined,
    };
    if (status === 'Approved') {
      app.technicianProfileId = app.technicianProfileId ?? `tech-${app.id}`;
    }
    app.history.push({ at: now, by: reviewer, status, note: note || undefined });
    persist();
    return app;
  }

  function counts() {
    const base: Record<ApplicationStatus, number> = {
      Pending: 0,
      'Under Review': 0,
      'Needs Information': 0,
      Approved: 0,
      Rejected: 0,
    };
    for (const app of state.applications) base[app.status] += 1;
    return base;
  }

  return { state, all, byId, mine, submit, resubmit, review, counts };
}
