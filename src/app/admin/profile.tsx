import { StatusBadge } from '@/components';
import { SettingsButton } from '@/components/settings-button';
import { Page } from '@/components/page';
import { ProfilePicturePicker } from '@/components/profile-picture-picker';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function AdminProfileScreen() {
  const { user, logout, updateProfile, refreshProfile } = useAuth();
  const refreshProfileRef = useRef(refreshProfile);
  useEffect(() => {
    refreshProfileRef.current = refreshProfile;
  }, [refreshProfile]);
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: user?.name || user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || user?.phone_number || '',
  });
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const avatar = user?.avatar || user?.avatar_url || user?.profile_image || user?.profile_image_url || user?.photo_url || null;
  const organizationName = user?.organization?.name || user?.toda?.name || user?.organization_name || user?.toda_name || (typeof user?.organization === 'string' ? user.organization : null) || (typeof user?.toda === 'string' ? user.toda : null);

  useFocusEffect(useCallback(() => {
    let isActive = true;
    setLoadingProfile(true);
    refreshProfileRef.current()
      .then((manager) => {
        if (!isActive) return;
        if (!manager) return;
        setProfile({
          name: manager.name || manager.full_name || '',
          email: manager.email || '',
          phone: manager.phone || manager.phone_number || '',
        });
        setProfileError(null);
      })
      .catch((error: any) => {
        if (isActive) setProfileError(error?.response?.data?.message || error?.message || 'Unable to load your latest profile details.');
      })
      .finally(() => {
        if (isActive) setLoadingProfile(false);
      });

    return () => {
      isActive = false;
    };
  }, []));

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      setProfileError('Enter your name.');
      return;
    }
    setSaving(true);
    setProfileError(null);
    try {
      await updateProfile({ name: profile.name.trim(), email: profile.email.trim(), phone: profile.phone.trim() });
      const refreshedProfile = await refreshProfile();
      if (refreshedProfile) {
        setProfile({
          name: refreshedProfile.name || refreshedProfile.full_name || profile.name.trim(),
          email: refreshedProfile.email || profile.email.trim(),
          phone: refreshedProfile.phone || refreshedProfile.phone_number || profile.phone.trim(),
        });
      }
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
      await apiService.uploadManagerProfileImage(uri, fileName);
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
      await apiService.removeManagerProfileImage();
      await refreshProfile();
      Alert.alert('Profile picture removed', 'Your profile picture has been removed.');
    } catch (error: any) {
      Alert.alert('Unable to remove picture', error?.response?.data?.message || error?.message || 'Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const confirmLogout = () => Alert.alert('Log out?', 'You will need to sign in again.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
  ]);

  return (
    <Page title="Manager Profile">
      <View>
        <View style={profileStyles.content}>
          <View style={profileStyles.accountCard}>
          <ProfilePicturePicker imageUri={avatar} onChange={uploadAvatar} onRemove={removeAvatar} loading={avatarLoading} />
          <View style={profileStyles.identity}>
              <ThemedText style={profileStyles.eyebrow}>ACCOUNT PROFILE</ThemedText>
              <ThemedText style={profileStyles.name}>{user?.name || user?.full_name || 'Manager'}</ThemedText>
              <ThemedText style={profileStyles.email}>{user?.email || 'No email provided'}</ThemedText>
              <View style={profileStyles.badge}><StatusBadge status="active" label="Manager account" /></View>
            </View>
            <View style={profileStyles.accountDetails}>
              <ThemedText style={profileStyles.detailLabel}>Assigned organization</ThemedText>
              <ThemedText style={profileStyles.detailValue}>{organizationName || 'No organization assigned'}</ThemedText>
            </View>
          </View>

          <View style={profileStyles.sectionHeader}>
            <ThemedText style={profileStyles.sectionTitle}>Personal information</ThemedText>
            <ThemedText style={profileStyles.sectionHint}>{loadingProfile ? 'Refreshing…' : 'Keep your contact details up to date'}</ThemedText>
          </View>
          <View style={profileStyles.formCard}>
            <ProfileField label="Full name" value={profile.name} onChangeText={(name) => setProfile((current) => ({ ...current, name }))} />
            <ProfileField label="Email address" value={profile.email} keyboardType="email-address" onChangeText={(email) => setProfile((current) => ({ ...current, email }))} />
            <ProfileField label="Phone number" value={profile.phone} keyboardType="phone-pad" onChangeText={(phone) => setProfile((current) => ({ ...current, phone }))} />
            {profileError ? <ThemedText style={profileStyles.error}>{profileError}</ThemedText> : null}
          </View>

          <Pressable onPress={saveProfile} disabled={saving || loadingProfile} style={({ pressed }) => [profileStyles.primary, (saving || loadingProfile) && profileStyles.disabled, pressed && { opacity: 0.85 }]}>
            <ThemedText style={profileStyles.primaryText}>{saving ? 'Saving changes…' : 'Save changes'}</ThemedText>
          </Pressable>

          <View style={profileStyles.sectionHeader}>
            <ThemedText style={profileStyles.sectionTitle}>Security</ThemedText>
            <ThemedText style={profileStyles.sectionHint}>Manage your account access</ThemedText>
          </View>
          <Pressable onPress={() => router.push('/change-password')} style={profileStyles.securityRow}>
            <View style={profileStyles.securityIcon}>
              <ThemedText style={profileStyles.securityIconText}>•••</ThemedText>
            </View>
            <View style={profileStyles.securityCopy}>
              <ThemedText style={profileStyles.securityTitle}>Change Password</ThemedText>
              <ThemedText style={profileStyles.sectionHint}>Verify your email before changing your password</ThemedText>
            </View>
            <ThemedText style={profileStyles.chevron}>›</ThemedText>
          </Pressable>
          <SettingsButton />
          <Pressable accessibilityRole="button" onPress={() => router.push('/manager-attendance')} style={profileStyles.securityRow}><ThemedText style={profileStyles.securityTitle}>Attendance</ThemedText></Pressable>
          <Pressable onPress={confirmLogout} style={({ pressed }) => [profileStyles.logout, pressed && { opacity: 0.8 }]}>
            <ThemedText style={profileStyles.logoutText}>Log out of account</ThemedText>
          </Pressable>
        </View>
      </View>
    </Page>
  );
}

function ProfileField({ label, value, keyboardType = 'default', onChangeText }: { label: string; value: string; keyboardType?: 'default' | 'email-address' | 'phone-pad'; onChangeText: (value: string) => void }) {
  return (
    <View style={profileStyles.field}>
      <ThemedText style={profileStyles.fieldLabel}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={keyboardType !== 'email-address'}
        style={profileStyles.input}
      />
    </View>
  );
}

const profileStyles = StyleSheet.create({
  content: { paddingBottom: 20 },
  accountCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#E5EBF3' },
  identity: { alignItems: 'center', marginTop: -8, marginBottom: 18 },
  eyebrow: { color: '#1D4ED8', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 7 },
  name: { color: '#14243A', fontSize: 23, lineHeight: 29, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  email: { color: '#748198', fontSize: 13 },
  badge: { marginTop: 11 },
  accountDetails: { borderTopWidth: 1, borderTopColor: '#E9EEF4', paddingTop: 14 },
  detailLabel: { color: '#8793A5', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  detailValue: { color: '#23354D', fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 5 },
  sectionHeader: { marginBottom: 11 },
  sectionTitle: { color: '#172A43', fontSize: 16, fontWeight: '800' },
  sectionHint: { color: '#748198', fontSize: 11, lineHeight: 16, marginTop: 4 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E5EBF3', paddingHorizontal: 15, paddingVertical: 4, marginBottom: 14 },
  field: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF1F4' },
  fieldLabel: { color: '#748198', fontSize: 11, fontWeight: '700' },
  input: { minHeight: 42, color: '#172A43', fontSize: 15, fontWeight: '700', marginTop: 4, paddingVertical: 7 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18, marginVertical: 10 },
  primary: { backgroundColor: '#1D4ED8', minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  disabled: { opacity: 0.55 },
  securityRow: { backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#E5EBF3', padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  securityIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  securityIconText: { color: '#1D4ED8', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  securityCopy: { flex: 1 },
  securityTitle: { color: '#172A43', fontSize: 13, fontWeight: '800' },
  chevron: { color: '#1D4ED8', fontSize: 24, fontWeight: '600', marginLeft: 8 },
  logout: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 15, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#B42318', fontSize: 13, fontWeight: '800' },
});
