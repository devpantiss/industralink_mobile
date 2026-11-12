import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  BadgeCheck,
  Camera,
  FileText,
  FileImage,
  Upload,
  Star,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Avatar } from '../../components/ui/Avatar';
import { workerApi } from '../../api/workerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import {
  TRADE_LABEL,
  EXPERIENCE_LABEL,
  SHIFT_LABEL,
  DOC_TYPE_LABEL,
  AVAILABILITY_LABEL,
  EMPLOYMENT_TYPE_LABEL,
} from '../../lib/labels';
import { formatDate, formatNumber, formatPhone } from '../../lib/format';
import { t } from '../../lib/i18n';
import type { DocType, WorkerDocument } from '../../types';

type Tab = 'profile' | 'documents';

export const WorkerProfileScreen: React.FC = () => {
  const { colors, showToast } = useUiStore();
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('profile');

  // Profile & Summary Queries
  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.worker.profile,
    queryFn: () => workerApi.getProfile(),
  });

  const { data: summary } = useQuery({
    queryKey: queryKeys.worker.summary,
    queryFn: () => workerApi.getSummary(),
  });

  const { data: docs } = useQuery({
    queryKey: queryKeys.worker.documents,
    queryFn: () => workerApi.getDocuments(),
  });

  // Photo Update Mutation
  const updatePhotoMutation = useMutation({
    mutationFn: (photoUrl: string | undefined) => workerApi.updateProfile({ photoUrl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
      showToast(t('Profile photo updated'), 'success');
    },
  });

  // Document Upload Mutation
  const uploadDocMutation = useMutation({
    mutationFn: (doc: { name: string; type: DocType; fileUrl: string }) =>
      workerApi.uploadDocument(doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.worker.all });
      showToast(t('Document uploaded successfully'), 'success');
    },
  });

  const handlePickPhoto = async () => {
    Alert.alert(t('Change Profile Photo'), t('Choose a source:'), [
      {
        text: t('Take Photo'),
        onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });
          if (!res.canceled && res.assets[0]?.uri) {
            updatePhotoMutation.mutate(res.assets[0].uri);
          }
        },
      },
      {
        text: t('Choose from Gallery'),
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });
          if (!res.canceled && res.assets[0]?.uri) {
            updatePhotoMutation.mutate(res.assets[0].uri);
          }
        },
      },
      { text: t('Cancel'), style: 'cancel' },
    ]);
  };

  const handleUploadDocument = async () => {
    Alert.alert(t('Upload Document'), t('Choose document type:'), [
      {
        text: t('Aadhaar / ID proof'),
        onPress: () => pickAndUploadDoc('id_proof'),
      },
      {
        text: t('ITI / Diploma Certificate'),
        onPress: () => pickAndUploadDoc('iti_diploma'),
      },
      {
        text: t('Resume (PDF)'),
        onPress: () => pickAndUploadDoc('resume'),
      },
      { text: t('Cancel'), style: 'cancel' },
    ]);
  };

  const pickAndUploadDoc = async (type: DocType) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      if (!res.canceled && res.assets[0]) {
        uploadDocMutation.mutate({
          name: res.assets[0].name,
          type,
          fileUrl: res.assets[0].uri,
        });
      }
    } catch {
      // Ignored
    }
  };

  if (isLoading || !profile) {
    return (
      <Screen edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <Avatar name={profile.name} size="xl" src={profile.photoUrl} />
              <TouchableOpacity onPress={handlePickPhoto} style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                <Camera size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileTextInfo}>
              <View style={styles.nameBadgeRow}>
                <Text style={[styles.profileName, { color: colors.ink }]}>{profile.name}</Text>
                <View style={[styles.verifiedPill, { backgroundColor: colors.successBg }]}>
                  <BadgeCheck size={12} color={colors.successFg} />
                  <Text style={[styles.verifiedPillText, { color: colors.successFg }]}>
                    {t('Mobile verified')}
                  </Text>
                </View>
              </View>

              <Text style={[styles.profileTradeSubtitle, { color: colors.inkSecondary }]}>
                {profile.trade ? t(TRADE_LABEL[profile.trade]) : t('Trade not added')} · {formatPhone(profile.phone)}
              </Text>
            </View>
          </View>

          {/* Profile Strength Progress */}
          {summary && (
            <View style={[styles.strengthBox, { borderTopColor: colors.border }]}>
              <View style={styles.strengthTextRow}>
                <Text style={[styles.strengthLabel, { color: colors.inkSecondary }]}>
                  {t('Profile {n}% complete', { n: summary.profileStrength })}
                </Text>
              </View>
              <View style={[styles.strengthTrack, { backgroundColor: colors.surfaceStrong }]}>
                <View
                  style={[
                    styles.strengthFill,
                    { width: `${summary.profileStrength}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              {summary.profileHint && (
                <Text style={[styles.strengthHint, { color: colors.inkMuted }]}>
                  {t(summary.profileHint)}
                </Text>
              )}
            </View>
          )}
        </View>

        <SegmentedTabs
          style={styles.tabSwitcher}
          value={tab}
          onChange={setTab}
          items={[
            { key: 'profile', label: t('Details') },
            { key: 'documents', label: t('Resume & documents') },
          ]}
        />

        {/* Tab 1: Profile Details */}
        {tab === 'profile' ? (
          <View style={styles.tabContent}>
            {/* Work Details Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('Work')}</Text>
              </View>

              <DefinitionRow
                label={t('Trade')}
                value={profile.trade ? t(TRADE_LABEL[profile.trade]) : '—'}
              />
              <DefinitionRow
                label={t('Experience')}
                value={profile.experience ? t(EXPERIENCE_LABEL[profile.experience]) : '—'}
              />
              <DefinitionRow
                label={t('Education')}
                value={profile.qualifications?.join(', ') || '—'}
              />
              <DefinitionRow
                label={t('Licences / certificates')}
                value={profile.licences?.join(', ') || '—'}
              />
              {profile.safetyTrainingHours && (
                <DefinitionRow
                  label={t('Safety training')}
                  value={t('{n} hours', { n: profile.safetyTrainingHours })}
                />
              )}
              <DefinitionRow
                label={t('Languages I speak')}
                value={profile.languages?.join(', ') || 'Hindi'}
              />

              {/* Skills */}
              <View style={[styles.subSection, { borderColor: colors.border }]}>
                <Text style={[styles.subSectionLabel, { color: colors.inkMuted }]}>
                  {t('Skills')}
                </Text>
                <View style={styles.skillsRow}>
                  {profile.skills?.map((s) => (
                    <View
                      key={s}
                      style={[styles.skillChip, { backgroundColor: colors.surfaceMuted }]}
                    >
                      <Text style={[styles.skillChipText, { color: colors.ink }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Work History */}
              <View style={[styles.subSection, { borderColor: colors.border }]}>
                <Text style={[styles.subSectionLabel, { color: colors.inkMuted }]}>
                  {t('Past jobs')}
                </Text>
                {profile.workHistory?.length ? (
                  profile.workHistory.map((h, i) => (
                    <View key={i} style={styles.historyRow}>
                      <Text style={[styles.historyRole, { color: colors.ink }]}>
                        {h.role} <Text style={{ color: colors.inkSecondary, fontWeight: '400' }}>· {h.company} ({h.from}–{h.to || t('now')})</Text>
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyHint, { color: colors.inkMuted }]}>
                    {t('Add where you worked before. Employers check this first.')}
                  </Text>
                )}
              </View>
            </View>

            {/* Personal Details Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('Personal')}</Text>
              </View>

              <DefinitionRow label={t('Name')} value={profile.name} />
              <DefinitionRow label={t('Mobile')} value={formatPhone(profile.phone)} />
              <DefinitionRow label={t('Email')} value={profile.email || '—'} />
              <DefinitionRow
                label={t('Date of birth')}
                value={profile.dob ? formatDate(profile.dob) : '—'}
              />
              <DefinitionRow
                label={t('Gender')}
                value={profile.gender ? { male: 'Male', female: 'Female', other: 'Other' }[profile.gender] : '—'}
              />
              <DefinitionRow
                label={t('City')}
                value={profile.location ? `${profile.location.city}, ${profile.location.state}` : '—'}
              />
              {profile.about && (
                <DefinitionRow label={t('About me')} value={profile.about} />
              )}
            </View>

            {/* Job Preferences Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>
                  {t('Job preferences')}
                </Text>
              </View>

              <DefinitionRow
                label={t('Expected pay')}
                value={profile.expectedPay ? `₹${formatNumber(profile.expectedPay)} / ${t('month')}` : '—'}
              />
              <DefinitionRow
                label={t('Shift')}
                value={profile.shiftPreference ? t(SHIFT_LABEL[profile.shiftPreference]) : '—'}
              />
              <DefinitionRow
                label={t('Looking for')}
                value={profile.employmentType ? t(EMPLOYMENT_TYPE_LABEL[profile.employmentType]) : '—'}
              />
              <DefinitionRow
                label={t('Ready to move')}
                value={profile.willingToRelocate ? t('Yes') : t('No')}
              />
              <DefinitionRow
                label={t('When can you join')}
                value={t(AVAILABILITY_LABEL[profile.availability])}
              />
            </View>
          </View>
        ) : (
          /* Tab 2: Resume & Documents */
          <View style={styles.tabContent}>
            <View style={[styles.uploadPromptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.uploadPromptHeader}>
                <Upload size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uploadTitle, { color: colors.ink }]}>
                    {t('Add your certificate or resume')}
                  </Text>
                  <Text style={[styles.uploadSubtitle, { color: colors.inkSecondary }]}>
                    {t('Verified documents help you get shortlisted faster by leading industrial plants.')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleUploadDocument}
                disabled={uploadDocMutation.isPending}
                style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
              >
                {uploadDocMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.uploadBtnText}>{t('Upload document')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Documents List */}
            <View style={{ gap: 10 }}>
              {docs?.map((d) => (
                <View
                  key={d.id}
                  style={[styles.docCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.docIconCircle, { backgroundColor: colors.primarySoft }]}>
                    <FileText size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.docTitleRow}>
                      <Text style={[styles.docName, { color: colors.ink }]} numberOfLines={1}>
                        {d.name}
                      </Text>
                      {d.isDefaultResume && (
                        <View style={[styles.starBadge, { backgroundColor: colors.tiles.yellow.bg }]}>
                          <Star size={11} color={colors.tiles.yellow.text} fill={colors.tiles.yellow.text} />
                          <Text style={[styles.starBadgeText, { color: colors.tiles.yellow.text }]}>
                            {t('Default')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.docMeta, { color: colors.inkMuted }]}>
                      {t(DOC_TYPE_LABEL[d.type])} · {formatDate(d.uploadedAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(t('Log out'), t('Are you sure you want to log out of IndustriaLink?'), [
              { text: t('Cancel'), style: 'cancel' },
              {
                text: t('Log out'),
                style: 'destructive',
                onPress: () => logout(),
              },
            ]);
          }}
          style={[styles.logoutBtn, { borderColor: colors.border }]}
        >
          <LogOut size={16} color={colors.dangerFg} />
          <Text style={[styles.logoutBtnText, { color: colors.dangerFg }]}>{t('Log out')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
};

function DefinitionRow({ label, value }: { label: string; value: string }) {
  const { colors } = useUiStore();
  return (
    <View style={styles.defRow}>
      <Text style={[styles.defLabel, { color: colors.inkMuted }]}>{label}</Text>
      <Text style={[styles.defValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 14,
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTextInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileTradeSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  strengthBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 14,
    gap: 6,
  },
  strengthTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  strengthTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthHint: {
    fontSize: 11.5,
    marginTop: 2,
  },
  tabSwitcher: {},
  tabButton: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  tabContent: {
    gap: 14,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  defRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  defLabel: {
    fontSize: 13,
    flex: 1,
  },
  defValue: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  subSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 4,
    gap: 6,
  },
  subSectionLabel: {
    fontSize: 12,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyRow: {
    marginTop: 2,
  },
  historyRole: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  emptyHint: {
    fontSize: 12.5,
  },
  uploadPromptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  uploadPromptHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  uploadSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 17,
  },
  uploadBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  docIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  starBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  docMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
