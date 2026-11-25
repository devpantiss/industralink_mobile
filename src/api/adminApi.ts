import { apiClient } from './client';
import {
  VerificationItem,
  AdminSummary,
  AdminUserRow,
  AdminJobRow,
  AdminReportRow,
  SupportTicket,
  AuditEntry,
  AccountStatus,
  PlatformSettings,
} from '../types';

export const adminApi = {
  async getSummary(): Promise<AdminSummary> {
    const res = await apiClient.get('/admin/summary');
    return res.data;
  },

  async getVerifications(): Promise<VerificationItem[]> {
    const res = await apiClient.get('/admin/verifications');
    return res.data;
  },

  async decideVerification(
    kind: string | undefined,
    id: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): Promise<void> {
    await apiClient.post(`/admin/verifications/${kind || 'company'}/${id}`, { decision, reason });
  },

  async getUsers(params?: { role?: string; q?: string }): Promise<AdminUserRow[]> {
    // The API lists one role at a time; "All" asks for both and merges them, newest first.
    if (params?.role === 'worker' || params?.role === 'employer') {
      return (await apiClient.get('/admin/users', { params })).data;
    }
    const [workers, employers] = await Promise.all(
      (['worker', 'employer'] as const).map(async (role) => (await apiClient.get('/admin/users', { params: { ...params, role } })).data as AdminUserRow[])
    );
    return [...workers, ...employers].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  },

  async setUserStatus(id: string, status: AccountStatus, reason?: string): Promise<AdminUserRow> {
    return (await apiClient.patch(`/admin/users/${id}`, { status, reason })).data;
  },

  async getUserImpact(id: string): Promise<{ activeJobs: number; applicants: number }> {
    return (await apiClient.get(`/admin/user-impact/${id}`)).data;
  },

  async getJobs(params?: { q?: string; status?: string }): Promise<AdminJobRow[]> {
    return (await apiClient.get('/admin/jobs', { params })).data;
  },

  async removeJob(id: string, reason: string): Promise<void> {
    await apiClient.post(`/admin/jobs/${id}/remove`, { reason });
  },

  async getReports(status: string): Promise<AdminReportRow[]> {
    return (await apiClient.get('/admin/reports', { params: { status } })).data;
  },

  async resolveReport(id: string, action: 'dismiss' | 'remove_job', note?: string): Promise<void> {
    await apiClient.post(`/admin/reports/${id}`, { action, note });
  },

  async getTickets(status: string): Promise<SupportTicket[]> {
    return (await apiClient.get('/admin/support', { params: { status } })).data;
  },

  async closeTicket(id: string): Promise<void> {
    await apiClient.post(`/admin/support/${id}/close`);
  },

  async getAudit(): Promise<AuditEntry[]> {
    return (await apiClient.get('/admin/audit')).data;
  },

  async getPlatformSettings(): Promise<PlatformSettings> {
    const res = await apiClient.get('/admin/settings');
    return res.data;
  },

  async updatePlatformSettings(changes: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const res = await apiClient.patch('/admin/settings', changes);
    return res.data;
  },
};
