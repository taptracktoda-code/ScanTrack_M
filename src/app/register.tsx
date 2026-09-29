import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL, apiService, REGISTER_ENDPOINT } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [unit, setUnit] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !licenseNumber.trim() || !unit.trim() || !address.trim() || !password || !confirmation) {
      setError('Complete all fields to create your account.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      console.log('[Registration] POST', `${API_BASE_URL}${REGISTER_ENDPOINT}`);
      await apiService.registerDriver({
        full_name: name.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        license_number: licenseNumber.trim(),
        unit: unit.trim(),
        address: address.trim(),
        password,
        password_confirmation: confirmation,
      });
      Alert.alert('Account request sent', 'Your driver account was created. You can now sign in.', [
        { text: 'Go to login', onPress: () => router.replace('/login') },
      ]);
    } catch (requestError: any) {
      const responseData = requestError?.response?.data;
      const validationErrors = responseData?.errors
        ? Object.values(responseData.errors).flat().join(' ')
        : null;
      const serverMessage = validationErrors || responseData?.message;

      if (serverMessage) {
        setError(String(serverMessage));
      } else if (!requestError?.response) {
        setError('Cannot reach the server. Please check your connection and confirm Laravel is running on the PC Wi-Fi address.');
      } else if (requestError.response.status === 404) {
        setError('Registration endpoint was not found (HTTP 404). Confirm the Laravel registration route and set EXPO_PUBLIC_REGISTER_ENDPOINT in .env.');
      } else if (requestError.response.status === 401 || requestError.response.status === 403) {
        setError(`Registration is not authorized (HTTP ${requestError.response.status}).`);
      } else if (requestError.response.status === 422) {
        setError('Laravel rejected the registration details (HTTP 422). Check the required field names and values.');
      } else if (requestError.response.status >= 500) {
        setError('Laravel encountered a server error. Check the Laravel log for details.');
      } else {
        setError(`Unable to create your account (HTTP ${requestError.response.status}). Please try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}><ThemedText style={styles.back}>‹ Back to login</ThemedText></Pressable>
          <ThemedText style={styles.logo}>TAP TRACK</ThemedText>
          <ThemedText style={styles.kicker}>DRIVER PORTAL</ThemedText>
          <ThemedText style={styles.title}>Create account</ThemedText>
          <ThemedText style={styles.subtitle}>Register as a driver to access your terminal activity.</ThemedText>

          <ThemedText style={styles.label}>Full name</ThemedText>
          <TextInput value={name} onChangeText={setName} placeholder="Juan Dela Cruz" placeholderTextColor="#9AA6B2" style={styles.input} />
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="driver@example.com" placeholderTextColor="#9AA6B2" style={styles.input} />
          <ThemedText style={styles.label}>Phone number</ThemedText>
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09XX XXX XXXX" placeholderTextColor="#9AA6B2" style={styles.input} />
          <ThemedText style={styles.label}>License number</ThemedText>
          <TextInput value={licenseNumber} onChangeText={setLicenseNumber} autoCapitalize="characters" placeholder="Enter your license number" placeholderTextColor="#9AA6B2" style={styles.input} />
          <ThemedText style={styles.label}>Unit</ThemedText>
          <TextInput value={unit} onChangeText={setUnit} placeholder="Enter your unit number" placeholderTextColor="#9AA6B2" style={styles.input} />
          <ThemedText style={styles.label}>Address</ThemedText>
          <TextInput value={address} onChangeText={setAddress} multiline placeholder="Enter your address" placeholderTextColor="#9AA6B2" style={[styles.input, styles.addressInput]} />
          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Create a password" placeholderTextColor="#9AA6B2" style={styles.input} />
          <ThemedText style={styles.label}>Confirm password</ThemedText>
          <TextInput value={confirmation} onChangeText={setConfirmation} secureTextEntry placeholder="Repeat your password" placeholderTextColor="#9AA6B2" style={styles.input} />
          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          <Pressable onPress={handleRegister} disabled={submitting} style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}>
            <ThemedText style={styles.buttonText}>{submitting ? 'Creating account...' : 'Create account'}</ThemedText>
          </Pressable>
          <ThemedText style={styles.note}>Your driver ID, vehicle assignment, and QR code are managed by the terminal administrator.</ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' }, flex: { flex: 1 }, content: { padding: 28, paddingBottom: 40 }, back: { color: '#208AEF', fontWeight: '700', marginBottom: 36 }, logo: { color: '#208AEF', fontSize: 19, fontWeight: '800', letterSpacing: 1 }, kicker: { color: '#7B8794', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4 }, title: { color: '#14212B', fontSize: 32, fontWeight: '800', marginTop: 44 }, subtitle: { color: '#6B7785', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 18 }, label: { color: '#33404D', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 14 }, input: { height: 52, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DFE6ED', borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: '#14212B' }, addressInput: { height: 84, paddingTop: 14, textAlignVertical: 'top' }, error: { color: '#C0392B', fontSize: 13, marginTop: 14 }, button: { height: 54, borderRadius: 15, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', marginTop: 24 }, pressed: { opacity: 0.8 }, disabled: { opacity: 0.55 }, buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, note: { color: '#9AA6B2', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 20 },
});
