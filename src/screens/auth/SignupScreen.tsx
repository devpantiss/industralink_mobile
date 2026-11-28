import { isValidPhone, errorText } from '../../lib/errors';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme/effects';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useRef } from 'react';
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
  ArrowLeft,
  ArrowRight,
  User as UserIcon,
} from '../../components/ui/icons';
import { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/layout/Screen';
import { LogoMark } from '../../components/ui/LogoMark';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { t } from '../../lib/i18n';
import { OrDivider } from '../../components/ui/GoogleButton';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;
type Audience = 'worker' | 'employer';

const heroImage = require('../../../assets/login.jpg');

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, theme, toggleTheme, language, setLanguage, showToast } = useUiStore();
  const { signupWorker, signupEmployer } = useAuthStore();

  const [role, setRole] = useState<Audience>('worker');

  // One form for both tabs. Typed values stay when switching tabs.
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'name' | 'second' | 'email' | 'password' | null>(null);

  const [loading, setLoading] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const secondRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // Animation values
  const [roleSlideAnim] = useState(() => new Animated.Value(0));
  const [formFadeAnim] = useState(() => new Animated.Value(1));
  const [formSlideY] = useState(() => new Animated.Value(0));

  // Hero proportion matching login screen (~39%)

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

    Animated.spring(roleSlideAnim, {
      toValue: selected === 'worker' ? 0 : 1,
      friction: 9,
      tension: 65,
      useNativeDriver: false,
    }).start();

    triggerFormTransition();
  };

  /** The first problem with the form, in plain words, or undefined when it is ready. */
  const formProblem = (): string | undefined => {
    if (name.trim().length < 2) return t('Please enter your full name.');
    if (role === 'worker' && !isValidPhone(phone)) {
      return t('Enter a 10-digit mobile number that starts with 6, 7, 8 or 9.');
    }
    if (role === 'employer' && companyName.trim().length < 2) return 'Please enter your company or factory name.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return t('Enter a valid email address.');
    if (password.length < 8) return t('Use at least 8 characters for your password.');
    return undefined;
  };

  const handleSubmit = async () => {
    const problem = formProblem();
    if (problem) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast(problem, 'warning');
      return;
    }
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const account = { name: name.trim(), email: email.trim(), password };
      if (role === 'worker') await signupWorker({ ...account, phone });
      else await signupEmployer({ ...account, companyName: companyName.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t('Account created successfully!'), 'success');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(errorText(err, 'Could not create the account. Try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const termsLine = (
    <Text style={[styles.fieldHint, { color: colors.inkMuted, marginTop: 6 }]}>
      {t('By continuing you agree to our')}{' '}
      <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>{t('Terms')}</Text>
      {' · '}
      <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>{t('Privacy')}</Text>
      {' · '}
      <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => navigation.navigate('Legal', { kind: 'nofees' })}>{t('No fees')}</Text>
    </Text>
  );

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
                  : 'Every company is checked before its jobs go live.'}
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
                    {t('Job seekers')}
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
              {/*
                One form, four rows on both tabs, so switching never changes the height.
                Only the second row differs: the worker's mobile number, or the company name.
              */}
              <View style={styles.formFieldsBox}>
                <GoogleAuthButton mode="signup" role={role} companyName={companyName} disabled={loading} />
                <OrDivider label={t('or')} style={styles.orDivider} />

                <View
                  style={[
                    styles.fieldGroup,
                    { backgroundColor: colors.surface, borderColor: focused ? colors.primary : colors.border },
                  ]}
                >
                  <View style={styles.groupRow}>
                    <UserIcon size={18} color={focused === 'name' ? colors.primary : colors.inkMuted} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder={t('Your full name')}
                      placeholderTextColor={colors.placeholder}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      autoCapitalize="words"
                      autoComplete="name"
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => secondRef.current?.focus()}
                      accessibilityLabel={t('Your full name')}
                      style={[styles.groupInput, { color: colors.ink }]}
                    />
                  </View>
                  <View style={[styles.groupDivider, { backgroundColor: colors.border }]} />
                  {role === 'worker' ? (
                    <View style={styles.groupRow}>
                      <Text style={[styles.groupPrefix, { color: colors.ink, borderRightColor: colors.border }]}>+91</Text>
                      <TextInput
                        ref={secondRef}
                        value={phone}
                        onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                        placeholder={t('Mobile number')}
                        placeholderTextColor={colors.placeholder}
                        onFocus={() => setFocused('second')}
                        onBlur={() => setFocused(null)}
                        keyboardType="phone-pad"
                        autoComplete="tel-national"
                        textContentType="telephoneNumber"
                        maxLength={10}
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => emailRef.current?.focus()}
                        accessibilityLabel={t('Mobile number')}
                        style={[styles.groupInput, { color: colors.ink, letterSpacing: 0.5 }]}
                      />
                    </View>
                  ) : (
                    <View style={styles.groupRow}>
                      <Building2 size={18} color={focused === 'second' ? colors.primary : colors.inkMuted} />
                      <TextInput
                        ref={secondRef}
                        value={companyName}
                        onChangeText={setCompanyName}
                        placeholder="Company or factory name"
                        placeholderTextColor={colors.placeholder}
                        onFocus={() => setFocused('second')}
                        onBlur={() => setFocused(null)}
                        autoCapitalize="words"
                        autoComplete="organization"
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => emailRef.current?.focus()}
                        accessibilityLabel="Company or factory name"
                        style={[styles.groupInput, { color: colors.ink }]}
                      />
                    </View>
                  )}
                  <View style={[styles.groupDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.groupRow}>
                    <Mail size={18} color={focused === 'email' ? colors.primary : colors.inkMuted} />
                    <TextInput
                      ref={emailRef}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={role === 'worker' ? t('Email') : 'Work email'}
                      placeholderTextColor={colors.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="username"
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      accessibilityLabel={role === 'worker' ? t('Email') : 'Work email'}
                      style={[styles.groupInput, { color: colors.ink }]}
                    />
                  </View>
                  <View style={[styles.groupDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.groupRow}>
                    <Lock size={18} color={focused === 'password' ? colors.primary : colors.inkMuted} />
                    <TextInput
                      ref={passwordRef}
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('Password (8+ characters)')}
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      returnKeyType="go"
                      onSubmitEditing={handleSubmit}
                      accessibilityLabel={t('Password (8+ characters)')}
                      style={[styles.groupInput, { color: colors.ink }]}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      accessibilityLabel={showPassword ? t('Hide password') : t('Show password')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={colors.inkMuted} />
                      ) : (
                        <Eye size={18} color={colors.inkMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                {termsLine}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.88}
                  style={styles.primaryActionBtn}
                >
                  <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.primaryBtnText}>
                        {role === 'worker' ? t('Create account') : 'Register company'}
                      </Text>
                      <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
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
        </KeyboardScrollView>
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
  // The box already spaces its children.
  orDivider: { marginVertical: 2 },
  groupPrefix: { fontSize: 15, fontWeight: '700', paddingRight: 10, borderRightWidth: 1 },
  fieldGroup: { borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 12 },
  groupDivider: { height: StyleSheet.hairlineWidth * 2, marginLeft: 40 },
  groupInput: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 0 },
  fieldHint: {
    fontSize: 11.5,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    overflow: 'hidden',
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

  /* TRUST NOTE CARD */

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
    fontWeight: '700',
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
