import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please complete all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiService.changePassword(currentPassword, newPassword, confirmPassword);
      Alert.alert('Password updated', 'Your password has been changed successfully.', [
        { text: 'Back to profile', onPress: () => router.back() },
      ]);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError: any) {
      const responseData = requestError?.response?.data;
      const validationErrors = responseData?.errors
        ? Object.values(responseData.errors).flat().join(' ')
        : null;
      const serverMessage = validationErrors || responseData?.message || requestError?.message;

      if (serverMessage) {
        setError(String(serverMessage));
      } else if (!requestError?.response) {
        setError('Unable to reach the server. Check your connection and Laravel API status.');
      } else if (requestError.response.status === 404) {
        setError('Driver password endpoint was not found. Confirm route /driver/change-password in Laravel.');
      } else if (requestError.response.status === 422) {
        setError('The current password is invalid or the new password does not meet Laravel validation rules.');
      } else if (requestError.response.status === 401 || requestError.response.status === 403) {
        setError('Your session is no longer valid. Please log in again.');
      } else {
        setError('Unable to update password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}>
            <ThemedText style={styles.back}>‹ Back</ThemedText>
          </Pressable>

          <ThemedText style={styles.logo}>TAP TRACK</ThemedText>
          <ThemedText style={styles.kicker}>DRIVER PORTAL</ThemedText>
          <ThemedText style={styles.title}>Change password</ThemedText>
          <ThemedText style={styles.subtitle}>Update your current login password to keep your account secure.</ThemedText>

          <View style={styles.form}>
            <ThemedText style={styles.label}>Current password</ThemedText>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Enter your current password"
              placeholderTextColor="#9AA6B2"
              style={styles.input}
            />

            <ThemedText style={styles.label}>New password</ThemedText>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Create a new password"
              placeholderTextColor="#9AA6B2"
              style={styles.input}
            />

            <ThemedText style={styles.label}>Confirm new password</ThemedText>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Repeat your new password"
              placeholderTextColor="#9AA6B2"
              style={styles.input}
            />

            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}
            >
              <ThemedText style={styles.buttonText}>{submitting ? 'Updating...' : 'Update password'}</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  flex: { flex: 1 },
  content: { padding: 28, paddingBottom: 40 },
  back: { color: '#208AEF', fontWeight: '700', marginBottom: 30 },
  logo: { color: '#208AEF', fontSize: 19, fontWeight: '800', letterSpacing: 1 },
  kicker: { color: '#7B8794', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  title: { color: '#14212B', fontSize: 32, fontWeight: '800', marginTop: 36 },
  subtitle: { color: '#6B7785', fontSize: 15, lineHeight: 22, marginTop: 8 },
  form: { marginTop: 24 },
  label: { color: '#33404D', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 18 },
  input: {
    height: 52,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DFE6ED',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#14212B',
  },
  error: { color: '#C0392B', fontSize: 13, marginTop: 14 },
  button: { height: 54, borderRadius: 15, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
