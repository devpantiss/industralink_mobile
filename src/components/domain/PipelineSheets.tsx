import React, { useState } from 'react';
import { Toggle } from '../ui/Toggle';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../ui/Text';
import { Sheet } from '../ui/Sheet';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DateField } from '../ui/DateField';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';
import type { PayPeriod, PayType } from '../../types';

interface BaseProps {
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDay(d);
};
const todayIso = () => isoDay(new Date());

/** Combine a picked day and time into a local ISO string without a time-zone shift. */
const at = (day: string, time: string) => new Date(`${day}T${time}:00`).toISOString();

/* ---------- Interview ---------- */

export const InterviewSheet: React.FC<
  BaseProps & { name: string; sites: string[]; defaultPlace?: string; rescheduling?: boolean; onSubmit: (payload: Record<string, unknown>) => void }
> = ({ visible, onClose, loading, name, sites, defaultPlace, rescheduling, onSubmit }) => {
  const colors = useUiStore((s) => s.colors);
  const [day, setDay] = useState<string | undefined>(tomorrow());
  const [time, setTime] = useState<string | undefined>('10:00');
  const [place, setPlace] = useState(defaultPlace ?? '');
  const [ask, setAsk] = useState('');
  const [bring, setBring] = useState('ID proof, certificates, 2 photos');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!day) e.day = t('Choose the date.');
    else if (time && new Date(`${day}T${time}:00`).getTime() < Date.now()) e.day = t('Choose a time in the future.');
    if (!time) e.time = t('Choose the time.');
    if (place.trim().length < 3) e.place = t('Enter where the worker should come.');
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ at: at(day!, time!), place: place.trim(), contactPerson: ask.trim(), bring: bring.trim(), note: note.trim() });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={rescheduling ? t('Change interview') : t('Schedule interview')}
      subtitle={t('{name} will get the time and place.', { name })}
      maxHeight={0.94}
      footer={
        <View style={styles.footer}>
          <Button label={t('Cancel')} variant="ghost" onPress={onClose} />
          <Button label={rescheduling ? t('Save') : t('Schedule')} onPress={submit} loading={loading} style={styles.flex} />
        </View>
      }
    >
      <View>
        <View style={styles.row}>
          <DateField style={styles.flex} label={t('Date')} value={day} onChange={setDay} minimumDate={new Date()} error={errors.day} />
          <DateField style={styles.flex} mode="time" label={t('Time')} value={time} onChange={setTime} error={errors.time} />
        </View>
        <Input label={t('Place')} value={place} onChangeText={setPlace} multiline placeholder={t('Gate, plant or office address')} error={errors.place} />
        {sites.length > 0 && (
          <View style={styles.quick}>
            {sites.map((s) => (
              <Pressable key={s} onPress={() => setPlace(s)} style={[styles.quickChip, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.ink, fontSize: 13 }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Input label={t('Ask for')} value={ask} onChangeText={setAsk} placeholder={t('Name of the person at the gate')} />
        <Input label={t('What to bring')} value={bring} onChangeText={setBring} />
        <Input label={t('Note for the worker')} value={note} onChangeText={setNote} placeholder={t('e.g. Come through gate 3')} />
      </View>
    </Sheet>
  );
};

/* ---------- Offer ---------- */

export const OfferSheet: React.FC<
  BaseProps & { name: string; defaultPay?: number; defaultPlace?: string; onSubmit: (payload: Record<string, unknown>) => void }
> = ({ visible, onClose, loading, name, defaultPay, defaultPlace, onSubmit }) => {
  const colors = useUiStore((s) => s.colors);
  const [pay, setPay] = useState(defaultPay ? String(defaultPay) : '');
  const [period, setPeriod] = useState<PayPeriod>('month');
  const [payType, setPayType] = useState<PayType>('in_hand');
  const [joining, setJoining] = useState<string | undefined>();
  const [place, setPlace] = useState(defaultPlace ?? '');
  const [replyBy, setReplyBy] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    const p = Number(pay);
    const [lo, hi] = period === 'month' ? [5000, 500000] : [200, 10000];
    if (!p || p < lo || p > hi) e.pay = t('Enter the pay in rupees.');
    if (!joining) e.joining = t('Choose the joining date.');
    else if (joining < todayIso()) e.joining = t('The joining date cannot be in the past.');
    if (replyBy && replyBy < todayIso()) e.replyBy = t('The reply date cannot be in the past.');
    else if (replyBy && joining && replyBy > joining) e.replyBy = t('The reply date should be before the joining date.');
    if (place.trim().length < 3) e.place = t('Enter where the worker will work.');
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ pay: p, payPeriod: period, payType, joiningDate: joining, place: place.trim(), replyBy, note: note.trim() });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('Send job offer')}
      subtitle={t('{name} can accept or decline in the app.', { name })}
      maxHeight={0.94}
      footer={
        <View style={styles.footer}>
          <Button label={t('Cancel')} variant="ghost" onPress={onClose} />
          <Button label={t('Send offer')} onPress={submit} loading={loading} style={styles.flex} />
        </View>
      }
    >
      <View>
        <Text style={[styles.label, { color: colors.inkSecondary }]}>{t('Pay is paid')}</Text>
        <View style={styles.chips}>
          {(['month', 'day'] as PayPeriod[]).map((k) => (
            <Chip key={k} on={period === k} label={k === 'month' ? t('Per month') : t('Per day')} onPress={() => setPeriod(k)} />
          ))}
        </View>
        <Input label={`${t('Pay')} (₹)`} value={pay} onChangeText={(v) => setPay(v.replace(/\D/g, '').slice(0, 7))} keyboardType="number-pad" error={errors.pay} />
        <View style={styles.chips}>
          {(['in_hand', 'ctc'] as PayType[]).map((k) => (
            <Chip key={k} on={payType === k} label={k === 'in_hand' ? t('In-hand') : t('Before PF/ESI')} onPress={() => setPayType(k)} />
          ))}
        </View>
        <DateField label={t('Joining date')} value={joining} onChange={setJoining} minimumDate={new Date()} error={errors.joining} />
        <Input label={t('Place of work')} value={place} onChangeText={setPlace} multiline error={errors.place} />
        <DateField label={t('Please reply by (optional)')} value={replyBy} onChange={setReplyBy} minimumDate={new Date()} error={errors.replyBy} />
        <Input label={t('Note for the worker')} value={note} onChangeText={setNote} placeholder={t('e.g. Bring your original certificates on day one')} />
      </View>
    </Sheet>
  );
};

/* ---------- Reject ---------- */

const REASONS = ['Position filled', 'More experience needed', 'Trade does not match', 'Did not attend', 'Documents not clear', 'Other'];

export const RejectSheet: React.FC<
  BaseProps & { title?: string; onSubmit: (payload: { reason: string; notify: boolean }) => void }
> = ({ visible, onClose, loading, title, onSubmit }) => {
  const colors = useUiStore((s) => s.colors);
  const [reason, setReason] = useState<string | undefined>();
  const [more, setMore] = useState('');
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string>();

  const submit = () => {
    if (!reason) return setError(t('Choose a reason. Only you can see it.'));
    setError(undefined);
    onSubmit({ reason: more.trim() ? `${reason}: ${more.trim()}` : reason, notify });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title ?? t('Reject candidate?')}
      subtitle={t('The worker gets a kind, general message. Your reason stays private.')}
      footer={
        <View style={styles.footer}>
          <Button label={t('Cancel')} variant="ghost" onPress={onClose} />
          <Button label={t('Reject')} variant="danger" onPress={submit} loading={loading} style={styles.flex} />
        </View>
      }
    >
      <View>
        <Text style={[styles.label, { color: colors.inkSecondary }]}>{t('Reason (private)')}</Text>
        <View style={styles.chips}>
          {REASONS.map((r) => (
            <Chip key={r} on={reason === r} label={t(r)} onPress={() => setReason(r)} />
          ))}
        </View>
        {error ? <Text style={{ color: colors.dangerFg, fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}
        <Input label={t('More detail (private)')} value={more} onChangeText={setMore} />
        <View style={styles.switchRow}>
          <Text style={{ color: colors.ink, fontSize: 15, flex: 1 }}>{t('Tell the worker')}</Text>
          <Toggle value={notify} onValueChange={setNotify} />
        </View>
      </View>
    </Sheet>
  );
};

/* ---------- Mark joined ---------- */

export const JoinedSheet: React.FC<BaseProps & { name: string; defaultDate?: string; onSubmit: (joinedAt: string) => void }> = ({
  visible,
  onClose,
  loading,
  name,
  defaultDate,
  onSubmit,
}) => {
  const [day, setDay] = useState<string | undefined>(defaultDate || todayIso());
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('Mark as joined')}
      subtitle={t('Confirm that {name} has joined.', { name })}
      footer={
        <View style={styles.footer}>
          <Button label={t('Cancel')} variant="ghost" onPress={onClose} />
          <Button label={t('Confirm joining')} onPress={() => day && onSubmit(day)} loading={loading} style={styles.flex} />
        </View>
      }
    >
      <DateField label={t('Date joined')} value={day} onChange={setDay} />
    </Sheet>
  );
};

const Chip: React.FC<{ on: boolean; label: string; onPress: () => void }> = ({ on, label, onPress }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[styles.chip, { backgroundColor: on ? colors.primarySoft : colors.surface, borderColor: on ? colors.primary : colors.border }]}
    >
      <Text style={{ color: on ? colors.primary : colors.ink, fontWeight: on ? '700' : '500', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, justifyContent: 'center' },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: -6 },
  quickChip: { minHeight: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
});
