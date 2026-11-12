import type { JobSearchParams } from '../types';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  worker: {
    all: ['worker'] as const,
    summary: ['worker', 'summary'] as const,
    profile: ['worker', 'profile'] as const,
    documents: ['worker', 'documents'] as const,
    applications: ['worker', 'applications'] as const,
    application: (id: string) => ['worker', 'application', id] as const,
    jobs: (params?: JobSearchParams | Record<string, any>) => ['worker', 'jobs', params] as const,
    job: (id: string) => ['worker', 'job', id] as const,
    saved: ['worker', 'saved'] as const,
    company: (id: string) => ['worker', 'company', id] as const,
  },
  employer: {
    all: ['employer'] as const,
    summary: ['employer', 'summary'] as const,
    jobs: (status?: string) => ['employer', 'jobs', status] as const,
    job: (id: string) => ['employer', 'job', id] as const,
    candidates: (jobId?: string) => ['employer', 'candidates', jobId] as const,
    allCandidates: (params?: Record<string, any>) => ['employer', 'allCandidates', params] as const,
    talent: (params?: Record<string, any>) => ['employer', 'talent', params] as const,
    analytics: ['employer', 'analytics'] as const,
    company: ['employer', 'company'] as const,
  },
  admin: {
    all: ['admin'] as const,
    summary: ['admin', 'summary'] as const,
    verifications: ['admin', 'verifications'] as const,
    users: (params?: Record<string, any>) => ['admin', 'users', params] as const,
    jobs: (params?: Record<string, any>) => ['admin', 'jobs', params] as const,
    reports: (status?: string) => ['admin', 'reports', status] as const,
    tickets: (status?: string) => ['admin', 'tickets', status] as const,
    audit: ['admin', 'audit'] as const,
  },
  messages: {
    threads: ['messages', 'threads'] as const,
    thread: (id: string) => ['messages', 'thread', id] as const,
  },
  settings: ['settings'] as const,

  // Backwards compatibility shortcuts
  jobs: (filters?: Record<string, any>) => ['worker', 'jobs', filters] as const,
  jobDetail: (id: string) => ['worker', 'job', id] as const,
  applications: ['worker', 'applications'] as const,
  applicationDetail: (id: string) => ['worker', 'application', id] as const,
  workerProfile: ['worker', 'profile'] as const,
  employerJobs: (status?: string) => ['employer', 'jobs', status] as const,
  candidates: (jobId?: string) => ['employer', 'candidates', jobId] as const,
  verifications: ['admin', 'verifications'] as const,
};
