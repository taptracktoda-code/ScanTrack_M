import { apiRequestFailed, apiRequestStarted, apiRequestSucceeded, getConnectionState, monitorConnection } from './connection';
import * as Network from 'expo-network';
import { notifyQueueUpdated } from './queueUpdates';

jest.mock('expo-network', () => ({ getNetworkStateAsync: jest.fn(), addNetworkStateListener: jest.fn() }));
jest.mock('./queueUpdates', () => ({ notifyQueueUpdated: jest.fn() }));

it('distinguishes device offline state from API failure and refreshes on reconnection', async () => {
  let receive!: (state: Network.NetworkState) => void;
  const remove = jest.fn();
  jest.mocked(Network.getNetworkStateAsync).mockResolvedValue({ isConnected: true, isInternetReachable: true });
  jest.mocked(Network.addNetworkStateListener).mockImplementation(listener => { receive = listener; return { remove }; });
  const cleanup = monitorConnection();
  await Promise.resolve();
  apiRequestFailed({});
  expect(getConnectionState()).toMatchObject({ offline: false, apiUnavailable: true });
  apiRequestStarted();
  expect(getConnectionState().reconnecting).toBe(true);
  receive({ isConnected: false });
  expect(getConnectionState().offline).toBe(true);
  receive({ isConnected: true, isInternetReachable: true });
  expect(notifyQueueUpdated).toHaveBeenCalledTimes(1);
  apiRequestSucceeded();
  expect(getConnectionState()).toMatchObject({ offline: false, apiUnavailable: false, reconnecting: false });
  expect(getConnectionState().lastSuccess).not.toBeNull();
  cleanup(); expect(remove).toHaveBeenCalled();
});
