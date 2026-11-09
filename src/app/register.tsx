import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.logo}>TAP TRACK</ThemedText>
        <ThemedText style={styles.kicker}>DRIVER PORTAL</ThemedText>
        <ThemedText style={styles.title}>Driver account</ThemedText>
        <ThemedText style={styles.subtitle}>
          Driver accounts are created by the Manager of your assigned TODA.
          Contact your Manager to get an account and temporary password.
        </ThemedText>
        <Pressable onPress={() => router.replace('/login')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <ThemedText style={styles.buttonText}>Go to login</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC', justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', width: '100%', maxWidth: 480, alignSelf: 'center', padding: 20 },
  logo: { color: '#208AEF', fontSize: 19, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  kicker: { color: '#7B8794', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4, textAlign: 'center' },
  title: { color: '#14212B', fontSize: 30, lineHeight: 38, fontWeight: '800', marginTop: 44, textAlign: 'center' },
  subtitle: { color: '#6B7785', fontSize: 15, lineHeight: 23, marginTop: 12, textAlign: 'center' },
  button: { minHeight: 54, padding: 12, borderRadius: 15, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  pressed: { opacity: 0.8 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
