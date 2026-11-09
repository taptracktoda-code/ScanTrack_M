import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ThemedText } from './themed-text';

export function QrCodeCard({ value, label, size = 180 }: { value?: string; label?: string; size?: number }) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const qrSize = Math.min(size, Math.max(0, availableWidth - 34));
  return (
    <View style={styles.card}>
      <ThemedText style={styles.label}>{label || 'QR Code'}</ThemedText>
      {value ? (
        <>
          <View style={styles.qrArea} onLayout={({ nativeEvent }) => setAvailableWidth(nativeEvent.layout.width)}>
            {qrSize > 0 ? <View style={styles.qrWrap}>
              <QRCode value={value} size={qrSize} backgroundColor="white" color="#14212B" />
            </View> : null}
          </View>
          <ThemedText style={styles.value}>{value}</ThemedText>
        </>
      ) : <ThemedText style={styles.value}>No QR assigned yet</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5EBF3',
  },
  label: {
    textAlign: 'center',
    color: '#172A43',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  qrArea: { alignSelf: 'stretch', alignItems: 'center' },
  qrWrap: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EBF3',
  },
  value: {
    alignSelf: 'stretch',
    color: '#52647B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
