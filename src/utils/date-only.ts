import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

export class DateOnly {
  public year: number;
  public month: number; // 0-11
  public date: number;

  constructor(year: number, month: number, date: number) {
    if (month < 0 || month > 11) {
      throw new Error("Invalid month value: " + month);
    }
    if (date < 1 || date > 31) {
      throw new Error("Invalid date value: " + date);
    }

    this.year = year;
    this.month = month;
    this.date = date;
  }

  get displayMonth(): number {
    return this.month + 1;
  }

  equals(other: DateOnly): boolean {
    return this.year === other.year && this.month === other.month && this.date === other.date;
  }

  toString(): string {
    return `${this.year}-${this.displayMonth.toString().padStart(2, '0')}-${this.date.toString().padStart(2, '0')}`;
  }

  toDayjs(): Dayjs {
    return dayjs.utc([this.year, this.month, this.date]);
  }

  static fromDayjs(date: Dayjs): DateOnly {
    return new DateOnly(date.year(), date.month(), date.date());
  }
}