export const managerDriverFilters = [
  { value: 'all', label: 'Total Drivers', accent: '#2563EB' },
  { value: 'active', label: 'Active Drivers', accent: '#16A34A' },
  { value: 'waiting', label: 'Waiting Drivers', accent: '#F59E0B' },
  { value: 'on_trip', label: 'On Trip Drivers', accent: '#14B8A6' },
] as const;

export type ManagerDriverFilter = typeof managerDriverFilters[number]['value'];
export type ManagerDriverAccount = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  license_number: string;
  unit: string;
  account_status: string;
  queue_status: string | null;
  queue_position: number | null;
  queue_entry_id?: string | null;
  has_queue_status: boolean;
  duty_status?: string;
  shift_status?: string;
};

const statusKey = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');

export function parseManagerDriverFilter(value: unknown): ManagerDriverFilter {
  return managerDriverFilters.find((filter) => filter.value === value)?.value ?? 'all';
}

export function normalizeManagerDriver(value: any): ManagerDriverAccount | null {
  const payload = value?.data?.data || value?.data || value;
  const driver = payload?.driver || payload;
  if (!driver || typeof driver !== 'object') return null;
  const email = String(driver.email || '');
  const id = driver.id ?? driver.driver_id ?? email;
  if (id === '' || id == null) return null;
  return {
    id: String(id),
    full_name: String(driver.full_name || driver.name || [driver.first_name, driver.last_name].filter(Boolean).join(' ') || 'Driver'),
    email,
    phone_number: String(driver.contact_number || driver.phone_number || driver.phone || ''),
    license_number: String(driver.license_number || ''),
    unit: String(driver.plate_number || driver.unit || driver.vehicle_number || ''),
    account_status: statusKey(driver.account_status || driver.status) || 'unknown',
    queue_status: driver.queue_status == null ? null : statusKey(driver.queue_status),
    queue_position: typeof driver.queue_position === 'number' ? driver.queue_position : null,
    queue_entry_id: driver.queue_entry_id == null ? null : String(driver.queue_entry_id),
    has_queue_status: Object.prototype.hasOwnProperty.call(driver, 'queue_status'),
    duty_status: driver.duty_status,
    shift_status: driver.shift_status,
  };
}

export function normalizeManagerDrivers(value: any): ManagerDriverAccount[] {
  const { records: list } = getManagerDriverPage(value);
  const unique = new Map<string, ManagerDriverAccount>();
  for (const item of list) {
    const driver = normalizeManagerDriver(item);
    if (driver) unique.set(driver.id, driver);
  }
  return [...unique.values()];
}

// Preserve Laravel pagination metadata while unwrapping response envelopes.
export function getManagerDriverPage(value: any): { records: unknown[]; lastPage: number } {
  let current = value;
  let lastPage = 1;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) return { records: current, lastPage };
    if (!current || typeof current !== 'object') break;
    lastPage = Number(current.meta?.last_page ?? current.last_page ?? lastPage);
    if (!Number.isSafeInteger(lastPage) || lastPage < 1) throw new Error('The manager drivers API returned invalid pagination.');
    current = current.drivers ?? current.data;
  }
  throw new Error('The manager drivers API did not return a driver list.');
}

export function filterManagerDrivers(drivers: ManagerDriverAccount[], filter: ManagerDriverFilter, search = '') {
  const query = search.trim().toLowerCase();
  return drivers.filter((driver) => {
    const matches = filter === 'all' ||
      (filter === 'active' && driver.account_status === 'active') ||
      (filter === 'waiting' && driver.queue_status === 'waiting') ||
      (filter === 'on_trip' && driver.queue_status === 'serving');
    return matches && (!query || [driver.full_name, driver.email, driver.phone_number, driver.license_number, driver.unit]
      .some((value) => value.toLowerCase().includes(query)));
  });
}

export function hasManagerQueueData(drivers: ManagerDriverAccount[]) {
  return drivers.every((driver) => driver.has_queue_status);
}

export function getManagerDriverCounts(drivers: ManagerDriverAccount[]) {
  const queueAvailable = hasManagerQueueData(drivers);
  return Object.fromEntries(managerDriverFilters.map(({ value }) => [value,
    !queueAvailable && (value === 'waiting' || value === 'on_trip') ? null : filterManagerDrivers(drivers, value).length,
  ])) as Record<ManagerDriverFilter, number | null>;
}
