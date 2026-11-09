import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { notifyQueueUpdated } from '../services/queueUpdates';
import { useQueueRefresh } from './use-queue-refresh';

jest.mock('react', () => ({ useCallback: (callback: unknown) => callback }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: jest.fn() } }));

describe('queue synchronization while focused', () => {
  let cleanup: () => void;
  let stateChanged: (state: string) => void;
  const remove = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (AppState as { currentState: string }).currentState = 'active';
    jest.mocked(useFocusEffect).mockImplementation((effect) => { cleanup = effect() as () => void; });
    jest.mocked(AppState.addEventListener).mockImplementation((_event, listener) => {
      stateChanged = listener as (state: string) => void;
      return { remove };
    });
  });

  afterEach(() => { cleanup?.(); jest.useRealTimers(); });

  it('refreshes on focus, polling, foreground return, and local queue changes', async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    useQueueRefresh(refresh);
    expect(refresh).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    jest.advanceTimersByTime(5000);
    expect(refresh).toHaveBeenCalledTimes(2);
    await Promise.resolve();
    stateChanged('active');
    expect(refresh).toHaveBeenCalledTimes(3);
    await Promise.resolve();
    notifyQueueUpdated();
    expect(refresh).toHaveBeenCalledTimes(4);
  });

  it('pauses background polling and removes subscriptions on blur', async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    useQueueRefresh(refresh);
    await Promise.resolve();
    (AppState as { currentState: string }).currentState = 'background';
    jest.advanceTimersByTime(15000);
    expect(refresh).toHaveBeenCalledTimes(1);
    cleanup();
    expect(remove).toHaveBeenCalled();
    notifyQueueUpdated();
    jest.advanceTimersByTime(10000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('serializes slow requests and follows up when a mutation arrives during a refresh', async () => {
    let resolve: () => void = () => {};
    const refresh = jest.fn().mockImplementationOnce(() => new Promise<void>((done) => { resolve = done; })).mockResolvedValue(undefined);
    useQueueRefresh(refresh);
    jest.advanceTimersByTime(10000);
    notifyQueueUpdated();
    expect(refresh).toHaveBeenCalledTimes(1);
    resolve();
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
