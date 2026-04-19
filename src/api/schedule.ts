import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import dayjs from 'dayjs';
import axios from 'axios';

import { Month } from 'src/utils/month';
import { DateOnly } from 'src/utils/date-only';
import { parseDate, parseTime, fDateBackend, fTimeBackend } from 'src/utils/format-time';

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
    public isPreAttendanceTarget: boolean,
    public startTime: Dayjs | null = null,
    public endTime: Dayjs | null = null,
  ) {}

  static fromSchema(data: SchedulesResult) {
    return data.map(
      (item) =>
        new Schedule(
          item.date,
          item.type,
          item.generations,
          item.groups,
          item.excludeGroups,
          item.isPreAttendanceTarget,
          item.startTime,
          item.endTime,
        ),
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
    excludeGroups: string[] | null,
    isPreAttendanceTarget: boolean,
    startTime: Dayjs | null = null,
    endTime: Dayjs | null = null,
  ): Promise<boolean> {
    const body = SchedulePostSchema.parse({
      date,
      type,
      generations,
      groups,
      excludeGroups,
      isPreAttendanceTarget,
      startTime,
      endTime,
    });

    try {
      const result = await axios.post('/schedule', body, {
        headers: { 'content-type': 'application/json' },
      });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async update(
    type: ScheduleType,
    generations: number[] | null,
    groups: string[] | null,
    excludeGroups: string[] | null,
    isPreAttendanceTarget: boolean,

    startTime: Dayjs | null = null,
    endTime: Dayjs | null = null,
  ): Promise<boolean> {
    this.type = type;
    return Schedule.add(
      this.date,
      type,
      generations,
      groups,
      excludeGroups,
      isPreAttendanceTarget,
      startTime,
      endTime,
    );
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
      const group = groups.find((g) => g.id === t)?.displayName;
      if (group) displays.push(group);
    });
    this.excludeGroups?.forEach((t) => {
      const group = groups.find((g) => g.id === t)?.displayName;
      if (group) displays.push(`${group}以外`);
    });

    if (this.generations && this.generations.length > 0) {
      const labelByType: Record<string, string> = {
        senior: '高校生',
        junior: '中学生',
      };
      const selectedGenerations = new Set(this.generations);
      const gradeByGeneration = new Map(grade.map((gr) => [gr.generation, gr]));
      const summarizeTypes = new Set<string>();

      Object.entries(labelByType).forEach(([type]) => {
        const generationsByType = grade
          .filter((gr) => gr.type === type)
          .map((gr) => gr.generation);
        const hasAll =
          generationsByType.length > 0 &&
          generationsByType.every((gen) => selectedGenerations.has(gen));
        if (hasAll) summarizeTypes.add(type);
      });

      const emittedSummaryTypes = new Set<string>();
      this.generations.forEach((generation) => {
        const matchedGrade = gradeByGeneration.get(generation);
        if (!matchedGrade) return;

        if (summarizeTypes.has(matchedGrade.type)) {
          if (emittedSummaryTypes.has(matchedGrade.type)) return;
          displays.push(labelByType[matchedGrade.type]);
          emittedSummaryTypes.add(matchedGrade.type);
          return;
        }

        displays.push(matchedGrade.displayName);
      });
    }

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
    isPreAttendanceTarget: z.boolean(),
    startTime: z
      .string()
      .nullable()
      .transform((time) => (time ? parseTime(time) : null)),
    endTime: z
      .string()
      .nullable()
      .transform((time) => (time ? parseTime(time) : null)),
  })
  .array();
export type SchedulesResult = z.infer<typeof SchedulesSchema>;

export const SchedulePostSchema = z.object({
  date: z
    .custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid())
    .transform((date) => fDateBackend(date)),
  type: z.instanceof(ScheduleType).transform((type) => type.value),
  generations: z.number().array().nullable(),
  groups: z.string().array().nullable(),
  excludeGroups: z.string().array().nullable(),
  isPreAttendanceTarget: z.boolean(),
  startTime: z
    .custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid())
    .nullable()
    .transform((time) => (time ? fTimeBackend(time) : null)),
  endTime: z
    .custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid())
    .nullable()
    .transform((time) => (time ? fTimeBackend(time) : null)),
});
