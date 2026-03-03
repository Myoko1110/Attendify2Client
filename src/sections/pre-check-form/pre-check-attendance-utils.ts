import type Schedule from 'src/api/schedule';
import type { Dayjs, ConfigType } from 'dayjs';
import type { WeeklyParticipation } from 'src/api/member';

import dayjs from 'dayjs';

import ScheduleType from 'src/abc/schedule-type';

export const attendanceEventColors: Record<string, { color: string; textColor: string }> = {
  出席: { color: '#c7edd4', textColor: '#1B4332' },
  欠席: { color: '#F8D7DA', textColor: '#842029' },
  遅刻: { color: '#ffd9c2', textColor: '#7a4500' },
  早退: { color: '#ffecc2', textColor: '#7a5e00' },
  講習: { color: '#d8f0ff', textColor: '#0b5a6c' },
  仮退: { color: '#E7D9F7', textColor: '#4A148C' },
};

export const toDateKey = (value: ConfigType) => dayjs(value).format('YYYY-MM-DD');

const statusesWithoutReason = new Set(['出席', '講習']);
export const requiresReason = (status?: string | null) =>
  Boolean(status && !statusesWithoutReason.has(status));

const toWeekdayIndex = (date: Dayjs) => {
  const sundayBased = date.day();
  return sundayBased === 0 ? 6 : sundayBased - 1;
};

export const getDefaultAttendanceForDate = (
  schedule: Schedule,
  weeklyParticipations: WeeklyParticipation[],
) => {
  if (!schedule.type.equals(ScheduleType.WEEKDAY)) return null;

  const weekday = toWeekdayIndex(schedule.date);
  const wp = weeklyParticipations.find((item) => item.weekday === weekday && item.isActive);
  return wp?.defaultAttendance || null;
};
