const listeners = new Set<() => void>();

export function subscribeQueueUpdates(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyQueueUpdated() {
  listeners.forEach((listener) => listener());
}
