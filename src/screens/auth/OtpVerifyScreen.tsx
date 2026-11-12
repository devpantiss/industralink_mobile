import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle2, RotateCw } from 'lucide-react-native';
import { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/layout/Screen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export const OtpVerifyScreen: React.FC<Props> = ({ route }) => {
  const { phone } = route.params;
  const { colors, showToast } = useUiStore();
  const { verifyOtp, sendOtp } = useAuthStore();

  const [digits, setDigits] = useState(['1', '2', '3', '4', '5', '6']);
  const [timer, setTimer] = useState(45);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<any>>([]);

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleDigitChange = (val: string, index: number) => {
    const updated = [...digits];
    updated[index] = val;
    setDigits(updated);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (updated.every((d) => d !== '') && updated.join('').length === 6) {
      Keyboard.dismiss();
      submitOtp(updated.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (code: string) => {
    setLoading(true);
    try {
      await verifyOtp(phone, code);
      showToast('Verified successfully! Welcome to IndustriaLink.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Verification failed. Try 123456.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await sendOtp(phone);
      setTimer(60);
      showToast('New verification code sent!', 'info');
    } catch {
      showToast('Failed to resend code', 'error');
    }
  };

  return (
    <Screen edges={['top']}>
      <AppHeader title="OTP Verification" showBack />
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.badgeRow}>
            <Badge label="Demo code: 123456" variant="primary" />
          </View>

          <Text style={[typography.h1, styles.heading, { color: colors.ink }]}>
            Enter 6-digit Code
          </Text>
          <Text style={[typography.body, styles.sub, { color: colors.inkSecondary }]}>
            We have sent a verification code to +91 {phone}. Enter below to confirm your mobile number.
          </Text>

          {/* 6 Individual PIN Digit Boxes */}
          <View style={styles.otpBoxesRow}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <TextInput
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                value={digits[idx]}
                onChangeText={(val) => handleDigitChange(val.slice(-1), idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: digits[idx] ? colors.primary : colors.border,
                    borderWidth: digits[idx] ? 2 : 1,
                    color: colors.ink,
                  },
                ]}
              />
            ))}
          </View>

          <Button
            label="Verify & Sign In"
            loading={loading}
            onPress={() => submitOtp(digits.join(''))}
            style={styles.verifyBtn}
          />

          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={[typography.caption, { color: colors.inkMuted }]}>
                Resend code in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
                <RotateCw size={14} color={colors.primary} />
                <Text style={[typography.small, { color: colors.primary, fontWeight: '700', marginLeft: 4 }]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.xl,
  },
  badgeRow: {
    marginBottom: spacing.sm,
  },
  heading: {
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  sub: {
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
  },
  verifyBtn: {
    marginBottom: spacing.md,
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
