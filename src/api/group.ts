import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import axios from 'axios';

import { parseDateTime } from 'src/utils/format-time';

import { APIError } from 'src/abc/api-error';

import Member, { MemberArraySchema } from './member';

export default class Group {
  constructor(
    public id: string,
    public displayName: string,
    public createdAt: Dayjs,
  ) {}

  static fromSchema(data: GroupResult) {
    return new Group(data.id, data.displayName, data.createdAt);
  }

  static fromSchemaArray(data: GroupResult[]) {
    return data.map((item) => Group.fromSchema(item));
  }

  static async getAll(): Promise<Group[]> {
    try {
      const result = await axios.get(`/groups`);
      return Group.fromSchemaArray(GroupSchema.array().parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async create(displayName: string): Promise<Group> {
    try {
      const result = axios.post('/group', { displayName });
      return Group.fromSchema(GroupSchema.parse((await result).data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async remove(): Promise<boolean> {
    try {
      const result = await axios.delete(`/group/${this.id}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async rename(displayName: string): Promise<Group> {
    try {
      const result = await axios.put(
        `/group/${this.id}`,
        { displayName },
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      return new Group(this.id, displayName, this.createdAt);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async getMembers(): Promise<Member[]> {
    try {
      const result = await axios.get(`/group/${this.id}/members`);
      return MemberArraySchema.parse(result.data).map((data) => Member.fromSchema(data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async addMember(memberId: string): Promise<boolean> {
    try {
      const result = await axios.post(`/group/${this.id}/member/${memberId}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async addMembers(memberIds: string[]): Promise<boolean> {
    try {
      const result = await axios.post(`/group/${this.id}/members`, memberIds, {
        headers: { 'content-type': 'application/json' },
      });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async removeMember(memberId: string): Promise<boolean> {
    try {
      const result = await axios.delete(`/group/${this.id}/member/${memberId}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async removeMembers(memberIds: string[]): Promise<boolean> {
    try {
      const result = await axios.delete(`/group/${this.id}/members`, {
        data: memberIds,
        headers: { 'content-type': 'application/json' },
      });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}

export const GroupSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  createdAt: z
    .string()
    .transform((str) => parseDateTime(str)),
});
export type GroupResult = z.infer<typeof GroupSchema>;
