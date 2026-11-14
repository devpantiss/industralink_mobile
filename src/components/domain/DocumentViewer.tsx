import React, { useState } from 'react';
import { View, Image, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { FileText } from '../ui/icons';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { useUiStore } from '../../store/uiStore';
import { formatBytes, formatDate } from '../../lib/format';
import { t } from '../../lib/i18n';

export interface ViewableDoc {
  name: string;
  typeLabel: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  url?: string;
}

interface Props {
  doc: ViewableDoc | null;
  onClose: () => void;
  /** Who is looking, so the "who can see this" line is correct. */
  audience: 'worker' | 'hr' | 'admin';
  /** Extra line for the worker view, e.g. "Shown to an employer after they shortlist you." */
  visibility?: string;
}

/** Document sheet: details, an in-app preview for images, and the phone's viewer for PDFs. */
export const DocumentViewer: React.FC<Props> = ({ doc, onClose, audience, visibility }) => {
  const colors = useUiStore((s) => s.colors);
  const showToast = useUiStore((s) => s.showToast);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isImage = !!doc?.mimeType?.startsWith('image/') && !!doc.url;

  const open = async () => {
    try {
      if (!doc?.url) throw new Error('no url');
      await Linking.openURL(doc.url);
    } catch {
      showToast(t('This file cannot be opened right now.'), 'error');
    }
  };

  const who =
    visibility ??
    (audience === 'worker'
      ? t('Employers you apply to can see this. ID proof is shown only after they shortlist you.')
      : audience === 'hr'
        ? t('Shared by the worker with you for this application.')
        : t('Shared with the admin team for review.'));

  return (
    <Sheet visible={!!doc} onClose={onClose} title={doc?.typeLabel} subtitle={doc?.name}>
      {doc ? (
        <View>
          {isImage && !failed ? (
            <View style={[styles.preview, { backgroundColor: colors.surfaceMuted }]}>
              <Image
                source={{ uri: doc.url }}
                style={styles.image}
                resizeMode="contain"
                onLoadEnd={() => setLoading(false)}
                onError={() => setFailed(true)}
              />
              {loading ? <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.primary} /> : null}
            </View>
          ) : (
            <View style={[styles.preview, styles.center, { backgroundColor: colors.surfaceMuted }]}>
              <FileText size={40} color={colors.inkMuted} />
              <Text style={[styles.hint, { color: colors.inkSecondary }]}>
                {doc.url ? t('This file opens in your phone’s viewer.') : t('No preview available for this file.')}
              </Text>
            </View>
          )}

          <View style={styles.meta}>
            <Row label={t('Type')} value={doc.typeLabel} />
            {doc.sizeBytes ? <Row label={t('Size')} value={formatBytes(doc.sizeBytes)} /> : null}
            {doc.uploadedAt ? <Row label={t('Added')} value={formatDate(doc.uploadedAt)} /> : null}
          </View>

          <Text style={[styles.who, { color: colors.inkSecondary }]}>{who}</Text>

          {doc.url ? (
            <Button
              label={isImage ? t('Open full size') : t('Open file')}
              variant="outline"
              onPress={open}
              style={{ marginTop: 16 }}
            />
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.inkMuted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  preview: { height: 240, borderRadius: 16, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  image: { width: '100%', height: '100%' },
  hint: { fontSize: 14, textAlign: 'center' },
  meta: { marginTop: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  who: { fontSize: 13, lineHeight: 19, marginTop: 16 },
});
