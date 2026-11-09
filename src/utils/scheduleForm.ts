import type { OrganizationEvent } from '@/types/schedule';

type ScheduleFormValues = Pick<
  OrganizationEvent,
  'title' | 'event_date' | 'start_time' | 'end_time' | 'location'
>;

export function normalizeScheduleDate(value: string): string | null {
  const date = value.trim();
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year
    || parsedDate.getMonth() !== month - 1
    || parsedDate.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function normalizeScheduleTime(value: string): string | null {
  const time = value.trim();
  const twentyFourHour = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = Number(twentyFourHour[2]);
    if (hour > 23 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const twelveHour = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!twelveHour) return null;

  const hour = Number(twelveHour[1]);
  const minute = Number(twelveHour[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;

  const normalizedHour = (hour % 12) + (twelveHour[3].toUpperCase() === 'PM' ? 12 : 0);
  return `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function getScheduleFormError(form: ScheduleFormValues): string | null {
  if (!form.title.trim()) return 'Enter an event title.';
  if (!normalizeScheduleDate(form.event_date)) return 'Enter the date as YYYY-MM-DD (for example, 2026-11-06).';
  if (!normalizeScheduleTime(form.start_time)) return 'Enter a valid start time, such as 09:00 or 9:00 AM.';
  if (!normalizeScheduleTime(form.end_time)) return 'Enter a valid end time, such as 11:00 or 11:00 AM.';
  if (!form.location.trim()) return 'Enter the event location.';

  const startTime = normalizeScheduleTime(form.start_time);
  const endTime = normalizeScheduleTime(form.end_time);
  if (startTime && endTime && endTime <= startTime) {
    return 'The end time must be later than the start time.';
  }

  return null;
}
