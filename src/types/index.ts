/**
 * Data shapes shared by the UI, mock DB, and real backend.
 * Complete 1:1 match with web dashboard types.
 */

export type Role = 'worker' | 'employer' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'blocked' | 'suspended';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type Sector = 'mining' | 'metals' | 'shipping' | 'petroleum' | 'logistics' | 'automotive';
export type Trade =
  | 'welder'
  | 'electrician'
  | 'fitter'
  | 'machine_operator'
  | 'driver'
  | 'crane_operator'
  | 'helper'
  | 'security'
  | 'supervisor'
  | 'other';
export type ExperienceBand = 'fresher' | '1_2' | '3_5' | '5_plus';
export type Shift = 'day' | 'night' | 'rotational';
export type PayPeriod = 'day' | 'month';
export type JobType = 'full_time' | 'contract' | 'walk_in';
export type Benefit = 'food' | 'stay' | 'transport' | 'pf_esi' | 'overtime' | 'hazard_pay';
export type JobStatus = 'active' | 'draft' | 'closed';
export type PayType = 'in_hand' | 'ctc';
export type Availability = 'immediate' | '15_days' | '30_days';

export type ApplicationStage =
  | 'applied'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export type DocType =
  | 'resume'
  | 'id_proof'
  | 'iti_diploma'
  | 'trade_licence'
  | 'driving_licence'
  | 'experience_letter'
  | 'safety_cert';

export interface User {
  id: string;
  role: Role;
  name: string;
  phone?: string;
  email?: string;
  status: AccountStatus;
  onboarded: boolean;
  verified?: boolean;
  companyId?: string;
  companyName?: string;
  trade?: string;
  city?: string;
  createdAt: string;
}

export interface Location {
  city: string;
  state: string;
}

export interface WorkerProfile {
  userId: string;
  name: string;
  phone: string;
  trade?: Trade;
  experience?: ExperienceBand;
  qualifications: string[];
  licences: string[];
  location?: Location;
  willingToRelocate: boolean;
  expectedPay?: number;
  shiftPreference?: Shift | 'any';
  availability: Availability;
  skills: string[];
  about?: string;
  email?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  pincode?: string;
  languages?: string[];
  safetyTrainingHours?: number;
  employmentType?: 'permanent' | 'contract' | 'any';
  photoUrl?: string;
  verifiedAadhaar?: boolean;
  verifiedIti?: boolean;
  workHistory?: WorkHistoryItem[];
}

export interface WorkHistoryItem {
  company: string;
  role: string;
  from: string;
  to?: string;
}

export interface Company {
  id: string;
  name: string;
  sector: Sector;
  size: string;
  location: Location;
  website?: string;
  gstNumber?: string;
  about?: string;
  hrName?: string;
  hrDesignation?: string;
  hrPhone?: string;
  sites?: string[];
  address?: string;
  pincode?: string;
  logoUrl?: string;
  hiringType?: HiringType;
  verification: VerificationStatus;
  rejectionReason?: string;
  status: AccountStatus;
  createdAt: string;
}

export type HiringType = 'direct' | 'agency';
export type CompanyDocType = 'gst' | 'udyam' | 'cin' | 'other';

export interface CompanyDocument {
  id: string;
  companyId: string;
  name: string;
  type: CompanyDocType;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  url?: string;
}

export interface WalkIn {
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  address: string;
  contactPerson?: string;
  bring?: string;
}

export interface Job {
  /** Demo data only: which employer account owns this job (seed jobs belong to the demo employer). */
  ownerCompanyId?: string;
  id: string;
  companyId: string;
  companyName: string;
  companyVerified: boolean;
  companyLogoUrl?: string;
  title: string;
  trade: Trade;
  sector: Sector;
  location: Location;
  payMin?: number;
  payMax?: number;
  payPeriod: PayPeriod;
  payType?: PayType;
  shift: Shift;
  workHours?: string;
  jobType: JobType;
  contractLength?: string;
  walkIn?: WalkIn;
  openings: number;
  experience: ExperienceBand;
  qualifications: string[];
  licences?: string[];
  benefits: Benefit[];
  responsibilities: string[];
  requirements: string[];
  status: JobStatus;
  postedAt: string;
  deadline?: string;
  siteName?: string;
  address?: string;
  pincode?: string;
  hrPhone?: string;
  allowCalls: boolean;
  callHours?: string;
  removedByAdmin?: boolean;
  applicantsCount: number;
  newApplicantsCount: number;
}

export interface JobForWorker extends Job {
  saved: boolean;
  appliedApplicationId?: string;
}

export interface TimelineEvent {
  stage: ApplicationStage | 'viewed';
  at: string;
  note?: string;
}

export interface Interview {
  at: string;
  place: string;
  contactPerson?: string;
  bring?: string;
  /** Extra words from HR, e.g. "Come through gate 3". */
  note?: string;
  response?: 'attending' | 'cant_attend';
  responseNote?: string;
  respondedAt?: string;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  stage: ApplicationStage;
  appliedAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  interview?: Interview;
  sentWith: 'profile' | 'document';
  documentId?: string;
  rejectionNote?: string;
  /** HR's private note about this candidate. Never shown to the worker. */
  hrNote?: string;
  /** The date the worker actually joined (set when HR marks hired). */
  joinedAt?: string;
  offer?: Offer;
  offerResponse?: 'accepted' | 'declined';
}

export interface Offer {
  /** Last day the worker should answer (optional). */
  replyBy?: string;
  pay: number;
  payPeriod: PayPeriod;
  payType?: PayType;
  joiningDate: string;
  place: string;
  note?: string;
  sentAt: string;
}

export interface WorkerApplication extends Application {
  job: Job;
  contact?: { phone: string; hours?: string };
}

export interface Candidate extends Application {
  /** How well the worker fits the job, 0 to 100 (trade, experience, education, city). */
  match?: number;
  worker: WorkerProfile;
  jobTitle: string;
  documents: WorkerDocument[];
}

export interface WorkerDocument {
  id: string;
  ownerId: string;
  name: string;
  type: DocType;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  url?: string;
  isDefaultResume?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  link?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
}

export type VerificationKind = 'company';

export interface VerificationItem {
  id: string;
  kind?: VerificationKind;
  title: string;
  subtitle: string;
  submittedAt: string;
  status: VerificationStatus;
  details: Record<string, string>;
  documents: Pick<CompanyDocument, 'id' | 'name' | 'type' | 'url' | 'mimeType' | 'uploadedAt'>[];
}

export interface AdminUserRow {
  id: string;
  role: 'worker' | 'employer';
  name: string;
  contact: string;
  city: string;
  status: AccountStatus;
  verification?: VerificationStatus;
  joinedAt: string;
  /** Why the account was suspended (shown to the person when they try to log in). */
  suspendReason?: string;
}

export interface CompanyForWorker {
  company: Company;
  jobs: JobForWorker[];
}

export interface AdminJobRow extends Job {
  companyStatus: AccountStatus;
}

/** A job report plus the job's current state, for the admin list. */
export interface AdminReportRow extends JobReport {
  jobStatus: JobStatus;
  reportsForJob: number;
}

export type ReportReason = 'asks_money' | 'fake' | 'wrong_details' | 'unsafe' | 'other';
export type ReportStatus = 'open' | 'dismissed' | 'job_removed';

export interface JobReport {
  id: string;
  reporterId?: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  reporterName: string;
  reason: ReportReason;
  details?: string;
  at: string;
  status: ReportStatus;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SupportTicket {
  id: string;
  userId?: string;
  name: string;
  contact: string;
  role: Role | 'guest';
  topic: string;
  message: string;
  at: string;
  status: 'open' | 'closed';
}

export interface UserSettings {
  language: 'en' | 'hi' | 'or';
  jobAlerts: boolean;
  smsAlerts: boolean;
  whatsappAlerts: boolean;
  visibleToEmployers: boolean;
}

export interface Message {
  id: string;
  applicationId: string;
  fromUserId: string;
  fromRole: 'worker' | 'employer';
  text: string;
  at: string;
}

export interface MessageThread {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  workerName: string;
  otherName: string;
  stage: ApplicationStage;
  lastMessage?: string;
  lastAt?: string;
  unread: number;
  canSend: boolean;
}

export interface TalentProfile {
  userId: string;
  name: string;
  trade?: Trade;
  experience?: ExperienceBand;
  qualifications: string[];
  licences: string[];
  skills: string[];
  location?: Location;
  willingToRelocate: boolean;
  expectedPay?: number;
  availability: Availability;
  languages?: string[];
  safetyTrainingHours?: number;
  photoUrl?: string;
  invitedTo: string[];
  appliedTo: string[];
}

export interface EmployerAnalytics {
  totalApplicants: number;
  hired: number;
  fillRate: number;
  avgDaysToHire: number | null;
  resumeShare: number;
  applicantsPerWeek: { week: string; count: number }[];
  byState: { state: string; count: number }[];
  byJob: { jobId: string; title: string; openings: number; applied: number; shortlisted: number; interview: number; hired: number }[];
}

export interface WorkerSummary {
  activeApplications: number;
  interviews: number;
  saved: number;
  profileStrength: number;
  profileHint?: string;
  missing: { key: string; label: string; link: string }[];
  nextStep?: { title: string; subtitle: string; link: string; at?: string };
}

export interface EmployerSummary {
  openJobs: number;
  newApplicants: number;
  interviewsThisWeek: number;
  hiredThisMonth: number;
  attention: { id: string; text: string; link: string; action: string }[];
  applicantsPerDay: { day: string; count: number }[];
  funnel: { stage: string; count: number }[];
}

export interface AdminSummary {
  workers: number;
  companies: number;
  activeJobs: number;
  pendingVerifications: number;
  openReports: number;
  openTickets: number;
  attention: { id: string; text: string; link: string }[];
  signupsPerWeek: { week: string; workers: number; companies: number }[];
}

export interface JobSearchParams {
  q?: string;
  city?: string;
  trade?: Trade | '';
  sector?: Sector | '';
  shift?: Shift | '';
  minPay?: number;
  foodStay?: boolean;
  walkInOnly?: boolean;
  verifiedOnly?: boolean;
  sort?: 'newest' | 'pay' | 'nearest';
  page?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type JobInput = Omit<
  Job,
  'id' | 'companyId' | 'companyName' | 'companyVerified' | 'companyLogoUrl' | 'postedAt' | 'applicantsCount' | 'newApplicantsCount'
>;

/** Rules an admin can switch for the whole platform (same fields as the web dashboard). */
export interface PlatformSettings {
  /** New companies go live without admin approval (not recommended). */
  autoApproveCompanies: boolean;
  /** Workers and HR can message each other after shortlisting. */
  messagingEnabled: boolean;
  /** Employers can search all workers who allow it. */
  talentSearchEnabled: boolean;
}
