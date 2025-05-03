import type { Dayjs } from 'dayjs';
import type Part from 'src/abc/part';

import { z } from 'zod';
import axios from 'axios';
import dayjs from 'dayjs';

import { Month } from 'src/utils/month';
import { DateOnly } from 'src/utils/date-only';
import Attendances from 'src/utils/attendances';
import { parseDate, fDateBackend, parseDateTime } from 'src/utils/format-time';

import { APIError } from 'src/abc/api-error';

import Member, { MemberSchema } from './member';

// ----------------------------------------------------------------------

export default class Attendance {
  constructor(
    public id: string,
    public date: Dayjs,
    public attendance: string,
    public createdAt: Dayjs,
    public updatedAt: Dayjs,
    public member: Member,
  ) {}

  static fromSchema(data: AttendanceResult) {
    return new Attendance(
      data.id,
      data.date,
      data.attendance,
      data.createdAt,
      data.updatedAt,
      Member.fromSchema(data.member),
    );
  }

  static async get(part?: Part, generation?: number, date?: Dayjs): Promise<Attendances> {
    const params = new URLSearchParams();
    if (part) params.append('part', part.value);
    if (generation) params.append('generation', generation.toString());
    if (date) params.append('date', date.format('YYYY-MM-DD'));

    try {
      const result = await axios.get(`/attendances`, { params });
      return new Attendances(...AttendanceArraySchema.parse(result.data).map((data) => Attendance.fromSchema(data)));
    } catch (e) {
      console.log(e);
      throw APIError.fromError(e);
    }
  }

  static async add(attendances: AttendanceArrayPost): Promise<boolean> {
    const body = AttendanceArrayPostSchema.parse(attendances);

    try {
      const result = await axios.post(`/attendances`, body, {
        headers: { 'content-type': 'application/json' },
      });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async addOne(attendance: AttendancePost): Promise<Attendance> {
    const body = AttendancePostSchema.parse(attendance);

    try {
      const result = await axios.post(`/attendance`, body);
      return Attendance.fromSchema(AttendanceSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async update(attendance: string): Promise<boolean> {
    this.attendance = attendance;

    try {
      const result = await axios.patch(`/attendance/${this.id}?attendance=${attendance}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async remove(): Promise<boolean> {
    try {
      const result = await axios.delete(`/attendance/${this.id}`);
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

export const AttendanceSchema = z.object({
  id: z.string().uuid(),
  date: z.string().transform((date) => parseDate(date)),
  attendance: z.string(),
  createdAt: z.string().transform((date) => parseDateTime(date)),
  updatedAt: z.string().transform((date) => parseDateTime(date)),
  member: MemberSchema,
});
export const AttendanceArraySchema = z.array(AttendanceSchema);
export type AttendanceResult = z.infer<typeof AttendanceSchema>;

export const AttendancePostSchema = z.object({
  member: z.instanceof(Member).transform((member) => member.id),
  attendance: z.string(),
  date: z.any().refine((val): val is Dayjs => dayjs.isDayjs(val)).transform((date) => fDateBackend(date)),
}).transform((data) => ({
  memberId: data.member,
  attendance: data.attendance,
  date: data.date,
}));
export const AttendanceArrayPostSchema = z.array(AttendancePostSchema);

export type AttendancePost = z.input<typeof AttendancePostSchema>;
export type AttendanceArrayPost = z.input<typeof AttendanceArrayPostSchema>;
