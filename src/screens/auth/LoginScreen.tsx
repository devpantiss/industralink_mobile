import { isValidPhone, errorText } from '../../lib/errors';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  HardHat,
  Building2,
  ShieldCheck,
  Languages,
  Moon,
  Sun,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Mail,
  Lock,
  X,
  RotateCw,
  Sparkles,
} from '../../components/ui/icons';
import { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/layout/Screen';
import { LogoMark } from '../../components/ui/LogoMark';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { USE_MOCKS } from '../../api/client';
import { t } from '../../lib/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type Audience = 'worker' | 'employer';

const heroImage = require('../../../assets/login.jpg');

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, theme, toggleTheme, language, setLanguage, showToast } = useUiStore();
  const { sendOtp, verifyOtp, loginWithEmail, loginAsDemo } = useAuthStore();

  const [role, setRole] = useState<Audience>('worker');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [phoneFocused, setPhoneFocused] = useState(false);

  // Employer state (non-controversial brand)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const codeInputs = useRef<any[]>([]);

  // Animation values
  const [roleSlideAnim] = useState(() => new Animated.Value(0));
  const [formFadeAnim] = useState(() => new Animated.Value(1));
  const [formSlideY] = useState(() => new Animated.Value(0));

  // Stretches hero image to cover ~39% of screen height

  useEffect(() => {
    let timer: any = null;
    if (step === 'code' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const triggerFormTransition = () => {
    formFadeAnim.stopAnimation();
    formSlideY.stopAnimation();
    formFadeAnim.setValue(0);
    formSlideY.setValue(8);
    Animated.parallel([
      Animated.timing(formFadeAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        formFadeAnim.setValue(1);
        formSlideY.setValue(0);
      }
    });
  };

  const handleRoleChange = (selected: Audience) => {
    if (selected === role) return;
    Haptics.selectionAsync();

    setRole(selected);
    setStep('phone');

    Animated.spring(roleSlideAnim, {
      toValue: selected === 'worker' ? 0 : 1,
      friction: 9,
      tension: 65,
      useNativeDriver: false,
    }).start();

    triggerFormTransition();
  };

  const handlePhoneSubmit = async () => {
    if (!isValidPhone(phone)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast(t('Enter a 10-digit mobile number that starts with 6, 7, 8 or 9.'), 'warning');
      return;
    }
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await sendOtp(phone);
      if (res.isNewUser) {
        // No account for this number yet: send them to sign up instead of creating one silently.
        showToast(t('No account found for this number. Create one to continue.'), 'info');
        navigation.navigate('Signup');
        return;
      }
      showToast(res.message, 'info');
      setStep('code');
      setCountdown(30);
      triggerFormTransition();
    } catch (err: any) {
      showToast(errorText(err, 'Failed to send the code. Try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    const nextCode = [...code];
    nextCode[index] = text;
    setCode(nextCode);

    if (text && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }

    if (nextCode.every((digit) => digit.length === 1)) {
      handleVerifyOtp(nextCode.join(''));
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (codeString: string) => {
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await verifyOtp(phone, codeString);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t('Welcome back!'), 'success');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(errorText(err, 'That code is not right.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendOtp(phone);
      setCountdown(30);
      showToast(t('New code sent to +91 {phone}', { phone }), 'info');
    } catch {
      showToast(t('Could not resend the code. Try again.'), 'error');
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Please enter your work email and password', 'warning');
      return;
    }
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await loginWithEmail(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Welcome back, Employer!', 'success');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(errorText(err, 'Login failed. Check your email and password.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'worker' | 'employer' | 'admin') => {
    setDemoLoading(demoRole);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await loginAsDemo(demoRole);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Logged in as demo ${demoRole.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(errorText(err, 'Demo login failed'), 'error');
    } finally {
      setDemoLoading(null);
    }
  };

  const getLanguageLabel = () => {
    switch (language) {
      case 'hi':
        return 'हिन्दी';
      case 'or':
        return 'ଓଡ଼ିଆ';
      default:
        return 'English';
    }
  };

  const thumbLeft = roleSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0B1120' }}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <KeyboardScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={[styles.scrollView, { backgroundColor: colors.surface }]}
          // Screen pads only the top here, so the form's last row must clear the home indicator / nav bar.
          contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}
        >
          {/* ================= HERO CONTAINER (Dark Background Behind Radius) ================= */}
          <View style={[styles.heroOuterWrapper, { backgroundColor: '#0B1120' }]}>
            <View style={styles.heroBackground}>
              {/* The photo is tall; crop it so the people (about a quarter of the way down) stay in view. */}
              <Image
                source={heroImage}
                resizeMode="cover"
                style={{ position: 'absolute', left: 0, width: screenWidth, height: screenWidth * 1.5, top: -screenWidth * 1.5 * 0.2 }}
              />
              {/* Rich cinematic gradient overlay */}
              <View style={styles.heroOverlay} />

              {/* Top Navigation Row */}
              <View style={styles.heroTopBar}>
                <View style={styles.brandRow}>
                  <LogoMark size={28} />
                  <Text style={styles.brandText}>IndustriaLink</Text>
                </View>

                <View style={styles.topActions}>
                  {/* Theme Toggle Button */}
                  <TouchableOpacity
                    onPress={toggleTheme}
                    style={styles.glassCircleBtn}
                    activeOpacity={0.8}
                    accessibilityLabel="Toggle Dark Mode"
                  >
                    {theme === 'dark' ? (
                      <Sun size={16} color="#FFFFFF" />
                    ) : (
                      <Moon size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>

                  {/* Language Selector Pill */}
                  <TouchableOpacity
                    onPress={() => setLangModalVisible(true)}
                    style={styles.langPill}
                    activeOpacity={0.8}
                  >
                    <Languages size={14} color="#FFFFFF" />
                    <Text style={styles.langText}>{getLanguageLabel()}</Text>
                    <ChevronDown size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            {/* Seamless 36px dark apron directly behind card top corners */}
            <View style={styles.heroDarkApron} />
          </View>

          {/* ================= REFINED FORM CONTAINER (White all the way to bottom) ================= */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
            {/* Title & Subtitle */}
            <View style={styles.titleBlock}>
              <Text style={[styles.mainTitle, { color: colors.ink }]}>
                {t('Welcome back')}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.inkSecondary }]}>
                {role === 'worker'
                  ? 'Access verified factory jobs & track interviews'
                  : 'Manage candidate pipeline & factory hiring'}
              </Text>
            </View>

            {/* Animated Sliding Segmented Role Switcher */}
            <View
              style={[
                styles.segmentTrack,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
            >
              {/* Sliding Active Pill Background */}
              <Animated.View
                style={[
                  styles.slidingIndicator,
                  {
                    left: thumbLeft,
                    backgroundColor: colors.surface,
                    borderColor: colors.borderStrong,
                    shadowColor: colors.ink,
                  },
                ]}
              />

              {/* Option 1: Worker */}
              <TouchableOpacity
                onPress={() => handleRoleChange('worker')}
                activeOpacity={0.8}
                style={styles.segmentBtn}
              >
                <View
                  style={[
                    styles.segmentIconCircle,
                    {
                      backgroundColor:
                        role === 'worker' ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <HardHat
                    size={16}
                    color={role === 'worker' ? '#FFFFFF' : colors.inkMuted}
                  />
                </View>
                <View style={{ marginLeft: 8, flexShrink: 1 }}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[
                      styles.segmentTitle,
                      { color: role === 'worker' ? colors.ink : colors.inkSecondary },
                    ]}
                  >
                    I need a job
                  </Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.segmentSub, { color: colors.inkMuted }]}>
                    Worker mobile login
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Employer */}
              <TouchableOpacity
                onPress={() => handleRoleChange('employer')}
                activeOpacity={0.8}
                style={styles.segmentBtn}
              >
                <View
                  style={[
                    styles.segmentIconCircle,
                    {
                      backgroundColor:
                        role === 'employer' ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Building2
                    size={16}
                    color={role === 'employer' ? '#FFFFFF' : colors.inkMuted}
                  />
                </View>
                <View style={{ marginLeft: 8, flexShrink: 1 }}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[
                      styles.segmentTitle,
                      { color: role === 'employer' ? colors.ink : colors.inkSecondary },
                    ]}
                  >
                    I’m hiring
                  </Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.segmentSub, { color: colors.inkMuted }]}>
                    Company & HR login
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Animated Form Fields (Fade + Slide Y Transition) */}
            <Animated.View
              style={{
                opacity: formFadeAnim,
                transform: [{ translateY: formSlideY }],
              }}
            >
              {/* ================= WORKER FORM ================= */}
              {role === 'worker' && (
                <View style={styles.formSection}>
                  {step === 'phone' ? (
                    <>
                      <Text style={[styles.inputLabel, { color: colors.ink }]}>
                        {t('Mobile number')}
                      </Text>

                      <View
                        style={[
                          styles.cleanInputContainer,
                          {
                            borderColor: phoneFocused ? colors.primary : colors.border,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      >
                        <View style={styles.countryPrefixBox}>
                          <Text style={[styles.prefixText, { color: colors.ink }]}>+91</Text>
                          <View style={[styles.prefixDivider, { backgroundColor: colors.border }]} />
                        </View>
                        <TextInput
                          value={phone}
                          onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                          onFocus={() => setPhoneFocused(true)}
                          onBlur={() => setPhoneFocused(false)}
                          placeholder="98765 43210"
                          placeholderTextColor={colors.inkMuted}
                          keyboardType="phone-pad"
                          maxLength={10}
                          style={[styles.phoneTextInput, { color: colors.ink }]}
                        />
                        {phone.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setPhone('')}
                            accessibilityLabel={t('Clear')}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ padding: 4 }}
                          >
                            <X size={15} color={colors.inkMuted} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={[styles.inputHint, { color: colors.inkMuted }]}>
                        {t("We'll send a 6-digit code by SMS. No password needed.")}
                      </Text>

                      <TouchableOpacity
                        onPress={handlePhoneSubmit}
                        disabled={loading}
                        style={[
                          styles.primaryBtn,
                          { backgroundColor: colors.primary },
                          loading && { opacity: 0.7 },
                        ]}
                        activeOpacity={0.85}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.primaryBtnText}>{t('Send code')}</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    /* STEP 2: CODE VERIFICATION */
                    <View style={styles.codeStepContainer}>
                      <View style={styles.codeInfoRow}>
                        <Text style={[styles.codeInfoText, { color: colors.inkSecondary }]}>
                          {t('Code sent to')}{' '}
                          <Text style={{ fontWeight: '700', color: colors.ink }}>
                            +91 {phone}
                          </Text>
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setStep('phone');
                            setCode(['', '', '', '', '', '']);
                            triggerFormTransition();
                          }}
                        >
                          <Text style={[styles.changeNumberText, { color: colors.primary }]}>
                            {t('Change')}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.inputLabel, { color: colors.ink, marginTop: 12 }]}>
                        {t('6-digit code')}
                      </Text>

                      {/* 6 Digit Input Boxes */}
                      <View style={styles.codeBoxesRow}>
                        {code.map((digit, idx) => (
                          <TextInput
                            key={idx}
                            ref={(ref) => {
                              codeInputs.current[idx] = ref;
                            }}
                            value={digit}
                            onChangeText={(val) => handleCodeChange(val.replace(/\D/g, ''), idx)}
                            onKeyPress={(e) => handleCodeKeyPress(e, idx)}
                            keyboardType="number-pad"
                            maxLength={1}
                            style={[
                              styles.codeBox,
                              {
                                backgroundColor: colors.surfaceMuted,
                                borderColor: digit ? colors.primary : colors.border,
                                color: colors.ink,
                              },
                            ]}
                            selectTextOnFocus
                          />
                        ))}
                      </View>

                      <View style={styles.resendRow}>
                        <Text style={[styles.resendHint, { color: colors.inkMuted }]}>
                          {USE_MOCKS ? 'Demo code: 123456' : ''}
                        </Text>
                        {countdown > 0 ? (
                          <Text style={[styles.countdownText, { color: colors.inkSecondary }]}>
                            Resend in 0:{countdown < 10 ? `0${countdown}` : countdown}
                          </Text>
                        ) : (
                          <TouchableOpacity
                            onPress={handleResendCode}
                            style={styles.resendBtn}
                          >
                            <RotateCw size={13} color={colors.primary} />
                            <Text style={[styles.resendBtnText, { color: colors.primary }]}>
                              Resend code
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={() => handleVerifyOtp(code.join(''))}
                        disabled={loading || code.some((d) => !d)}
                        style={[
                          styles.primaryBtn,
                          { backgroundColor: colors.primary, marginTop: 16 },
                          (loading || code.some((d) => !d)) && { opacity: 0.6 },
                        ]}
                        activeOpacity={0.85}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.primaryBtnText}>{t('Log in')}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Sign up prompt */}
                  <View style={styles.signupPromptRow}>
                    <Text style={[styles.promptText, { color: colors.inkSecondary }]}>
                      {t('New here?')}{' '}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                      <Text style={[styles.promptLink, { color: colors.primary }]}>
                        {t('Create a free job seeker account')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ================= EMPLOYER FORM ================= */}
              {role === 'employer' && (
                <View style={styles.formSection}>
                  {/* Work Email */}
                  <Text style={[styles.inputLabel, { color: colors.ink }]}>Work email</Text>
                  <Text style={{ color: colors.inkMuted, fontSize: 13, marginBottom: 8 }}>{t('Company and admin accounts sign in here.')}</Text>
                  <View
                    style={[
                      styles.cleanInputContainer,
                      {
                        borderColor: emailFocused ? colors.primary : colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Mail size={17} color={colors.inkMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="name@company.com"
                      placeholderTextColor={colors.inkMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={[styles.standardInput, { color: colors.ink }]}
                    />
                  </View>

                  {/* Password */}
                  <Text style={[styles.inputLabel, { color: colors.ink, marginTop: 12 }]}>
                    Password
                  </Text>
                  <View
                    style={[
                      styles.cleanInputContainer,
                      {
                        borderColor: passwordFocused ? colors.primary : colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Lock size={17} color={colors.inkMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="Enter password"
                      placeholderTextColor={colors.inkMuted}
                      secureTextEntry={!showPassword}
                      style={[styles.standardInput, { color: colors.ink }]}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showPassword ? (
                        <EyeOff size={17} color={colors.inkMuted} />
                      ) : (
                        <Eye size={17} color={colors.inkMuted} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Forgot Password Link */}
                  <TouchableOpacity style={styles.forgotPassBtn} onPress={() => navigation.navigate('ForgotPassword')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={[styles.forgotPassText, { color: colors.primary }]}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleEmailSubmit}
                    disabled={loading}
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: colors.primary, marginTop: 14 },
                      loading && { opacity: 0.7 },
                    ]}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Log in</Text>
                    )}
                  </TouchableOpacity>

                  {/* Sign up prompt */}
                  <View style={styles.signupPromptRow}>
                    <Text style={[styles.promptText, { color: colors.inkSecondary }]}>
                      New company?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                      <Text style={[styles.promptLink, { color: colors.primary }]}>
                        Register your company
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* ================= COMPACT DEMO BAR ================= */}
            {USE_MOCKS && (
            <View style={styles.demoBarWrapper}>
              <View style={styles.demoDividerRow}>
                <View style={[styles.demoLine, { backgroundColor: colors.border }]} />
                <View style={styles.demoBadge}>
                  <Sparkles size={11} color={colors.primary} />
                  <Text style={[styles.demoBadgeText, { color: colors.inkMuted }]}>
                    1-TAP DEMO ACCESS
                  </Text>
                </View>
                <View style={[styles.demoLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.demoPillsRow}>
                {/* 1. Worker */}
                <TouchableOpacity
                  onPress={() => handleDemoLogin('worker')}
                  disabled={!!demoLoading}
                  style={[
                    styles.demoPill,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  {demoLoading === 'worker' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <HardHat size={14} color={colors.primary} />
                      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.demoPillLine}>
                        <Text style={[styles.demoPillTitle, { color: colors.ink }]}>Worker</Text>
                        <Text style={[styles.demoPillWho, { color: colors.inkMuted }]}> · Welder</Text>
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* 2. HR / Employer */}
                <TouchableOpacity
                  onPress={() => handleDemoLogin('employer')}
                  disabled={!!demoLoading}
                  style={[
                    styles.demoPill,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  {demoLoading === 'employer' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Building2 size={14} color="#0284C7" />
                      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.demoPillLine}>
                        <Text style={[styles.demoPillTitle, { color: colors.ink }]}>HR</Text>
                        <Text style={[styles.demoPillWho, { color: colors.inkMuted }]}> · National Eng</Text>
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* 3. Admin */}
                <TouchableOpacity
                  onPress={() => handleDemoLogin('admin')}
                  disabled={!!demoLoading}
                  style={[
                    styles.demoPill,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  {demoLoading === 'admin' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <ShieldCheck size={14} color="#D97706" />
                      <Text style={[styles.demoPillTitle, { color: colors.ink }]}>
                        Admin
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            )}
          </View>
        </KeyboardScrollView>
      </View>

      {/* ================= LANGUAGE PICKER BOTTOM SHEET ================= */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[typography.h3, { color: colors.ink, fontWeight: '700' }]}>
                Select Language
              </Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <X size={20} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>

            {[
              { code: 'en', label: 'English', sub: 'Default' },
              { code: 'hi', label: 'हिन्दी (Hindi)', sub: 'कारखाना नौकरियां और कामगार' },
              { code: 'or', label: 'ଓଡ଼ିଆ (Odia)', sub: 'କାରଖାନା ଚାକିରି ଏବଂ କାରିଗର' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.code}
                onPress={() => {
                  Haptics.selectionAsync();
                  setLanguage(opt.code as any);
                  setLangModalVisible(false);
                }}
                style={[
                  styles.langOptionRow,
                  { borderBottomColor: colors.border },
                  language === opt.code && { backgroundColor: colors.primarySoft },
                ]}
              >
                <View>
                  <Text style={[styles.langOptionTitle, { color: colors.ink }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.langOptionSub, { color: colors.inkSecondary }]}>
                    {opt.sub}
                  </Text>
                </View>
                {language === opt.code && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* HERO (Dark container behind top rounded corners) */
  heroOuterWrapper: {
    flex: 1,
    minHeight: 200,
    width: '100%',
    backgroundColor: '#0B1120',
  },
  heroDarkApron: {
    height: 36,
    width: '100%',
    backgroundColor: '#0B1120',
  },
  heroBackground: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'space-between',
    backgroundColor: '#0B1120',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 17, 32, 0.34)',
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glassCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* HERO SHOWCASE BODY */
  heroShowcaseBody: {
    paddingHorizontal: 18,
    paddingBottom: 22,
    gap: 10,
  },
  heroTaglineRow: {
    marginBottom: 2,
  },
  heroTaglineText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: -0.2,
  },
  mainGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 15,
    padding: 11,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  glassCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyGlyphBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#2454E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#15191E',
    flex: 1,
  },
  payPill: {
    backgroundColor: '#E6F8ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  payPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#086337',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  glassDivider: {
    height: 1,
    backgroundColor: '#EEF0F4',
    marginVertical: 8,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2454E6',
  },

  shortlistFloatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },
  shortlistPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0E9F6E',
  },

  /* FORM CARD (White all the way to screen bottom with no gray cutoff) */
  formContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -36,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  titleBlock: {
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  mainSubtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },

  /* SEGMENTED ROLE PICKER WITH SLIDING THUMB */
  segmentTrack: {
    flexDirection: 'row',
    position: 'relative',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 3,
  },
  slidingIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '50%',
    borderRadius: 11,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  segmentIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  segmentSub: {
    fontSize: 11,
    marginTop: 1,
  },

  /* FORM SECTION */
  formSection: {
    marginTop: 0,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  cleanInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  countryPrefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
  },
  prefixDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 10,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  inputHint: {
    fontSize: 11.5,
    marginTop: 5,
    lineHeight: 16,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* CODE STEP */
  codeStepContainer: {
    marginTop: 0,
  },
  codeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  codeInfoText: {
    fontSize: 12.5,
  },
  changeNumberText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  codeBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  codeBox: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resendHint: {
    fontSize: 11,
  },
  countdownText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* SIGNUP PROMPT */
  signupPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    flexWrap: 'wrap',
  },
  promptText: {
    fontSize: 13,
  },
  promptLink: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* EMPLOYER INPUTS */
  standardInput: {
    flex: 1,
    fontSize: 14.5,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* COMPACT DEMO BAR */
  demoBarWrapper: {
    marginTop: 16,
    paddingTop: 6,
  },
  demoDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  demoLine: {
    flex: 1,
    height: 1,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  demoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  demoPillLine: { flexShrink: 1 },
  demoPillTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  demoPillWho: {
    fontSize: 11,
  },

  /* MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  langOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  langOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  langOptionSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
