import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import axios from 'axios';

import { Month } from 'src/utils/month';
import { DateOnly } from 'src/utils/date-only';
import { parseDate, fDateBackend } from 'src/utils/format-time';

import { APIError } from 'src/abc/api-error';
import ScheduleType from 'src/abc/schedule-type';

import type Grade from './grade';

// ----------------------------------------------------------------------

export default class Schedule {
  constructor(
    public date: Dayjs,
    public type: ScheduleType,
    public target: string[] | null,
  ) {}

  static fromSchema(data: SchedulesResult) {
    return data.map((item) => new Schedule(item.date, item.type, item.target));
  }

  static async get(): Promise<Schedule[]> {
    try {
      const result = await axios.get('/schedules');
      return Schedule.fromSchema(SchedulesSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async add(date: Dayjs, type: ScheduleType, target: string[] | null): Promise<boolean> {
    const body = SchedulePostSchema.parse({date, type, target});

    try {
      const result = await axios.post('/schedule', body, {
        headers: { 'content-type': 'application/json' },
      });
      return result.data.result;
    } catch (e) {
      console.log(e)
      throw APIError.fromError(e);
    }
  }

  async update(type: ScheduleType, target: string[] | null): Promise<boolean> {
    this.type = type;
    return Schedule.add(this.date, type, target);
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

  getDisplayTarget(grade: Grade[]): string {
    const displays: string[] = [];
    this.target?.forEach((t) => {
      if (t.startsWith('g:')) {
        const generation = Number(t.substring(2));
        const g = grade.find((_g) => _g.generation === generation);
        if (g) {
          displays.push(g.displayName);
        }
      } else if (t.startsWith('c:')) {
        if (t === "c:Y") displays.push("コンクールメンバー")
        else displays.push("コンクールメンバー以外")
      }
    });

    return displays.join(",");
  }
}



export const SchedulesSchema = z
  .object({
    date: z.string().transform((date) => parseDate(date)),
    type: z.string().transform(ScheduleType.valueOf),
    target: z.string().array().nullable(),
  })
  .array();
export type SchedulesResult = z.infer<typeof SchedulesSchema>;

export const SchedulePostSchema = z.object({
  date: z.any().transform((date) => fDateBackend(date)),
  type: z.instanceof(ScheduleType).transform((type) => type.value),
  target: z.string().array().nullable(),
});
