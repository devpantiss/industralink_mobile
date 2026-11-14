import { findFeeWording } from '../lib/scam';
import { matchScore } from '../lib/match';
import {
  Job,
  JobForWorker,
  Company,
  WorkerProfile,
  Application,
  WorkerApplication,
  Candidate,
  VerificationItem,
  User,
  ApplicationStage,
  WorkerSummary,
  EmployerSummary,
  AdminSummary,
  WorkerDocument,
  TalentProfile,
  JobSearchParams,
  Paginated,
  CompanyForWorker,
  EmployerAnalytics,
  AdminUserRow,
  AdminJobRow,
  AdminReportRow,
  JobReport,
  SupportTicket,
  AuditEntry,
  AccountStatus,
  CompanyDocument,
  CompanyDocType,
  ReportReason,
  PlatformSettings,
  AppNotification,
  Message,
  MessageThread,
} from '../types';
import {
  SEED_JOBS,
  SEED_COMPANIES,
  SEED_WORKER,
  SEED_VERIFICATIONS,
  SEED_APPLICANT_POOL,
  SEED_ADMIN_USERS,
  SEED_REPORTS,
  SEED_TICKETS,
  SEED_AUDIT,
} from './seed';

/** A small public PDF so demo documents actually open. */
const SAMPLE_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const FLOW: ApplicationStage[] = ['applied', 'shortlisted', 'interview', 'offer', 'hired'];
const DAY = 86400000;
const NOW = Date.now();

/** Applications from the other workers in the pool, with a timeline up to their stage. */
const poolCandidates: Candidate[] = SEED_APPLICANT_POOL.map((p, i) => {
  const appliedAt = new Date(NOW - p.daysAgo * DAY).toISOString();
  const reached = p.stage === 'rejected' ? ['applied' as ApplicationStage] : FLOW.slice(0, FLOW.indexOf(p.stage) + 1);
  // Each step a few days after the previous one (at most 4), ending before today.
  const gap = Math.min(4, p.daysAgo / (reached.length + 1));
  const timeline = reached.map((stage, k) => ({ stage, at: new Date(NOW - (p.daysAgo - k * gap) * DAY).toISOString() }));
  if (p.stage === 'rejected') timeline.push({ stage: 'rejected', at: new Date(NOW - (p.daysAgo - 2) * DAY).toISOString() });
  const id = `app_pool_${i + 1}`;
  return {
    id,
    jobId: p.jobId,
    workerId: p.worker.userId,
    stage: p.stage,
    appliedAt,
    updatedAt: timeline[timeline.length - 1].at,
    sentWith: p.sentWith ?? 'profile',
    timeline,
    worker: p.worker,
    jobTitle: '',
    documents:
      p.sentWith === 'document'
        ? [{ id: `${id}_cv`, ownerId: p.worker.userId, name: `${p.worker.name.replace(/ /g, '_')}_Resume.pdf`,
            type: 'resume', sizeBytes: 1024 * 210, mimeType: 'application/pdf', uploadedAt: appliedAt, isDefaultResume: true }]
        : [],
    ...(p.stage === 'interview'
      ? { interview: { at: new Date(NOW + 2 * DAY).toISOString(), place: 'Main gate HR office' } }
      : {}),
    ...(p.stage === 'offer'
      ? { offer: { pay: p.worker.expectedPay ?? 22000, payPeriod: 'month' as const, joiningDate: new Date(NOW + 10 * DAY).toISOString().slice(0, 10),
          place: 'Main gate HR office', sentAt: timeline[timeline.length - 1].at } }
      : {}),
  };
});

class MockDatabase {
  private jobs: Job[] = [...SEED_JOBS];
  private companies: Company[] = [...SEED_COMPANIES];
  private seedProfile: WorkerProfile = {
    ...SEED_WORKER,
    safetyTrainingHours: 40,
    languages: ['Hindi', 'Odia', 'English'],
    dob: '1996-05-14',
    gender: 'male',
    address: 'Plot 12, Phase 2, Industrial Colony',
    pincode: '755026',
    employmentType: 'permanent',
    workHistory: [
      { company: 'Konark Heavy Engineering', role: 'Arc Welder', from: '2021', to: '2024' },
      { company: 'Mahanadi Steel & Power', role: 'Trainee Welder', from: '2019', to: '2021' },
    ],
  };
  private seedSaved: string[] = ['job_1'];
  private seedDocs: WorkerDocument[] = [
    {
      id: 'doc_1',
      ownerId: 'usr_worker_1',
      name: 'Govt_ITI_Welder_Certificate.pdf',
      type: 'iti_diploma',
      sizeBytes: 1024 * 450,
      mimeType: 'application/pdf',
      url: SAMPLE_PDF,
      uploadedAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'doc_2',
      ownerId: 'usr_worker_1',
      name: 'Aadhaar_Card.pdf',
      type: 'id_proof',
      sizeBytes: 1024 * 320,
      mimeType: 'application/pdf',
      url: SAMPLE_PDF,
      uploadedAt: '2026-11-01T10:05:00Z',
    },
    {
      id: 'doc_3',
      ownerId: 'usr_worker_1',
      name: 'Ramesh_Kumar_Welder_Resume.pdf',
      type: 'resume',
      sizeBytes: 1024 * 180,
      mimeType: 'application/pdf',
      url: SAMPLE_PDF,
      uploadedAt: '2026-11-02T12:00:00Z',
      isDefaultResume: true,
    },
  ];

  private applications: Application[] = [
    {
      id: 'app_1',
      jobId: 'job_1',
      workerId: 'usr_worker_1',
      stage: 'interview',
      appliedAt: '2026-11-10T10:00:00Z',
      updatedAt: '2026-11-11T09:30:00Z',
      sentWith: 'profile',
      timeline: [
        { stage: 'applied', at: '2026-11-10T10:00:00Z' },
        { stage: 'viewed', at: '2026-11-10T12:00:00Z' },
        { stage: 'shortlisted', at: '2026-11-10T15:00:00Z' },
        {
          stage: 'interview',
          at: '2026-11-11T09:30:00Z',
          note: 'Reporting at Plant Gate 4 with Original ITI Certificate',
        },
      ],
      interview: {
        at: '2026-11-20T10:30:00Z',
        place: 'Plot 4B, Kalinganagar Plant Gate 4 HR Office',
        contactPerson: 'Mr. Pradeep Mohanty (Plant HR Manager)',
        bring: 'Aadhaar Card, ITI Marksheet, 2 Passport Photos, Safety Shoes',
      },
    },
    {
      id: 'app_2',
      jobId: 'job_3',
      workerId: 'usr_worker_1',
      stage: 'applied',
      appliedAt: '2026-11-09T14:20:00Z',
      updatedAt: '2026-11-09T14:20:00Z',
      sentWith: 'profile',
      timeline: [{ stage: 'applied', at: '2026-11-09T14:20:00Z' }],
    },
  ];

  private verifications: VerificationItem[] = SEED_VERIFICATIONS.map((v) => ({ ...v, details: { ...v.details } }));
  private adminUsers: AdminUserRow[] = SEED_ADMIN_USERS.map((u) => ({ ...u }));
  private reports: JobReport[] = SEED_REPORTS.map((r) => ({ ...r }));
  private tickets: SupportTicket[] = SEED_TICKETS.map((t) => ({ ...t }));
  private audit: AuditEntry[] = [...SEED_AUDIT];

  private log(action: string, target: string) {
    this.audit.unshift({ id: this.uid('aud'), at: new Date().toISOString(), actor: 'Admin', action, target });
  }
  private pool: Candidate[] = poolCandidates;
  private talent: TalentProfile[] = [
    {
      userId: 'usr_talent_1',
      name: 'Ramesh Kumar',
      trade: 'welder',
      experience: '3_5',
      qualifications: ['ITI', '10th'],
      licences: ['DGMS', 'Welding cert'],
      skills: ['Arc Welding', 'MIG 6G', 'Gas Cutting'],
      location: { city: 'Kalinganagar', state: 'Odisha' },
      willingToRelocate: true,
      expectedPay: 22000,
      availability: 'immediate',
      languages: ['Hindi', 'Odia'],
      safetyTrainingHours: 40,
      invitedTo: [],
      appliedTo: ['job_1'],
    },
    {
      userId: 'usr_talent_2',
      name: 'Sunil Pradhan',
      trade: 'fitter',
      experience: '1_2',
      qualifications: ['ITI'],
      licences: ['Forklift'],
      skills: ['Machine Assembly', 'Hydraulics', 'Bearing fitting'],
      location: { city: 'Jajpur', state: 'Odisha' },
      willingToRelocate: false,
      expectedPay: 19000,
      availability: '15_days',
      languages: ['Hindi', 'Odia'],
      safetyTrainingHours: 20,
      invitedTo: [],
      appliedTo: [],
    },
    {
      userId: 'usr_talent_3',
      name: 'Bikash Mohanty',
      trade: 'electrician',
      experience: '5_plus',
      qualifications: ['Diploma', 'ITI'],
      licences: ['Electrical licence', 'DGMS'],
      skills: ['HT/LT Panels', 'Substation Wiring', 'Transformer testing'],
      location: { city: 'Angul', state: 'Odisha' },
      willingToRelocate: true,
      expectedPay: 28000,
      availability: 'immediate',
      languages: ['Hindi', 'Odia', 'English'],
      safetyTrainingHours: 60,
      invitedTo: [],
      appliedTo: [],
    },
  ];
  /** The signed-in employer's own company (shown on Company profile and in the drawer). */
  private seedMyCompany: Company = {
    id: 'emp_demo',
    name: 'Eastline Heavy Engineering',
    sector: 'metals',
    size: '1000+',
    hiringType: 'direct',
    location: { city: 'Kalinganagar', state: 'Odisha' },
    address: 'Plot 4B, Kalinganagar Industrial Complex, Gate 4',
    pincode: '755026',
    website: 'https://eastline.demo',
    gstNumber: '21DEMO00001A1Z1',
    about: 'Steel fabrication and heavy engineering plant. We hire welders, fitters and machinists for permanent and contract roles.',
    hrName: 'Pradeep Mohanty',
    hrDesignation: 'Plant HR Manager',
    hrPhone: '9437000111',
    sites: ['Kalinganagar Plant', 'Angul Fabrication Yard'],
    verification: 'approved',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
  };


  // ---- Demo accounts: who is signed in, and each account's own data ----
  private workerId = 'usr_worker_1';
  private companyId = 'emp_demo';
  private profiles: Record<string, WorkerProfile> = { usr_worker_1: this.seedProfile };
  private workerDocs: Record<string, WorkerDocument[]> = { usr_worker_1: this.seedDocs };
  private workerSaved: Record<string, string[]> = { usr_worker_1: this.seedSaved };
  private employerCompanies: Record<string, Company> = { emp_demo: this.seedMyCompany };
  private companyDocs: Record<string, CompanyDocument[]> = {
    emp_demo: [
      {
        id: 'cdoc_1',
        companyId: 'emp_demo',
        name: 'GST_Certificate.pdf',
        type: 'gst',
        sizeBytes: 1024 * 320,
        mimeType: 'application/pdf',
        uploadedAt: '2026-10-20T09:00:00Z',
      },
    ],
  };
  private employerAccounts: { email: string; password: string; name: string; companyId: string }[] = [
    { email: 'recruiter@nationaleng.demo', password: 'password123', name: 'Pradeep Mohanty', companyId: 'emp_demo' },
    { email: 'hr@eastline.demo', password: 'password123', name: 'Pradeep Mohanty', companyId: 'emp_demo' },
  ];
  /** Accounts that signed up but have not finished the short setup yet. */
  private pendingOnboarding: string[] = [];

  private get workerProfile(): WorkerProfile {
    return this.profiles[this.workerId] ?? this.seedProfile;
  }
  private set workerProfile(v: WorkerProfile) {
    this.profiles[this.workerId] = v;
  }
  private get documents(): WorkerDocument[] {
    return (this.workerDocs[this.workerId] ??= []);
  }
  private set documents(v: WorkerDocument[]) {
    this.workerDocs[this.workerId] = v;
  }
  private get savedJobIds(): Set<string> {
    return new Set(this.workerSaved[this.workerId] ?? []);
  }
  private get myCompany(): Company {
    return this.employerCompanies[this.companyId] ?? this.seedMyCompany;
  }
  private set myCompany(v: Company) {
    this.employerCompanies[this.companyId] = v;
  }

  private seq = 0;
  /** Unique ids even when two things are created in the same millisecond. */
  private uid(prefix: string) {
    return `${prefix}_${Date.now()}_${++this.seq}`;
  }
  private digits = (s?: string) => (s ?? '').replace(/\D/g, '');
  private acct(role: 'worker' | 'employer' | 'admin') {
    return role === 'worker' ? this.workerId : role === 'employer' ? `emp:${this.companyId}` : 'admin';
  }
  private ownerOf(j: Job) {
    return j.ownerCompanyId ?? 'emp_demo';
  }
  private isSuspended(id?: string) {
    const r = this.adminUsers.find((u) => u.id === id);
    return !!r && (r.status === 'suspended' || r.status === 'blocked');
  }
  /** A job workers can see and apply to. */
  private jobOpen(j: Job) {
    const late = !!j.deadline && new Date(j.deadline) < new Date();
    return j.status === 'active' && !late && !this.isSuspended(j.companyId) && !this.isSuspended(this.ownerOf(j));
  }
  private allCompanies(): Company[] {
    return [...this.companies, ...Object.values(this.employerCompanies)];
  }
  private fail(message: string, code: string): never {
    throw Object.assign(new Error(message), { code });
  }
  /** One place that creates a notification, so every event reaches the right person. */
  private notify(userId: string, title: string, body: string, link?: string) {
    this.notifications.unshift({
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      title,
      body,
      at: new Date().toISOString(),
      read: false,
      link,
    });
  }
  private jobOwnerAcct(j: Job) {
    return `emp:${this.ownerOf(j)}`;
  }

  workerExists(phone: string): boolean {
    const d = this.digits(phone).slice(-10);
    return Object.values(this.profiles).some((p) => this.digits(p.phone).slice(-10) === d);
  }

  useDemoAccount(role: 'worker' | 'employer' | 'admin') {
    if (role === 'worker') this.workerId = 'usr_worker_1';
    if (role === 'employer') this.companyId = 'emp_demo';
  }

  markOnboarded(userId: string) {
    this.pendingOnboarding = this.pendingOnboarding.filter((x) => x !== userId);
  }

  private createWorker(name: string, tenDigits: string): WorkerProfile {
    const id = this.uid('usr_w');
    const p: WorkerProfile = {
      userId: id,
      name,
      phone: `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`,
      qualifications: [],
      licences: [],
      willingToRelocate: true,
      availability: 'immediate',
      skills: [],
    };
    this.profiles[id] = p;
    this.workerDocs[id] = [];
    this.workerSaved[id] = [];
    this.adminUsers.unshift({ id, role: 'worker', name, contact: tenDigits, city: '', status: 'active', joinedAt: new Date().toISOString() });
    this.pendingOnboarding.push(id);
    this.notify('admin', 'New worker joined', `${name} created an account.`, 'users');
    return p;
  }

  private workerUser(p: WorkerProfile): User {
    return {
      id: p.userId,
      name: p.name,
      phone: p.phone,
      role: 'worker',
      verified: true,
      status: 'active',
      onboarded: !this.pendingOnboarding.includes(p.userId),
      city: p.location?.city,
      trade: p.trade,
      createdAt: new Date().toISOString(),
    } as User;
  }

  private employerUser(acc: { email: string; name: string; companyId: string }): User {
    const c = this.employerCompanies[acc.companyId]!;
    return {
      id: `emp:${acc.companyId}`,
      name: acc.name,
      phone: c.hrPhone ?? '',
      email: acc.email,
      role: 'employer',
      verified: c.verification === 'approved',
      status: c.verification === 'approved' ? 'active' : 'pending',
      onboarded: !this.pendingOnboarding.includes(`emp:${acc.companyId}`),
      companyId: acc.companyId,
      companyName: c.name,
      createdAt: c.createdAt,
    } as User;
  }

  async registerEmployer(body: { name: string; email: string; password: string; companyName: string }): Promise<{ token: string; user: User }> {
    const email = body.email.trim().toLowerCase();
    if (this.employerAccounts.some((a) => a.email === email)) {
      this.fail('An account with this email already exists. Log in instead.', 'EXISTS');
    }
    const id = this.uid('emp');
    const auto = this.platformSettings.autoApproveCompanies;
    const company: Company = {
      id,
      name: body.companyName.trim(),
      sector: 'metals',
      size: '1–50',
      hiringType: 'direct',
      location: { city: '', state: '' },
      verification: auto ? 'approved' : 'pending',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.employerCompanies[id] = company;
    this.companyDocs[id] = [];
    this.employerAccounts.push({ email, password: body.password, name: body.name.trim(), companyId: id });
    this.adminUsers.unshift({ id, role: 'employer', name: company.name, contact: email, city: '', status: 'active', verification: company.verification, joinedAt: company.createdAt });
    this.verifications.unshift({
      id,
      kind: 'company',
      title: company.name,
      subtitle: 'Direct employer',
      submittedAt: company.createdAt,
      status: company.verification,
      details: {},
      documents: [],
    });
    this.pendingOnboarding.push(`emp:${id}`);
    this.companyId = id;
    this.notify('admin', 'New company to review', `${company.name} signed up and needs approval.`, 'verifications');
    this.log('New company signed up', company.name);
    return { token: 'mock-jwt-token-employer', user: this.employerUser({ email, name: body.name.trim(), companyId: id }) };
  }

  // Auth Operations
  async loginWithOtp(phone: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `OTP sent to +91 ${phone}. For demo, use 123456.`,
    };
  }

  async verifyOtp(phone: string, otp: string, name?: string): Promise<{ token: string; user: User }> {
    if (otp !== '123456') this.fail('That code is not right. For the demo, use 123456.', 'WRONG_OTP');
    const d = this.digits(phone).slice(-10);
    let p = Object.values(this.profiles).find((x) => this.digits(x.phone).slice(-10) === d);
    if (!p) {
      if (!name?.trim()) this.fail('No account found for this number. Create one to continue.', 'NOT_FOUND');
      p = this.createWorker(name.trim(), d);
    }
    if (this.isSuspended(p.userId)) this.fail(`Your account is suspended${this.suspendReasonOf(p.userId)}. Please contact help.`, 'BLOCKED');
    this.workerId = p.userId;
    return { token: 'mock-jwt-token-worker', user: this.workerUser(p) };
  }
  async loginWithEmail(email: string, password: string): Promise<{ token: string; user: User }> {
    const e = email.trim().toLowerCase();
    if (e.includes('admin')) {
      const user: User = {
        id: 'admin',
        name: 'IndustriaLink Admin',
        phone: '+91 99999 88888',
        email: e,
        role: 'admin',
        status: 'active',
        onboarded: true,
        createdAt: new Date().toISOString(),
      } as User;
      return { token: 'mock-jwt-token-admin', user };
    }
    const acc = this.employerAccounts.find((a) => a.email === e);
    if (!acc || acc.password !== password) this.fail('The email or password is not right.', 'INVALID_CREDENTIALS');
    if (this.isSuspended(acc.companyId)) this.fail(`Your account is suspended${this.suspendReasonOf(acc.companyId)}. Please contact help.`, 'BLOCKED');
    this.companyId = acc.companyId;
    return { token: 'mock-jwt-token-employer', user: this.employerUser(acc) };
  }
  async getMe(token: string): Promise<User> {
    if (token.includes('admin')) {
      return {
        id: 'usr_admin_1',
        name: 'IndustriaLink Admin',
        phone: '+91 99999 88888',
        role: 'admin',
        status: 'active',
        onboarded: true,
        createdAt: '2026-01-01T00:00:00Z',
      };
    }
    if (token.includes('employer')) {
      return {
        id: 'emp:emp_demo',
        name: 'Pradeep Mohanty',
        phone: '+91 98111 22334',
        email: 'hr@eastline.demo',
        role: 'employer',
        status: 'active',
        onboarded: true,
        companyId: 'emp_demo',
        companyName: 'Eastline Heavy Engineering',
        createdAt: '2026-01-01T00:00:00Z',
      };
    }
    return {
      id: 'usr_worker_1',
      name: this.workerProfile.name,
      phone: this.workerProfile.phone,
      role: 'worker',
      status: 'active',
      onboarded: true,
      city: this.workerProfile.location?.city,
      trade: this.workerProfile.trade,
      createdAt: '2026-01-01T00:00:00Z',
    };
  }

  // Worker Operations
  async getWorkerSummary(): Promise<WorkerSummary> {
    const mine = this.applications.filter((a) => a.workerId === this.workerId);
    const activeApps = mine.filter((a) => !['hired', 'rejected', 'withdrawn'].includes(a.stage)).length;
    const interviews = mine.filter((a) => a.stage === 'interview').length;
    const p = this.workerProfile;
    const docs = this.documents;
    // Each item adds its points when done; what is not done becomes the "missing" list.
    const items: { key: string; label: string; hint: string; points: number; done: boolean; link: string }[] = [
      { key: 'trade', label: 'Your trade', hint: 'Add your trade so the right jobs show first', points: 15, done: !!p.trade, link: '/worker/profile?edit=work' },
      { key: 'experience', label: 'Your experience', hint: 'Add how long you have worked', points: 10, done: !!p.experience, link: '/worker/profile?edit=work' },
      { key: 'location', label: 'Your city and state', hint: 'Add your city and state', points: 10, done: !!(p.location?.city && p.location?.state), link: '/worker/profile?edit=personal' },
      { key: 'dob', label: 'Date of birth', hint: 'Add your date of birth', points: 10, done: !!p.dob, link: '/worker/profile?edit=personal' },
      { key: 'education', label: 'Education', hint: 'Add your education so employers can shortlist you', points: 10, done: p.qualifications.length > 0, link: '/worker/profile?edit=work' },
      { key: 'pay', label: 'Expected pay', hint: 'Add the pay you expect', points: 5, done: !!p.expectedPay, link: '/worker/profile?edit=preferences' },
      { key: 'about', label: 'About you', hint: 'Write one line about your work', points: 5, done: !!p.about, link: '/worker/profile?edit=personal' },
      { key: 'skills', label: 'Skills', hint: 'Add your skills', points: 5, done: p.skills.length > 0, link: '/worker/profile?edit=work' },
      { key: 'history', label: 'Past jobs', hint: 'Add where you worked before', points: 5, done: (p.workHistory?.length ?? 0) > 0, link: '/worker/profile?edit=work' },
      { key: 'photo', label: 'Profile photo', hint: 'Add a clear photo of your face', points: 5, done: !!p.photoUrl, link: '/worker/profile' },
      { key: 'resume', label: 'Resume', hint: 'Upload your resume so employers can see it', points: 10, done: docs.some((d) => d.type === 'resume'), link: '/worker/profile?tab=documents' },
      { key: 'certificate', label: 'ITI certificate', hint: 'Upload your ITI certificate so employers can see it', points: 10, done: docs.some((d) => d.type === 'iti_diploma'), link: '/worker/profile?tab=documents' },
    ];
    const profileStrength = items.filter((i) => i.done).reduce((n, i) => n + i.points, 0);
    const missing = items.filter((i) => !i.done);
    // The next thing that needs the worker: a coming interview, else an offer waiting for an answer.
    const upcoming = mine
      .filter((a) => a.stage === 'interview' && a.interview && new Date(a.interview.at).getTime() > Date.now() - 6 * 3600_000)
      .sort((a, b) => +new Date(a.interview!.at) - +new Date(b.interview!.at))[0];
    const offer = mine.find((a) => a.stage === 'offer' && !a.offerResponse);
    const jobOf = (a: Application) => this.jobs.find((j) => j.id === a.jobId);
    return {
      activeApplications: activeApps,
      interviews,
      saved: this.workerSaved[this.workerId]?.length ?? 0,
      profileStrength,
      profileHint: missing[0]?.hint,
      missing: missing.map((m) => ({ key: m.key, label: m.label, link: m.link })),
      nextStep: upcoming
        ? {
            title: 'Interview scheduled',
            subtitle: `${upcoming.interview!.place} with ${jobOf(upcoming)?.companyName ?? 'the company'}`,
            link: `/worker/applications/${upcoming.id}`,
            at: upcoming.interview!.at,
          }
        : offer
        ? {
            title: 'You have a job offer',
            subtitle: `${jobOf(offer)?.title ?? 'Job'} at ${jobOf(offer)?.companyName ?? 'the company'}. Reply to accept or decline.`,
            link: `/worker/applications/${offer.id}`,
          }
        : undefined,
    };
  }
  async getJobs(params?: { search?: string; trade?: string }): Promise<JobForWorker[]> {
    return this.jobs
      .filter((j) => {
        if (!this.jobOpen(j)) return false;
        if (params?.trade && j.trade !== params.trade) return false;
        if (params?.search) {
          const s = params.search.toLowerCase();
          return (
            j.title.toLowerCase().includes(s) ||
            j.companyName.toLowerCase().includes(s) ||
            j.location.city.toLowerCase().includes(s)
          );
        }
        return true;
      })
      .map((j) => this.mapJobForWorker(j));
  }

  async searchJobs(params?: JobSearchParams): Promise<Paginated<JobForWorker>> {
    let items = this.jobs.filter((j) => this.jobOpen(j)).map((j) => this.mapJobForWorker(j));
    if (params?.trade) {
      items = items.filter((j) => j.trade === params.trade);
    }
    if (params?.sector) {
      items = items.filter((j) => j.sector === params.sector);
    }
    if (params?.shift) {
      items = items.filter((j) => j.shift === params.shift);
    }
    if (params?.minPay) {
      items = items.filter((j) => (j.payMax ?? j.payMin ?? 0) >= params.minPay!);
    }
    if (params?.walkInOnly) {
      items = items.filter((j) => j.jobType === 'walk_in');
    }
    if (params?.verifiedOnly) {
      items = items.filter((j) => j.companyVerified);
    }
    if (params?.foodStay) {
      items = items.filter((j) => j.benefits.includes('food') || j.benefits.includes('stay'));
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      items = items.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.location.city.toLowerCase().includes(q)
      );
    }
    if (params?.city) {
      const c = params.city.toLowerCase();
      items = items.filter((j) => j.location.city.toLowerCase().includes(c));
    }
    if (params?.sort === 'pay') {
      items.sort((a, b) => (b.payMax || 0) - (a.payMax || 0));
    } else {
      items.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }

    return {
      items,
      total: items.length,
      page: params?.page || 1,
      pageSize: 20,
    };
  }

  async getJobById(id: string): Promise<JobForWorker | null> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return null;
    return this.mapJobForWorker(job);
  }

  async getSavedJobs(): Promise<JobForWorker[]> {
    return this.jobs
      .filter((j) => this.savedJobIds.has(j.id))
      .map((j) => this.mapJobForWorker(j));
  }

  async toggleSaveJob(id: string, forceState?: boolean): Promise<boolean> {
    const list = new Set(this.workerSaved[this.workerId] ?? []);
    const next = forceState ?? !list.has(id);
    if (next) list.add(id);
    else list.delete(id);
    this.workerSaved[this.workerId] = [...list];
    return next;
  }
  async applyJob(
    jobId: string,
    payload?: { sentWith?: string; documentId?: string }
  ): Promise<Application> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job || !this.jobOpen(job)) this.fail('This job is closed. You cannot apply to it now.', 'JOB_CLOSED');
    const mine = this.applications.filter((a) => a.jobId === jobId && a.workerId === this.workerId);
    const live = mine.find((a) => a.stage !== 'withdrawn');
    if (live) {
      this.fail(
        live.stage === 'rejected' ? 'This company has already replied to your application.' : 'You already applied to this job.',
        'ALREADY_APPLIED'
      );
    }
    const p = this.workerProfile;
    const lacking = [
      !p.trade && 'your trade',
      !p.experience && 'your experience',
      !(p.location?.city && p.location?.state) && 'your city and state',
      !p.dob && 'your date of birth',
    ].filter(Boolean) as string[];
    if (lacking.length) this.fail(`Add ${lacking.join(', ')} to your profile before you apply.`, 'PROFILE_INCOMPLETE');

    const now = new Date().toISOString();
    // A withdrawn application can be sent again: it becomes a new application.
    const newApp: Application = {
      id: this.uid('app'),
      jobId,
      workerId: this.workerId,
      stage: 'applied',
      appliedAt: now,
      updatedAt: now,
      sentWith: (payload?.sentWith as any) || 'profile',
      documentId: payload?.documentId,
      timeline: [{ stage: 'applied', at: now }],
    };
    this.applications.unshift(newApp);
    job.applicantsCount += 1;
    job.newApplicantsCount += 1;
    this.notify(this.jobOwnerAcct(job), 'New applicant', `${p.name} applied for ${job.title}.`, 'candidates');
    return newApp;
  }
  /** What a worker may see of an application: HR-only notes are removed. */
  private forWorker(a: Application): WorkerApplication | null {
    const job = this.jobs.find((j) => j.id === a.jobId);
    if (!job) return null;
    const { rejectionNote: _hidden, hrNote: _private, ...rest } = a;
    return {
      ...rest,
      timeline: a.timeline.map((e) => (e.stage === 'rejected' ? { stage: e.stage, at: e.at } : e)),
      job,
      contact:
        ['shortlisted', 'interview', 'offer', 'hired'].includes(a.stage) && job.allowCalls
          ? { phone: job.hrPhone || '', hours: job.callHours }
          : undefined,
    } as WorkerApplication;
  }

  async getApplications(): Promise<WorkerApplication[]> {
    return this.applications
      .filter((a) => a.workerId === this.workerId)
      .map((a) => this.forWorker(a))
      .filter(Boolean) as WorkerApplication[];
  }
  async getApplicationById(id: string): Promise<WorkerApplication | null> {
    const a = this.applications.find((app) => app.id === id && app.workerId === this.workerId);
    return a ? this.forWorker(a) : null;
  }
  async withdrawApplication(id: string): Promise<void> {
    const app = this.applications.find((a) => a.id === id && a.workerId === this.workerId);
    if (!app) return;
    if (['hired', 'rejected', 'withdrawn'].includes(app.stage)) this.fail('This application is already closed.', 'CLOSED');
    const job = this.jobs.find((j) => j.id === app.jobId);
    app.stage = 'withdrawn';
    app.updatedAt = new Date().toISOString();
    app.timeline.push({ stage: 'withdrawn', at: app.updatedAt });
    if (job) this.notify(this.jobOwnerAcct(job), 'Application withdrawn', `${this.workerProfile.name} withdrew from ${job.title}.`, 'candidates');
  }
  async replyInterview(
    id: string,
    response: 'attending' | 'cant_attend',
    note?: string
  ): Promise<void> {
    const app = this.applications.find((a) => a.id === id && a.workerId === this.workerId);
    if (!app || !app.interview) return;
    app.interview.response = response;
    app.interview.responseNote = note;
    app.interview.respondedAt = new Date().toISOString();
    const job = this.jobs.find((j) => j.id === app.jobId);
    if (job) {
      this.notify(
        this.jobOwnerAcct(job),
        response === 'attending' ? 'Interview confirmed' : 'Cannot attend the interview',
        `${this.workerProfile.name} ${response === 'attending' ? 'will attend' : 'cannot attend'} the interview for ${job.title}.${note ? ` "${note}"` : ''}`,
        'candidates'
      );
    }
  }
  async replyOffer(
    id: string,
    response: 'accepted' | 'declined',
    note?: string
  ): Promise<void> {
    const app = this.applications.find((a) => a.id === id && a.workerId === this.workerId);
    if (!app || app.stage !== 'offer') return;
    app.offerResponse = response;
    app.updatedAt = new Date().toISOString();
    // Accepting keeps the stage at "offer" until HR confirms the joining; declining ends the application.
    if (response === 'declined') {
      app.stage = 'withdrawn';
      app.rejectionNote = note;
      app.timeline.push({ stage: 'withdrawn', at: app.updatedAt });
    }
    const job = this.jobs.find((j) => j.id === app.jobId);
    if (job) {
      this.notify(
        this.jobOwnerAcct(job),
        response === 'accepted' ? 'Offer accepted' : 'Offer declined',
        `${this.workerProfile.name} ${response === 'accepted' ? 'accepted' : 'declined'} the offer for ${job.title}.${note ? ` "${note}"` : ''}`,
        'candidates'
      );
    }
  }
  async getDocuments(): Promise<WorkerDocument[]> {
    return this.documents;
  }

  async uploadDocument(doc: { name: string; type: any; fileUrl: string; mimeType?: string; sizeBytes?: number }): Promise<WorkerDocument> {
    const newDoc: WorkerDocument = {
      id: this.uid('doc'),
      ownerId: this.workerId,
      name: doc.name,
      type: doc.type,
      sizeBytes: doc.sizeBytes ?? 1024 * 350,
      mimeType: doc.mimeType ?? 'application/pdf',
      uploadedAt: new Date().toISOString(),
      url: doc.fileUrl,
    };
    this.documents.push(newDoc);
    return newDoc;
  }

  async deleteDocument(id: string): Promise<void> {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc) return;
    const resumes = this.documents.filter((d) => d.type === 'resume');
    if (doc.type === 'resume' && resumes.length === 1) {
      throw new Error('This is your only resume. Add another one before deleting it.');
    }
    this.documents = this.documents.filter((d) => d.id !== id);
    // If the default resume was removed, the newest remaining resume becomes the default.
    if (doc.isDefaultResume) {
      const next = this.documents.filter((d) => d.type === 'resume').pop();
      if (next) next.isDefaultResume = true;
    }
  }

  async setDefaultResume(id: string): Promise<void> {
    this.documents.forEach((d) => {
      if (d.type === 'resume') d.isDefaultResume = d.id === id;
    });
  }

  async getWorkerProfile(): Promise<WorkerProfile> {
    return this.workerProfile;
  }

  async updateWorkerProfile(partial: Partial<WorkerProfile>): Promise<WorkerProfile> {
    this.workerProfile = { ...this.workerProfile, ...partial };
    return this.workerProfile;
  }

  async getCompanyForWorker(id: string): Promise<CompanyForWorker | null> {
    const company = this.allCompanies().find((c) => c.id === id);
    if (!company || this.isSuspended(company.id)) return null;
    const jobs = this.jobs.filter((j) => j.companyId === company.id && this.jobOpen(j)).map((j) => this.mapJobForWorker(j));
    return { company, jobs };
  }
  async listCompanies(params?: { q?: string; sector?: string }): Promise<{ company: Company; openJobs: number }[]> {
    const q = params?.q?.trim().toLowerCase();
    return this.allCompanies()
      .filter((c) => c.verification === 'approved' && !this.isSuspended(c.id))
      .filter((c) => !params?.sector || c.sector === params.sector)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.location.city.toLowerCase().includes(q))
      .map((company) => ({
        company,
        openJobs: this.jobs.filter((j) => j.companyId === company.id && this.jobOpen(j)).length,
      }))
      .sort((a, b) => b.openJobs - a.openJobs);
  }
  // ---- Inbox: notifications and messages ----
  private notifications: AppNotification[] = [
    { id: 'n_w1', link: 'application:app_1', userId: 'usr_worker_1', title: 'Interview scheduled', body: 'Gate interview at Kalinganagar Plant tomorrow, 10:30 AM. Bring your ITI certificate.', at: '2026-11-12T08:30:00Z', read: false },
    { id: 'n_w2', link: 'application:app_1', userId: 'usr_worker_1', title: 'You were shortlisted', body: 'Your application for Welder was shortlisted.', at: '2026-11-11T14:10:00Z', read: false },
    { id: 'n_w3', link: 'jobs', userId: 'usr_worker_1', title: 'New jobs near you', body: '5 new welding jobs were posted in Kalinganagar.', at: '2026-11-10T07:00:00Z', read: true },
    { id: 'n_e1', link: 'candidates', userId: 'emp:emp_demo', title: 'New applicants', body: '3 new applicants are waiting for your review.', at: '2026-11-12T09:00:00Z', read: false },
    { id: 'n_e2', link: 'candidates', userId: 'emp:emp_demo', title: 'Interview reply', body: 'A worker confirmed they will attend the gate interview.', at: '2026-11-11T16:40:00Z', read: false },
    { id: 'n_e3', userId: 'emp:emp_demo', title: 'Company approved', body: 'Your company is verified. Workers can now see your jobs.', at: '2026-10-21T11:00:00Z', read: true },
  ];

  private messages: Message[] = [];
  private seedAdminNotes: AppNotification[] = [
    { id: 'n_a1', userId: 'admin', title: 'Company waiting for approval', body: 'Kalinganagar Manpower Services is waiting for your review.', at: '2026-11-11T08:20:00Z', read: false, link: 'verifications' },
    { id: 'n_a2', userId: 'admin', title: 'Job reported', body: 'Automotive Spot & Robotic Welder has 2 reports about asking for money.', at: '2026-11-12T05:40:00Z', read: false, link: 'reports' },
  ];
  private lastRead: Record<string, string> = {};
  private adminNotesAdded = false;
  private messagesSeeded = false;

  private async eligibleThreads(role: 'worker' | 'employer'): Promise<MessageThread[]> {
    const ok = (stage: string) => ['shortlisted', 'interview', 'offer', 'hired'].includes(stage);
    const last = (id: string) => this.messages.filter((m) => m.applicationId === id).sort((a, b) => +new Date(a.at) - +new Date(b.at)).pop();
    const unread = (id: string) => {
      const seen = this.lastRead[`${role}:${id}`] ?? '';
      return this.messages.filter((m) => m.applicationId === id && m.fromRole !== role && m.at > seen).length;
    };
    const base =
      role === 'worker'
        ? this.applications
            .filter((a) => a.workerId === this.workerId && ok(a.stage))
            .map((a) => {
              const job = this.jobs.find((j) => j.id === a.jobId);
              return { id: a.id, stage: a.stage, jobTitle: job?.title ?? 'Job', companyName: job?.companyName ?? 'Company', workerName: this.workerProfile.name, otherName: `${job?.companyName ?? 'Company'} HR` };
            })
        : (await this.getCandidates())
            .filter((c) => ok(c.stage))
            .map((c) => ({ id: c.id, stage: c.stage, jobTitle: c.jobTitle, companyName: this.myCompany.name, workerName: c.worker.name, otherName: c.worker.name }));
    if (!this.messagesSeeded && base[0]) {
      this.messagesSeeded = true;
      const id = this.applications.find((a) => a.workerId === 'usr_worker_1' && ok(a.stage))?.id ?? base[0].id;
      this.messages.push(
        { id: 'm_seed1', applicationId: id, fromUserId: 'usr_employer_1', fromRole: 'employer', text: 'Hello. Your profile was shortlisted. Can you visit the plant gate tomorrow?', at: '2026-11-12T10:15:00Z' },
        { id: 'm_seed2', applicationId: id, fromUserId: 'usr_worker_1', fromRole: 'worker', text: 'Yes, I can come at 10:30 AM. Should I bring my original ITI certificate?', at: '2026-11-12T10:18:00Z' },
        { id: 'm_seed3', applicationId: id, fromUserId: 'usr_employer_1', fromRole: 'employer', text: 'Yes. Please bring your Aadhaar copy, ITI certificate and safety shoes.', at: '2026-11-12T10:20:00Z' },
      );
    }
    return base
      .map((b) => {
        const l = last(b.id);
        return { applicationId: b.id, jobTitle: b.jobTitle, companyName: b.companyName, workerName: b.workerName, otherName: b.otherName, stage: b.stage, lastMessage: l?.text, lastAt: l?.at, unread: unread(b.id), canSend: true } as MessageThread;
      })
      .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''));
  }

  async getThreads(role: 'worker' | 'employer'): Promise<MessageThread[]> {
    return this.eligibleThreads(role);
  }

  async getThread(role: 'worker' | 'employer', applicationId: string): Promise<{ thread: MessageThread; messages: Message[] }> {
    const thread = (await this.eligibleThreads(role)).find((t) => t.applicationId === applicationId);
    if (!thread) throw new Error('This conversation is not available yet.');
    this.lastRead[`${role}:${applicationId}`] = new Date().toISOString();
    const messages = this.messages.filter((m) => m.applicationId === applicationId).sort((a, b) => +new Date(a.at) - +new Date(b.at));
    return { thread: { ...thread, unread: 0 }, messages };
  }

  async sendMessage(role: 'worker' | 'employer', applicationId: string, text: string): Promise<Message> {
    if (!this.platformSettings.messagingEnabled) this.fail('Messaging is turned off for now.', 'DISABLED');
    const thread = (await this.eligibleThreads(role)).find((t) => t.applicationId === applicationId);
    if (!thread) this.fail('You can message after the worker is shortlisted.', 'NOT_ALLOWED');
    const m: Message = {
      id: this.uid('m'),
      applicationId,
      fromUserId: role === 'worker' ? this.workerId : `emp:${this.companyId}`,
      fromRole: role,
      text: text.trim(),
      at: new Date().toISOString(),
    };
    this.messages.push(m);
    this.lastRead[`${role}:${applicationId}`] = m.at;
    const app = this.applications.find((a) => a.id === applicationId) ?? this.pool.find((a) => a.id === applicationId);
    const job = app ? this.jobs.find((j) => j.id === app.jobId) : undefined;
    if (role === 'worker') {
      if (job) this.notify(this.jobOwnerAcct(job), `Message from ${thread.workerName}`, m.text.slice(0, 90), `thread:${applicationId}`);
    } else if (app) {
      this.notify(app.workerId, `Message from ${thread.companyName}`, m.text.slice(0, 90), `thread:${applicationId}`);
    }
    return m;
  }
  async getNotifications(role: 'worker' | 'employer' | 'admin'): Promise<AppNotification[]> {
    if (!this.adminNotesAdded) {
      this.adminNotesAdded = true;
      this.notifications.push(...this.seedAdminNotes);
    }
    const me = this.acct(role);
    return this.notifications.filter((n) => n.userId === me).sort((a, b) => b.at.localeCompare(a.at));
  }
  async markNotificationRead(id: string): Promise<void> {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  }

  async markAllNotificationsRead(role: 'worker' | 'employer' | 'admin'): Promise<void> {
    const me = this.acct(role);
    this.notifications = this.notifications.map((n) => (n.userId === me ? { ...n, read: true } : n));
  }
  // Employer Operations
  async getEmployerSummary(): Promise<EmployerSummary> {
    const all = await this.getCandidates();
    const jobs = await this.getEmployerJobs();
    const openJobs = jobs.filter((j) => j.status === 'active').length;
    const newApplicants = all.filter((c) => c.stage === 'applied').length;
    const reached = (s: ApplicationStage) =>
      all.filter((c) => c.timeline.some((t) => t.stage === s)).length;
    return {
      openJobs,
      newApplicants,
      interviewsThisWeek: all.filter((c) => c.stage === 'interview').length,
      hiredThisMonth: all.filter((c) => c.stage === 'hired').length,
      attention: [
        {
          id: 'att_1',
          text: `${newApplicants} new applicants are waiting for your review`,
          link: '/employer/candidates?stage=applied',
          action: 'Review',
        },
      ],
      applicantsPerDay: Array.from({ length: 7 }, (_, k) => {
        const day = new Date(NOW - (6 - k) * DAY);
        const key = day.toDateString();
        return {
          day: day.toLocaleDateString('en-IN', { weekday: 'short' }),
          count: all.filter((c) => new Date(c.appliedAt).toDateString() === key).length,
        };
      }),
      funnel: [
        { stage: 'Applied', count: all.length },
        { stage: 'Shortlisted', count: reached('shortlisted') },
        { stage: 'Interview', count: reached('interview') },
        { stage: 'Hired', count: reached('hired') },
      ],
    };
  }

  /** Jobs that belong to the signed-in company. */
  private ownJobs(): Job[] {
    return this.jobs.filter((j) => this.ownerOf(j) === this.companyId);
  }

  async getEmployerJobs(status?: string): Promise<Job[]> {
    const all = await this.getCandidates();
    return this.ownJobs()
      .filter((j) => !status || j.status === status)
      .map((j) => {
        const mine = all.filter((c) => c.jobId === j.id);
        return {
          ...j,
          applicantsCount: mine.length,
          newApplicantsCount: mine.filter((c) => c.stage === 'applied').length,
        };
      });
  }
  private checkNoFees(data: any) {
    if (data?.status !== 'active') return;
    const hits = findFeeWording(data.title, ...(data.responsibilities ?? []), ...(data.requirements ?? []), data.walkIn?.bring);
    if (hits.length) this.fail('This job asks workers for money. Remove that wording before you publish.', 'FEE_WORDING');
  }
  async createJob(data: any): Promise<Job> {
    this.checkNoFees(data);
    const c = this.myCompany;
    if (data?.status !== 'draft' && c.verification !== 'approved') {
      this.fail('You can publish jobs after your company is verified. Save it as a draft for now.', 'NOT_VERIFIED');
    }
    const newJob: Job = {
      id: this.uid('job'),
      companyId: c.id,
      ownerCompanyId: c.id,
      companyName: c.name,
      companyLogoUrl: c.logoUrl,
      companyVerified: c.verification === 'approved',
      postedAt: new Date().toISOString(),
      applicantsCount: 0,
      newApplicantsCount: 0,
      status: 'active',
      payPeriod: 'month',
      jobType: 'full_time',
      experience: '1_2',
      qualifications: ['ITI'],
      benefits: ['food', 'pf_esi'],
      responsibilities: ['Factory fabrication and maintenance'],
      requirements: ['Valid ITI diploma'],
      allowCalls: true,
      openings: 5,
      ...data,
    };
    this.jobs.unshift(newJob);
    return newJob;
  }
  async updateJob(id: string, changes: any): Promise<Job> {
    this.checkNoFees(changes);
    const i = this.jobs.findIndex((j) => j.id === id && this.ownerOf(j) === this.companyId);
    if (i < 0) this.fail('This job no longer exists.', 'NOT_FOUND');
    const wasLive = this.jobs[i]!.status === 'active';
    if (changes?.status === 'active' && !wasLive && this.myCompany.verification !== 'approved') {
      this.fail('You can publish jobs after your company is verified. Save it as a draft for now.', 'NOT_VERIFIED');
    }
    this.jobs[i] = { ...this.jobs[i]!, ...changes, id };
    return this.jobs[i]!;
  }
  async deleteJob(id: string): Promise<void> {
    this.jobs = this.jobs.filter((j) => !(j.id === id && this.ownerOf(j) === this.companyId));
  }
  async getCandidates(jobId?: string): Promise<Candidate[]> {
    const mineIds = new Set(this.ownJobs().map((j) => j.id));
    // ID proof is shown to HR only after the worker is shortlisted.
    const shown = (a: Application, docs: WorkerDocument[]) =>
      docs.filter((d) => d.type !== 'id_proof' || ['shortlisted', 'interview', 'offer', 'hired'].includes(a.stage));
    const own: Candidate[] = this.applications
      .filter((a) => mineIds.has(a.jobId))
      .map((a) => ({
        ...a,
        worker: this.profiles[a.workerId] ?? this.seedProfile,
        jobTitle: '',
        documents: shown(a, this.workerDocs[a.workerId] ?? []),
      }));
    const score = (c: Candidate) => {
      const j = this.jobs.find((x) => x.id === c.jobId);
      return j ? matchScore(c.worker, j) : undefined;
    };
    const pool = this.pool.filter((c) => mineIds.has(c.jobId));
    return [...own, ...pool]
      .filter((c) => (!jobId ? true : c.jobId === jobId))
      .map((c) => ({ ...c, match: score(c), jobTitle: this.jobs.find((j) => j.id === c.jobId)?.title || 'Industrial Worker' }))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }
  async getCompanyDocuments(): Promise<CompanyDocument[]> {
    return this.companyDocs[this.companyId] ?? [];
  }
  async uploadCompanyDocument(doc: { name: string; type: CompanyDocType; fileUrl: string; sizeBytes?: number; mimeType?: string }): Promise<CompanyDocument> {
    const d: CompanyDocument = {
      id: this.uid('cdoc'),
      companyId: this.companyId,
      name: doc.name,
      type: doc.type,
      sizeBytes: doc.sizeBytes ?? 1024 * 300,
      mimeType: doc.mimeType ?? 'application/pdf',
      uploadedAt: new Date().toISOString(),
      url: doc.fileUrl,
    };
    this.companyDocs[this.companyId] = [...(this.companyDocs[this.companyId] ?? []), d];
    return d;
  }
  async deleteCompanyDocument(id: string): Promise<void> {
    if (this.myCompany.verification === 'approved') {
      this.fail('Documents cannot be removed after your company is approved.', 'LOCKED');
    }
    this.companyDocs[this.companyId] = (this.companyDocs[this.companyId] ?? []).filter((d) => d.id !== id);
  }
  private platformSettings: PlatformSettings = {
    autoApproveCompanies: false,
    messagingEnabled: true,
    talentSearchEnabled: true,
  };

  async getPlatformSettings(): Promise<PlatformSettings> {
    return this.platformSettings;
  }

  async updatePlatformSettings(changes: Partial<PlatformSettings>): Promise<PlatformSettings> {
    this.platformSettings = { ...this.platformSettings, ...changes };
    return this.platformSettings;
  }

  async getMyCompany(): Promise<Company> {
    return this.myCompany;
  }

  async updateMyCompany(changes: Partial<Company> & { resubmit?: boolean }): Promise<Company> {
    const { resubmit, ...rest } = changes;
    const before = this.myCompany;
    let next: Company = { ...before, ...rest };
    if (resubmit) {
      if ((this.companyDocs[this.companyId] ?? []).length === 0) {
        this.fail('Add your GST certificate before you send the company for review.', 'NO_DOCUMENTS');
      }
      next = { ...next, verification: 'pending', rejectionReason: undefined };
      const v = this.verifications.find((x) => x.id === this.companyId);
      if (v) {
        v.status = 'pending';
        v.submittedAt = new Date().toISOString();
        delete v.details['Rejection reason'];
      }
      const u = this.adminUsers.find((x) => x.id === this.companyId);
      if (u) u.verification = 'pending';
      this.notify('admin', 'Company sent again for review', `${next.name} fixed its details and sent them again.`, 'verifications');
    }
    this.myCompany = next;
    // The company name and logo also appear on its jobs.
    if (rest.name || rest.logoUrl !== undefined) {
      this.jobs.forEach((j) => {
        if (this.ownerOf(j) === this.companyId) {
          if (rest.name) j.companyName = rest.name;
          if (rest.logoUrl !== undefined) j.companyLogoUrl = rest.logoUrl;
        }
      });
    }
    return this.myCompany;
  }
  async getEmployerAnalytics(): Promise<EmployerAnalytics> {
    const all = await this.getCandidates();
    const jobs = await this.getEmployerJobs();
    const hired = all.filter((c) => c.stage === 'hired');
    const openings = jobs.filter((j) => j.status === 'active').reduce((n, j) => n + j.openings, 0);
    const days = hired.map((c) => (+new Date(c.updatedAt) - +new Date(c.appliedAt)) / DAY);
    const byState = new Map<string, number>();
    all.forEach((c) => {
      const st = c.worker.location?.state ?? 'Not given';
      byState.set(st, (byState.get(st) ?? 0) + 1);
    });
    const reached = (list: Candidate[], st: ApplicationStage) =>
      list.filter((c) => c.timeline.some((t) => t.stage === st)).length;
    return {
      totalApplicants: all.length,
      hired: hired.length,
      fillRate: openings ? Math.round((hired.length / openings) * 100) : 0,
      avgDaysToHire: days.length ? days.reduce((a, b) => a + b, 0) / days.length : null,
      resumeShare: all.length ? Math.round((all.filter((c) => c.sentWith === 'document').length / all.length) * 100) : 0,
      applicantsPerWeek: Array.from({ length: 8 }, (_, k) => {
        const end = NOW - (7 - k) * 7 * DAY;
        const start = end - 7 * DAY;
        return {
          week: new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          count: all.filter((c) => {
            const t = +new Date(c.appliedAt);
            return t > start && t <= end;
          }).length,
        };
      }),
      byState: [...byState].map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count),
      byJob: jobs.map((j) => {
        const mine = all.filter((c) => c.jobId === j.id);
        return {
          jobId: j.id,
          title: j.title,
          openings: j.openings,
          applied: mine.length,
          shortlisted: reached(mine, 'shortlisted'),
          interview: reached(mine, 'interview'),
          hired: reached(mine, 'hired'),
        };
      }),
    };
  }

  async getEmployerJob(id: string): Promise<Job | null> {
    return this.ownJobs().find((j) => j.id === id) ?? null;
  }
  /** Which step each application may move to next. */
  private static readonly NEXT: Partial<Record<ApplicationStage, ApplicationStage[]>> = {
    applied: ['shortlisted', 'interview', 'offer', 'rejected'],
    shortlisted: ['interview', 'offer', 'rejected'],
    interview: ['interview', 'offer', 'rejected'],
    offer: ['offer', 'hired', 'rejected'],
  };

  private findApplication(id: string): Application | undefined {
    const mineIds = new Set(this.ownJobs().map((j) => j.id));
    const a = this.applications.find((x) => x.id === id) ?? this.pool.find((x) => x.id === id);
    return a && mineIds.has(a.jobId) ? a : undefined;
  }

  /** HR opened the application: the worker sees "Seen by employer" (once). */
  async markViewed(appId: string): Promise<void> {
    const app = this.findApplication(appId);
    if (!app || app.timeline.some((e) => e.stage === 'viewed')) return;
    const at = new Date().toISOString();
    app.timeline.push({ stage: 'viewed', at });
    app.updatedAt = at;
  }

  async updateCandidateStage(appId: string, stage: ApplicationStage, payload?: any): Promise<void> {
    const app = this.findApplication(appId);
    if (!app) this.fail('This application is not available.', 'NOT_FOUND');
    if (!(MockDatabase.NEXT[app.stage] ?? []).includes(stage)) {
      this.fail('This move is not possible from the current step.', 'INVALID_STEP');
    }
    const job = this.jobs.find((j) => j.id === app.jobId);
    const company = job?.companyName ?? 'the company';
    const title = job?.title ?? 'the job';
    const at = new Date().toISOString();
    await this.markViewed(appId);

    const rescheduled = stage === 'interview' && app.stage === 'interview';
    app.stage = stage;
    app.updatedAt = at;
    app.timeline.push({ stage, at, ...(stage === 'rejected' && payload?.reason ? { note: String(payload.reason) } : {}) });

    if (stage === 'interview') {
      app.interview = {
        at: payload?.at || new Date(Date.now() + 86400000).toISOString(),
        place: payload?.place || 'The plant gate',
        contactPerson: payload?.contactPerson || undefined,
        bring: payload?.bring || undefined,
        note: payload?.note || undefined,
      };
    }
    if (stage === 'offer') {
      app.offer = {
        pay: Number(payload?.pay) || 0,
        payPeriod: payload?.payPeriod || 'month',
        payType: payload?.payType,
        joiningDate: payload?.joiningDate || '',
        place: payload?.place || this.myCompany.address || this.myCompany.location.city,
        note: payload?.note || undefined,
        replyBy: payload?.replyBy || undefined,
        sentAt: at,
      };
      app.offerResponse = undefined;
    }
    if (stage === 'rejected') app.rejectionNote = payload?.reason ? String(payload.reason) : undefined;
    if (stage === 'hired') {
      app.joinedAt = payload?.joinedAt || at.slice(0, 10);
      // Count the people hired for this job; at zero openings left, tell HR to close it.
      if (job) {
        const hired = [...this.applications, ...this.pool].filter((x) => x.jobId === job.id && x.stage === 'hired').length;
        if (hired >= job.openings) {
          this.notify(this.jobOwnerAcct(job), 'All openings filled', `${job.title} has ${hired} of ${job.openings} people hired. Close the job so workers stop applying.`, 'jobs');
        }
      }
    }

    // Tell the worker. A rejection is always a kind, generic message: HR's note stays private.
    const link = `application:${app.id}`;
    const tell = (t: string, b: string) => this.notify(app.workerId, t, b, link);
    if (stage === 'shortlisted') tell('You were shortlisted', `${company} shortlisted you for ${title}.`);
    if (stage === 'interview') tell(rescheduled ? 'Interview moved' : 'Interview scheduled', `${company} has set an interview for ${title}. Open it to see the time and place.`);
    if (stage === 'offer') tell('You have a job offer', `${company} sent you an offer for ${title}. Reply to accept or decline.`);
    if (stage === 'hired') tell('Welcome aboard', `${company} confirmed your joining for ${title}.`);
    if (stage === 'rejected' && payload?.notify !== false) {
      tell('Update on your application', `${company} has chosen other candidates for ${title} for now. Keep applying: more jobs are waiting.`);
    }
  }
  async saveCandidateNote(appId: string, note: string): Promise<void> {
    const app = this.findApplication(appId);
    if (!app) this.fail('This application is not available.', 'NOT_FOUND');
    app.hrNote = note.trim().slice(0, 500) || undefined;
  }
  async searchTalent(params?: { trade?: string; city?: string }): Promise<TalentProfile[]> {
    if (!this.platformSettings.talentSearchEnabled) this.fail('Find workers is turned off for now.', 'DISABLED');
    if (this.myCompany.verification !== 'approved') this.fail('You can search workers after your company is verified.', 'NOT_VERIFIED');
    return this.talent.filter(
      (t) =>
        (!params?.trade || t.trade === params.trade) &&
        (!params?.city || t.location?.city.toLowerCase().includes(params.city.toLowerCase()))
    );
  }
  private inviteLog: Record<string, number> = {};
  async inviteTalent(workerId: string, jobId: string): Promise<void> {
    if (this.myCompany.verification !== 'approved') this.fail('You can invite workers after your company is verified.', 'NOT_VERIFIED');
    const t = this.talent.find((x) => x.userId === workerId);
    if (!t) return;
    if (t.appliedTo.includes(jobId) || t.invitedTo.includes(jobId)) this.fail('This worker was already invited or has applied.', 'ALREADY_DONE');
    const today = new Date().toISOString().slice(0, 10);
    const used = this.inviteLog[`${this.companyId}:${today}`] ?? 0;
    if (used >= 20) this.fail('You can send 20 invites a day. Try again tomorrow.', 'LIMIT');
    this.inviteLog[`${this.companyId}:${today}`] = used + 1;
    t.invitedTo = [...t.invitedTo, jobId];
    const job = this.jobs.find((j) => j.id === jobId);
    this.notify(workerId, 'A company invited you', `${this.myCompany.name} invited you to apply for ${job?.title ?? 'a job'}.`, 'jobs');
  }
  // Admin Operations
  async getAdminSummary(): Promise<AdminSummary> {
    const pending = this.verifications.filter((v) => v.status === 'pending').length;
    const openReports = this.reports.filter((r) => r.status === 'open').length;
    const openTickets = this.tickets.filter((t) => t.status === 'open').length;
    const moneyReports = this.reports.filter((r) => r.status === 'open' && r.reason === 'asks_money').length;
    const attention: AdminSummary['attention'] = [];
    if (moneyReports)
      attention.push({ id: 'att_money', text: `${moneyReports} report${moneyReports === 1 ? '' : 's'} of a job asking workers for money`, link: 'Reports' });
    if (pending)
      attention.push({ id: 'att_pending', text: `${pending} compan${pending === 1 ? 'y is' : 'ies are'} waiting for approval`, link: 'VerificationsQueue' });
    if (openTickets)
      attention.push({ id: 'att_help', text: `${openTickets} help request${openTickets === 1 ? '' : 's'} not answered`, link: 'Reports' });
    return {
      workers: 2450 + this.adminUsers.filter((u) => u.role === 'worker').length,
      companies: 84 + this.adminUsers.filter((u) => u.role === 'employer').length,
      activeJobs: this.jobs.filter((j) => j.status === 'active').length,
      pendingVerifications: pending,
      openReports,
      openTickets,
      attention,
      signupsPerWeek: [
        { week: '20 Oct', workers: 96, companies: 4 },
        { week: '27 Oct', workers: 120, companies: 6 },
        { week: '3 Nov', workers: 142, companies: 5 },
        { week: '10 Nov', workers: 180, companies: 9 },
      ],
    };
  }

  async getAdminUsers(params?: { role?: string; q?: string }): Promise<AdminUserRow[]> {
    const s = params?.q?.trim().toLowerCase();
    return this.adminUsers.filter(
      (u) =>
        (!params?.role || u.role === params.role) &&
        (!s || `${u.name} ${u.contact} ${u.city}`.toLowerCase().includes(s))
    );
  }

  private suspendReasonOf(id: string): string {
    const r = this.adminUsers.find((u) => u.id === id)?.suspendReason;
    return r ? ` (${r})` : '';
  }
  async setUserStatus(id: string, status: AccountStatus, reason?: string): Promise<AdminUserRow> {
    const u = this.adminUsers.find((x) => x.id === id);
    if (!u) this.fail('User not found', 'NOT_FOUND');
    if ((u.role as string) === 'admin') this.fail('You cannot suspend an admin account.', 'NOT_ALLOWED');
    if (status === 'suspended' && (reason?.trim().length ?? 0) < 3) this.fail('Write the reason for the suspension.', 'VALIDATION');
    u.status = status;
    u.suspendReason = status === 'suspended' ? reason!.trim() : undefined;
    this.log(status === 'suspended' ? `Suspended (${reason!.trim()})` : 'Reactivated', u.name);
    return u;
  }

  /** How many open jobs and applicants a company has (shown before blocking it). */
  async getUserImpact(id: string): Promise<{ activeJobs: number; applicants: number }> {
    const jobs = this.jobs.filter((j) => j.status === 'active' && (this.ownerOf(j) === id || j.companyId === id));
    const ids = new Set(jobs.map((j) => j.id));
    const applicants = [...this.applications, ...this.pool].filter((a) => ids.has(a.jobId)).length;
    return { activeJobs: jobs.length, applicants };
  }
  async getAdminJobs(params?: { q?: string; status?: string }): Promise<AdminJobRow[]> {
    const s = params?.q?.trim().toLowerCase();
    return this.jobs
      .filter((j) => !params?.status || j.status === params.status)
      .filter((j) => !s || `${j.title} ${j.companyName} ${j.location.city}`.toLowerCase().includes(s))
      .map((j) => ({ ...j, companyStatus: 'active' as AccountStatus }));
  }

  async removeJob(id: string, reason: string): Promise<void> {
    const j = this.jobs.find((x) => x.id === id);
    if (!j) this.fail('Job not found', 'NOT_FOUND');
    j.status = 'closed';
    j.removedByAdmin = true;
    this.reports.forEach((r) => {
      if (r.jobId === id && r.status === 'open') {
        r.status = 'job_removed';
        r.resolvedAt = new Date().toISOString();
        r.resolvedBy = 'Admin';
      }
    });
    this.log(`Removed job (${reason})`, j.title);
    this.notify(this.jobOwnerAcct(j), 'Your job was removed', `${j.title} was removed by our team. Reason: ${reason}`, 'jobs');
  }

  async reportJob(jobId: string, reason: ReportReason, details?: string): Promise<void> {
    const j = this.jobs.find((x) => x.id === jobId);
    if (!j) this.fail('This job no longer exists.', 'NOT_FOUND');
    if (this.reports.some((r) => r.jobId === jobId && r.reporterId === this.workerId)) {
      this.fail('You already reported this job. Our team is looking at it.', 'ALREADY_REPORTED');
    }
    this.reports.unshift({
      id: this.uid('rep'),
      jobId,
      jobTitle: j.title,
      companyName: j.companyName,
      reporterId: this.workerId,
      reporterName: this.workerProfile.name,
      reason,
      details: details?.trim() || undefined,
      at: new Date().toISOString(),
      status: 'open',
    });
    this.notify('admin', 'Job reported', `${j.title} was reported by a worker.`, 'reports');
  }
  async getReports(status: string): Promise<AdminReportRow[]> {
    return this.reports
      .filter((r) => status === 'all' || r.status === status)
      .map((r) => ({
        ...r,
        jobStatus: this.jobs.find((j) => j.id === r.jobId)?.status ?? 'closed',
        reportsForJob: this.reports.filter((x) => x.jobId === r.jobId && x.status === 'open').length,
      }))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }

  async resolveReport(id: string, action: 'dismiss' | 'remove_job', note?: string): Promise<void> {
    const r = this.reports.find((x) => x.id === id);
    if (!r) throw new Error('Report not found');
    if (action === 'remove_job') return this.removeJob(r.jobId, note || r.reason);
    // One decision covers every open report on the same job.
    this.reports
      .filter((x) => x.jobId === r.jobId && x.status === 'open')
      .forEach((x) => {
        x.status = 'dismissed';
        x.resolvedAt = new Date().toISOString();
        x.resolvedBy = 'Admin';
      });
    this.log('Dismissed reports on', r.jobTitle);
  }

  async createTicket(t: Omit<SupportTicket, 'id' | 'at' | 'status'>): Promise<SupportTicket> {
    const ticket: SupportTicket = { ...t, id: this.uid('tkt'), at: new Date().toISOString(), status: 'open' };
    this.tickets = [ticket, ...this.tickets];
    this.notify('admin', 'New help request', `${t.name}: ${t.topic}`, 'reports');
    return ticket;
  }
  async getTickets(status: string): Promise<SupportTicket[]> {
    return this.tickets
      .filter((t) => status === 'all' || t.status === status)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }

  async closeTicket(id: string): Promise<void> {
    const t = this.tickets.find((x) => x.id === id);
    if (!t) this.fail('Request not found', 'NOT_FOUND');
    t.status = 'closed';
    this.log('Closed help request from', t.name);
    if (t.userId) this.notify(t.userId, 'Your help request was answered', `We closed your request about "${t.topic}". If it is not solved, send us a new message.`);
  }
  async getAudit(): Promise<AuditEntry[]> {
    return this.audit;
  }

  async getVerifications(): Promise<VerificationItem[]> {
    return this.verifications.map((v) => {
      const c = this.employerCompanies[v.id];
      if (!c || v.id === 'emp_demo') return v;
      return {
        ...v,
        title: c.name,
        subtitle: `${c.hiringType === 'agency' ? 'Contractor or agency' : 'Direct employer'}${c.location.city ? ` · ${c.location.city}, ${c.location.state}` : ''}`,
        details: {
          ...v.details,
          'GST number': c.gstNumber || 'Not given',
          'Entity Name': c.name,
          'City': c.location.city ? `${c.location.city}, ${c.location.state}` : 'Not given',
          'HR Contact': c.hrPhone ? `${c.hrName ?? ''} (+91 ${c.hrPhone})` : 'Not given',
          'Hiring as': c.hiringType === 'agency' ? 'Contractor or agency' : 'Direct employer',
        },
        documents: (this.companyDocs[v.id] ?? []).map(({ id, name, type, url, mimeType, uploadedAt }) => ({ id, name, type, url, mimeType, uploadedAt })),
      };
    });
  }
  async updateVerification(
    id: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<VerificationItem> {
    const item = this.verifications.find((v) => v.id === id);
    if (!item) this.fail('Item not found', 'NOT_FOUND');
    if (item.status !== 'pending') this.fail('This company was already decided.', 'ALREADY_DONE');
    if (decision === 'rejected' && !reason?.trim()) this.fail('Write the reason so the company can fix it.', 'VALIDATION');
    item.status = decision;
    this.log(decision === 'approved' ? 'Approved company' : 'Rejected company', item.title);
    const u = this.adminUsers.find((x) => x.id === id);
    if (u) u.verification = decision;
    if (decision === 'rejected') {
      item.details = item.details ?? {};
      item.details['Rejection reason'] = reason!.trim();
    }
    // The company itself changes too, and the people behind it are told.
    const own = this.employerCompanies[id];
    const seeded = this.companies.find((c) => c.id === id);
    for (const c of [own, seeded]) {
      if (!c) continue;
      c.verification = decision;
      c.rejectionReason = decision === 'rejected' ? reason!.trim() : undefined;
    }
    this.jobs.forEach((j) => {
      if (this.ownerOf(j) === id || j.companyId === id) j.companyVerified = decision === 'approved';
    });
    this.notify(
      `emp:${id}`,
      decision === 'approved' ? 'Your company is approved' : 'Your company needs changes',
      decision === 'approved' ? 'You can now publish jobs and find workers.' : `Reason: ${reason!.trim()}. Fix it in Company profile and send it again.`,
      'company'
    );
    return item;
  }
  async decideVerification(
    _kind: string,
    id: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): Promise<VerificationItem> {
    return this.updateVerification(id, decision === 'approve' ? 'approved' : 'rejected', reason);
  }

  /** Everything that can change while using the demo, as plain JSON (see mocks/persist.ts). */
  snapshot() {
    return {
      jobs: this.jobs,
      companies: this.companies,
      workerId: this.workerId,
      companyId: this.companyId,
      profiles: this.profiles,
      workerDocs: this.workerDocs,
      workerSaved: this.workerSaved,
      employerCompanies: this.employerCompanies,
      companyDocs: this.companyDocs,
      employerAccounts: this.employerAccounts,
      pendingOnboarding: this.pendingOnboarding,
      applications: this.applications,
      verifications: this.verifications,
      adminUsers: this.adminUsers,
      reports: this.reports,
      tickets: this.tickets,
      audit: this.audit,
      pool: this.pool,
      talent: this.talent,
      notifications: this.notifications,
      messages: this.messages,
      lastRead: this.lastRead,
      adminNotesAdded: this.adminNotesAdded,
      messagesSeeded: this.messagesSeeded,
      platformSettings: this.platformSettings,
    };
  }

  restore(data: Partial<ReturnType<MockDatabase['snapshot']>>) {
    Object.assign(this, data);
  }

  // Helper
  private mapJobForWorker(j: Job): JobForWorker {
    const app = this.applications.find((a) => a.jobId === j.id && a.workerId === this.workerId && a.stage !== 'withdrawn');
    return {
      ...j,
      saved: (this.workerSaved[this.workerId] ?? []).includes(j.id),
      appliedApplicationId: app?.id,
    };
  }
}

export const mockDb = new MockDatabase();
