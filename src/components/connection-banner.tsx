import { ThemedText } from '@/components/themed-text';
import { getConnectionState, subscribeConnection } from '@/services/connection';
import { useSyncExternalStore } from 'react';
import { View } from 'react-native';

export function ConnectionBanner() {
  const state = useSyncExternalStore(subscribeConnection, getConnectionState, getConnectionState);
  const label = state.offline ? 'Offline — your device has no internet connection.'
    : state.reconnecting ? 'Reconnecting — checking the server.'
    : state.apiUnavailable ? 'API unreachable or unavailable — your device may still have internet.' : 'Connected';
  return <View accessibilityLiveRegion="polite" style={{ backgroundColor: state.offline || state.apiUnavailable ? '#FFF7ED' : '#EFF6FF', padding: 10, borderRadius: 10, marginBottom: 12 }}>
    <ThemedText style={{ color: '#334155', fontSize: 12 }}>{label}</ThemedText>
    {(state.offline || state.apiUnavailable) && <ThemedText style={{ color: '#9A3412', fontSize: 12 }}>Previously loaded queue information may be outdated.</ThemedText>}
    <ThemedText style={{ color: '#64748B', fontSize: 11 }}>Last successful server contact: {state.lastSuccess ? new Date(state.lastSuccess).toLocaleTimeString() : 'Not yet connected'}</ThemedText>
  </View>;
}
