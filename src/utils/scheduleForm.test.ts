import {
  getScheduleFormError,
  normalizeScheduleDate,
  normalizeScheduleTime,
} from './scheduleForm';

const validForm = {
  title: 'TODA meeting',
  event_date: '2026-11-06',
  start_time: '09:00',
  end_time: '11:00',
  location: 'North terminal',
};

describe('normalizeScheduleDate', () => {
  it('accepts a real ISO date and trims whitespace', () => {
    expect(normalizeScheduleDate(' 2026-11-06 ')).toBe('2026-11-06');
  });

  it('rejects invalid dates and other formats', () => {
    expect(normalizeScheduleDate('2026-02-30')).toBeNull();
    expect(normalizeScheduleDate('11/06/2026')).toBeNull();
  });
});

describe('normalizeScheduleTime', () => {
  it.each([
    ['9:00', '09:00'],
    ['09:00', '09:00'],
    ['9:00 AM', '09:00'],
    ['12:30 PM', '12:30'],
    ['12:30 AM', '00:30'],
    ['1:45 PM', '13:45'],
    ['09:00:00', '09:00'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeScheduleTime(input)).toBe(expected);
  });

  it.each(['24:00', '09:60', '0:30 PM', '13:00 AM', 'noon'])(
    'rejects invalid time %s',
    (input) => {
      expect(normalizeScheduleTime(input)).toBeNull();
    },
  );
});

describe('getScheduleFormError', () => {
  it('identifies the specific missing or invalid field', () => {
    expect(getScheduleFormError({ ...validForm, title: ' ' })).toBe('Enter an event title.');
    expect(getScheduleFormError({ ...validForm, event_date: '11/06/2026' }))
      .toContain('YYYY-MM-DD');
    expect(getScheduleFormError({ ...validForm, start_time: '' }))
      .toContain('start time');
    expect(getScheduleFormError({ ...validForm, location: '' }))
      .toBe('Enter the event location.');
  });

  it('accepts valid 12-hour times and compares their normalized values', () => {
    expect(getScheduleFormError({
      ...validForm,
      start_time: '9:00 AM',
      end_time: '11:00 AM',
    })).toBeNull();
    expect(getScheduleFormError({
      ...validForm,
      start_time: '1:00 PM',
      end_time: '12:30 PM',
    })).toBe('The end time must be later than the start time.');
  });
});
