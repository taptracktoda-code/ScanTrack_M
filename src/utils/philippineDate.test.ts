import { philippineDate, shiftDate } from './philippineDate';

it('changes Philippine date at 16:00 UTC regardless of device timezone', () => {
  expect(philippineDate(new Date('2026-11-08T15:59:59Z'))).toBe('2026-11-08');
  expect(philippineDate(new Date('2026-11-08T16:00:00Z'))).toBe('2026-11-09');
});

it('shifts report dates across month, year, and leap-day boundaries', () => {
  expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
  expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29');
  expect(shiftDate('2028-02-29', 1)).toBe('2028-03-01');
});
