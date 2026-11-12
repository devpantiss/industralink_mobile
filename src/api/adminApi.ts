import { apiClient, USE_MOCKS, delay } from './client';
import { mockDb } from '../mocks/db';
import { VerificationItem, AdminSummary } from '../types';

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
};
