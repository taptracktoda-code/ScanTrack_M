import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { API_BASE_URL, apiService } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OTP_EXPIRY_SECONDS = 300;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
function getPasswordRouteError(requestError: any) {
  const method = requestError?.config?.method?.toUpperCase() || 'POST';
  const endpoint = requestError?.config?.url || 'password OTP route';
  return `Password reset route not found: ${method} ${API_BASE_URL}${endpoint}. Restart the Laravel API with the latest routes, then reload or rebuild the app.`;
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; mode?: string; role?: string }>();
  const { driver, user, isManager } = useAuth();
  const account = isManager ? user : driver;
  const recoveryRole = params.role === 'manager' ? 'manager' : params.role === 'driver' ? 'driver' : null;
  const accountRole: 'manager' | 'driver' = recoveryRole || (isManager ? 'manager' : 'driver');
  const isForgotPassword = params.mode === 'forgot';
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'complete'>('request');
  const [email, setEmail] = useState(String(params.email || account?.email || ''));
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (!otpExpiresAt && !resendAvailableAt) return;
    const updateTimers = () => {
      const now = Date.now();
      const nextExpirySeconds = Math.max(0, Math.ceil(((otpExpiresAt ?? now) - now) / 1000));
      const nextResendSeconds = Math.max(0, Math.ceil(((resendAvailableAt ?? now) - now) / 1000));
      setExpirySeconds(nextExpirySeconds);
      setResendSeconds(nextResendSeconds);
      if (otpExpiresAt && nextExpirySeconds === 0) {
        setStep('request');
      }
    };
    updateTimers();
    timerRef.current = setInterval(updateTimers, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [otpExpiresAt, resendAvailableAt]);

  const requestOtp = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiService.requestPasswordOtp(email.trim(), accountRole);
      // The timestamp is created only during the user action that starts OTP expiry.
      // eslint-disable-next-line react-hooks/purity
      setOtpExpiresAt(Date.now() + OTP_EXPIRY_SECONDS * 1000);
      // eslint-disable-next-line react-hooks/purity
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setExpirySeconds(OTP_EXPIRY_SECONDS);
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      setOtp('');
      setOtpAttempts(0);
      setStep('verify');
    } catch (requestError: any) {
      const serverMessage = requestError?.response?.data?.message || requestError?.message;
      setError(requestError?.response?.status === 404 ? getPasswordRouteError(requestError) : serverMessage || 'Unable to send the verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (otpAttempts >= MAX_ATTEMPTS) {
      setError('Too many failed attempts. Request a new verification code.');
      return;
    }
    if (!otp.trim() || otp.length < 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    // eslint-disable-next-line react-hooks/purity
    if (!otpExpiresAt || Date.now() > otpExpiresAt) {
      setError('The verification code has expired. Request a new one.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiService.verifyPasswordOtp(email.trim(), otp.trim(), accountRole);
      setStep('reset');
    } catch (requestError: any) {
      setOtpAttempts((current) => current + 1);
      const message = requestError?.response?.data?.message || requestError?.message || 'The verification code is invalid.';
      setError(requestError?.response?.status === 404 ? getPasswordRouteError(requestError) : message);
    } finally {
      setSubmitting(false);
    }
  };

  const passwordErrors = validatePassword(newPassword);
  const submitReset = async () => {
    if (passwordErrors.length) {
      setError(passwordErrors[0]);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // eslint-disable-next-line react-hooks/purity
    if (!otpExpiresAt || Date.now() > otpExpiresAt) {
      setError('Your verification code has expired. Request a new one.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiService.resetPassword(email.trim(), otp.trim(), newPassword, confirmPassword, accountRole);
      setStep('complete');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (requestError: any) {
      const serverMessage = requestError?.response?.data?.message || requestError?.message || 'Unable to update password.';
      setError(requestError?.response?.status === 404 ? getPasswordRouteError(requestError) : serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    if (resendSeconds > 0 || submitting) return;
    await requestOtp();
  };

  const renderStepContent = () => {
    if (step === 'complete') return (
      <View style={styles.successCard}>
        <ThemedText style={styles.successIcon}>✓</ThemedText>
        <ThemedText style={styles.title}>Password changed</ThemedText>
        <ThemedText style={styles.subtitle}>Your password has been updated securely. You can now use your new credentials to sign in.</ThemedText>
        <Pressable onPress={() => isForgotPassword ? router.replace('/login') : router.back()} style={styles.button}>
          <ThemedText style={styles.buttonText}>{isForgotPassword ? 'Back to login' : 'Back to profile'}</ThemedText>
        </Pressable>
      </View>
    );

    const emailHint = step === 'verify'
      ? 'We sent the code to your registered email.'
      : `Use the email linked to your Tap Track ${accountRole} account.`;
    const emailIsLocked = !isForgotPassword && Boolean(account?.email);
    return (
      <View style={styles.form}>
        {step === 'request' || step === 'verify' ? (
          <>
            <ThemedText style={styles.label}>Email address</ThemedText>
            <TextInput value={email} onChangeText={setEmail} editable={!emailIsLocked} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="name@example.com" placeholderTextColor="#9AA6B2" style={[styles.input, emailIsLocked && styles.readOnlyInput]} />
            <ThemedText style={styles.hint}>{emailHint}</ThemedText>
          </>
        ) : null}

        {step === 'verify' ? (
          <>
            <ThemedText style={styles.label}>Verification code</ThemedText>
            <TextInput value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="Enter 6-digit code" placeholderTextColor="#9AA6B2" style={styles.input} />
            <View style={styles.rowBetween}>
              <ThemedText style={styles.hint}>{otpAttempts >= MAX_ATTEMPTS ? 'Verification attempts exhausted.' : `Code expires in ${expirySeconds}s`}</ThemedText>
              <Pressable disabled={resendSeconds > 0 || submitting} onPress={() => void resendOtp()}><ThemedText style={[styles.link, resendSeconds > 0 && styles.linkDisabled]}>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}</ThemedText></Pressable>
            </View>
          </>
        ) : null}

        {step === 'reset' ? (
          <>
            <ThemedText style={styles.label}>New password</ThemedText>
            <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Create a strong password" placeholderTextColor="#9AA6B2" style={styles.input} />
            <ThemedText style={styles.hint}>{passwordErrors.length ? passwordErrors[0] : 'At least 8 characters with uppercase, lowercase, number, and symbol.'}</ThemedText>
            <ThemedText style={styles.label}>Confirm new password</ThemedText>
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat your new password" placeholderTextColor="#9AA6B2" style={styles.input} />
          </>
        ) : null}

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

        <Pressable onPress={() => step === 'request' ? void requestOtp() : step === 'verify' ? void verifyOtp() : void submitReset()} disabled={submitting} style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}>
          <ThemedText style={styles.buttonText}>{submitting ? 'Please wait...' : step === 'request' ? 'Send verification code' : step === 'verify' ? 'Verify code' : 'Save new password'}</ThemedText>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}><ThemedText style={styles.back}>‹ Back</ThemedText></Pressable>
          <ThemedText style={styles.logo}>TAP TRACK</ThemedText>
          <ThemedText style={styles.kicker}>SECURITY</ThemedText>
          <ThemedText style={styles.title}>{isForgotPassword ? 'Forgot password' : 'Change password'}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {isForgotPassword ? 'Get a verification code, then create a new password.' : 'Verify your identity before creating a new password.'}
          </ThemedText>
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function validatePassword(value: string) {
  const errors: string[] = [];
  if (value.length < 8) errors.push('Password must be at least 8 characters long.');
  if (!/[A-Z]/.test(value)) errors.push('Password must include an uppercase letter.');
  if (!/[a-z]/.test(value)) errors.push('Password must include a lowercase letter.');
  if (!/\d/.test(value)) errors.push('Password must include a number.');
  if (!/[^A-Za-z0-9]/.test(value)) errors.push('Password must include a symbol.');
  return errors;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' }, flex: { flex: 1 }, content: { padding: 28, paddingBottom: 40 }, back: { color: '#208AEF', fontWeight: '700', marginBottom: 30 }, logo: { color: '#208AEF', fontSize: 19, fontWeight: '800', letterSpacing: 1 }, kicker: { color: '#7B8794', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4 }, title: { color: '#14212B', fontSize: 32, fontWeight: '800', marginTop: 30 }, subtitle: { color: '#6B7785', fontSize: 15, lineHeight: 22, marginTop: 8 }, form: { marginTop: 24 }, label: { color: '#33404D', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 18 }, input: { height: 52, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DFE6ED', borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: '#14212B' }, readOnlyInput: { color: '#64748B', backgroundColor: '#F1F5F9' }, hint: { color: '#6B7785', fontSize: 12, lineHeight: 18, marginTop: 8 }, rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }, link: { color: '#208AEF', fontSize: 12, fontWeight: '800' }, linkDisabled: { color: '#94A3B8' }, error: { color: '#C0392B', fontSize: 13, marginTop: 14 }, button: { height: 54, borderRadius: 15, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', marginTop: 24 }, pressed: { opacity: 0.8 }, disabled: { opacity: 0.55 }, buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, successCard: { alignItems: 'center', marginTop: 26, paddingVertical: 32, backgroundColor: '#FFF', borderRadius: 18 }, successIcon: { width: 68, height: 68, lineHeight: 68, textAlign: 'center', backgroundColor: '#DCFCE7', color: '#15803D', borderRadius: 34, fontSize: 30, fontWeight: '800' },
});
