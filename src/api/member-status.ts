import { z } from 'zod';
import axios from 'axios';

import { APIError } from '../abc/api-error';

export default class MembershipStatus {
  constructor(
    public id: string,
    public displayName: string,
    public isAttendanceTarget: boolean,
    public defaultAttendance: string | null,
  ) {
  }

  static fromSchema(data: MembershipStatusSchemaResult) {
    return new MembershipStatus(
      data.id,
      data.displayName,
      data.isAttendanceTarget,
      data.defaultAttendance,
    );
  }

  static fromSchemaArray(data: MembershipStatusSchemaResult[]) {
    return data.map((item) => MembershipStatus.fromSchema(item));
  }

  static async getAll(): Promise<MembershipStatus[]> {
    try {
      const result = await axios.get(`/membership_statuses`);
      return MembershipStatus.fromSchemaArray(MembershipStatusSchema.array().parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async create(displayName: string, isAttendanceTarget: boolean, defaultAttendance: string): Promise<MembershipStatus> {
    const body = MembershipStatusPostSchema.parse({ displayName, isAttendanceTarget, defaultAttendance });

    try {
      const result = await axios.post('/membership_status', body, {
        headers: { 'content-type': 'application/json' },
      });
      return MembershipStatus.fromSchema(MembershipStatusSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async remove(): Promise<boolean> {
    try {
      const result = await axios.delete(`/membership_status/${this.id}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}


export const MembershipStatusSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  isAttendanceTarget: z.boolean(),
  defaultAttendance: z.string().nullable(),
});
export type MembershipStatusSchemaResult = z.infer<typeof MembershipStatusSchema>;

export const MembershipStatusPostSchema = z.object({
  displayName: z.string(),
  isAttendanceTarget: z.boolean(),
  defaultAttendance: z.string().nullable(),
});
