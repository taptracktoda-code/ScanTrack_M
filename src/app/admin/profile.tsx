import { StatusBadge } from '@/components';
import { Page, styles } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const confirmLogout = () => Alert.alert('Log out?', 'You will need to sign in again.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
  ]);

  return (
    <Page title="Admin Profile">
      <View style={styles.card}>
        <ThemedText style={{ fontSize: 26, fontWeight: '800', color: '#14212B' }}>{user?.name || 'Admin'}</ThemedText>
        <ThemedText style={{ color: '#6B7785', marginTop: 8 }}>{user?.email || 'No email provided'}</ThemedText>
        <View style={{ marginTop: 14 }}>
          <StatusBadge status="active" label={user?.role || 'admin'} />
        </View>
      </View>

      <Pressable onPress={confirmLogout} style={{ backgroundColor: '#D64545', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 18 }}>
        <ThemedText style={{ color: '#FFF', fontWeight: '800' }}>Logout</ThemedText>
      </Pressable>
    </Page>
  );
}
