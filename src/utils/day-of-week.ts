import type { Dayjs } from 'dayjs';

export class DayOfWeek {
  static readonly MON = new DayOfWeek("mon", "月", 0);
  static readonly TUE = new DayOfWeek("tue", "火", 1);
  static readonly WED = new DayOfWeek("wed", "水", 2);
  static readonly THU = new DayOfWeek("thu", "木", 3);
  static readonly FRI = new DayOfWeek("fri", "金", 4);
  static readonly SAT = new DayOfWeek("sat", "土", 5);
  static readonly SUN = new DayOfWeek("sun", "日", 6);

  static readonly ALL = [
    DayOfWeek.MON,
    DayOfWeek.TUE,
    DayOfWeek.WED,
    DayOfWeek.THU,
    DayOfWeek.FRI,
    DayOfWeek.SAT,
    DayOfWeek.SUN,
  ];

  static readonly ALL_LECTURE_DAYS = [
    DayOfWeek.MON,
    DayOfWeek.TUE,
    DayOfWeek.THU,
    DayOfWeek.FRI,
    DayOfWeek.SAT,
  ]

  isSameDay(date: Dayjs): boolean {
    return DayOfWeek.dayjsToWeekdayIndex(date) === this.num;
  }

  equals(other: DayOfWeek): boolean {
    return this.num === other.num;
  }

  constructor(public value: string, public jp: string, public num: number) {}

  static valueOf(value: string): DayOfWeek {
    const week = DayOfWeek.ALL.find((day) => day.value === value);
    if (week) return week;
    throw new Error(`Invalid day of week: ${value}`);
  }

  static valueOfNum(num: number): DayOfWeek {
    const week = DayOfWeek.ALL.find((day) => day.num === num);
    if (week) return week;
    throw new Error(`Invalid day of week number: ${num}`);
  }

  static fromDayjs(date: Dayjs): DayOfWeek {
    return DayOfWeek.ALL.find((day) => day.isSameDay(date))!;
  }

  static dayjsToWeekdayIndex(date: Dayjs): number {
    return (date.day() + 6) % 7;
  }
}