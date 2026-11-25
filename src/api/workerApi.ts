import { apiClient, fileForUpload } from './client';
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
  ReportReason,
} from '../types';

export const workerApi = {
  async getSummary(): Promise<WorkerSummary> {
    const res = await apiClient.get('/worker/summary');
    return res.data;
  },

  async getJobs(params?: { search?: string; trade?: string }): Promise<JobForWorker[]> {
    // Same search as Find jobs, first page only.
    const res = await apiClient.get('/jobs', { params: { q: params?.search, trade: params?.trade } });
    return res.data.items;
  },

  async searchJobs(params?: JobSearchParams): Promise<Paginated<JobForWorker>> {
    const res = await apiClient.get('/jobs', { params });
    return res.data;
  },

  async getJob(id: string): Promise<JobForWorker> {
    const res = await apiClient.get(`/jobs/${id}`);
    return res.data;
  },

  async getJobById(id: string): Promise<JobForWorker | null> {
    return this.getJob(id);
  },

  async getSavedJobs(): Promise<JobForWorker[]> {
    const res = await apiClient.get('/worker/saved');
    return res.data;
  },

  async toggleSaveJob(id: string, forceState?: boolean): Promise<boolean> {
    // Without forceState, look up the current state and flip it.
    const save = forceState ?? !(await apiClient.get(`/jobs/${id}`)).data.saved;
    const res = save ? await apiClient.post(`/jobs/${id}/save`) : await apiClient.delete(`/jobs/${id}/save`);
    return res.data.saved;
  },

  async applyJob(
    jobId: string,
    payload?: { sentWith?: string; documentId?: string }
  ): Promise<Application> {
    const res = await apiClient.post(`/jobs/${jobId}/apply`, { sentWith: payload?.sentWith ?? 'profile', documentId: payload?.documentId });
    return res.data;
  },

  async getApplications(): Promise<WorkerApplication[]> {
    const res = await apiClient.get('/worker/applications');
    return res.data;
  },

  async getApplication(id: string): Promise<WorkerApplication> {
    const res = await apiClient.get(`/worker/applications/${id}`);
    return res.data;
  },

  async withdrawApplication(id: string): Promise<void> {
    await apiClient.post(`/worker/applications/${id}/withdraw`);
  },

  async replyInterview(
    id: string,
    response: 'attending' | 'cant_attend',
    note?: string
  ): Promise<void> {
    await apiClient.post(`/worker/applications/${id}/interview-response`, { response, note });
  },

  async replyOffer(
    id: string,
    response: 'accepted' | 'declined',
    note?: string
  ): Promise<void> {
    await apiClient.post(`/worker/applications/${id}/offer-response`, { response, note });
  },

  async getProfile(): Promise<WorkerProfile> {
    const res = await apiClient.get('/worker/profile');
    return res.data;
  },

  async updateProfile(partial: Partial<WorkerProfile>): Promise<WorkerProfile> {
    const res = await apiClient.patch('/worker/profile', partial);
    return res.data;
  },

  async getDocuments(): Promise<WorkerDocument[]> {
    const res = await apiClient.get('/worker/documents');
    return res.data;
  },

  async uploadDocument(doc: { name: string; type: DocType; fileUrl: string; mimeType?: string; sizeBytes?: number }): Promise<WorkerDocument> {
    // A real file upload: the file picked on the phone plus its type.
    const form = new FormData();
    form.append('file', fileForUpload(doc.fileUrl, doc.name, doc.mimeType));
    form.append('type', doc.type);
    const res = await apiClient.post('/worker/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/worker/documents/${id}`);
  },

  async setDefaultResume(id: string): Promise<void> {
    await apiClient.post(`/worker/documents/${id}/default`);
  },

  async listCompanies(params?: { q?: string; sector?: string }): Promise<{ company: Company; openJobs: number }[]> {
    const res = await apiClient.get('/companies', { params });
    return res.data;
  },

  async reportJob(jobId: string, reason: ReportReason, details?: string): Promise<void> {
    await apiClient.post(`/jobs/${jobId}/report`, { reason, details });
  },

  async getCompany(id: string): Promise<CompanyForWorker> {
    const res = await apiClient.get(`/companies/${id}`);
    return res.data;
  },
};
