import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { Text } from './Text';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { useUiStore } from '../../store/uiStore';
import { t } from '../../lib/i18n';

interface Props {
  label?: string;
  /** 'YYYY-MM-DD' for dates, 'HH:mm' for times. */
  value?: string;
  onChange: (value: string) => void;
  mode?: 'date' | 'time';
  minimumDate?: Date;
  placeholder?: string;
  error?: string;
  style?: object;
}

const pad = (n: number) => String(n).padStart(2, '0');

function toDate(value: string | undefined, mode: 'date' | 'time'): Date {
  const now = new Date();
  if (!value) return now;
  if (mode === 'date') {
    const [y, m, d] = value.split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d) : now;
  }
  const [h, min] = value.split(':').map(Number);
  const dt = new Date();
  dt.setHours(h ?? 9, min ?? 0, 0, 0);
  return dt;
}

const fromDate = (d: Date, mode: 'date' | 'time') =>
  mode === 'date' ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function displayDate(value?: string, mode: 'date' | 'time' = 'date') {
  if (!value) return '';
  const d = toDate(value, mode);
  return mode === 'date'
    ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** A tappable field that opens the phone's date or time picker. */
export const DateField: React.FC<Props> = ({ label, value, onChange, mode = 'date', minimumDate, placeholder, error, style }) => {
  const colors = useUiStore((s) => s.colors);
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(() => toDate(value, mode));
  const Icon = mode === 'date' ? Calendar : Clock;

  const show = () => {
    const current = toDate(value, mode);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        minimumDate,
        is24Hour: false,
        onChange: (e, d) => {
          if (e.type === 'set' && d) onChange(fromDate(d, mode));
        },
      });
    } else {
      setTemp(current);
      setOpen(true);
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={[styles.label, { color: colors.inkSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={show}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.field, { backgroundColor: colors.surface, borderColor: error ? colors.dangerFg : colors.border }]}
      >
        <Icon size={18} color={colors.inkMuted} />
        <Text style={{ color: value ? colors.ink : colors.inkMuted, fontSize: 16, fontWeight: '500' }}>
          {value ? displayDate(value, mode) : (placeholder ?? (mode === 'date' ? t('Choose a date') : t('Choose a time')))}
        </Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: colors.dangerFg }]}>{error}</Text> : null}

      {Platform.OS === 'ios' && (
        <Sheet visible={open} onClose={() => setOpen(false)} title={label} scroll={false}>
          <DateTimePicker
            value={temp}
            mode={mode}
            display="spinner"
            minimumDate={minimumDate}
            onChange={(_e, d) => d && setTemp(d)}
            themeVariant={useUiStore.getState().theme === 'dark' ? 'dark' : 'light'}
          />
          <Button
            label={t('Done')}
            onPress={() => {
              onChange(fromDate(temp, mode));
              setOpen(false);
            }}
            style={{ marginTop: 8 }}
          />
        </Sheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: { minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { fontSize: 13, marginTop: 4 },
});
