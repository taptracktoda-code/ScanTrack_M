import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ThemedText } from './themed-text';

export function QrCodeCard({ value, label }: { value?: string; label?: string }) {
  const qrValue = value || 'NO_QR_ASSIGNED';

  return (
    <View style={styles.card}>
      <ThemedText style={styles.label}>{label || 'QR Code'}</ThemedText>
      <View style={styles.qrWrap}>
        <QRCode value={qrValue} size={180} backgroundColor="white" color="#14212B" />
      </View>
      <ThemedText style={styles.value}>{value || 'No QR assigned yet'}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    color: '#14212B',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  qrWrap: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EAF2',
  },
  value: {
    color: '#4B5866',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
