import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import axios from 'axios';
import dayjs from 'dayjs';

import { Month } from 'src/utils/month';
import { DateOnly } from 'src/utils/date-only';
import { parseDate, fDateBackend, parseDateTime } from 'src/utils/format-time';

import { APIError } from 'src/abc/api-error';

import Member from './member';

import type PreCheck from './pre-check';

// ----------------------------------------------------------------------

export default class PreAttendance {
  constructor(
    public id: string,
    public date: Dayjs,
    public memberId: string,
    public attendance: string,
    public reason: string | null,
    public preCheckId: string | null,
    public createdAt: Dayjs,
    public updateAt: Dayjs,
  ) {}

  static fromSchema(data: PreAttendanceResult) {
    return new PreAttendance(
      data.id,
      data.date,
      data.memberId,
      data.attendance,
      data.reason,
      data.preCheckId,
      parseDateTime(data.createdAt),
      parseDateTime(data.updatedAt),
    );
  }

  static async get({
    member,
    month,
    preCheck,
    date,
  }: {
    member?: Member;
    month?: Month;
    preCheck?: PreCheck;
    date?: Dayjs;
  } = {}): Promise<PreAttendance[]> {
    const params = new URLSearchParams();
    if (member) params.append('member_id', member.id);
    if (month) params.append('month', month.toString());
    if (preCheck) params.append('pre_check_id', preCheck.id);
    if (date) params.append('date', date.format('YYYY-MM-DD'));

    try {
      const result = await axios.get(`/pre-check/attendances`, { params });
      return PreAttendanceArraySchema.parse(result.data).map((data) =>
        PreAttendance.fromSchema(data),
      );
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async add(
    attendances: PreAttendanceArrayPost,
    overwrite: boolean = false,
  ): Promise<PreAttendance[]> {
    const body = PreAttendanceArrayPostSchema.parse(attendances);
    const params = new URLSearchParams({ overwrite: overwrite.toString() });

    try {
      const result = await axios.post(`/pre-check/attendances?${params}`, body, {
        headers: { 'content-type': 'application/json' },
      });
      return PreAttendanceArraySchema.parse(result.data).map((data) =>
        PreAttendance.fromSchema(data),
      );
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async update(attendance: string): Promise<boolean> {
    this.attendance = attendance;

    try {
      const result = await axios.patch(`/pre-check/attendance/${this.id}?attendance=${attendance}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async remove(): Promise<boolean> {
    try {
      const result = await axios.delete(`/pre-check/attendance/${this.id}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async bulkRemove(attendances: PreAttendance[]): Promise<boolean> {
    try {
      const ids = attendances.map((attendance) => attendance.id);
      const result = await axios.delete(`/pre-check/attendances`, {
        data: ids,
        headers: { 'content-type': 'application/json' },
      });
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

export const PreAttendanceSchema = z.object({
  id: z.string().uuid(),
  date: z.string().transform((date) => parseDate(date)),
  memberId: z.string().uuid(),
  attendance: z.string(),
  reason: z.string().nullable(),
  preCheckId: z.string().length(10).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const PreAttendanceArraySchema = z.array(PreAttendanceSchema);
export type PreAttendanceResult = z.infer<typeof PreAttendanceSchema>;

export const PreAttendancePostSchema = z
  .object({
    member: z.instanceof(Member).transform((member) => member.id),
    attendance: z.string(),
    reason: z.string().nullable(),
    date: z
      .any()
      .refine((val): val is Dayjs => dayjs.isDayjs(val))
      .transform((date) => fDateBackend(date)),
    preCheckId: z.string().length(10).nullable(),
  })
  .transform((data) => ({
    memberId: data.member,
    attendance: data.attendance,
    reason: data.reason,
    date: data.date,
    preCheckId: data.preCheckId,
  }));
export const PreAttendanceArrayPostSchema = z.array(PreAttendancePostSchema);

export type PreAttendancePost = z.input<typeof PreAttendancePostSchema>;
export type PreAttendanceArrayPost = z.input<typeof PreAttendanceArrayPostSchema>;
