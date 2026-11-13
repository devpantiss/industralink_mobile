import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import type {
  JobForWorker,
  WorkerApplication,
  WorkerProfile,
  Application,
  WorkerSummary,
  JobSearchParams,
  Paginated,
  WorkerDocument,
  CompanyForWorker,
  Company,
  DocType,
} from '../types';

export const workerApi = {
  async getSummary(): Promise<WorkerSummary> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.getWorkerSummary();
    }
    const res = await apiClient.get('/worker/summary');
    return res.data;
  },

  async getJobs(params?: { search?: string; trade?: string }): Promise<JobForWorker[]> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.getJobs(params);
    }
    const res = await apiClient.get('/worker/jobs', { params });
    return res.data;
  },

  async searchJobs(params?: JobSearchParams): Promise<Paginated<JobForWorker>> {
    if (USE_MOCKS) {
      await delay(80);
      return mockDb.searchJobs(params);
    }
    const res = await apiClient.get('/worker/jobs/search', { params });
    return res.data;
  },

  async getJob(id: string): Promise<JobForWorker> {
    if (USE_MOCKS) {
      await delay(60);
      const j = await mockDb.getJobById(id);
      if (!j) throw new Error('Job not found');
      return j;
    }
    const res = await apiClient.get(`/worker/jobs/${id}`);
    return res.data;
  },

  async getJobById(id: string): Promise<JobForWorker | null> {
    return this.getJob(id);
  },

  async getSavedJobs(): Promise<JobForWorker[]> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.getSavedJobs();
    }
    const res = await apiClient.get('/worker/saved');
    return res.data;
  },

  async toggleSaveJob(id: string, forceState?: boolean): Promise<boolean> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.toggleSaveJob(id, forceState);
    }
    const res = await apiClient.post(`/worker/jobs/${id}/save`, { forceState });
    return res.data.saved;
  },

  async applyJob(
    jobId: string,
    payload?: { sentWith?: string; documentId?: string }
  ): Promise<Application> {
    if (USE_MOCKS) {
      await delay(120);
      return mockDb.applyJob(jobId, payload);
    }
    const res = await apiClient.post(`/worker/jobs/${jobId}/apply`, payload);
    return res.data;
  },

  async getApplications(): Promise<WorkerApplication[]> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.getApplications();
    }
    const res = await apiClient.get('/worker/applications');
    return res.data;
  },

  async getApplication(id: string): Promise<WorkerApplication> {
    if (USE_MOCKS) {
      await delay(60);
      const a = await mockDb.getApplicationById(id);
      if (!a) throw new Error('Application not found');
      return a;
    }
    const res = await apiClient.get(`/worker/applications/${id}`);
    return res.data;
  },

  async withdrawApplication(id: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.withdrawApplication(id);
    }
    await apiClient.post(`/worker/applications/${id}/withdraw`);
  },

  async replyInterview(
    id: string,
    response: 'attending' | 'cant_attend',
    note?: string
  ): Promise<void> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.replyInterview(id, response, note);
    }
    await apiClient.post(`/worker/applications/${id}/interview/reply`, { response, note });
  },

  async replyOffer(
    id: string,
    response: 'accepted' | 'declined',
    note?: string
  ): Promise<void> {
    if (USE_MOCKS) {
      await delay(60);
      return mockDb.replyOffer(id, response, note);
    }
    await apiClient.post(`/worker/applications/${id}/offer/reply`, { response, note });
  },

  async getProfile(): Promise<WorkerProfile> {
    if (USE_MOCKS) {
      await delay(50);
      return mockDb.getWorkerProfile();
    }
    const res = await apiClient.get('/worker/profile');
    return res.data;
  },

  async updateProfile(partial: Partial<WorkerProfile>): Promise<WorkerProfile> {
    if (USE_MOCKS) {
      await delay(80);
      return mockDb.updateWorkerProfile(partial);
    }
    const res = await apiClient.patch('/worker/profile', partial);
    return res.data;
  },

  async getDocuments(): Promise<WorkerDocument[]> {
    if (USE_MOCKS) {
      await delay(50);
      return mockDb.getDocuments();
    }
    const res = await apiClient.get('/worker/documents');
    return res.data;
  },

  async uploadDocument(doc: { name: string; type: DocType; fileUrl: string }): Promise<WorkerDocument> {
    if (USE_MOCKS) {
      await delay(120);
      return mockDb.uploadDocument(doc);
    }
    const res = await apiClient.post('/worker/documents', doc);
    return res.data;
  },

  async deleteDocument(id: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(80);
      return mockDb.deleteDocument(id);
    }
    await apiClient.delete(`/worker/documents/${id}`);
  },

  async setDefaultResume(id: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(80);
      return mockDb.setDefaultResume(id);
    }
    await apiClient.post(`/worker/documents/${id}/default`);
  },

  async listCompanies(params?: { q?: string; sector?: string }): Promise<{ company: Company; openJobs: number }[]> {
    if (USE_MOCKS) {
      await delay(80);
      return mockDb.listCompanies(params);
    }
    const res = await apiClient.get('/worker/companies', { params });
    return res.data;
  },

  async getCompany(id: string): Promise<CompanyForWorker> {
    if (USE_MOCKS) {
      await delay(60);
      const res = await mockDb.getCompanyForWorker(id);
      if (!res) throw new Error('Company not found');
      return res;
    }
    const res = await apiClient.get(`/worker/companies/${id}`);
    return res.data;
  },
};
