import {
  filterManagerDrivers, getManagerDriverCounts, getManagerDriverPage,
  normalizeManagerDriver, normalizeManagerDrivers, parseManagerDriverFilter,
} from './managerDrivers';

const records = [
  { id: 1, name: 'Ana Cruz', account_status: 'Active', queue_status: 'WAITING', plate_number: 'ABC123' },
  { id: 2, full_name: 'Ben Santos', account_status: 'active', queue_status: 'SERVING', email: 'ben@example.com' },
  { id: 3, name: 'Carlo', account_status: 'suspended', queue_status: null },
  { id: 4, name: 'Dana', account_status: 'pending_verification', queue_status: null },
];

describe('manager driver lists and statistics', () => {
  it('uses the current queue entry ID for removals instead of a driver ID or queue position', () => {
    expect(normalizeManagerDriver({ id: 4, queue_entry_id: 120, queue_position: 2, queue_status: 'WAITING' }))
      .toMatchObject({ id: '4', queue_entry_id: '120', queue_position: 2 });
    expect(normalizeManagerDriver({ id: 4, queue_status: null })?.queue_entry_id).toBeNull();
  });
  it('deduplicates by driver ID, including numeric/string IDs', () => {
    const drivers = normalizeManagerDrivers({ data: { drivers: [...records, { ...records[0], id: '1' }] } });
    expect(getManagerDriverCounts(drivers)).toEqual({ all: 4, active: 2, waiting: 1, on_trip: 1 });
  });

  it.each(['all', 'active', 'waiting', 'on_trip'] as const)('matches the %s count to its filtered records', (filter) => {
    const drivers = normalizeManagerDrivers(records);
    expect(getManagerDriverCounts(drivers)[filter]).toBe(filterManagerDrivers(drivers, filter).length);
    expect(parseManagerDriverFilter(filter)).toBe(filter);
  });

  it('keeps account status independent from dispatch and duty status', () => {
    const drivers = normalizeManagerDrivers([
      { id: 1, account_status: 'active', duty_status: 'off_duty', queue_status: null },
      { id: 2, account_status: 'pending_verification', queue_status: null },
      { id: 3, shift_status: 'Available', queue_status: null },
    ]);
    expect(getManagerDriverCounts(drivers)).toEqual({ all: 3, active: 1, waiting: 0, on_trip: 0 });
  });

  it('searches case-insensitively within the selected status', () => {
    const drivers = normalizeManagerDrivers(records);
    expect(filterManagerDrivers(drivers, 'waiting', '  abc123 ')).toHaveLength(1);
    expect(filterManagerDrivers(drivers, 'on_trip', 'BEN@EXAMPLE')).toHaveLength(1);
    expect(filterManagerDrivers(drivers, 'waiting', 'Ben')).toEqual([]);
  });

  it('does not present missing queue data as zero drivers', () => {
    const drivers = normalizeManagerDrivers([{ id: 1, status: 'Active' }]);
    expect(getManagerDriverCounts(drivers)).toEqual({ all: 1, active: 1, waiting: null, on_trip: null });
  });

  it('handles empty lists and invalid URL filters', () => {
    expect(getManagerDriverCounts([])).toEqual({ all: 0, active: 0, waiting: 0, on_trip: 0 });
    expect(parseManagerDriverFilter('suspended')).toBe('all');
    expect(parseManagerDriverFilter(undefined)).toBe('all');
    expect(normalizeManagerDriver(null)).toBeNull();
    expect(normalizeManagerDriver({ name: 'No ID' })).toBeNull();
  });

  it('recomputes counts when a driver moves from waiting to serving', () => {
    const changed = records.map((driver) => driver.id === 1 ? { ...driver, queue_status: 'SERVING' } : driver);
    expect(getManagerDriverCounts(normalizeManagerDrivers(changed))).toEqual({ all: 4, active: 2, waiting: 0, on_trip: 2 });
  });
});

describe('Laravel driver list response handling', () => {
  it.each([
    { data: records, current_page: 1, last_page: 3 },
    { data: records, meta: { last_page: 3 } },
    { drivers: { data: records, last_page: 3 } },
    { data: { drivers: { data: records, meta: { last_page: 3 } } } },
  ])('preserves pagination metadata', (response) => {
    expect(getManagerDriverPage(response)).toEqual({ records, lastPage: 3 });
    expect(normalizeManagerDrivers(response)).toHaveLength(4);
  });

  it('reports malformed responses rather than silently returning zero', () => {
    expect(() => getManagerDriverPage({ message: 'Forbidden' })).toThrow('did not return a driver list');
    expect(() => getManagerDriverPage({ data: records, last_page: 'invalid' })).toThrow('invalid pagination');
  });
});
