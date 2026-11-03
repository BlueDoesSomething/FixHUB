import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export enum ApplicationStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  NEEDS_INFORMATION = "NEEDS_INFORMATION",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
};

export enum RepairStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  EN_ROUTE = "EN_ROUTE",
  ARRIVED = "ARRIVED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
};

export enum ServiceType {
  HOME = "HOME",
  DROPOFF = "DROPOFF",
  BOTH = "BOTH",
};

export enum UserRole {
  CLIENT = "CLIENT",
  TECHNICIAN = "TECHNICIAN",
  ADMIN = "ADMIN",
};



export interface AdminApproveApplicationData {
  technicianApplication_update?: TechnicianApplication_Key | null;
  technicianProfile_insert: TechnicianProfile_Key;
  user_update?: User_Key | null;
  applicationEvent_insert: ApplicationEvent_Key;
}

export interface AdminApproveApplicationVariables {
  id: UUIDString;
}

export interface AdminListApplicationsData {
  technicianApplications: ({
    id: UUIDString;
    applicantId: string;
    fullName: string;
    email: string;
    contactNumber: string;
    city: string;
    yearsExperience: number;
    brands: string[];
    specializations: string[];
    experienceDescription: string;
    serviceType: ServiceType;
    coverageArea: string;
    workingDays: string[];
    workingHours: string;
    status: ApplicationStatus;
    feedback?: string | null;
    reviewedAt?: TimestampString | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
    applicationEvents_on_application: ({
      status: ApplicationStatus;
      note?: string | null;
      createdAt: TimestampString;
      actor: {
        fullName: string;
      };
    })[];
  } & TechnicianApplication_Key)[];
}

export interface AdminRejectApplicationData {
  technicianApplication_update?: TechnicianApplication_Key | null;
  applicationEvent_insert: ApplicationEvent_Key;
}

export interface AdminRejectApplicationVariables {
  id: UUIDString;
  note: string;
}

export interface AdminRequestApplicationInformationData {
  technicianApplication_update?: TechnicianApplication_Key | null;
  applicationEvent_insert: ApplicationEvent_Key;
}

export interface AdminRequestApplicationInformationVariables {
  id: UUIDString;
  note: string;
}

export interface AdminStartApplicationReviewData {
  technicianApplication_update?: TechnicianApplication_Key | null;
  applicationEvent_insert: ApplicationEvent_Key;
}

export interface AdminStartApplicationReviewVariables {
  id: UUIDString;
}

export interface ApplicationEvent_Key {
  id: UUIDString;
  __typename?: 'ApplicationEvent_Key';
}

export interface CancelMyRepairRequestData {
  repairRequest_update?: RepairRequest_Key | null;
}

export interface CancelMyRepairRequestVariables {
  id: UUIDString;
}

export interface CreateMyProfileData {
  user_insert: User_Key;
}

export interface CreateMyProfileVariables {
  fullName: string;
  phone: string;
  city: string;
}

export interface CreateMyRepairRequestData {
  repairRequest_insert: RepairRequest_Key;
}

export interface CreateMyRepairRequestVariables {
  device: string;
  brand: string;
  model: string;
  problem: string;
  serviceType: ServiceType;
  location: string;
}

export interface GetMyApplicationData {
  technicianApplications: ({
    id: UUIDString;
    applicantId: string;
    fullName: string;
    email: string;
    contactNumber: string;
    city: string;
    yearsExperience: number;
    brands: string[];
    specializations: string[];
    experienceDescription: string;
    serviceType: ServiceType;
    coverageArea: string;
    workingDays: string[];
    workingHours: string;
    status: ApplicationStatus;
    feedback?: string | null;
    reviewedAt?: TimestampString | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
    applicationEvents_on_application: ({
      status: ApplicationStatus;
      note?: string | null;
      createdAt: TimestampString;
      actor: {
        fullName: string;
      };
    })[];
  } & TechnicianApplication_Key)[];
}

export interface GetMyProfileData {
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    city: string;
    role: UserRole;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & User_Key;
}

export interface ListMyRepairRequestsData {
  repairRequests: ({
    id: UUIDString;
    device: string;
    brand: string;
    model: string;
    problem: string;
    serviceType: ServiceType;
    location: string;
    status: RepairStatus;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & RepairRequest_Key)[];
}

export interface RepairRequest_Key {
  id: UUIDString;
  __typename?: 'RepairRequest_Key';
}

export interface SubmitMyApplicationData {
  technicianApplication_insert: TechnicianApplication_Key;
  applicationEvent_insert: ApplicationEvent_Key;
}

export interface SubmitMyApplicationVariables {
  fullName: string;
  contactNumber: string;
  city: string;
  yearsExperience: number;
  brands: string[];
  specializations: string[];
  experienceDescription: string;
  serviceType: ServiceType;
  coverageArea: string;
  workingDays: string[];
  workingHours: string;
}

export interface TechnicianApplication_Key {
  id: UUIDString;
  __typename?: 'TechnicianApplication_Key';
}

export interface TechnicianProfile_Key {
  userId: string;
  __typename?: 'TechnicianProfile_Key';
}

export interface UpdateMyProfileData {
  user_update?: User_Key | null;
}

export interface UpdateMyProfileVariables {
  fullName: string;
  phone: string;
  city: string;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface CreateMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMyProfileVariables): MutationRef<CreateMyProfileData, CreateMyProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateMyProfileVariables): MutationRef<CreateMyProfileData, CreateMyProfileVariables>;
  operationName: string;
}
export const createMyProfileRef: CreateMyProfileRef;

export function createMyProfile(vars: CreateMyProfileVariables): MutationPromise<CreateMyProfileData, CreateMyProfileVariables>;
export function createMyProfile(dc: DataConnect, vars: CreateMyProfileVariables): MutationPromise<CreateMyProfileData, CreateMyProfileVariables>;

interface UpdateMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMyProfileVariables): MutationRef<UpdateMyProfileData, UpdateMyProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateMyProfileVariables): MutationRef<UpdateMyProfileData, UpdateMyProfileVariables>;
  operationName: string;
}
export const updateMyProfileRef: UpdateMyProfileRef;

export function updateMyProfile(vars: UpdateMyProfileVariables): MutationPromise<UpdateMyProfileData, UpdateMyProfileVariables>;
export function updateMyProfile(dc: DataConnect, vars: UpdateMyProfileVariables): MutationPromise<UpdateMyProfileData, UpdateMyProfileVariables>;

interface SubmitMyApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitMyApplicationVariables): MutationRef<SubmitMyApplicationData, SubmitMyApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SubmitMyApplicationVariables): MutationRef<SubmitMyApplicationData, SubmitMyApplicationVariables>;
  operationName: string;
}
export const submitMyApplicationRef: SubmitMyApplicationRef;

export function submitMyApplication(vars: SubmitMyApplicationVariables): MutationPromise<SubmitMyApplicationData, SubmitMyApplicationVariables>;
export function submitMyApplication(dc: DataConnect, vars: SubmitMyApplicationVariables): MutationPromise<SubmitMyApplicationData, SubmitMyApplicationVariables>;

interface AdminStartApplicationReviewRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminStartApplicationReviewVariables): MutationRef<AdminStartApplicationReviewData, AdminStartApplicationReviewVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AdminStartApplicationReviewVariables): MutationRef<AdminStartApplicationReviewData, AdminStartApplicationReviewVariables>;
  operationName: string;
}
export const adminStartApplicationReviewRef: AdminStartApplicationReviewRef;

export function adminStartApplicationReview(vars: AdminStartApplicationReviewVariables): MutationPromise<AdminStartApplicationReviewData, AdminStartApplicationReviewVariables>;
export function adminStartApplicationReview(dc: DataConnect, vars: AdminStartApplicationReviewVariables): MutationPromise<AdminStartApplicationReviewData, AdminStartApplicationReviewVariables>;

interface AdminRequestApplicationInformationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminRequestApplicationInformationVariables): MutationRef<AdminRequestApplicationInformationData, AdminRequestApplicationInformationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AdminRequestApplicationInformationVariables): MutationRef<AdminRequestApplicationInformationData, AdminRequestApplicationInformationVariables>;
  operationName: string;
}
export const adminRequestApplicationInformationRef: AdminRequestApplicationInformationRef;

export function adminRequestApplicationInformation(vars: AdminRequestApplicationInformationVariables): MutationPromise<AdminRequestApplicationInformationData, AdminRequestApplicationInformationVariables>;
export function adminRequestApplicationInformation(dc: DataConnect, vars: AdminRequestApplicationInformationVariables): MutationPromise<AdminRequestApplicationInformationData, AdminRequestApplicationInformationVariables>;

interface AdminRejectApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminRejectApplicationVariables): MutationRef<AdminRejectApplicationData, AdminRejectApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AdminRejectApplicationVariables): MutationRef<AdminRejectApplicationData, AdminRejectApplicationVariables>;
  operationName: string;
}
export const adminRejectApplicationRef: AdminRejectApplicationRef;

export function adminRejectApplication(vars: AdminRejectApplicationVariables): MutationPromise<AdminRejectApplicationData, AdminRejectApplicationVariables>;
export function adminRejectApplication(dc: DataConnect, vars: AdminRejectApplicationVariables): MutationPromise<AdminRejectApplicationData, AdminRejectApplicationVariables>;

interface AdminApproveApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminApproveApplicationVariables): MutationRef<AdminApproveApplicationData, AdminApproveApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AdminApproveApplicationVariables): MutationRef<AdminApproveApplicationData, AdminApproveApplicationVariables>;
  operationName: string;
}
export const adminApproveApplicationRef: AdminApproveApplicationRef;

export function adminApproveApplication(vars: AdminApproveApplicationVariables): MutationPromise<AdminApproveApplicationData, AdminApproveApplicationVariables>;
export function adminApproveApplication(dc: DataConnect, vars: AdminApproveApplicationVariables): MutationPromise<AdminApproveApplicationData, AdminApproveApplicationVariables>;

interface CreateMyRepairRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMyRepairRequestVariables): MutationRef<CreateMyRepairRequestData, CreateMyRepairRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateMyRepairRequestVariables): MutationRef<CreateMyRepairRequestData, CreateMyRepairRequestVariables>;
  operationName: string;
}
export const createMyRepairRequestRef: CreateMyRepairRequestRef;

export function createMyRepairRequest(vars: CreateMyRepairRequestVariables): MutationPromise<CreateMyRepairRequestData, CreateMyRepairRequestVariables>;
export function createMyRepairRequest(dc: DataConnect, vars: CreateMyRepairRequestVariables): MutationPromise<CreateMyRepairRequestData, CreateMyRepairRequestVariables>;

interface CancelMyRepairRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CancelMyRepairRequestVariables): MutationRef<CancelMyRepairRequestData, CancelMyRepairRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CancelMyRepairRequestVariables): MutationRef<CancelMyRepairRequestData, CancelMyRepairRequestVariables>;
  operationName: string;
}
export const cancelMyRepairRequestRef: CancelMyRepairRequestRef;

export function cancelMyRepairRequest(vars: CancelMyRepairRequestVariables): MutationPromise<CancelMyRepairRequestData, CancelMyRepairRequestVariables>;
export function cancelMyRepairRequest(dc: DataConnect, vars: CancelMyRepairRequestVariables): MutationPromise<CancelMyRepairRequestData, CancelMyRepairRequestVariables>;

interface GetMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProfileData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyProfileData, undefined>;
  operationName: string;
}
export const getMyProfileRef: GetMyProfileRef;

export function getMyProfile(options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;
export function getMyProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface GetMyApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyApplicationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyApplicationData, undefined>;
  operationName: string;
}
export const getMyApplicationRef: GetMyApplicationRef;

export function getMyApplication(options?: ExecuteQueryOptions): QueryPromise<GetMyApplicationData, undefined>;
export function getMyApplication(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyApplicationData, undefined>;

interface AdminListApplicationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminListApplicationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AdminListApplicationsData, undefined>;
  operationName: string;
}
export const adminListApplicationsRef: AdminListApplicationsRef;

export function adminListApplications(options?: ExecuteQueryOptions): QueryPromise<AdminListApplicationsData, undefined>;
export function adminListApplications(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminListApplicationsData, undefined>;

interface ListMyRepairRequestsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyRepairRequestsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyRepairRequestsData, undefined>;
  operationName: string;
}
export const listMyRepairRequestsRef: ListMyRepairRequestsRef;

export function listMyRepairRequests(options?: ExecuteQueryOptions): QueryPromise<ListMyRepairRequestsData, undefined>;
export function listMyRepairRequests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyRepairRequestsData, undefined>;

