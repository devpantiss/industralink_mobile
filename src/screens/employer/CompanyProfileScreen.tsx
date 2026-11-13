import { errorText } from '../../lib/errors';
import { VerificationBanner } from '../../components/domain/VerificationBanner';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { BadgeCheck, Clock, EyeOff, FileText, Trash2, Plus } from 'lucide-react-native';
import { Sheet } from '../../components/ui/Sheet';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { CompanyLogo } from '../../components/domain/CompanyLogo';
import { employerApi } from '../../api/employerApi';
import { queryKeys } from '../../api/keys';
import { useUiStore } from '../../store/uiStore';
import { COMPANY_DOC_LABEL, HIRING_TYPE_LABEL, SECTOR_LABEL } from '../../lib/labels';
import { formatDate } from '../../lib/format';
import type { Company, CompanyDocType, HiringType, Sector } from '../../types';
import { shadows } from '../../theme/shadows';

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const SIZES = ['1–50', '50–200', '200–1000', '1000+'];

/** Employer's company page (web: CompanyPage). Workers see this on every job. */
export const CompanyProfileScreen: React.FC = () => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: queryKeys.employer.company, queryFn: () => employerApi.getCompany() });
  /** Unsaved edits; undefined means the form shows what is saved. */
  const [draft, setDraft] = useState<Company>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const c = draft ?? q.data;

  const save = useMutation({
    mutationFn: (next: Company) =>
      employerApi.updateCompany({ ...next, sites: (next.sites ?? []).map((x) => x.trim()).filter(Boolean) }),
    onSuccess: (saved) => {
      qc.setQueryData(queryKeys.employer.company, saved);
      setDraft(undefined);
      showToast('Company profile saved', 'success');
    },
    onError: () => showToast('Could not save. Please try again.', 'error'),
  });

  const resubmit = useMutation({
    mutationFn: (next: Company) => employerApi.updateCompany({ ...next, resubmit: true } as Partial<Company>),
    onSuccess: (saved) => {
      qc.setQueryData(queryKeys.employer.company, saved);
      setDraft(undefined);
      showToast('Sent to our team for review', 'success');
    },
    onError: (e: Error) => showToast(errorText(e, 'Could not send for review.'), 'error'),
  });

  // Verification documents (admin checks these before the company goes live)
  const docsQuery = useQuery({ queryKey: queryKeys.employer.companyDocs, queryFn: () => employerApi.getCompanyDocuments() });
  const [docMenu, setDocMenu] = useState(false);
  const uploadDoc = useMutation({
    mutationFn: (d: { name: string; type: CompanyDocType; fileUrl: string; sizeBytes?: number; mimeType?: string }) =>
      employerApi.uploadCompanyDocument(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employer.companyDocs });
      showToast('Document added', 'success');
    },
    onError: () => showToast('Could not upload. Try again.', 'error'),
  });
  const deleteDoc = useMutation({
    mutationFn: (id: string) => employerApi.deleteCompanyDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employer.companyDocs });
      showToast('Document deleted', 'success');
    },
  });
  const pickCompanyDoc = async (type: CompanyDocType) => {
    setDocMenu(false);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
      const a = !res.canceled ? res.assets[0] : undefined;
      if (!a) return;
      if ((a.size ?? 0) > 5 * 1024 * 1024) return showToast('This file is too big. Choose a file under 5 MB.', 'warning');
      uploadDoc.mutate({ name: a.name, type, fileUrl: a.uri, sizeBytes: a.size, mimeType: a.mimeType });
    } catch {
      showToast('Could not open that file. Try again.', 'error');
    }
  };

  if (q.isLoading || !c) {
    return (
      <Screen edges={['top']}>
        <AppHeader />
        <ListSkeleton count={3} style={styles.pad} />
      </Screen>
    );
  }

  const set = (changes: Partial<Company>) => setDraft({ ...c, ...changes });
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(q.data);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!c.name.trim()) e.name = 'Enter the company name.';
    if (!c.location.city.trim()) e.city = 'Enter the city of your main site.';
    if (!c.location.state.trim()) e.state = 'Enter the state.';
    if (c.hrPhone && !/^[6-9]\d{9}$/.test(c.hrPhone)) e.hrPhone = 'Enter a 10-digit mobile number.';
    if (c.pincode && !/^\d{6}$/.test(c.pincode)) e.pincode = 'Pincode has 6 digits.';
    if (c.gstNumber && !GSTIN.test(c.gstNumber)) e.gst = 'A GST number has 15 characters, like 21ABCDE1234F1Z5.';
    setErrors(e);
    if (Object.keys(e).length) return showToast('Please fix the highlighted fields.', 'error');
    save.mutate(c);
  };

  const approved = c.verification === 'approved';

  return (
    <Screen edges={['top']}>
      <AppHeader />
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.pad, { paddingBottom: 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.ink }]}>Company</Text>
          <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>Workers see this on every job you post.</Text>

          <VerificationBanner onCompanyScreen />
          {c.verification === 'rejected' ? (
            <Button
              label="Send again for review"
              loading={resubmit.isPending}
              onPress={() => resubmit.mutate(c)}
              style={{ marginTop: 12 }}
            />
          ) : null}
          {/* Identity */}
          <View style={[styles.card, styles.identity, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CompanyLogo job={{ companyName: c.name || '?', sector: c.sector, companyLogoUrl: c.logoUrl }} size="lg" />
            <View style={styles.flex}>
              <Text style={[styles.companyName, { color: colors.ink }]} numberOfLines={2}>
                {c.name || 'Your company'}
              </Text>
              <Text style={[styles.meta, { color: colors.inkSecondary }]} numberOfLines={1}>
                {SECTOR_LABEL[c.sector]} · {c.location.city || 'City'}
              </Text>
              <View
                style={[styles.verify, { backgroundColor: approved ? colors.successBg : colors.warningBg }]}
              >
                {approved ? (
                  <BadgeCheck size={14} color={colors.successFg} />
                ) : (
                  <Clock size={14} color={colors.warningFg} />
                )}
                <Text style={[styles.verifyText, { color: approved ? colors.successFg : colors.warningFg }]}>
                  {approved ? 'Verified company' : c.verification === 'rejected' ? 'Not approved' : 'Waiting for approval'}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <Section title="Company details">
            <Input
              label="Company name *"
              value={c.name}
              error={errors.name}
              onChangeText={(name) => set({ name })}
            />
            <ChipField
              label="Industry"
              options={(Object.keys(SECTOR_LABEL) as Sector[]).map((k) => ({ key: k, label: SECTOR_LABEL[k] }))}
              value={c.sector}
              onChange={(sector) => set({ sector })}
            />
            <ChipField
              label="Company size (people)"
              options={SIZES.map((k) => ({ key: k, label: k }))}
              value={c.size}
              onChange={(size) => set({ size })}
            />
            <ChipField
              label="Hiring as"
              hint="Contractors and agencies hire workers for other companies."
              options={(Object.keys(HIRING_TYPE_LABEL) as HiringType[]).map((k) => ({ key: k, label: HIRING_TYPE_LABEL[k] }))}
              value={c.hiringType}
              onChange={(hiringType) => set({ hiringType })}
            />
            <Input
              label="About"
              value={c.about ?? ''}
              onChangeText={(about) => set({ about })}
              multiline
              style={styles.multiline}
              placeholder="What you make, and who you hire"
              placeholderTextColor={colors.inkMuted}
            />
            <Input
              label="Website"
              value={c.website ?? ''}
              onChangeText={(website) => set({ website })}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Input
              label="GST number"
              value={c.gstNumber ?? ''}
              maxLength={15}
              error={errors.gst}
              autoCapitalize="characters"
              onChangeText={(g) => set({ gstNumber: g.toUpperCase() })}
            />
          </Section>

          {/* Location */}
          <Section title="Location">
            <View style={styles.row2}>
              <Input
                label="City *"
                value={c.location.city}
                error={errors.city}
                containerStyle={styles.flex}
                onChangeText={(city) => set({ location: { ...c.location, city } })}
              />
              <Input
                label="State *"
                value={c.location.state}
                error={errors.state}
                containerStyle={styles.flex}
                onChangeText={(state) => set({ location: { ...c.location, state } })}
              />
            </View>
            <Input
              label="Address"
              value={c.address ?? ''}
              placeholder="Area, road or plant gate"
              placeholderTextColor={colors.inkMuted}
              onChangeText={(address) => set({ address: address || undefined })}
            />
            <Input
              label="Pincode"
              value={c.pincode ?? ''}
              error={errors.pincode}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(p) => set({ pincode: p.replace(/\D/g, '') || undefined })}
            />
            <Input
              label="Plants / sites"
              value={(c.sites ?? []).join('\n')}
              multiline
              style={styles.multiline}
              placeholder={'One per line, e.g.\nSmelter Plant 2'}
              placeholderTextColor={colors.inkMuted}
              onChangeText={(v) => set({ sites: v.split('\n') })}
            />
            <Text style={[styles.hint, { color: colors.inkMuted }]}>You can pick these when posting a job.</Text>
          </Section>

          {/* HR contact */}
          <Section title="HR contact">
            <View style={[styles.private, { backgroundColor: colors.surfaceMuted }]}>
              <EyeOff size={16} color={colors.inkSecondary} />
              <Text style={[styles.privateText, { color: colors.inkSecondary }]}>
                Not shown to workers. Our team may call to check your company. The number also fills in on new jobs.
              </Text>
            </View>
            <Input label="Name" value={c.hrName ?? ''} onChangeText={(hrName) => set({ hrName: hrName || undefined })} />
            <Input
              label="Designation"
              value={c.hrDesignation ?? ''}
              placeholder="e.g. HR Manager"
              placeholderTextColor={colors.inkMuted}
              onChangeText={(d) => set({ hrDesignation: d || undefined })}
            />
            <Input
              label="Mobile number"
              value={c.hrPhone ?? ''}
              error={errors.hrPhone}
              keyboardType="number-pad"
              maxLength={10}
              leftIcon={<Text style={[styles.prefix, { color: colors.inkSecondary }]}>+91</Text>}
              onChangeText={(p) => set({ hrPhone: p.replace(/\D/g, '') || undefined })}
            />
          </Section>

          {/* Verification documents */}
          <Section title="Verification documents">
            <Text style={[styles.hint, { color: colors.inkMuted }]}>
              Our team checks these before your company goes live. PDF or photo, up to 5 MB.
            </Text>
            {(docsQuery.data ?? []).map((d) => (
              <View key={d.id} style={[styles.docRow, { borderColor: colors.border }]}>
                <FileText size={20} color={colors.primary} />
                <View style={styles.flex}>
                  <Text style={[styles.docName, { color: colors.ink }]} numberOfLines={1}>{d.name}</Text>
                  <Text style={[styles.hint, { color: colors.inkMuted }]}>
                    {COMPANY_DOC_LABEL[d.type]} · {formatDate(d.uploadedAt)}
                  </Text>
                </View>
                {!approved && <Pressable
                  onPress={() =>
                    Alert.alert('Delete this document?', d.name, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteDoc.mutate(d.id) },
                    ])
                  }
                  accessibilityLabel="Delete document"
                  hitSlop={8}
                  style={styles.docDelete}
                >
                  <Trash2 size={18} color={colors.inkMuted} />
                </Pressable>}
              </View>
            ))}
            {approved ? (
              <Text style={[styles.hint, { color: colors.inkMuted }]}>Your company is approved, so documents are locked. Contact help to change them.</Text>
            ) : <Button
              label="Add a document"
              variant="outline"
              loading={uploadDoc.isPending}
              icon={<Plus size={16} color={colors.primary} />}
              textStyle={{ color: colors.primary }}
              onPress={() => setDocMenu(true)}
            />}
          </Section>
        </ScrollView>

        <Sheet visible={docMenu} onClose={() => setDocMenu(false)} title="Add a document" subtitle="Choose the document type">
          {(Object.keys(COMPANY_DOC_LABEL) as CompanyDocType[]).map((k) => (
            <Pressable key={k} onPress={() => pickCompanyDoc(k)} style={[styles.docRow, { borderColor: colors.border, minHeight: 56 }]}>
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.docName, { color: colors.ink }]}>{COMPANY_DOC_LABEL[k]}</Text>
            </Pressable>
          ))}
        </Sheet>

        {dirty && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown.duration(150)}
            style={[
              styles.saveBar,
              { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <Button label="Discard" variant="ghost" onPress={() => { setDraft(undefined); setErrors({}); }} />
            <Button label="Save changes" onPress={submit} loading={save.isPending} style={styles.flex} />
          </Animated.View>
        )}
      </View>
    </Screen>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.fields}>{children}</View>
    </View>
  );
};

function ChipField<K extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { key: K; label: string }[];
  value?: K | string;
  onChange: (k: K) => void;
}) {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={styles.chipField}>
      <Text style={[styles.label, { color: colors.inkSecondary }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[
                styles.chip,
                on
                  ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.chipText, { color: on ? colors.primary : colors.ink }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={[styles.hint, { color: colors.inkMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  docName: { fontSize: 14, fontWeight: '600', flex: 1 },
  docDelete: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  pad: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 14 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.card },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  companyName: { fontSize: 18, fontWeight: '700', lineHeight: 23 },
  meta: { fontSize: 13, marginTop: 2 },
  verify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  verifyText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  fields: { gap: 14 },
  row2: { flexDirection: 'row', gap: 10 },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
  hint: { fontSize: 12, lineHeight: 16, marginTop: -6 },
  chipField: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '600' },
  private: { flexDirection: 'row', gap: 8, borderRadius: 10, padding: 10, marginTop: -2 },
  privateText: { flex: 1, fontSize: 12.5, lineHeight: 17 },
  prefix: { fontSize: 15, fontWeight: '600' },
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
