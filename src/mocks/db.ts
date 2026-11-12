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
} from '../types';
import { SEED_JOBS, SEED_COMPANIES, SEED_WORKER, SEED_VERIFICATIONS } from './seed';

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
      { company: 'L&T Heavy Engineering', role: 'Arc Welder', from: '2021', to: '2024' },
      { company: 'Jindal Steel & Power', role: 'Trainee Welder', from: '2019', to: '2021' },
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
      name: 'Aadhaar_Card_Verified.pdf',
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

  private verifications: VerificationItem[] = [...SEED_VERIFICATIONS];

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
      name: 'Eastline Plant HR',
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
        name: 'Eastline Plant HR',
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
      profileHint: 'Add ITI Diploma Certificate for 100% verification',
      missing: [{ key: 'iti', label: 'ITI Certificate', link: '/worker/profile?tab=documents' }],
      nextStep: {
        title: 'Gate Interview Scheduled',
        subtitle: 'Plant Gate 4, Kalinganagar with National Heavy Engineering HR',
        link: '/worker/applications/app_1',
        at: '2026-11-20T10:30:00Z',
      },
    };
  }

  async getJobs(params?: { search?: string; trade?: string }): Promise<JobForWorker[]> {
    return this.jobs
      .filter((j) => {
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
    let items = this.jobs.map((j) => this.mapJobForWorker(j));
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
    const openJobs = this.jobs.filter((j) => j.status === 'active').length;
    const newApplicants = this.jobs.reduce((s, j) => s + (j.newApplicantsCount || 0), 0);
    return {
      openJobs,
      newApplicants: Math.max(1, newApplicants),
      interviewsThisWeek: 4,
      hiredThisMonth: 8,
      attention: [
        {
          id: 'att_1',
          text: '3 new welder applicants awaiting review for Kalinganagar Plant',
          link: '/employer/candidates?stage=applied',
          action: 'Review',
        },
      ],
      applicantsPerDay: [
        { day: 'Mon', count: 12 },
        { day: 'Tue', count: 18 },
        { day: 'Wed', count: 24 },
        { day: 'Thu', count: 15 },
        { day: 'Fri', count: 22 },
        { day: 'Sat', count: 8 },
        { day: 'Sun', count: 5 },
      ],
      funnel: [
        { stage: 'Applied', count: 84 },
        { stage: 'Shortlisted', count: 32 },
        { stage: 'Interview', count: 14 },
        { stage: 'Hired', count: 8 },
      ],
    };
  }

  async getEmployerJobs(status?: string): Promise<Job[]> {
    if (status) return this.jobs.filter((j) => j.status === status);
    return this.jobs;
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

  async getCandidates(jobId?: string): Promise<Candidate[]> {
    return this.applications
      .filter((a) => (!jobId ? true : a.jobId === jobId))
      .map((a) => {
        const job = this.jobs.find((j) => j.id === a.jobId);
        return {
          ...a,
          worker: this.workerProfile,
          jobTitle: job?.title || 'Industrial Worker',
          documents: this.documents,
        };
      });
  }

  async updateCandidateStage(appId: string, stage: ApplicationStage, payload?: any): Promise<void> {
    const app = this.applications.find((a) => a.id === appId);
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

  async searchTalent(_params?: any): Promise<TalentProfile[]> {
    return [
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
  }

  async inviteTalent(_workerId: string, _jobId: string): Promise<void> {
    // Simulated invite recorded
  }

  // Admin Operations
  async getAdminSummary(): Promise<AdminSummary> {
    return {
      workers: 2450,
      companies: 84,
      activeJobs: this.jobs.filter((j) => j.status === 'active').length,
      pendingVerifications: this.verifications.filter((v) => v.status === 'pending').length,
      openReports: 1,
      openTickets: 3,
      attention: [
        {
          id: 'att_adm_1',
          text: '2 companies submitted GST certificates for approval',
          link: '/admin/verifications',
        },
      ],
      signupsPerWeek: [
        { week: 'W1', workers: 120, companies: 6 },
        { week: 'W2', workers: 180, companies: 9 },
      ],
    };
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
