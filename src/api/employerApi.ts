import { apiClient, fileForUpload } from './client';
import { Job, Candidate, ApplicationStage, EmployerSummary, TalentProfile, Company, EmployerAnalytics, CompanyDocument, CompanyDocType } from '../types';

/**
 * The screens' stage payload → the API body: { stage, note?, notify?, interview?, offer? }.
 * The reject reason goes in `note` (HR only, never shown to the worker).
 */
function toStageBody(stage: ApplicationStage, payload?: any) {
  if (stage === 'interview' && payload) {
    const { at, place, contactPerson, bring } = payload;
    return { stage, interview: { at, place, contactPerson, bring } };
  }
  if (stage === 'offer' && payload) {
    const { pay, payPeriod, payType, joiningDate, place, note } = payload;
    return { stage, offer: { pay: Number(pay), payPeriod, payType, joiningDate, place, note } };
  }
  if (stage === 'rejected') return { stage, note: payload?.reason, notify: payload?.notify ?? true };
  return { stage };
}

export const employerApi = {
  async getSummary(): Promise<EmployerSummary> {
    const res = await apiClient.get('/employer/summary');
    return res.data;
  },

  async getJobs(status?: string): Promise<Job[]> {
    const res = await apiClient.get('/employer/jobs', { params: { status } });
    return res.data;
  },

  async createJob(data: any): Promise<Job> {
    const res = await apiClient.post('/employer/jobs', data);
    return res.data;
  },

  async updateJob(id: string, changes: any): Promise<Job> {
    const res = await apiClient.patch(`/employer/jobs/${id}`, changes);
    return res.data;
  },

  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`/employer/jobs/${id}`);
  },

  async getCandidates(jobId?: string): Promise<Candidate[]> {
    // One job's list also clears that job's "new applicants" count.
    const res = jobId
      ? await apiClient.get(`/employer/jobs/${jobId}/candidates`)
      : await apiClient.get('/employer/candidates');
    return res.data;
  },

  async getAllCandidates(params?: { stage?: string; q?: string }): Promise<Candidate[]> {
    const res = await apiClient.get('/employer/candidates', { params });
    return res.data;
  },

  async updateStage(appId: string, stage: ApplicationStage, payload?: any): Promise<void> {
    await apiClient.patch(`/employer/applications/${appId}`, toStageBody(stage, payload));
  },

  async searchTalent(params?: any): Promise<TalentProfile[]> {
    const res = await apiClient.get('/employer/talent', { params });
    return res.data;
  },

  async inviteTalent(workerId: string, jobId: string): Promise<void> {
    await apiClient.post(`/employer/talent/${workerId}/invite`, { jobId });
  },

  async getJob(id: string): Promise<Job | null> {
    const res = await apiClient.get(`/employer/jobs/${id}`);
    return res.data;
  },

  async getCompany(): Promise<Company> {
    const res = await apiClient.get('/employer/company');
    return res.data;
  },

  async updateCompany(changes: Partial<Company>): Promise<Company> {
    const res = await apiClient.patch('/employer/company', changes);
    return res.data;
  },

  async getCompanyDocuments(): Promise<CompanyDocument[]> {
    const res = await apiClient.get('/employer/company/documents');
    return res.data;
  },

  async uploadCompanyDocument(doc: {
    name: string;
    type: CompanyDocType;
    fileUrl: string;
    sizeBytes?: number;
    mimeType?: string;
  }): Promise<CompanyDocument> {
    const form = new FormData();
    form.append('file', fileForUpload(doc.fileUrl, doc.name, doc.mimeType));
    form.append('type', doc.type);
    const res = await apiClient.post('/employer/company/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  async deleteCompanyDocument(id: string): Promise<void> {
    await apiClient.delete(`/employer/company/documents/${id}`);
  },

  async markViewed(appId: string): Promise<void> {
    await apiClient.post(`/employer/applications/${appId}/view`);
  },

  async getAnalytics(): Promise<EmployerAnalytics> {
    const res = await apiClient.get('/employer/analytics');
    return res.data;
  },
};
