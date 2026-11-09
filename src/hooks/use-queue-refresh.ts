import { subscribeQueueUpdates } from '@/services/queueUpdates';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';

// Events refresh this session immediately; polling synchronizes other devices.
export function useQueueRefresh(refresh: () => unknown) {
  useFocusEffect(useCallback(() => {
    let running = false;
    let pending = false;
    let disposed = false;
    const update = async () => {
      if (disposed) return;
      if (running) { pending = true; return; }
      running = true;
      try {
        await refresh();
      } finally {
        running = false;
        if (pending && !disposed) { pending = false; void update(); }
      }
    };
    void update();
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void update();
    }, 5000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void update();
    });
    const unsubscribe = subscribeQueueUpdates(() => { void update(); });
    return () => {
      disposed = true;
      clearInterval(interval);
      subscription.remove();
      unsubscribe();
    };
  }, [refresh]));
}
