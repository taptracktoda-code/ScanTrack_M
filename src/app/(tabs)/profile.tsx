import { StatusBadge } from '@/components';
import { MyToda } from '@/components/my-toda';
import { SettingsButton } from '@/components/settings-button';
import { Page, styles } from '@/components/page';
import { ProfilePicturePicker } from '@/components/profile-picture-picker';
import { QrCodeCard } from '@/components/qr-code-card';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function ProfileScreen() {
  const { driver, logout, updateProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [assignedToda, setAssignedToda] = useState(() => getAssignedTodaName(driver));
  const [profile, setProfile] = useState({ name: driver?.name || '', phone: driver?.phone || '', email: driver?.email || '' });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [qr, setQr] = useState<{ identifier?: string; status: string }>({
    identifier: driver?.qr_identifier,
    status: driver?.qr_status || driver?.qr_code_status || 'unregistered',
  });
  const [qrError, setQrError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let isActive = true;
    apiService.getDriverProfile()
      .then((response) => {
        const payload = response?.data?.data || response?.data || response;
        const profileData = payload?.driver || payload;
        if (!isActive) return;
        setAssignedToda(getAssignedTodaName(profileData) || getAssignedTodaName(driver));
        setQr({
          identifier: profileData?.qr_identifier || undefined,
          status: String(profileData?.qr_status || profileData?.qr_code_status || 'unregistered').toLowerCase(),
        });
        setQrError(null);
      })
      .catch((error: any) => {
        if (isActive) setQrError(error?.response?.data?.message || error?.message || 'Unable to load your QR code.');
      });
    return () => { isActive = false; };
  }, [driver]));

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      setProfileError('Enter your full name.');
      return;
    }
    setSaving(true);
    setProfileError(null);
    try {
      await updateProfile({ name: profile.name.trim(), phone: profile.phone.trim(), email: profile.email.trim() });
      await refreshProfile();
      Alert.alert('Profile updated', 'Your profile information has been saved.');
    } catch (error: any) {
      setProfileError(error?.response?.data?.message || error?.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (uri: string, fileName: string) => {
    setAvatarLoading(true);
    try {
      const response = await apiService.uploadProfileImage(uri, fileName);
      const nextAvatar = response?.data?.avatar || response?.avatar || response?.data?.url || response?.url || response?.data?.profile_image || response?.profile_image;
      if (!nextAvatar) throw new Error('The server did not return an avatar URL.');
      await refreshProfile();
      Alert.alert('Profile picture updated', 'Your new profile picture is now active.');
    } catch (error: any) {
      Alert.alert('Unable to update picture', error?.response?.data?.message || error?.message || 'Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarLoading(true);
    try {
      await apiService.removeProfileImage();
      await refreshProfile();
      Alert.alert('Profile picture removed', 'Your profile picture has been removed.');
    } catch (error: any) {
      Alert.alert('Unable to remove picture', error?.response?.data?.message || error?.message || 'Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const confirmLogout = () => Alert.alert('Log out?', 'You will need to sign in again.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } }]);

  return (
    <Page title="My Profile">
      <View style={profileStyles.scrollContent}>
        <ProfilePicturePicker imageUri={driver?.avatar || null} onChange={uploadAvatar} onRemove={removeAvatar} loading={avatarLoading} />
        <View style={profileStyles.hero}>
          <ThemedText style={profileStyles.name}>{driver?.name || 'Driver'}</ThemedText>
          <ThemedText style={styles.muted}>{driver?.driver_id || 'Driver ID unavailable'}</ThemedText>
          <View style={profileStyles.badgeRow}><StatusBadge status={driver?.account_status === 'active' ? 'active' : 'off_duty'} label={driver?.account_status || 'Unknown'} /></View>
        </View>

        <View style={styles.card}>
          <ProfileField label="Full name" value={profile.name} onChangeText={(value) => setProfile((current) => ({ ...current, name: value }))} />
          <ProfileField label="Phone" value={profile.phone} keyboardType="phone-pad" onChangeText={(value) => setProfile((current) => ({ ...current, phone: value }))} />
          <ProfileField label="Email" value={profile.email} keyboardType="email-address" onChangeText={(value) => setProfile((current) => ({ ...current, email: value }))} />
          <ProfileRow label="Assigned TODA" value={assignedToda || 'Not assigned'} />
          <ProfileRow label="Assigned Vehicle" value={driver?.vehicle_number || 'Not assigned'} />
          <ProfileRow label="QR Status" value={qr.status === 'active' ? 'Active' : qr.status === 'unregistered' ? 'Not assigned' : qr.status.replace(/_/g, ' ')} />
          {profileError ? <ThemedText style={profileStyles.error}>{profileError}</ThemedText> : null}
        </View>
        <MyToda key={driver?.id} />
        {qr.status === 'active' && qr.identifier ? <QrCodeCard value={qr.identifier} label="My Driver QR Code" /> : (
          <View style={profileStyles.qrMessage}>
            <ThemedText style={profileStyles.qrMessageText}>
              {qrError || (qr.status === 'unregistered' ? 'Your QR code will appear here after your Manager completes your driver account setup.' : 'Your QR code is not active. Please contact your TODA manager.')}
            </ThemedText>
          </View>
        )}

        <Pressable onPress={saveProfile} disabled={saving} style={({ pressed }) => [profileStyles.primary, saving && profileStyles.disabled, pressed && { opacity: 0.85 }]}><ThemedText style={profileStyles.primaryText}>{saving ? 'Saving...' : 'Save profile'}</ThemedText></Pressable>
        <SettingsButton />
        <Pressable onPress={confirmLogout} style={profileStyles.logout}><ThemedText style={profileStyles.logoutText}>Log Out</ThemedText></Pressable>
      </View>
    </Page>
  );
}

function ProfileField({ label, value, keyboardType = 'default', onChangeText }: { label: string; value: string; keyboardType?: 'default' | 'email-address' | 'phone-pad'; onChangeText: (value: string) => void }) {
  return <View style={profileStyles.field}><ThemedText style={styles.muted}>{label}</ThemedText><TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={label === 'Email' ? 'none' : 'words'} style={profileStyles.input} /></View>;
}

function getAssignedTodaName(driver?: {
  toda?: string | { name?: string };
  toda_name?: string;
  organization_name?: string;
  organization?: string | { name?: string };
  association_name?: string;
  association?: string | { name?: string };
} | null) {
  const getName = (value?: string | { name?: string }) => typeof value === 'string' ? value : value?.name;
  return [
    driver?.toda_name,
    getName(driver?.toda),
    driver?.organization_name,
    getName(driver?.organization),
    driver?.association_name,
    getName(driver?.association),
  ].find((name) => typeof name === 'string' && name.trim())?.trim() || '';
}

function ProfileRow({ label, value }: { label: string; value: string }) { return <View style={profileStyles.row}><ThemedText style={styles.muted}>{label}</ThemedText><ThemedText style={profileStyles.rowValue}>{value}</ThemedText></View>; }

const profileStyles = StyleSheet.create({
  scrollContent: { paddingBottom: 24 },
  hero: { alignItems: 'center', paddingVertical: 10, marginBottom: 14 },
  badgeRow: { marginTop: 10 },
  name: { color: '#14243A', fontSize: 23, lineHeight: 30, textAlign: 'center', fontWeight: '800', marginBottom: 5 },
  field: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF1F4' },
  input: { minHeight: 42, color: '#14243A', fontSize: 15, fontWeight: '700', marginTop: 6 },
  row: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#EDF1F4' },
  rowValue: { color: '#23354D', fontSize: 14, fontWeight: '700', marginTop: 5 },
  qrMessage: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 17, marginBottom: 14, borderWidth: 1, borderColor: '#E5EBF3' },
  qrMessageText: { color: '#64748B', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  primary: { backgroundColor: '#1D4ED8', minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  secondary: { backgroundColor: '#EFF6FF', minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  secondaryText: { color: '#1D4ED8', fontWeight: '800' },
  logout: { minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#B42318', fontWeight: '800' },
  error: { color: '#B42318', fontSize: 12, marginTop: 12 },
  disabled: { opacity: 0.55 },
});
