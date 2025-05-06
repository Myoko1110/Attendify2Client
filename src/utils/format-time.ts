import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import arraySupport from 'dayjs/plugin/arraySupport';

// ----------------------------------------------------------------------

/**
 * @Docs
 * https://day.js.org/docs/en/display/format
 */

/**
 * Default timezones
 * https://day.js.org/docs/en/timezone/set-default-timezone#docsNav
 *
 */

/**
 * UTC
 * https://day.js.org/docs/en/plugin/utc
 * @install
 * import utc from 'dayjs/plugin/utc';
 * dayjs.extend(utc);
 * @usage
 * dayjs().utc().format()
 *
 */

export const defaultTimezone = import.meta.env.VITE_TIMEZONE;

dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(arraySupport)

dayjs.locale('ja');
dayjs.tz.setDefault(defaultTimezone);

// ----------------------------------------------------------------------

export type DatePickerFormat = Dayjs | Date | string | number | null | undefined;

export const formatPatterns = {
  dateTime: 'DD MMM YYYY h:mm a', // 17 Apr 2022 12:00 am
  date: 'DD MMM YYYY', // 17 Apr 2022
  time: 'h:mm a', // 12:00 am
  split: {
    dateTime: 'DD/MM/YYYY h:mm a', // 17/04/2022 12:00 am
    date: 'DD/MM/YYYY', // 17/04/2022
  },
  paramCase: {
    dateTime: 'DD-MM-YYYY h:mm a', // 17-04-2022 12:00 am
    date: 'DD-MM-YYYY', // 17-04-2022
  },
  backend: {
    dateTime: 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ',
    date: 'YYYY-MM-DD',
  },
};

const isValidDate = (date: DatePickerFormat) =>
  date !== null && date !== undefined && dayjs(date).isValid();

// ----------------------------------------------------------------------

/**
 * @output 17 Apr 2022 12:00 am
 */
export function fDateTime(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.dateTime);
}

// ----------------------------------------------------------------------

/**
 * @output 17 Apr 2022
 */
export function fDate(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.date);
}

// ----------------------------------------------------------------------

/**
 * @output a few seconds, 2 years
 */
export function fToNow(date: DatePickerFormat): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).toNow(true);
}

// ----------------------------------------------------------------------

export function parseDateTime(date: string) {
  const parsedDateTime = dayjs.utc(date, undefined, true);
  if (!parsedDateTime.isValid()) {
    throw new Error(`Invalid date format: ${date}`);
  }
  return parsedDateTime;
}

export function parseDate(date: string) {
  const parsedDate = dayjs.tz(date);

  if (!parsedDate.isValid()) {
    throw new Error(`Invalid date format: ${date}`);
  }
  return parsedDate;
}

export function fDateTimeBackend(datetime: Dayjs) {
  if (!datetime.isValid()) {
    throw Error('Invalid datetime value');
  }
  return datetime.utc().format(formatPatterns.backend.dateTime);
}

export function fDateBackend(date: Dayjs) {
  if (!date.isValid()) {
    throw Error('Invalid date value');
  }
  return date.tz().format(formatPatterns.backend.date);
}
