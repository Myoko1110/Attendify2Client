import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import axios from 'axios';

import { Month } from 'src/utils/month';
import { DateOnly } from 'src/utils/date-only';
import { parseDate, fDateBackend } from 'src/utils/format-time';

import { APIError } from 'src/abc/api-error';
import ScheduleType from 'src/abc/schedule-type';

// ----------------------------------------------------------------------

export default class Schedule {
  constructor(
    public date: Dayjs,
    public type: ScheduleType,
  ) {}

  static fromSchema(data: SchedulesResult) {
    return data.map((item) => new Schedule(item.date, item.type));
  }

  static async get(): Promise<Schedule[]> {
    try {
      const result = await axios.get('/schedules');
      return Schedule.fromSchema(SchedulesSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async add(date: Dayjs, type: ScheduleType): Promise<boolean> {
    const params = new URLSearchParams({ date: fDateBackend(date), type: type.value });

    try {
      const result = await axios.post(`/schedule?${params}`);
      return result.data.result;
    } catch (e) {
      console.log(e)
      throw APIError.fromError(e);
    }
  }

  async update(type: ScheduleType): Promise<boolean> {
    this.type = type;
    return Schedule.add(this.date, type);
  }

  async remove(): Promise<boolean> {
    try {
      const result = await axios.delete(`/schedule/${fDateBackend(this.date)}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  get month(): Month {
    return new Month(this.date.year(), this.date.month());
  }

  get dateOnly(): DateOnly {
    return new DateOnly(this.date.year(), this.date.month(), this.date.date());
  }
}

export const SchedulesSchema = z
  .object({
    date: z.string().transform((date) => parseDate(date)),
    type: z.string().transform(ScheduleType.valueOf),
  })
  .array();
export type SchedulesResult = z.infer<typeof SchedulesSchema>;
