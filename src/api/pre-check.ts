import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import axios from 'axios';
import dayjs from 'dayjs';

import { DateOnly } from 'src/utils/date-only';
import { parseDate, fDateBackend, parseDateTime, fDateTimeBackend } from 'src/utils/format-time';

import { APIError } from '../abc/api-error';
import PreAttendance from './pre-attendance';

export default class PreCheck {
  constructor(
    public id: string,
    public startDate: DateOnly,
    public endDate: DateOnly,
    public description: string,
    public deadline: Dayjs | null,
    public editDeadlineDays: number,
  ) {}

  static async get(id: string) {
    try {
      const result = await axios.get(`/pre-check/${id}`);
      return result.data ? PreCheck.fromSchema(preCheckSchema.parse(result.data)) : null;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getAll() {
    try {
      const result = await axios.get(`/pre-checks`);
      return preCheckSchema.array().parse(result.data).map(PreCheck.fromSchema);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async create(body: PreCheckPost) {
    try {
      console.log(body);
      const result = await axios.post(`/pre-check`, body, {
        headers: { 'content-type': 'application/json' },
      });
      return PreCheck.fromSchema(preCheckSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async remove() {
    try {
      const result = await axios.delete(`/pre-check/${this.id}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async update(body: PreCheckPost) {
    try {
      const result = await axios.patch(`/pre-check/${this.id}`, body, {
        headers: { 'content-type': 'application/json' },
      });
      return PreCheck.fromSchema(
        preCheckSchema.parse({
          id: this.id,
          startDate: result.data.startDate,
          endDate: result.data.endDate,
          description: result.data.description,
          deadline: result.data.deadline,
          editDeadlineDays: result.data.editDeadlineDays,
        }),
      );
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async getAttendances(): Promise<PreAttendance[]> {
    return PreAttendance.get({ preCheck: this });
  }

  static fromSchema(data: PreCheckResult) {
    return new PreCheck(
      data.id,
      DateOnly.fromDayjs(data.startDate),
      DateOnly.fromDayjs(data.endDate),
      data.description,
      data.deadline,
      data.editDeadlineDays,
    );
  }
}

export const preCheckSchema = z.object({
  id: z.string().length(10),
  startDate: z.string().transform((str) => parseDate(str)),
  endDate: z.string().transform((str) => parseDate(str)),
  description: z.string().max(256),
  deadline: z
    .string()
    .datetime()
    .nullable()
    .transform((str) => (str ? parseDateTime(str) : null)),
  editDeadlineDays: z.number().int().min(0),
});

export type PreCheckResult = z.infer<typeof preCheckSchema>;

export const preCheckPostSchema = z
  .object({
    startDate: z.custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid(), '必須項目です'),
    endDate: z.custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid(), '必須項目です'),
    description: z.string().max(256),
    deadline: z.union([z.custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid()), z.null()]),
    editDeadlineDays: z.number().int().min(0),
  })
  .transform((data) => ({
    startDate: fDateBackend(data.startDate),
    endDate: fDateBackend(data.endDate),
    description: data.description,
    deadline: data.deadline ? fDateTimeBackend(data.deadline) : null,
    editDeadlineDays: data.editDeadlineDays,
  }));
export type PreCheckPost = z.infer<typeof preCheckPostSchema>;
