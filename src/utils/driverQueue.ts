export type QueueAction = 'join' | 'exit';

function integer(value: unknown, minimum: number): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum ? parsed : null;
}

export function getDriverQueue(value: any) {
  const queue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const status = typeof queue.status === 'string' ? queue.status.toUpperCase() : null;
  const position = status === 'WAITING' ? integer(queue.position, 1) : null;
  const waitingCount = integer(queue.waiting_count, 0);
  const label = status === 'WAITING' ? position === 1 ? 'Next in Line' : 'Waiting'
    : status === 'SERVING' ? 'On Trip'
    : status === 'COMPLETED' ? 'Trip Completed'
    : status === 'CANCELLED' || (value && status === null) ? 'Not in Queue'
    : 'Queue Unavailable';
  const driversAhead = status === 'WAITING' ? integer(queue.drivers_ahead, 0) : null;
  return { status, position, waitingCount, label, driversAhead };
}

export function confirmQrScanResponse(response: any, action: QueueAction) {
  let payload = response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!payload || typeof payload !== 'object' || payload.success === false) break;
    if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) break;
    payload = { ...payload, ...payload.data, data: payload.data.data };
  }
  const queue = getDriverQueue(payload?.queue);
  const confirmed = payload?.success === true && payload?.driver?.id != null &&
    (action === 'join'
      ? queue.status === 'WAITING' && queue.position !== null && payload.queue.entry_id != null
      : payload.transaction_type === 'EXIT' && queue.status !== 'WAITING' && queue.status !== 'SERVING');
  if (!confirmed) {
    const error = new Error(payload?.success === false
      ? payload.message || 'The scan was rejected.'
      : 'The server did not confirm queue registration. Refresh the queue before scanning again.');
    error.name = 'ScanConfirmationError';
    throw error;
  }
  return payload;
}
