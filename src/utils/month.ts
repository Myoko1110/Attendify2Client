import dayjs, {Dayjs} from 'dayjs';

export class Month {
  public year: number;
  public month: number; // 0-11

  constructor(year: number, month: number) {
    if (month < 0 || month > 11) {
      throw new Error("Invalid month value: " + month);
    }

    this.year = year;
    this.month = month;
  }

  equals(other: Month): boolean {
    return this.year === other.year && this.month === other.month;
  }

  displayMonth(): number {
    return this.month + 1;
  }

  toString(): string {
    return `${this.year}-${this.displayMonth().toString().padStart(2, '0')}`;
  }

  displayName(): string {
    return `${this.displayMonth()}月`;
  }

  static now(): Month {
    const now = dayjs.tz();
    return new Month(now.year(), now.month());
  }

  static fromString(value: string): Month {
    const [year, month] = value.split('-').map(Number);
    return new Month(year, month - 1);
  }

  static fromDayjs(date: Dayjs): Month {
    return new Month(date.year(), date.month());
  }
}
