import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  OtpVerify: { phone: string };
  Signup: undefined;
  RolePicker: undefined;
  WorkerWelcome: undefined;
  EmployerWelcome: undefined;
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
  CompanyDetail: { companyId: string };
  ApplicationDetail: { applicationId: string };
  ChatThread: { threadId: string; recipientName: string };
  Settings: undefined;
};

export type EmployerTabParamList = {
  EmployerDashboard: undefined;
  EmployerJobs: undefined;
  Candidates: undefined;
  FindWorkers: undefined;
};

export type EmployerDrawerParamList = {
  EmployerMain: NavigatorScreenParams<EmployerTabParamList>;
  PostJobWizard: undefined;
  CandidateDossier: { candidateId: string };
  CompanyProfile: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type AdminDrawerParamList = {
  VerificationsQueue: undefined;
  UsersManagement: undefined;
  JobsModeration: undefined;
  ActivityLog: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Worker: NavigatorScreenParams<WorkerStackParamList>;
  Employer: NavigatorScreenParams<EmployerDrawerParamList>;
  Admin: NavigatorScreenParams<AdminDrawerParamList>;
};
