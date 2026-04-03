import { z } from 'zod';
import axios from 'axios';

import { APIError } from '../abc/api-error';
import Member, { MemberSchema } from './member';

export default class AttendanceLog {
  constructor(
    public id: string,
    public memberId: string,
    public timestamp: string,
    public terminalMemberId: string,

    public member: Member,
    public attendance: string | null = null,
  ) {}

  static fromSchema(data: AttendanceLogResult) {
    return new AttendanceLog(
      data.id,
      data.memberId,
      data.timestamp,
      data.terminalMemberId,
      Member.fromSchema(data.member),
      data.attendance,
    );
  }

  static async createByFelicaIdm(felicaIdm: string): Promise<AttendanceLog> {
    try {
      const result = await axios.post(`/attendance-log/felica`, { felicaIdm });
      return AttendanceLog.fromSchema(AttendanceLogSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  // 学籍番号などから出欠を作成するためのヘルパー
  static async createByStudentId(studentId: string): Promise<AttendanceLog> {
    try {
      const result = await axios.post(`/attendance-log/studentid`, { studentId });
      return AttendanceLog.fromSchema(AttendanceLogSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}

export const AttendanceLogSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  timestamp: z.string(),
  terminalMemberId: z.string().uuid(),
  member: MemberSchema,
  attendance: z.string().nullish(),
});

export type AttendanceLogResult = z.infer<typeof AttendanceLogSchema>;
