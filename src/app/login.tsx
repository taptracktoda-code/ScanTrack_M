import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your username or email and password.');
      return;
    }
    setSubmitting(true);
    clearError();
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      // AuthContext exposes the server error below the form.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('@/assets/images/tap-track-logo.svg')} contentFit="contain" style={styles.brandLogo} />
          <ThemedText style={styles.logo}>TAP TRACK</ThemedText>
          <ThemedText style={styles.kicker}>DRIVER PORTAL</ThemedText>
          <ThemedText style={styles.title}>Welcome back</ThemedText>
          <ThemedText style={styles.subtitle}>Sign in to check your terminal activity.</ThemedText>
          <View style={styles.form}>
            <ThemedText style={styles.label}>Email or username</ThemedText>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Enter your Email" placeholderTextColor="#9AA6B2" style={styles.input} />
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Enter your password" placeholderTextColor="#9AA6B2" style={styles.input} />
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
            <Pressable onPress={handleLogin} disabled={submitting} style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}>
              <ThemedText style={styles.buttonText}>{submitting ? 'Signing in...' : 'Login'}</ThemedText>
            </Pressable>
            <Pressable><ThemedText style={styles.forgot}>Forgot password?</ThemedText></Pressable>
            <Pressable onPress={() => router.push('/register')} style={styles.registerLink}>
              <ThemedText style={styles.registerPrompt}>New driver?</ThemedText>
              <ThemedText style={styles.registerText}> Create an account</ThemedText>
            </Pressable>
          </View>
          <ThemedText style={styles.footer}>Attendance is recorded by the terminal NFC scanner.</ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' }, keyboard: { flex: 1 }, content: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  brandLogo: { width: 170, height: 170, alignSelf: 'center', marginBottom: 14 }, logo: { color: '#208AEF', fontSize: 19, fontWeight: '800', letterSpacing: 1, textAlign: 'center' }, kicker: { color: '#7B8794', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4, textAlign: 'center' }, title: { color: '#14212B', fontSize: 34, fontWeight: '800', marginTop: 36, textAlign: 'center' }, subtitle: { color: '#6B7785', fontSize: 15, marginTop: 8, textAlign: 'center' }, form: { marginTop: 30 }, label: { color: '#33404D', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 16 }, input: { height: 52, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DFE6ED', borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: '#14212B' }, button: { height: 54, borderRadius: 15, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', marginTop: 24 }, pressed: { opacity: 0.8 }, disabled: { opacity: 0.55 }, buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, forgot: { textAlign: 'center', color: '#208AEF', fontSize: 13, fontWeight: '700', marginTop: 20 }, registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 }, registerPrompt: { color: '#6B7785', fontSize: 13 }, registerText: { color: '#208AEF', fontSize: 13, fontWeight: '800' }, error: { color: '#C0392B', fontSize: 13, marginTop: 14 }, footer: { color: '#9AA6B2', fontSize: 12, textAlign: 'center', marginTop: 42 },
});
