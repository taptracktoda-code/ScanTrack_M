import { Page } from '@/components/page';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Pressable, StyleSheet, View } from 'react-native';

type ScanResult = {
  success: boolean;
  title: string;
  message: string;
  driverName?: string;
  plateNumber?: string;
  organization?: string;
  transaction?: string;
  timestamp?: string;
};

function getText(value: unknown, fallback?: string) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const namedValue = (value as { name?: unknown }).name;
    if (typeof namedValue === 'string' || typeof namedValue === 'number') return String(namedValue);
  }
  return fallback;
}

function formatTimestamp(value: unknown) {
  const text = getText(value);
  if (!text) return undefined;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function getErrorResult(error: any): ScanResult {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || 'Unable to connect to the Tap Track server.';
  const normalized = String(message).toLowerCase();

  if (!error?.response) {
    return { success: false, title: 'Connection Error', message: 'Unable to connect to the Tap Track server. Please check your network connection.' };
  }
  if (status === 401 || status === 403 || normalized.includes('unauthorized') || normalized.includes('permission')) {
    return { success: false, title: 'Access Denied', message: 'You do not have permission to perform this action.' };
  }
  if (normalized.includes('invalid qr') || normalized.includes('not registered') || normalized.includes('not found')) {
    return { success: false, title: 'Invalid QR Code', message: 'This QR code is not registered in Tap Track.' };
  }
  if (normalized.includes('inactive')) {
    return { success: false, title: 'Driver Inactive', message: 'This driver is currently not active.' };
  }

  return { success: false, title: 'Scan Failed', message };
}

export default function AdminScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleBarcodeScanned = async (event: BarcodeScanningResult) => {
    const qrValue = String(event?.data || '').trim();
    if (!qrValue || isProcessing || qrValue === lastScanned) return;

    setIsScanning(false);
    setIsProcessing(true);
    setLastScanned(qrValue);

    try {
      const response = await apiService.scanQrIdentifier(qrValue);
      const payload = response?.data || response || {};
      const driver = payload.driver || payload.data?.driver || {};
      const transaction = payload.transaction || payload.data?.transaction || payload.transaction_type || payload.type || 'ENTRY';
      const timestamp = payload.timestamp || payload.data?.timestamp || payload.created_at;
      const transactionText = (getText(transaction, 'ENTRY') || 'ENTRY').toUpperCase();
      const succeeded = payload.success !== false;
      const driverName = getText(driver.name, getText(payload.driver_name, 'Unknown Driver'));
      const plateNumber = getText(driver.plate_number, getText(driver.vehicle_number, getText(payload.plate_number, payload.vehicle_number)));
      const organization = getText(payload.organization, getText(payload.data?.organization, driver.organization));
      const recordedAt = getText(timestamp, new Date().toISOString()) || new Date().toISOString();

      if (succeeded) {
        await apiService.saveLocalAdminTransaction({
          id: `local-${Date.now()}`,
          driver_id: getText(driver.id, getText(payload.driver_id, driverName)),
          driver: { name: driverName, plate_number: plateNumber, organization },
          transaction: transactionText,
          timestamp: recordedAt,
          created_at: recordedAt,
        });
      }

      setResult({
        success: succeeded,
        title: succeeded ? 'DONE' : 'QR Scan Failed',
        message: succeeded ? `${transactionText} recorded successfully and added to history.` : getText(payload.message, 'Scan could not be recorded.') || 'Scan could not be recorded.',
        driverName,
        plateNumber,
        organization,
        transaction: transactionText,
        timestamp: formatTimestamp(timestamp),
      });
    } catch (error: any) {
      setResult(getErrorResult(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScan = () => {
    setIsScanning(true);
    setResult(null);
    setLastScanned(null);
  };

  if (!permission) {
    return (
      <Page title="QR Scanner">
        <ThemedText>Loading camera permission...</ThemedText>
      </Page>
    );
  }

  if (!permission.granted) {
    return (
      <Page title="QR Scanner">
        <ThemedText style={styles.message}>Camera permission is required to scan driver QR codes.</ThemedText>
        <Button title="Allow Camera" onPress={requestPermission} />
      </Page>
    );
  }

  return (
    <Page title="Scan Driver QR Code">
      <View style={styles.previewWrap}>
        <CameraView
          active={isScanning}
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
          onMountError={(event) => setResult({ success: false, title: 'Camera Error', message: event.message })}
        />
        <View style={styles.frame} />
        <View style={styles.caption}>
          <ThemedText style={styles.captionText}>{isProcessing ? 'Processing scan...' : "Place the driver's QR code inside the frame."}</ThemedText>
        </View>
      </View>

      {!isScanning && (
        <View style={styles.resultCard}>
          <ThemedText style={[styles.resultTitle, { color: result?.success ? '#1B8F5A' : '#C0392B' }]}>{result?.title || 'Scan Complete'}</ThemedText>
          <ThemedText style={styles.resultMessage}>{result?.message || 'Scan processed.'}</ThemedText>
          {result?.driverName ? <ResultRow label="Driver" value={result.driverName} /> : null}
          {result?.plateNumber ? <ResultRow label="Plate Number" value={result.plateNumber} /> : null}
          {result?.organization ? <ResultRow label="Organization" value={result.organization} /> : null}
          {result?.transaction ? <ResultRow label="Transaction" value={result.transaction} /> : null}
          {result?.timestamp ? <ResultRow label="Time" value={result.timestamp} /> : null}
          <Pressable onPress={() => result?.success ? router.push('/admin/history') : resetScan()} disabled={isProcessing} style={({ pressed }) => [styles.button, pressed && { opacity: 0.82 }, isProcessing && { opacity: 0.55 }]}> 
            <ThemedText style={styles.buttonText}>{result?.success ? 'Done - View History' : 'Scan Another'}</ThemedText>
          </Pressable>
          {result?.success ? <Pressable onPress={resetScan} disabled={isProcessing} style={styles.secondaryButton}><ThemedText style={styles.secondaryButtonText}>Scan Another</ThemedText></Pressable> : null}
        </View>
      )}
    </Page>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <ThemedText style={styles.resultLabel}>{label}</ThemedText>
      <ThemedText style={styles.resultValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: { height: 420, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0F172A', marginBottom: 18 },
  camera: { flex: 1 },
  frame: { position: 'absolute', top: '50%', left: '50%', width: 240, height: 240, marginLeft: -120, marginTop: -130, borderWidth: 2, borderColor: '#FFF', borderRadius: 18 },
  caption: { position: 'absolute', left: 16, right: 16, bottom: 18, backgroundColor: 'rgba(15, 23, 42, 0.72)', borderRadius: 10, padding: 12 },
  captionText: { color: '#FFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  message: { color: '#33404D', fontSize: 15, marginBottom: 16 },
  resultCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18 },
  resultTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  resultMessage: { color: '#33404D', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  resultRow: { paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#EDF1F4' },
  resultLabel: { color: '#7B8794', fontSize: 12, fontWeight: '800' },
  resultValue: { color: '#14212B', fontSize: 15, fontWeight: '800', marginTop: 3 },
  button: { marginTop: 16, backgroundColor: '#208AEF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '800' },
  secondaryButton: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#208AEF', fontWeight: '800' },
});
