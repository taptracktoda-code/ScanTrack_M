import * as Network from 'expo-network';
import { notifyQueueUpdated } from './queueUpdates';

type State = { offline: boolean; apiUnavailable: boolean; reconnecting: boolean; lastSuccess: string | null };
let state: State = { offline: false, apiUnavailable: false, reconnecting: false, lastSuccess: null };
const listeners = new Set<() => void>();
function update(changes: Partial<State>) {
  state = { ...state, ...changes };
  listeners.forEach(listener => listener());
}
export const getConnectionState = () => state;
export const subscribeConnection = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function apiRequestStarted() { if (state.apiUnavailable) update({ reconnecting: true }); }
export function apiRequestSucceeded() { update({ apiUnavailable: false, reconnecting: false, lastSuccess: new Date().toISOString() }); }
export function apiRequestFailed(error: { response?: { status?: number } }) {
  if (!error.response || Number(error.response.status) >= 500) update({ apiUnavailable: true, reconnecting: false });
}
export function monitorConnection() {
  let active = true;
  const receive = (network: Network.NetworkState) => {
    if (!active) return;
    const offline = network.isConnected === false || network.isInternetReachable === false;
    const recovered = state.offline && !offline;
    update({ offline, ...(recovered ? { reconnecting: true } : {}) });
    if (recovered) notifyQueueUpdated();
  };
  void Network.getNetworkStateAsync().then(receive).catch(() => {});
  const subscription = Network.addNetworkStateListener(receive);
  return () => { active = false; subscription.remove(); };
}
