import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import axios from 'axios';

import { Month } from '../utils/month';
import { APIError } from '../abc/api-error';
import { parseDateTime } from '../utils/format-time';


export class AttendanceRate {
  constructor(
    public id: string,
    public targetType: string,
    public targetId: string | null,
    public _month: string,
    public rate: number | null,
    public actual: boolean,
    public updatedAt: Dayjs,
  ) {
  }

  static fromSchema(data: AttendanceRatesResult) {
    return data.map((item) => new AttendanceRate(item.id, item.targetType, item.targetId, item.month, item.rate, item.actual, item.updatedAt));
  }

  static async get(): Promise<AttendanceRate[]> {
    try {
      const result = await axios.get(`/attendance/rate`);
      return AttendanceRate.fromSchema(AttendanceRatesSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  get month(): Month {
    return Month.fromString(this._month);
  }
}

export const AttendanceRatesSchema = z
  .object({
    id: z.string(),
    targetType: z.string(),
    targetId: z.string().nullable(),
    month: z.string(),
    rate: z.number().nullable(),
    actual: z.boolean(),
    updatedAt: z.string().transform((str) => parseDateTime(str)),
  }).array();
export type AttendanceRatesResult = z.infer<typeof AttendanceRatesSchema>;