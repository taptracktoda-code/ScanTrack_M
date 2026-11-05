import { QrCodeCard } from '@/components/qr-code-card';
import { Page, useApi } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { apiService } from '@/services/api';
import { Driver } from '@/types';
import { Redirect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

export default function MyQrScreen() {
  const { isLoading: authLoading, isSignedIn, isDriver } = useAuth();
  const request = useCallback(async (): Promise<Driver> => {
    const response = await apiService.getDriverProfile();
    const payload = response?.data?.data || response?.data || response;
    const profile = payload?.driver || payload;

    return {
      ...profile,
      qr_identifier: profile?.qr_identifier || undefined,
      qr_status: String(profile?.qr_status || profile?.qr_code_status || 'unregistered').toLowerCase(),
    };
  }, []);
  const { data: driver, loading, error, retry, refresh, refreshing } = useApi<Driver>(request, {} as Driver);

  if (authLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#208AEF" size="large" /></View>;
  }
  if (!isSignedIn) return <Redirect href="/login" />;
  if (!isDriver) return <Redirect href="/(tabs)" />;

  const hasActiveQr = driver.qr_status === 'active' && Boolean(driver.qr_identifier);

  return (
    <Page title="My QR Code" loading={loading} error={error} onRetry={retry} onRefresh={refresh} refreshing={refreshing}>
      <ThemedText style={{ color: '#64748B', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 22 }}>
        Show this code at the terminal scanner for attendance.
      </ThemedText>
      {hasActiveQr ? (
        <QrCodeCard value={driver.qr_identifier} label="Driver QR Code" size={240} />
      ) : (
        <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 20 }}>
          <ThemedText style={{ color: '#64748B', fontSize: 14, lineHeight: 21, textAlign: 'center' }}>
            {driver.qr_status === 'unregistered'
              ? 'Your QR code will appear here after your Manager completes your driver account setup.'
              : 'Your QR code is not active. Please contact your TODA manager.'}
          </ThemedText>
        </View>
      )}
      <Pressable
        onPress={refresh}
        disabled={refreshing}
        style={{ alignItems: 'center', paddingVertical: 16 }}
      >
        <ThemedText style={{ color: '#208AEF', fontSize: 14, fontWeight: '800' }}>
          {refreshing ? 'Refreshing...' : 'Refresh QR code'}
        </ThemedText>
      </Pressable>
    </Page>
  );
}
