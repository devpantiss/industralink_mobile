import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import {
  VerificationItem,
  AdminSummary,
  AdminUserRow,
  AdminJobRow,
  AdminReportRow,
  SupportTicket,
  AuditEntry,
  AccountStatus,
} from '../types';

export const adminApi = {
  async getSummary(): Promise<AdminSummary> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getAdminSummary();
    }
    const res = await apiClient.get('/admin/summary');
    return res.data;
  },

  async getVerifications(): Promise<VerificationItem[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getVerifications();
    }
    const res = await apiClient.get('/admin/verifications');
    return res.data;
  },

  async decideVerification(
    kind: string | undefined,
    id: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): Promise<VerificationItem> {
    if (USE_MOCKS) {
      await delay(150);
      return mockDb.decideVerification(kind || 'company', id, decision, reason);
    }
    const res = await apiClient.post(`/admin/verifications/${id}/decide`, { kind, decision, reason });
    return res.data;
  },

  async updateVerification(
    id: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<VerificationItem> {
    if (USE_MOCKS) {
      await delay(120);
      return mockDb.updateVerification(id, decision, reason);
    }
    const res = await apiClient.patch(`/admin/verifications/${id}`, { status: decision, reason });
    return res.data;
  },

  async getUsers(params?: { role?: string; q?: string }): Promise<AdminUserRow[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getAdminUsers(params);
    }
    return (await apiClient.get('/admin/users', { params })).data;
  },

  async setUserStatus(id: string, status: AccountStatus): Promise<AdminUserRow> {
    if (USE_MOCKS) {
      await delay(150);
      return mockDb.setUserStatus(id, status);
    }
    return (await apiClient.patch(`/admin/users/${id}`, { status })).data;
  },

  async getJobs(params?: { q?: string; status?: string }): Promise<AdminJobRow[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getAdminJobs(params);
    }
    return (await apiClient.get('/admin/jobs', { params })).data;
  },

  async removeJob(id: string, reason: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(150);
      return mockDb.removeJob(id, reason);
    }
    await apiClient.post(`/admin/jobs/${id}/remove`, { reason });
  },

  async getReports(status: string): Promise<AdminReportRow[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getReports(status);
    }
    return (await apiClient.get('/admin/reports', { params: { status } })).data;
  },

  async resolveReport(id: string, action: 'dismiss' | 'remove_job', note?: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(150);
      return mockDb.resolveReport(id, action, note);
    }
    await apiClient.post(`/admin/reports/${id}/resolve`, { action, note });
  },

  async getTickets(status: string): Promise<SupportTicket[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getTickets(status);
    }
    return (await apiClient.get('/admin/support', { params: { status } })).data;
  },

  async closeTicket(id: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(120);
      return mockDb.closeTicket(id);
    }
    await apiClient.post(`/admin/support/${id}/close`);
  },

  async getAudit(): Promise<AuditEntry[]> {
    if (USE_MOCKS) {
      await delay();
      return mockDb.getAudit();
    }
    return (await apiClient.get('/admin/audit')).data;
  },
};
