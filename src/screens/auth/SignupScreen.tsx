import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  BadgeCheck,
  CheckCircle2,
  Flame,
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
  MapPin,
  UtensilsCrossed,
  ArrowLeft,
  ArrowRight,
  User as UserIcon,
  Sparkles,
} from 'lucide-react-native';
import { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/layout/Screen';
import { LogoMark } from '../../components/ui/LogoMark';
import { HazardStrip } from '../../components/ui/HazardStrip';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { USE_MOCKS } from '../../api/client';
import { t } from '../../lib/i18n';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;
type Audience = 'worker' | 'employer';

const heroImage = require('../../../assets/login.jpg');

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { height: screenHeight } = useWindowDimensions();
  const { colors, theme, toggleTheme, language, setLanguage, showToast } = useUiStore();
  const { sendOtp, verifyOtp, signupEmployer } = useAuthStore();

  const [role, setRole] = useState<Audience>('worker');
  const [step, setStep] = useState<'details' | 'otp'>('details');

  // Worker form state
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState(USE_MOCKS ? '9876543210' : '');
  const [code, setCode] = useState(USE_MOCKS ? ['1', '2', '3', '4', '5', '6'] : ['', '', '', '', '', '']);
  const [workerNameFocused, setWorkerNameFocused] = useState(false);
  const [workerPhoneFocused, setWorkerPhoneFocused] = useState(false);

  // Employer form state
  const [employerName, setEmployerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [empNameFocused, setEmpNameFocused] = useState(false);
  const [companyFocused, setCompanyFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const codeInputs = useRef<any[]>([]);

  // Animation values
  const [roleSlideAnim] = useState(() => new Animated.Value(0));
  const [formFadeAnim] = useState(() => new Animated.Value(1));
  const [formSlideY] = useState(() => new Animated.Value(0));

  // Hero proportion matching login screen (~39%)
  const heroHeight = Math.max(300, Math.round(screenHeight * 0.39));

  useEffect(() => {
    let timer: any = null;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const triggerFormTransition = () => {
    formFadeAnim.stopAnimation();
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
    ]).start();
  };

  const handleRoleChange = (selected: Audience) => {
    if (selected === role) return;
    Haptics.selectionAsync();

    setRole(selected);
    setStep('details');

    Animated.spring(roleSlideAnim, {
      toValue: selected === 'worker' ? 0 : 1,
      friction: 9,
      tension: 65,
      useNativeDriver: false,
    }).start();

    triggerFormTransition();
  };

  // Submit Worker Details
  const handleWorkerSubmit = async () => {
    if (!workerName.trim() || workerName.trim().length < 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast(t('Please enter your full name.'), 'warning');
      return;
    }
    if (!workerPhone || workerPhone.length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast(t('Enter a valid 10-digit mobile number.'), 'warning');
      return;
    }

    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await sendOtp(workerPhone);
      if (res.isNewUser === false) {
        showToast(t('You already have an account. Log in instead.'), 'info');
        navigation.navigate('Login');
        return;
      }
      showToast(res.message, 'info');
      setStep('otp');
      setCountdown(30);
      triggerFormTransition();
    } catch (err: any) {
      showToast(err.message || 'Failed to send OTP code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Verify Worker OTP
  const handleVerifyOtp = async (codeString: string) => {
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // The new account is signed in already marked as not onboarded; the app shows the setup screen next.
      await verifyOtp(workerPhone, codeString, {
        name: workerName.trim(),
        phone: `+91 ${workerPhone}`,
        role: 'worker',
        onboarded: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t('Account created successfully!'), 'success');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err.message || 'Invalid code. Enter 123456.', 'error');
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

  const handleResendCode = async () => {
    if (countdown > 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendOtp(workerPhone);
      setCountdown(30);
      showToast(t('New code sent to +91 {phone}', { phone: workerPhone }), 'info');
    } catch {
      showToast('Failed to resend code', 'error');
    }
  };

  // Submit Employer Registration
  const handleEmployerSubmit = async () => {
    if (!employerName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Please enter your full name', 'warning');
      return;
    }
    if (!companyName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Please enter your company or plant name', 'warning');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Please enter a valid work email', 'warning');
      return;
    }
    if (password.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Password must be at least 8 characters', 'warning');
      return;
    }

    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signupEmployer({
        name: employerName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        password,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Employer account created!', 'success');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err.message || 'Registration failed. Try again.', 'error');
    } finally {
      setLoading(false);
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
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={[styles.scrollView, { backgroundColor: colors.surface }]}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.surface }]}
        >
          {/* ================= HERO CONTAINER (Dark Background Behind Radius) ================= */}
          <View style={[styles.heroOuterWrapper, { backgroundColor: '#0B1120' }]}>
            <View style={[styles.heroBackground, { height: heroHeight }]}>
              <Image source={heroImage} resizeMode="cover" style={StyleSheet.absoluteFill} />
              {/* Rich cinematic gradient overlay */}
              <View style={styles.heroOverlay} />

              {/* Top Navigation Bar with Back Button & Language Pill */}
              <View style={styles.heroTopBar}>
                <View style={styles.leftNavRow}>
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.glassCircleBtn}
                    activeOpacity={0.8}
                    accessibilityLabel="Back to Login"
                  >
                    <ArrowLeft size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.brandRow}>
                    <LogoMark size={26} />
                    <Text style={styles.brandText}>IndustriaLink</Text>
                  </View>
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

              {/* Dynamic Hero Showcase based on Selected Role */}
              <View style={styles.heroShowcaseBody}>
                {role === 'worker' ? (
                  <>
                    <View style={styles.heroTaglineRow}>
                      <Text style={styles.heroTaglineText}>
                        India’s trusted platform for industrial jobs
                      </Text>
                    </View>

                    {/* Main Glassmorphic Job Card */}
                    <View style={styles.mainGlassCard}>
                      <View style={styles.glassCardTopRow}>
                        <View style={styles.companyGlyphBox}>
                          <Flame size={17} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={styles.cardTitleRow}>
                            <Text style={styles.jobTitleText} numberOfLines={1}>
                              Welder (ITI / 6G)
                            </Text>
                            <View style={styles.payPill}>
                              <Text style={styles.payPillText}>₹24,000/mo</Text>
                            </View>
                          </View>
                          <View style={styles.locationRow}>
                            <MapPin size={11} color="#64748B" style={{ marginRight: 3 }} />
                            <Text style={styles.locationText} numberOfLines={1}>
                              National Heavy Engineering · Kalinganagar, Odisha
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.glassDivider} />

                      <View style={styles.cardBadgesRow}>
                        <View style={styles.featureBadge}>
                          <BadgeCheck size={13} color="#2454E6" />
                          <Text style={styles.featureBadgeText}>Verified Employer</Text>
                        </View>
                        <View style={styles.featureBadge}>
                          <UtensilsCrossed size={12} color="#086337" />
                          <Text style={[styles.featureBadgeText, { color: '#086337' }]}>
                            Food & Stay Included
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Overlapping Shortlisted Badge Pill */}
                    <View style={styles.shortlistFloatingPill}>
                      <CheckCircle2 size={13} color="#0E9F6E" />
                      <Text style={styles.shortlistPillText}>
                        Direct Plant Hiring · Zero Worker Fees
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.heroTaglineRow}>
                      <Text style={styles.heroTaglineText}>
                        Hire verified industrial workers, faster
                      </Text>
                    </View>

                    {/* Main Glassmorphic Candidate Card */}
                    <View style={styles.mainGlassCard}>
                      <View style={styles.glassCardTopRow}>
                        <View style={[styles.companyGlyphBox, { backgroundColor: '#2454E6' }]}>
                          <HardHat size={17} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={styles.cardTitleRow}>
                            <Text style={styles.jobTitleText} numberOfLines={1}>
                              Ramesh Kumar · ITI Welder
                            </Text>
                            <View style={[styles.payPill, { backgroundColor: '#EBF0FE' }]}>
                              <Text style={[styles.payPillText, { color: '#1D45C4' }]}>
                                5 yrs exp
                              </Text>
                            </View>
                          </View>
                          <View style={styles.locationRow}>
                            <MapPin size={11} color="#64748B" style={{ marginRight: 3 }} />
                            <Text style={styles.locationText} numberOfLines={1}>
                              Kalinganagar, Odisha · Ready to relocate
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.glassDivider} />

                      <View style={styles.cardBadgesRow}>
                        <View style={styles.featureBadge}>
                          <ShieldCheck size={13} color="#2454E6" />
                          <Text style={[styles.featureBadgeText, { color: '#2454E6' }]}>
                            Certificates uploaded
                          </Text>
                        </View>
                        <View style={styles.featureBadge}>
                          <Sparkles size={12} color="#086337" />
                          <Text style={[styles.featureBadgeText, { color: '#086337' }]}>
                            Immediate Joining
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Overlapping Candidate Verified Pill */}
                    <View style={styles.shortlistFloatingPill}>
                      <ShieldCheck size={13} color="#2454E6" />
                      <Text style={[styles.shortlistPillText, { color: '#2454E6' }]}>
                        Pre-screened Candidates · Zero Middlemen
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Industrial Hazard Safety Stripes */}
              <HazardStrip height={5} />
            </View>

            {/* Seamless 36px dark apron directly behind card top corners */}
            <View style={styles.heroDarkApron} />
          </View>

          {/* ================= REFINED FORM CONTAINER (White all the way to bottom) ================= */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
            {/* Title & Subtitle */}
            <View style={styles.titleBlock}>
              <Text style={[styles.mainTitle, { color: colors.ink }]}>
                {t('Create your free account')}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.inkSecondary }]}>
                {role === 'worker'
                  ? t('Takes less than a minute. Free for workers, always.')
                  : 'Register your company or plant to hire certified industrial talent.'}
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
                <View style={{ marginLeft: 8 }}>
                  <Text
                    style={[
                      styles.segmentTitle,
                      { color: role === 'worker' ? colors.ink : colors.inkSecondary },
                    ]}
                  >
                    I need a job
                  </Text>
                  <Text style={[styles.segmentSub, { color: colors.inkMuted }]}>
                    Workers · mobile signup
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
                <View style={{ marginLeft: 8 }}>
                  <Text
                    style={[
                      styles.segmentTitle,
                      { color: role === 'employer' ? colors.ink : colors.inkSecondary },
                    ]}
                  >
                    I’m hiring
                  </Text>
                  <Text style={[styles.segmentSub, { color: colors.inkMuted }]}>
                    Companies & HR
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Form Area with Fluid Fade / Y-slide */}
            <Animated.View
              style={{
                opacity: formFadeAnim,
                transform: [{ translateY: formSlideY }],
              }}
            >
              {/* ================= WORKER FORM ================= */}
              {role === 'worker' && (
                <>
                  {step === 'details' ? (
                    <View style={styles.formFieldsBox}>
                      {/* Full Name */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                          {t('Your full name')}
                        </Text>
                        <View
                          style={[
                            styles.inputFrame,
                            {
                              backgroundColor: colors.surface,
                              borderColor: workerNameFocused
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                        >
                          <UserIcon
                            size={18}
                            color={workerNameFocused ? colors.primary : colors.inkMuted}
                            style={{ marginRight: 10 }}
                          />
                          <TextInput
                            value={workerName}
                            onChangeText={setWorkerName}
                            placeholder="e.g. Ramesh Kumar"
                            placeholderTextColor={colors.inkMuted}
                            onFocus={() => setWorkerNameFocused(true)}
                            onBlur={() => setWorkerNameFocused(false)}
                            style={[styles.textInput, { color: colors.ink }]}
                            autoCapitalize="words"
                          />
                          {workerName.length > 0 && (
                            <TouchableOpacity
                              onPress={() => setWorkerName('')}
                              accessibilityLabel={t('Clear')}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <X size={16} color={colors.inkMuted} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={[styles.fieldHint, { color: colors.inkMuted }]}>
                          {t('Use your real name so employers know who is applying.')}
                        </Text>
                      </View>

                      {/* Mobile Number */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                          {t('Mobile number')}
                        </Text>
                        <View
                          style={[
                            styles.inputFrame,
                            {
                              backgroundColor: colors.surface,
                              borderColor: workerPhoneFocused
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.countryPrefixBox,
                              { borderRightColor: colors.border },
                            ]}
                          >
                            <Text style={[styles.prefixText, { color: colors.ink }]}>
                              +91
                            </Text>
                          </View>
                          <TextInput
                            value={workerPhone}
                            onChangeText={setWorkerPhone}
                            placeholder="9876543210"
                            placeholderTextColor={colors.inkMuted}
                            keyboardType="phone-pad"
                            maxLength={10}
                            onFocus={() => setWorkerPhoneFocused(true)}
                            onBlur={() => setWorkerPhoneFocused(false)}
                            style={[
                              styles.textInput,
                              { color: colors.ink, letterSpacing: 0.5 },
                            ]}
                          />
                          {workerPhone.length > 0 && (
                            <TouchableOpacity
                              onPress={() => setWorkerPhone('')}
                              accessibilityLabel={t('Clear')}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <X size={16} color={colors.inkMuted} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={[styles.fieldHint, { color: colors.inkMuted }]}>
                          {t("We'll send a 6-digit code by SMS. No password needed.")}
                        </Text>
                      </View>

                      {/* Continue to OTP Button */}
                      <TouchableOpacity
                        onPress={handleWorkerSubmit}
                        disabled={loading}
                        activeOpacity={0.88}
                        style={[
                          styles.primaryActionBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <View style={styles.btnRow}>
                            <Text style={styles.primaryBtnText}>
                              {t('Continue')}
                            </Text>
                            <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Worker OTP Verification Step */
                    <View style={styles.formFieldsBox}>
                      <View style={styles.otpHeaderRow}>
                        <View>
                          <Text style={[styles.otpHeaderTitle, { color: colors.ink }]}>
                            {t('Enter verification code')}
                          </Text>
                          <Text
                            style={[styles.otpHeaderSub, { color: colors.inkSecondary }]}
                          >
                            {t('Sent to')} +91 {workerPhone}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setStep('details')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text
                            style={[styles.editPhoneLink, { color: colors.primary }]}
                          >
                            {t('Edit')}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* 6 Digit Discrete OTP Boxes */}
                      <View style={styles.otpBoxesRow}>
                        {code.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(el) => {
                              codeInputs.current[index] = el;
                            }}
                            value={digit}
                            onChangeText={(text) => handleCodeChange(text, index)}
                            onKeyPress={(e) => handleCodeKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                            style={[
                              styles.otpBox,
                              {
                                backgroundColor: colors.surface,
                                borderColor: digit
                                  ? colors.primary
                                  : colors.borderStrong,
                                color: colors.ink,
                              },
                            ]}
                          />
                        ))}
                      </View>

                      {/* Verify Button */}
                      <TouchableOpacity
                        onPress={() => handleVerifyOtp(code.join(''))}
                        disabled={loading}
                        activeOpacity={0.88}
                        style={[
                          styles.primaryActionBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.primaryBtnText}>
                            {t('Create Worker Account')}
                          </Text>
                        )}
                      </TouchableOpacity>

                      {/* Resend Code Row */}
                      <View style={styles.resendRow}>
                        {countdown > 0 ? (
                          <Text
                            style={[styles.countdownText, { color: colors.inkMuted }]}
                          >
                            {t('Resend code in')} {countdown}s
                          </Text>
                        ) : (
                          <TouchableOpacity
                            onPress={handleResendCode}
                            style={styles.resendBtn}
                          >
                            <RotateCw size={14} color={colors.primary} />
                            <Text
                              style={[styles.resendBtnText, { color: colors.primary }]}
                            >
                              {t('Resend SMS code')}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* ================= EMPLOYER FORM ================= */}
              {role === 'employer' && (
                <View style={styles.formFieldsBox}>
                  {/* Your Name */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                      Your name
                    </Text>
                    <View
                      style={[
                        styles.inputFrame,
                        {
                          backgroundColor: colors.surface,
                          borderColor: empNameFocused
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <UserIcon
                        size={18}
                        color={empNameFocused ? colors.primary : colors.inkMuted}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        value={employerName}
                        onChangeText={setEmployerName}
                        placeholder="e.g. Pradeep Mohanty (Plant HR)"
                        placeholderTextColor={colors.inkMuted}
                        onFocus={() => setEmpNameFocused(true)}
                        onBlur={() => setEmpNameFocused(false)}
                        style={[styles.textInput, { color: colors.ink }]}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Company Name */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                      Company / Factory name
                    </Text>
                    <View
                      style={[
                        styles.inputFrame,
                        {
                          backgroundColor: colors.surface,
                          borderColor: companyFocused
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Building2
                        size={18}
                        color={companyFocused ? colors.primary : colors.inkMuted}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        value={companyName}
                        onChangeText={setCompanyName}
                        placeholder="e.g. National Heavy Engineering"
                        placeholderTextColor={colors.inkMuted}
                        onFocus={() => setCompanyFocused(true)}
                        onBlur={() => setCompanyFocused(false)}
                        style={[styles.textInput, { color: colors.ink }]}
                      />
                    </View>
                  </View>

                  {/* Work Email */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                      Work email
                    </Text>
                    <View
                      style={[
                        styles.inputFrame,
                        {
                          backgroundColor: colors.surface,
                          borderColor: emailFocused
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Mail
                        size={18}
                        color={emailFocused ? colors.primary : colors.inkMuted}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="recruiter@nationaleng.demo"
                        placeholderTextColor={colors.inkMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        style={[styles.textInput, { color: colors.ink }]}
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                      Password
                    </Text>
                    <View
                      style={[
                        styles.inputFrame,
                        {
                          backgroundColor: colors.surface,
                          borderColor: passwordFocused
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Lock
                        size={18}
                        color={passwordFocused ? colors.primary : colors.inkMuted}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="At least 8 characters"
                        placeholderTextColor={colors.inkMuted}
                        secureTextEntry={!showPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        style={[styles.textInput, { color: colors.ink }]}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} color={colors.inkMuted} />
                        ) : (
                          <Eye size={18} color={colors.inkMuted} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Trust Banner Card */}
                  <View
                    style={[
                      styles.trustNoteCard,
                      {
                        backgroundColor: colors.infoBg,
                        borderColor: colors.infoBg,
                      },
                    ]}
                  >
                    <ShieldCheck size={18} color={colors.infoFg} style={{ marginTop: 1 }} />
                    <Text style={[styles.trustNoteText, { color: colors.infoFg }]}>
                      We check every factory and company before jobs go live. This keeps workers safe from fake contractors.
                    </Text>
                  </View>

                  {/* Register Company Button */}
                  <TouchableOpacity
                    onPress={handleEmployerSubmit}
                    disabled={loading}
                    activeOpacity={0.88}
                    style={[
                      styles.primaryActionBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.btnRow}>
                        <Text style={styles.primaryBtnText}>
                          Register Company & Start Hiring
                        </Text>
                        <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            {/* Switch to Login Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.switchAuthRow}
              activeOpacity={0.7}
            >
              <Text style={[styles.switchAuthText, { color: colors.inkSecondary }]}>
                {t('Already have an account?')}{' '}
                <Text style={[styles.switchAuthLink, { color: colors.primary }]}>
                  {t('Log in')}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Language Selector Modal */}
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
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.ink }]}>
                Choose Language
              </Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <X size={20} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>

            {[
              { code: 'en', label: 'English', sub: 'Standard' },
              { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
              { code: 'or', label: 'ଓଡ଼ିଆ', sub: 'Odia' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.code}
                onPress={() => {
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
    width: '100%',
    backgroundColor: '#0B1120',
  },
  heroDarkApron: {
    height: 36,
    width: '100%',
    backgroundColor: '#0B1120',
  },
  heroBackground: {
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#0B1120',
  },
  heroImageStyle: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 17, 32, 0.72)',
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  leftNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
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
    fontWeight: '800',
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
    fontWeight: '800',
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
    fontSize: 11,
    fontWeight: '600',
    color: '#2454E6',
  },
  shortlistFloatingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  shortlistPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0E9F6E',
  },

  /* FORM CARD (White all the way to screen bottom with no gray cutoff) */
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -36,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 56,
    minHeight: 520,
  },
  titleBlock: {
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 23,
    fontWeight: '800',
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
    marginBottom: 16,
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
    zIndex: 2,
  },
  segmentIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentSub: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },

  /* FORM FIELDS */
  formFieldsBox: {
    gap: 14,
  },
  inputGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldHint: {
    fontSize: 11.5,
    marginTop: 2,
  },
  inputFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  countryPrefixBox: {
    paddingRight: 10,
    marginRight: 10,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  /* OTP STEP */
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  otpHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  otpHeaderSub: {
    fontSize: 12,
    marginTop: 2,
  },
  editPhoneLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 4,
  },
  otpBox: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  countdownText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 6,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* TRUST NOTE CARD */
  trustNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  trustNoteText: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
    flex: 1,
  },

  /* SWITCH TO LOGIN */
  switchAuthRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingVertical: 6,
  },
  switchAuthText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  switchAuthLink: {
    fontWeight: '700',
  },

  /* LANGUAGE MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  langOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  langOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  langOptionSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
});
