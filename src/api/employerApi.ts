import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import { Job, Candidate, ApplicationStage, EmployerSummary, TalentProfile, Company, EmployerAnalytics } from '../types';

export const employerApi = {
  async getSummary(): Promise<EmployerSummary> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getEmployerSummary();
    }
    const res = await apiClient.get('/employer/summary');
    return res.data;
  },

  async getJobs(status?: string): Promise<Job[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getEmployerJobs(status);
    }
    const res = await apiClient.get('/employer/jobs', { params: { status } });
    return res.data;
  },

  async createJob(data: any): Promise<Job> {
    if (USE_MOCKS) {
      await delay(250);
      return mockDb.createJob(data);
    }
    const res = await apiClient.post('/employer/jobs', data);
    return res.data;
  },

  async updateJob(id: string, changes: any): Promise<Job> {
    if (USE_MOCKS) {
      await delay(200);
      return mockDb.updateJob(id, changes);
    }
    const res = await apiClient.patch(`/employer/jobs/${id}`, changes);
    return res.data;
  },

  async deleteJob(id: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(150);
      return mockDb.deleteJob(id);
    }
    await apiClient.delete(`/employer/jobs/${id}`);
  },

  async getCandidates(jobId?: string): Promise<Candidate[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getCandidates(jobId);
    }
    const res = await apiClient.get('/employer/candidates', { params: { jobId } });
    return res.data;
  },

  async getAllCandidates(params?: { stage?: string; q?: string }): Promise<Candidate[]> {
    if (USE_MOCKS) {
      await delay();
      const all = await mockDb.getCandidates();
      if (!params?.stage) return all;
      return all.filter((c) => c.stage === params.stage);
    }
    const res = await apiClient.get('/employer/candidates', { params });
    return res.data;
  },

  async updateStage(appId: string, stage: ApplicationStage, payload?: any): Promise<void> {
    if (USE_MOCKS) {
      await delay(120);
      return mockDb.updateCandidateStage(appId, stage, payload);
    }
    await apiClient.patch(`/employer/applications/${appId}/stage`, { stage, payload });
  },

  async searchTalent(params?: any): Promise<TalentProfile[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.searchTalent(params);
    }
    const res = await apiClient.get('/employer/talent', { params });
    return res.data;
  },

  async inviteTalent(workerId: string, jobId: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(120);
      return mockDb.inviteTalent(workerId, jobId);
    }
    await apiClient.post('/employer/invites', { workerId, jobId });
  },

  async getJob(id: string): Promise<Job | null> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getEmployerJob(id);
    }
    const res = await apiClient.get(`/employer/jobs/${id}`);
    return res.data;
  },

  async getCompany(): Promise<Company> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getMyCompany();
    }
    const res = await apiClient.get('/employer/company');
    return res.data;
  },

  async updateCompany(changes: Partial<Company>): Promise<Company> {
    if (USE_MOCKS) {
      await delay(250);
      return mockDb.updateMyCompany(changes);
    }
    const res = await apiClient.patch('/employer/company', changes);
    return res.data;
  },

  async getAnalytics(): Promise<EmployerAnalytics> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getEmployerAnalytics();
    }
    const res = await apiClient.get('/employer/analytics');
    return res.data;
  },
};
