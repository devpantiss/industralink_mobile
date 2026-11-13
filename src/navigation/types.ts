import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Legal: { kind: 'terms' | 'privacy' | 'nofees' };
};

export type WorkerTabParamList = {
  WorkerHome: undefined;
  FindJobs: undefined;
  Applications: undefined;
  SavedJobs: undefined;
  WorkerProfile: undefined;
};

export type WorkerStackParamList = {
  WorkerTabs: NavigatorScreenParams<WorkerTabParamList>;
  JobDetail: { jobId: string };
  Companies: undefined;
  CompanyDetail: { companyId: string };
  ApplicationDetail: { applicationId: string };
  ChatThread: { threadId: string; recipientName: string };
  Inbox: undefined;
  Help: undefined;
  Settings: undefined;
  Legal: { kind: 'terms' | 'privacy' | 'nofees' };
};

export type EmployerTabParamList = {
  EmployerDashboard: undefined;
  EmployerJobs: undefined;
  Candidates: undefined;
  FindWorkers: undefined;
};

export type EmployerDrawerParamList = {
  EmployerMain: NavigatorScreenParams<EmployerTabParamList>;
  Company: undefined;
  Analytics: undefined;
  Settings: undefined;
};

/** Full-screen employer screens pushed above the drawer, so Back returns to where you came from. */
export type EmployerStackParamList = {
  EmployerDrawer: NavigatorScreenParams<EmployerDrawerParamList>;
  /** With a `jobId` the wizard edits that job instead of creating a new one. */
  PostJobWizard: { jobId?: string } | undefined;
  CandidateDossier: { candidateId: string };
  JobApplicants: { jobId: string };
  Inbox: undefined;
  Help: undefined;
  Legal: { kind: 'terms' | 'privacy' | 'nofees' };
  ChatThread: { threadId: string; recipientName: string };
};

export type AdminDrawerParamList = {
  AdminHome: undefined;
  Inbox: undefined;
  VerificationsQueue: undefined;
  Reports: undefined;
  UsersManagement: undefined;
  JobsModeration: undefined;
  ActivityLog: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  /** Shown once after sign-up, until the new account finishes its short setup. */
  Onboarding: undefined;
  Worker: NavigatorScreenParams<WorkerStackParamList>;
  Employer: NavigatorScreenParams<EmployerStackParamList>;
  Admin: NavigatorScreenParams<AdminDrawerParamList>;
};
