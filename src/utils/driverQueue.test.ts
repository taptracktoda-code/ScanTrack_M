import { confirmQrScanResponse, getDriverQueue } from './driverQueue';

describe('driver queue display', () => {
  it('uses the backend drivers-ahead value and does not infer it from stale ranks', () => {
    expect(getDriverQueue({ status: 'WAITING', position: 2, drivers_ahead: 1 }).driversAhead).toBe(1);
    expect(getDriverQueue({ status: 'WAITING', position: 2 }).driversAhead).toBeNull();
    expect(getDriverQueue({ status: 'SERVING', drivers_ahead: 1 }).driversAhead).toBeNull();
  });
  it.each([
    [{ status: 'WAITING', position: '1', waiting_count: '3' }, 'Next in Line', 1, 3],
    [{ status: 'WAITING', position: 2, waiting_count: 3 }, 'Waiting', 2, 3],
    [{ status: 'SERVING', position: 1, waiting_count: 2 }, 'On Trip', null, 2],
    [{ status: 'COMPLETED', position: 1, waiting_count: 2 }, 'Trip Completed', null, 2],
    [{ status: null, position: null, waiting_count: 0 }, 'Not in Queue', null, 0],
    [{ status: 'CANCELLED', position: 1, waiting_count: 0 }, 'Not in Queue', null, 0],
    [undefined, 'Queue Unavailable', null, null],
  ])('uses current backend state: %j', (data, label, position, waitingCount) => {
    expect(getDriverQueue(data)).toMatchObject({ label, position, waitingCount });
  });

  it('rejects invalid positions and counts', () => {
    expect(getDriverQueue({ status: 'WAITING', position: 0, waiting_count: -1 })).toMatchObject({ position: null, waitingCount: null });
    expect(getDriverQueue({ status: 'WAITING', position: ' ', waiting_count: false })).toMatchObject({ position: null, waitingCount: null });
  });
});

describe('QR scan confirmation', () => {
  const confirmed = { success: true, driver: { id: 4 }, queue: { entry_id: 8, status: 'WAITING', position: 1, waiting_count: 1 } };
  it('requires explicit success and a persisted queue entry for the identified driver', () => {
    expect(confirmQrScanResponse(confirmed, 'join')).toEqual(confirmed);
    expect(confirmQrScanResponse({ success: true, data: confirmed }, 'join')).toMatchObject(confirmed);
  });

  it.each([
    {},
    { data: {} },
    { ...confirmed, success: undefined },
    { ...confirmed, driver: {} },
    { ...confirmed, queue: null },
    { ...confirmed, queue: { status: 'WAITING', position: 1 } },
    { ...confirmed, queue: { entry_id: 8, status: 'SERVING', position: 1 } },
    { success: false, message: 'Duplicate scan', data: confirmed },
    { success: true, data: { success: false, message: 'Inactive' } },
  ])('does not falsely confirm an incomplete or failed response: %j', (response) => {
    expect(() => confirmQrScanResponse(response, 'join')).toThrow();
  });

  it('does not interpret attendance success as queue registration', () => {
    expect(() => confirmQrScanResponse({ success: true, driver: { id: 4 }, message: 'ENTRY recorded successfully.' }, 'join'))
      .toThrow('did not confirm queue registration');
  });

  it('handles an explicit exit separately from joining', () => {
    const exit = { success: true, driver: { id: 4 }, transaction_type: 'EXIT', queue: { status: 'CANCELLED' } };
    expect(confirmQrScanResponse(exit, 'exit')).toEqual(exit);
    expect(() => confirmQrScanResponse(exit, 'join')).toThrow();
  });
});
