import type { Dayjs } from 'dayjs';
import type { MembershipStatusPeriod } from 'src/api/member';

import dayjs from 'dayjs';


export function getStatusAt(statuses: MembershipStatusPeriod[] | undefined, date?: Dayjs | Date): MembershipStatusPeriod | null {
  if (!statuses || statuses.length === 0)
    return null;
  const targetDate = date ? date : dayjs();

  const statusPeriod = statuses.find(
    (sp) =>
      (sp.startDate.isBefore(targetDate, 'date') || sp.startDate.isSame(targetDate, 'date')) &&
      (sp.endDate.isAfter(targetDate, 'date') || sp.endDate.isSame(targetDate, 'date')),
  );

  return statusPeriod ? statusPeriod : null;
}