import { calculateDurationSeconds, formatWorkDuration } from './dateFormatter';

describe('formatWorkDuration', () => {
  it('formats durations as hours and minutes when at least one hour', () => {
    expect(formatWorkDuration(3660)).toBe('1h 1m');
  });

  it('formats durations under one hour as minutes', () => {
    expect(formatWorkDuration(3540)).toBe('59m');
  });
});

describe('calculateDurationSeconds', () => {
  it('calculates elapsed seconds between timestamps', () => {
    expect(calculateDurationSeconds('2025-01-01T00:00:00Z', '2025-01-01T00:01:30Z')).toBe(90);
  });

  it('returns zero when either timestamp is missing', () => {
    expect(calculateDurationSeconds('2025-01-01T00:00:00Z')).toBe(0);
  });
});
