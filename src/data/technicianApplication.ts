export type ApplicationStatus =
  | 'Pending'
  | 'Under Review'
  | 'Needs Information'
  | 'Approved'
  | 'Rejected';

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface ReviewEvent {
  at: string;
  by: string;
  status: ApplicationStatus;
  note?: string;
}

export interface ApplicantInfo {
  userId: string;
  fullName: string;
  email: string;
  contactNumber: string;
  city: string;
}

export interface ProfessionalInfo {
  yearsExperience: string;
  brands: string[];
  brandsOther?: string;
  specializations: string[];
  specializationsOther?: string;
  experienceDescription: string;
}

export interface ServiceInfo {
  serviceType: string;
  coverageArea: string;
  workingDays: string[];
  workingHours: string;
}

export interface ApplicationDocuments {
  certificates: UploadedFile[];
  workPhotos: UploadedFile[];
}

export interface ApplicationReview {
  reviewer?: string;
  reviewedAt?: string;
  feedback?: string;
  allowReapply?: boolean;
}

export interface TechnicianApplication {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  applicant: ApplicantInfo;
  professional: ProfessionalInfo;
  service: ServiceInfo;
  documents: ApplicationDocuments;
  review: ApplicationReview;
  history: ReviewEvent[];
  technicianProfileId?: string;
}

export type TechnicianApplicationPayload = Pick<
  TechnicianApplication,
  'applicant' | 'professional' | 'service' | 'documents'
>;

export interface ApplicationFormState {
  fullName: string;
  email: string;
  contactNumber: string;
  city: string;
  yearsExperience: string;
  brands: string[];
  brandsOther: string;
  specializations: string[];
  specializationsOther: string;
  experienceDescription: string;
  serviceType: string;
  coverageArea: string;
  workingDays: string[];
  workingHours: string;
  certificates: UploadedFile[];
  workPhotos: UploadedFile[];
  agreed: boolean;
}

export const BRANDS = [
  'Samsung',
  'Apple / iPhone',
  'Xiaomi',
  'OPPO',
  'Vivo',
  'Realme',
  'Huawei',
  'Others',
];

export const SPECIALIZATIONS = [
  'Screen Replacement',
  'Battery Replacement',
  'Charging Port Repair',
  'Camera & Audio',
  'Software & Flashing',
  'Water Damage Assessment',
  'Back Glass Replacement',
  'Data Recovery',
  'Other Repairs',
];

export const SERVICE_TYPES = ['Home Service', 'Drop-off', 'Both'];

export const WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const ACCEPTED_FILE_EXT = '.pdf, .jpg, .jpeg, .png';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const MAX_FILES = 5;

export interface StatusMeta {
  label: string;
  pill: string;
  icon: string;
  description: string;
}

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  Pending: {
    label: 'Pending',
    pill: 'fx-pill--progress',
    icon: 'clock',
    description: 'Your application was submitted and is waiting for initial review.',
  },
  'Under Review': {
    label: 'Under Review',
    pill: 'fx-pill--pending',
    icon: 'search',
    description: 'A FIXHUB reviewer is currently checking your credentials.',
  },
  'Needs Information': {
    label: 'Needs Information',
    pill: 'fx-pill--accent',
    icon: 'alert-circle',
    description: 'We need a few more details before we can continue your review.',
  },
  Approved: {
    label: 'Approved',
    pill: 'fx-pill--success',
    icon: 'check-circle',
    description: 'Congratulations! You are now a verified FIXHUB technician.',
  },
  Rejected: {
    label: 'Rejected',
    pill: 'fx-pill--danger',
    icon: 'x-circle',
    description: 'This application did not meet our requirements this time.',
  },
};

export const STATUS_ORDER: ApplicationStatus[] = [
  'Pending',
  'Under Review',
  'Needs Information',
  'Approved',
  'Rejected',
];

export const FORM_STEPS = [
  { key: 'personal', title: 'Personal', icon: 'user' },
  { key: 'professional', title: 'Professional', icon: 'wrench' },
  { key: 'service', title: 'Service', icon: 'map-pin' },
  { key: 'documents', title: 'Documents', icon: 'file-text' },
  { key: 'review', title: 'Review', icon: 'check-circle' },
];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function emptyApplicationForm(): ApplicationFormState {
  return {
    fullName: '',
    email: '',
    contactNumber: '',
    city: '',
    yearsExperience: '',
    brands: [],
    brandsOther: '',
    specializations: [],
    specializationsOther: '',
    experienceDescription: '',
    serviceType: '',
    coverageArea: '',
    workingDays: [],
    workingHours: '',
    certificates: [],
    workPhotos: [],
    agreed: false,
  };
}

export function seedApplications(): TechnicianApplication[] {
  return [
    {
      id: 'app-demo-1001',
      createdAt: '2026-10-02T09:15:00.000Z',
      updatedAt: '2026-10-04T13:40:00.000Z',
      status: 'Pending',
      applicant: {
        userId: 'marco.lopez@email.com',
        fullName: 'Marco Lopez',
        email: 'marco.lopez@email.com',
        contactNumber: '+63 917 555 2211',
        city: 'Quezon City',
      },
      professional: {
        yearsExperience: '6',
        brands: ['Samsung', 'Xiaomi', 'OPPO'],
        specializations: ['Screen Replacement', 'Battery Replacement', 'Charging Port Repair'],
        experienceDescription:
          'Six years running a small repair shop in Cubao, handling mostly Samsung and Xiaomi screen and battery jobs.',
      },
      service: {
        serviceType: 'Both',
        coverageArea: 'Quezon City, San Juan, Mandaluyong',
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        workingHours: '9:00 AM - 7:00 PM',
      },
      documents: {
        certificates: [],
        workPhotos: [],
      },
      review: {},
      history: [
        { at: '2026-10-02T09:15:00.000Z', by: 'Marco Lopez', status: 'Pending', note: 'Application submitted' },
      ],
    },
    {
      id: 'app-demo-1002',
      createdAt: '2026-09-28T14:05:00.000Z',
      updatedAt: '2026-10-01T10:20:00.000Z',
      status: 'Under Review',
      applicant: {
        userId: 'bryan.tan@email.com',
        fullName: 'Bryan Tan',
        email: 'bryan.tan@email.com',
        contactNumber: '+63 918 222 7788',
        city: 'Makati',
      },
      professional: {
        yearsExperience: '9',
        brands: ['Apple / iPhone', 'Samsung'],
        specializations: ['Screen Replacement', 'Software & Flashing', 'Data Recovery'],
        experienceDescription:
          'Certified iPhone repair specialist, previously with an authorized service provider for four years.',
      },
      service: {
        serviceType: 'Home Service',
        coverageArea: 'Makati, Taguig, Pasay',
        workingDays: ['Mon', 'Wed', 'Fri'],
        workingHours: '10:00 AM - 6:00 PM',
      },
      documents: {
        certificates: [],
        workPhotos: [],
      },
      review: {
        reviewer: 'Admin User',
        reviewedAt: '2026-10-01T10:20:00.000Z',
        feedback: 'Verifying service certification documents.',
      },
      history: [
        { at: '2026-09-28T14:05:00.000Z', by: 'Bryan Tan', status: 'Pending', note: 'Application submitted' },
        { at: '2026-10-01T10:20:00.000Z', by: 'Admin User', status: 'Under Review', note: 'Verifying service certification documents.' },
      ],
    },
    {
      id: 'app-demo-1003',
      createdAt: '2026-09-20T08:30:00.000Z',
      updatedAt: '2026-09-24T16:10:00.000Z',
      status: 'Needs Information',
      applicant: {
        userId: 'grace.uy@email.com',
        fullName: 'Grace Uy',
        email: 'grace.uy@email.com',
        contactNumber: '+63 916 909 3131',
        city: 'Cebu City',
      },
      professional: {
        yearsExperience: '3',
        brands: ['Vivo', 'Realme', 'Others'],
        brandsOther: 'Infinix, Tecno',
        specializations: ['Battery Replacement', 'Charging Port Repair'],
        experienceDescription:
          'Three years of freelance repairs focused on battery and charging issues for budget Android phones.',
      },
      service: {
        serviceType: 'Drop-off',
        coverageArea: 'Cebu City',
        workingDays: ['Tue', 'Thu', 'Sat'],
        workingHours: '1:00 PM - 8:00 PM',
      },
      documents: {
        certificates: [],
        workPhotos: [],
      },
      review: {
        reviewer: 'Admin User',
        reviewedAt: '2026-09-24T16:10:00.000Z',
        feedback: 'Please upload a valid ID and at least two work photos to continue the review.',
      },
      history: [
        { at: '2026-09-20T08:30:00.000Z', by: 'Grace Uy', status: 'Pending', note: 'Application submitted' },
        { at: '2026-09-22T11:00:00.000Z', by: 'Admin User', status: 'Under Review', note: 'Initial screening passed.' },
        { at: '2026-09-24T16:10:00.000Z', by: 'Admin User', status: 'Needs Information', note: 'Please upload a valid ID and at least two work photos to continue the review.' },
      ],
    },
  ];
}
