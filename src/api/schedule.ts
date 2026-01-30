import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import axios from 'axios';

import { Month } from 'src/utils/month';
import { DateOnly } from 'src/utils/date-only';
import { parseDate, fDateBackend } from 'src/utils/format-time';

import { APIError } from 'src/abc/api-error';
import ScheduleType from 'src/abc/schedule-type';

import type Group from './group';
import type Grade from './grade';

// ----------------------------------------------------------------------

export default class Schedule {
  constructor(
    public date: Dayjs,
    public type: ScheduleType,
    public generations: number[] | null,
    public groups: string[] | null,
    public excludeGroups: string[] | null,
  ) {}

  static fromSchema(data: SchedulesResult) {
    return data.map(
      (item) =>
        new Schedule(item.date, item.type, item.generations, item.groups, item.excludeGroups),
    );
  }

  static async get(): Promise<Schedule[]> {
    try {
      const result = await axios.get('/schedules');
      return Schedule.fromSchema(SchedulesSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async add(
    date: Dayjs,
    type: ScheduleType,
    generations: number[] | null,
    groups: string[] | null,
    exclude_groups: string[] | null,
  ): Promise<boolean> {
    const body = SchedulePostSchema.parse({ date, type, generations, groups, exclude_groups });

    try {
      const result = await axios.post('/schedule', body, {
        headers: { 'content-type': 'application/json' },
      });
      return result.data.result;
    } catch (e) {
      console.log(e);
      throw APIError.fromError(e);
    }
  }

  async update(
    type: ScheduleType,
    generations: number[] | null,
    groups: string[] | null,
    exclude_groups: string[] | null,
  ): Promise<boolean> {
    this.type = type;
    return Schedule.add(this.date, type, generations, groups, exclude_groups);
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

  getDisplayTarget(grade: Grade[], groups: Group[]): string {
    const displays: string[] = [];
    this.groups?.forEach((t) => {
      const group = groups.find((g) => g.id === t)?.displayName
      if (group) displays.push(group);
    });
    this.excludeGroups?.forEach((t) => {
      const group = groups.find((g) => g.id === t)?.displayName
      if (group) displays.push(`${group}以外`);
    });
    this.generations?.forEach((g) => {
      const gradeName = grade.find((gr) => gr.generation === g)?.displayName;
      if (gradeName) displays.push(gradeName);
    });

    return displays.join(', ');
  }
}

export const SchedulesSchema = z
  .object({
    date: z.string().transform((date) => parseDate(date)),
    type: z.string().transform(ScheduleType.valueOf),
    generations: z.number().array().nullable(),
    groups: z.string().array().nullable(),
    excludeGroups: z.string().array().nullable(),
  })
  .array();
export type SchedulesResult = z.infer<typeof SchedulesSchema>;

export const SchedulePostSchema = z.object({
  date: z.any().transform((date) => fDateBackend(date)),
  type: z.instanceof(ScheduleType).transform((type) => type.value),
  generations: z.number().array().nullable(),
  groups: z.string().array().nullable(),
  exclude_groups: z.string().array().nullable(),
});
