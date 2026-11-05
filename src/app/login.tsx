import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

declare const require: (path: string) => number;

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const [portal, setPortal] = useState<'driver' | 'manager'>('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your username or email and password.');
      return;
    }
    setSubmitting(true);
    clearError();
    try {
      const loggedInUser = await login(email.trim(), password, portal);
      const nextRoute = loggedInUser?.role === 'manager' ? '/admin/dashboard' : '/(tabs)';
      router.replace(nextRoute);
    } catch {
      // AuthContext exposes the server error below the form.
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    clearError();
    router.push({
      pathname: '/change-password',
      params: {
        mode: 'forgot',
        role: portal,
        email: email.trim(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('@/assets/images/tap-track-logo.svg')} contentFit="contain" style={styles.brandLogo} />
          <ThemedText style={styles.logo}>SCAN TRACK</ThemedText>
          <ThemedText style={styles.kicker}>{portal === 'manager' ? 'MANAGER PORTAL' : 'DRIVER PORTAL'}</ThemedText>
          <ThemedText style={styles.title}>Welcome back</ThemedText>
          <ThemedText style={styles.subtitle}>
            {portal === 'manager' ? 'Sign in with your ScanTrack manager account.' : 'Sign in to check your terminal activity.'}
          </ThemedText>
          <View style={styles.portalSwitch}>
            <Pressable
              onPress={() => { setPortal('driver'); clearError(); }}
              style={[styles.portalOption, portal === 'driver' && styles.portalOptionActive]}
            >
              <ThemedText style={[styles.portalText, portal === 'driver' && styles.portalTextActive]}>Driver</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => { setPortal('manager'); clearError(); }}
              style={[styles.portalOption, portal === 'manager' && styles.portalOptionActive]}
            >
              <ThemedText style={[styles.portalText, portal === 'manager' && styles.portalTextActive]}>Manager</ThemedText>
            </Pressable>
          </View>
          <View style={styles.form}>
            <ThemedText style={styles.label}>{portal === 'manager' ? 'Email address' : 'Email or username'}</ThemedText>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Enter your Email" placeholderTextColor="#9AA6B2" style={styles.input} />
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={styles.passwordField}>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} placeholder="Enter your password" placeholderTextColor="#9AA6B2" style={[styles.input, styles.passwordInput]} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                onPress={() => setPasswordVisible((visible: boolean) => !visible)}
                style={styles.passwordToggle}
              >
                <ThemedText style={styles.passwordToggleText}>{passwordVisible ? 'Hide' : 'Show'}</ThemedText>
              </Pressable>
            </View>
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
            <Pressable onPress={handleLogin} disabled={submitting} style={({ pressed }: { pressed: boolean }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}>
              <ThemedText style={styles.buttonText}>{submitting ? 'Signing in...' : portal === 'manager' ? 'Manager Login' : 'Driver Login'}</ThemedText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleForgotPassword}>
              <ThemedText style={styles.forgot}>Forgot password?</ThemedText>
            </Pressable>
          </View>
          <ThemedText style={styles.footer}>
            {portal === 'manager' ? 'Manager QR scans are validated by the Laravel API.' : 'Attendance is recorded by the terminal QR scanner.'}
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' }, keyboard: { flex: 1 }, content: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  brandLogo: { width: 170, height: 170, alignSelf: 'center', marginBottom: 14 }, logo: { color: '#208AEF', fontSize: 19, fontWeight: '800', letterSpacing: 1, textAlign: 'center' }, kicker: { color: '#7B8794', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4, textAlign: 'center' }, title: { color: '#14212B', fontSize: 34, fontWeight: '800', marginTop: 36, textAlign: 'center' }, subtitle: { color: '#6B7785', fontSize: 15, marginTop: 8, textAlign: 'center' }, form: { marginTop: 30 }, label: { color: '#33404D', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 16 }, input: { height: 52, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DFE6ED', borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: '#14212B' }, button: { height: 54, borderRadius: 15, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', marginTop: 24 }, pressed: { opacity: 0.8 }, disabled: { opacity: 0.55 }, buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, forgot: { textAlign: 'center', color: '#208AEF', fontSize: 13, fontWeight: '700', marginTop: 20 }, registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 }, registerPrompt: { color: '#6B7785', fontSize: 13 }, registerText: { color: '#208AEF', fontSize: 13, fontWeight: '800' }, error: { color: '#C0392B', fontSize: 13, marginTop: 14 }, footer: { color: '#9AA6B2', fontSize: 12, textAlign: 'center', marginTop: 42 },
  portalSwitch: { flexDirection: 'row', backgroundColor: '#EAF1F8', borderRadius: 14, padding: 4, marginTop: 24 },
  portalOption: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  portalOptionActive: { backgroundColor: '#FFF' },
  portalText: { color: '#6B7785', fontSize: 14, fontWeight: '800' },
  portalTextActive: { color: '#208AEF' },
  passwordField: { justifyContent: 'center' },
  passwordInput: { paddingRight: 72 },
  passwordToggle: { position: 'absolute', right: 16, paddingVertical: 10 },
  passwordToggleText: { color: '#208AEF', fontSize: 13, fontWeight: '700' },
});
