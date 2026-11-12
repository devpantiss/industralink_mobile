import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  FileText,
  X,
  ShieldAlert,
  Building2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { adminApi } from '../../api/adminApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { COMPANY_DOC_LABEL } from '../../lib/labels';
import { formatDate, timeAgo } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { VerificationItem } from '../../types';

export const VerificationsQueueScreen: React.FC = () => {
  const { colors, showToast } = useUiStore();
  const qc = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const {
    data: items,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.admin.verifications,
    queryFn: () => adminApi.getVerifications(),
  });

  const decideMutation = useMutation({
    mutationFn: ({
      item,
      decision,
      reason,
    }: {
      item: VerificationItem;
      decision: 'approve' | 'reject';
      reason?: string;
    }) => adminApi.decideVerification(item.kind, item.id, decision, reason),
    onSuccess: (_data, { item, decision }) => {
      Haptics.notificationAsync(
        decision === 'approve'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      showToast(
        decision === 'approve'
          ? `${item.title} approved. They can now post jobs.`
          : `${item.title} rejected`,
        'success'
      );
      setSelectedItem(null);
      setRejectModalOpen(false);
      setRejectReason('');
    },
  });

  const pendingList = items ?? [];

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('Company approvals')}</Text>
          <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
            {t("New companies can't publish jobs until you approve them. Oldest first.")}
          </Text>
        </View>

        {/* List of pending companies */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : pendingList.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceMuted }]}>
            <BadgeCheck size={36} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              {t('All caught up 🎉')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.inkSecondary }]}>
              {t('No companies are waiting for approval.')}
            </Text>
          </View>
        ) : (
          pendingList.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              onPress={() => setSelectedItem(item)}
              style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Avatar name={item.title} square size="md" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.itemTitle, { color: colors.ink }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.inkSecondary }]}>
                  {item.subtitle}
                </Text>
                <Text style={[styles.itemTime, { color: colors.inkMuted }]}>
                  Signed up {timeAgo(item.submittedAt)}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.inkMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Review Company Details Modal */}
      {selectedItem && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.sheetCard, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetTitle, { color: colors.ink }]}>
                    {selectedItem.title}
                  </Text>
                  <Text style={[styles.sheetSubtitle, { color: colors.inkMuted }]}>
                    {selectedItem.subtitle} · {formatDate(selectedItem.submittedAt)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <X size={20} color={colors.inkMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.sheetBody}>
                {/* Details list */}
                <View style={styles.detailsGroup}>
                  {Object.entries(selectedItem.details).map(([k, v]) => (
                    <View key={k} style={styles.detailRow}>
                      <Text style={[styles.detailKey, { color: colors.inkMuted }]}>{k}</Text>
                      <Text style={[styles.detailVal, { color: colors.ink }]}>{v}</Text>
                    </View>
                  ))}
                </View>

                {/* Uploaded Documents */}
                <View style={styles.docsSection}>
                  <Text style={[styles.sectionHeading, { color: colors.ink }]}>
                    {t('Uploaded Documents')}
                  </Text>
                  {selectedItem.documents.length === 0 ? (
                    <View style={[styles.noDocsBox, { backgroundColor: colors.tiles.yellow.bg }]}>
                      <Text style={[styles.noDocsText, { color: colors.tiles.yellow.text }]}>
                        {t('No document uploaded yet. Ask for a GST certificate.')}
                      </Text>
                    </View>
                  ) : (
                    selectedItem.documents.map((doc) => (
                      <View
                        key={doc.id}
                        style={[styles.docPreviewCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                      >
                        <FileText size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.docName, { color: colors.ink }]}>{doc.name}</Text>
                          <Text style={[styles.docType, { color: colors.inkMuted }]}>
                            {COMPANY_DOC_LABEL[doc.type as keyof typeof COMPANY_DOC_LABEL] || doc.type}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* GST Portal Verify Link */}
                {selectedItem.details['GST number'] && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL('https://services.gst.gov.in/services/searchtp')}
                    style={[styles.gstLinkRow, { backgroundColor: colors.primarySoft }]}
                  >
                    <ExternalLink size={16} color={colors.primary} />
                    <Text style={[styles.gstLinkText, { color: colors.primary }]}>
                      {t('Check this GST number on Government GST Portal')} →
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Checklist Notice */}
                <View style={[styles.checklistCard, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.checkTitle, { color: colors.ink }]}>
                    {t('Before approving, check:')}
                  </Text>
                  <Text style={[styles.checkItem, { color: colors.inkSecondary }]}>
                    • The uploaded document shows matching company name & GST
                  </Text>
                  <Text style={[styles.checkItem, { color: colors.inkSecondary }]}>
                    • The GST number belongs to this company on the portal
                  </Text>
                  <Text style={[styles.checkItem, { color: colors.inkSecondary }]}>
                    • HR email is verified with company domain
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    onPress={() => setRejectModalOpen(true)}
                    style={[styles.rejectBtn, { borderColor: colors.dangerFg }]}
                  >
                    <Text style={[styles.rejectBtnText, { color: colors.dangerFg }]}>
                      {t('Reject')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => decideMutation.mutate({ item: selectedItem, decision: 'approve' })}
                    disabled={decideMutation.isPending}
                    style={[styles.approveBtn, { backgroundColor: colors.primary }]}
                  >
                    {decideMutation.isPending ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.approveBtnText}>{t('Approve company')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Reject Reason Modal */}
      {selectedItem && (
        <Modal visible={rejectModalOpen} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.rejectCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.rejectTitle, { color: colors.ink }]}>
                {t('Reject {company}?', { company: selectedItem.title })}
              </Text>
              <Text style={[styles.rejectDesc, { color: colors.inkSecondary }]}>
                {t('Please give a reason. The company will see this to fix their application.')}
              </Text>

              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="e.g. GST certificate mismatch or invalid registration"
                placeholderTextColor={colors.inkMuted}
                multiline
                numberOfLines={3}
                style={[styles.rejectInput, { borderColor: colors.border, color: colors.ink }]}
              />

              <View style={styles.rejectActions}>
                <TouchableOpacity
                  onPress={() => setRejectModalOpen(false)}
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.ink, fontWeight: '600' }}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    decideMutation.mutate({
                      item: selectedItem,
                      decision: 'reject',
                      reason: rejectReason.trim(),
                    })
                  }
                  disabled={decideMutation.isPending}
                  style={[styles.modalRejectBtn, { backgroundColor: colors.dangerFg }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('Reject')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },
  titleBlock: {
    marginBottom: 6,
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: 12.5,
  },
  itemTime: {
    fontSize: 11.5,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetBody: {
    padding: 16,
    gap: 16,
  },
  detailsGroup: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailKey: {
    fontSize: 13,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  docsSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  noDocsBox: {
    padding: 12,
    borderRadius: 10,
  },
  noDocsText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  docPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  docName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  docType: {
    fontSize: 11.5,
  },
  gstLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  gstLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  checklistCard: {
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rejectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectCard: {
    margin: 20,
    borderRadius: 18,
    padding: 20,
    alignSelf: 'center',
    width: '90%',
    gap: 10,
  },
  rejectTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  rejectDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    height: 70,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  rejectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalRejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
