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
  private workerProfile: WorkerProfile = {
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
  private savedJobIds: Set<string> = new Set(['job_1']);
  private documents: WorkerDocument[] = [
    {
      id: 'doc_1',
      ownerId: 'usr_worker_1',
      name: 'Govt_ITI_Welder_Certificate.pdf',
      type: 'iti_diploma',
      sizeBytes: 1024 * 450,
      mimeType: 'application/pdf',
      uploadedAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'doc_2',
      ownerId: 'usr_worker_1',
      name: 'Aadhaar_Card.pdf',
      type: 'id_proof',
      sizeBytes: 1024 * 320,
      mimeType: 'application/pdf',
      uploadedAt: '2026-11-01T10:05:00Z',
    },
    {
      id: 'doc_3',
      ownerId: 'usr_worker_1',
      name: 'Ramesh_Kumar_Welder_Resume.pdf',
      type: 'resume',
      sizeBytes: 1024 * 180,
      mimeType: 'application/pdf',
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
    this.audit.unshift({ id: `aud_${Date.now()}`, at: new Date().toISOString(), actor: 'Admin', action, target });
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
  private myCompany: Company = {
    id: 'comp_1',
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

  // Auth Operations
  async loginWithOtp(phone: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `OTP sent to +91 ${phone}. For demo, use 123456.`,
    };
  }

  async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: User }> {
    if (otp !== '123456' && otp.length !== 6) {
      throw new Error('Invalid OTP. Please enter 123456 for demo verification.');
    }
    const user: User = {
      id: 'usr_worker_1',
      name: this.workerProfile.name,
      phone: `+91 ${phone}`,
      role: 'worker',
      status: 'active',
      onboarded: true,
      city: this.workerProfile.location?.city,
      trade: this.workerProfile.trade,
      createdAt: new Date().toISOString(),
    };
    return { token: 'mock-jwt-token-worker', user };
  }

  async loginWithEmail(email: string, _password: string): Promise<{ token: string; user: User }> {
    if (email.includes('admin')) {
      const user: User = {
        id: 'usr_admin_1',
        name: 'IndustriaLink Admin',
        phone: '+91 99999 88888',
        email,
        role: 'admin',
        status: 'active',
        onboarded: true,
        createdAt: new Date().toISOString(),
      };
      return { token: 'mock-jwt-token-admin', user };
    }

    const user: User = {
      id: 'usr_employer_1',
      name: 'Pradeep Mohanty',
      phone: '+91 98111 22334',
      email,
      role: 'employer',
      status: 'active',
      onboarded: true,
      companyId: 'comp_1',
      companyName: 'Eastline Heavy Engineering',
      createdAt: new Date().toISOString(),
    };
    return { token: 'mock-jwt-token-employer', user };
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
        id: 'usr_employer_1',
        name: 'Pradeep Mohanty',
        phone: '+91 98111 22334',
        email: 'hr@eastline.demo',
        role: 'employer',
        status: 'active',
        onboarded: true,
        companyId: 'comp_1',
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
    const activeApps = this.applications.filter((a) => !['hired', 'rejected', 'withdrawn'].includes(a.stage)).length;
    const interviews = this.applications.filter((a) => a.stage === 'interview').length;
    return {
      activeApplications: activeApps,
      interviews,
      saved: this.savedJobIds.size,
      profileStrength: 85,
      profileHint: 'Upload your ITI certificate so employers can see it',
      missing: [{ key: 'iti', label: 'ITI Certificate', link: '/worker/profile?tab=documents' }],
      nextStep: {
        title: 'Interview scheduled',
        subtitle: 'Plant Gate 4, Kalinganagar with National Heavy Engineering HR',
        link: '/worker/applications/app_1',
        at: '2026-11-20T10:30:00Z',
      },
    };
  }

  async getJobs(params?: { search?: string; trade?: string }): Promise<JobForWorker[]> {
    return this.jobs
      .filter((j) => {
        if (j.status !== 'active') return false;
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
    let items = this.jobs.filter((j) => j.status === 'active').map((j) => this.mapJobForWorker(j));
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
    if (forceState !== undefined) {
      if (forceState) this.savedJobIds.add(id);
      else this.savedJobIds.delete(id);
      return forceState;
    }
    if (this.savedJobIds.has(id)) {
      this.savedJobIds.delete(id);
      return false;
    }
    this.savedJobIds.add(id);
    return true;
  }

  async applyJob(
    jobId: string,
    payload?: { sentWith?: string; documentId?: string }
  ): Promise<Application> {
    const existing = this.applications.find((a) => a.jobId === jobId);
    if (existing) return existing;

    const newApp: Application = {
      id: `app_${Date.now()}`,
      jobId,
      workerId: 'usr_worker_1',
      stage: 'applied',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentWith: (payload?.sentWith as any) || 'profile',
      documentId: payload?.documentId,
      timeline: [{ stage: 'applied', at: new Date().toISOString() }],
    };
    this.applications.unshift(newApp);

    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.applicantsCount += 1;
      job.newApplicantsCount += 1;
    }

    return newApp;
  }

  async getApplications(): Promise<WorkerApplication[]> {
    return this.applications
      .map((a) => {
        const job = this.jobs.find((j) => j.id === a.jobId);
        if (!job) return null;
        return {
          ...a,
          job,
          contact:
            ['shortlisted', 'interview', 'offer', 'hired'].includes(a.stage) && job.allowCalls
              ? { phone: job.hrPhone || '9876543210', hours: job.callHours }
              : undefined,
        };
      })
      .filter(Boolean) as WorkerApplication[];
  }

  async getApplicationById(id: string): Promise<WorkerApplication | null> {
    const a = this.applications.find((app) => app.id === id);
    if (!a) return null;
    const job = this.jobs.find((j) => j.id === a.jobId);
    if (!job) return null;
    return {
      ...a,
      job,
      contact:
        ['shortlisted', 'interview', 'offer', 'hired'].includes(a.stage) && job.allowCalls
          ? { phone: job.hrPhone || '9876543210', hours: job.callHours }
          : undefined,
    };
  }

  async withdrawApplication(id: string): Promise<void> {
    const app = this.applications.find((a) => a.id === id);
    if (app) {
      app.stage = 'withdrawn';
      app.updatedAt = new Date().toISOString();
      app.timeline.push({ stage: 'withdrawn', at: new Date().toISOString() });
    }
  }

  async replyInterview(
    id: string,
    response: 'attending' | 'cant_attend',
    note?: string
  ): Promise<void> {
    const app = this.applications.find((a) => a.id === id);
    if (app && app.interview) {
      app.interview.response = response;
      app.interview.responseNote = note;
      app.interview.respondedAt = new Date().toISOString();
    }
  }

  async replyOffer(
    id: string,
    response: 'accepted' | 'declined',
    note?: string
  ): Promise<void> {
    const app = this.applications.find((a) => a.id === id);
    if (app) {
      app.offerResponse = response;
      if (response === 'accepted') {
        app.stage = 'hired';
      } else {
        app.stage = 'withdrawn';
        app.rejectionNote = note;
      }
      app.updatedAt = new Date().toISOString();
    }
  }

  async getDocuments(): Promise<WorkerDocument[]> {
    return this.documents;
  }

  async uploadDocument(doc: { name: string; type: any; fileUrl: string }): Promise<WorkerDocument> {
    const newDoc: WorkerDocument = {
      id: `doc_${Date.now()}`,
      ownerId: 'usr_worker_1',
      name: doc.name,
      type: doc.type,
      sizeBytes: 1024 * 350,
      mimeType: 'application/pdf',
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
    const company = this.companies.find((c) => c.id === id) || this.companies[0];
    if (!company) return null;
    const jobs = this.jobs
      .filter((j) => j.companyId === company.id)
      .map((j) => this.mapJobForWorker(j));
    return { company, jobs };
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

  async getEmployerJobs(status?: string): Promise<Job[]> {
    const all = await this.getCandidates();
    return this.jobs
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

  async createJob(data: any): Promise<Job> {
    const newJob: Job = {
      id: `job_${Date.now()}`,
      companyId: 'comp_1',
      companyName: 'National Heavy Engineering',
      companyVerified: true,
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
    const i = this.jobs.findIndex((j) => j.id === id);
    if (i < 0) throw new Error('This job no longer exists.');
    this.jobs[i] = { ...this.jobs[i]!, ...changes, id };
    return this.jobs[i]!;
  }

  async deleteJob(id: string): Promise<void> {
    this.jobs = this.jobs.filter((j) => j.id !== id);
  }

  async getCandidates(jobId?: string): Promise<Candidate[]> {
    const own: Candidate[] = this.applications.map((a) => ({
      ...a,
      worker: this.workerProfile,
      jobTitle: '',
      documents: this.documents,
    }));
    return [...own, ...this.pool]
      .filter((c) => (!jobId ? true : c.jobId === jobId))
      .map((c) => ({ ...c, jobTitle: this.jobs.find((j) => j.id === c.jobId)?.title || 'Industrial Worker' }))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }

  async getMyCompany(): Promise<Company> {
    return this.myCompany;
  }

  async updateMyCompany(changes: Partial<Company>): Promise<Company> {
    this.myCompany = { ...this.myCompany, ...changes };
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
    return this.jobs.find((j) => j.id === id) ?? null;
  }

  async updateCandidateStage(appId: string, stage: ApplicationStage, payload?: any): Promise<void> {
    const app: Application | undefined =
      this.applications.find((a) => a.id === appId) ?? this.pool.find((a) => a.id === appId);
    if (app) {
      app.stage = stage;
      app.updatedAt = new Date().toISOString();
      app.timeline.push({ stage, at: new Date().toISOString() });
      if (stage === 'interview' && payload) {
        app.interview = {
          at: payload.at || new Date(Date.now() + 86400000).toISOString(),
          place: payload.place || 'Plant Gate 4',
        };
      }
      if (stage === 'offer' && payload) {
        app.offer = {
          pay: payload.pay || 22000,
          payPeriod: 'month',
          joiningDate: payload.joiningDate || '2026-12-01',
          place: 'Main Factory Plant Gate',
          sentAt: new Date().toISOString(),
        };
      }
    }
  }

  async searchTalent(params?: { trade?: string; city?: string }): Promise<TalentProfile[]> {
    return this.talent.filter(
      (t) =>
        (!params?.trade || t.trade === params.trade) &&
        (!params?.city || t.location?.city.toLowerCase().includes(params.city.toLowerCase()))
    );
  }

  async inviteTalent(workerId: string, jobId: string): Promise<void> {
    const t = this.talent.find((x) => x.userId === workerId);
    if (t && !t.invitedTo.includes(jobId)) t.invitedTo = [...t.invitedTo, jobId];
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

  async setUserStatus(id: string, status: AccountStatus): Promise<AdminUserRow> {
    const u = this.adminUsers.find((x) => x.id === id);
    if (!u) throw new Error('User not found');
    u.status = status;
    this.log(status === 'suspended' ? 'Suspended' : 'Reactivated', u.name);
    return u;
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
    if (!j) throw new Error('Job not found');
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
    r.status = 'dismissed';
    r.resolvedAt = new Date().toISOString();
    r.resolvedBy = 'Admin';
    this.log('Dismissed report on', r.jobTitle);
  }

  async getTickets(status: string): Promise<SupportTicket[]> {
    return this.tickets
      .filter((t) => status === 'all' || t.status === status)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }

  async closeTicket(id: string): Promise<void> {
    const t = this.tickets.find((x) => x.id === id);
    if (!t) throw new Error('Request not found');
    t.status = 'closed';
    this.log('Closed help request from', t.name);
  }

  async getAudit(): Promise<AuditEntry[]> {
    return this.audit;
  }

  async getVerifications(): Promise<VerificationItem[]> {
    return this.verifications;
  }

  async updateVerification(
    id: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<VerificationItem> {
    const item = this.verifications.find((v) => v.id === id);
    if (!item) throw new Error('Item not found');
    item.status = decision;
    this.log(decision === 'approved' ? 'Approved company' : 'Rejected company', item.title);
    const u = this.adminUsers.find((x) => x.id === id);
    if (u) u.verification = decision;
    if (decision === 'rejected') {
      if (!item.details) item.details = {};
      item.details['Rejection reason'] = reason || 'Document did not meet compliance criteria';
    }
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
      workerProfile: this.workerProfile,
      savedJobIds: [...this.savedJobIds],
      documents: this.documents,
      applications: this.applications,
      verifications: this.verifications,
      adminUsers: this.adminUsers,
      reports: this.reports,
      tickets: this.tickets,
      audit: this.audit,
      pool: this.pool,
      talent: this.talent,
      myCompany: this.myCompany,
    };
  }

  restore(data: Partial<ReturnType<MockDatabase['snapshot']>>) {
    const { savedJobIds, ...rest } = data;
    Object.assign(this, rest);
    if (savedJobIds) this.savedJobIds = new Set(savedJobIds);
  }

  // Helper
  private mapJobForWorker(j: Job): JobForWorker {
    const app = this.applications.find((a) => a.jobId === j.id && a.workerId === 'usr_worker_1');
    return {
      ...j,
      saved: this.savedJobIds.has(j.id),
      appliedApplicationId: app?.id,
    };
  }
}

export const mockDb = new MockDatabase();
