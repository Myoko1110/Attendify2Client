import { z } from 'zod';
import axios from 'axios';

import { DayOfWeek } from 'src/utils/day-of-week';

import Part from 'src/abc/part';
import Role from 'src/abc/role';
import { APIError } from 'src/abc/api-error';

import type Grade from './grade';

// ----------------------------------------------------------------------

export default class Member {
  constructor(
    public id: string,
    public part: Part,
    public generation: number,
    public name: string,
    public nameKana: string,
    public email: string | null,
    public role: Role,
    public lectureDay: DayOfWeek[],
    public isCompetitionMember: boolean,
  ) {}

  static fromSchema(data: MemberResult) {
    return new Member(
      data.id,
      data.part,
      data.generation,
      data.name,
      data.nameKana,
      data.email,
      data.role,
      data.lectureDay,
      data.isCompetitionMember,
    );
  }

  static async get(part?: Part, generation?: number): Promise<Member[]> {
    const params = new URLSearchParams();
    if (part) params.append('part', part.value);
    if (generation) params.append('generation', generation.toString());

    try {
      const result = await axios.get(`/members`, { params });
      return MemberArraySchema.parse(result.data).map((data) => Member.fromSchema(data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getSelf(): Promise<Member> {
    try {
      const result = await axios.get(`/member/self`);
      return Member.fromSchema(MemberSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async add(members: MemberArrayPost): Promise<boolean> {
    const body = MemberArrayPostSchema.parse(members);

    try {
      const result = await axios.post(`/members`, body, {
        headers: { 'content-type': 'application/json' },
      });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async addOne(member: MemberPost): Promise<Member> {
    const body = MemberPostSchema.parse(member);

    try {
      const result = await axios.post(`/member`, body);
      return Member.fromSchema(MemberSchema.parse(result.data));
    } catch (e) {
      console.log(e)
      throw APIError.fromError(e);
    }
  }

  async remove(): Promise<boolean> {
    try {
      const result = await axios.delete(`/member/${this.id}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async update(update: MemberUpdate): Promise<Member> {
    const body = MemberUpdateSchema.parse(update);

    try {
      await axios.patch(`/member/${this.id}`, body);

      const name = update.name || this.name;
      const nameKana = update.nameKana || this.nameKana;
      const part = update.part || this.part;
      const generation = update.generation || this.generation;
      const email = update.email || this.email;
      const role = update.role || this.role;
      const lectureDay = update.lectureDay || this.lectureDay;
      const isCompetitionMember = update.isCompetitionMember || this.isCompetitionMember;

      return new Member(this.id, part, generation, name, nameKana, email, role, lectureDay, isCompetitionMember);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  equals(other: Member): boolean {
    return this.id === other.id;
  }

  getGrade(grades: Grade[]): Grade | undefined {
    return grades.find((g) => g.generation === this.generation);
  }

  static async setCompetition(members: Member[], is_competition: boolean): Promise<boolean> {
    const ids = members.map((m) => m.id);
    try {
      const result = await axios.patch(
        `/member/competition/${is_competition}`,
        ids,
      );

      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  copy(): Member {
    return new Member(
      this.id,
      this.part,
      this.generation,
      this.name,
      this.nameKana,
      this.email,
      this.role,
      this.lectureDay,
      this.isCompetitionMember,
    );
  }
}

export const MemberSchema = z.object({
  id: z.string().uuid(),
  part: z.string().transform(Part.valueOf),
  generation: z.number().int(),
  name: z.string(),
  nameKana: z.string(),
  email: z.string().email().nullable(),
  role: z.string().transform(Role.valueOf),
  lectureDay: z.array(z.string()).transform((data) => data.map(DayOfWeek.valueOf).sort((a, b) => a.num > b.num ? 1 : -1)),
  isCompetitionMember: z.boolean(),
});
export const MemberArraySchema = z.array(MemberSchema);
type MemberResult = z.infer<typeof MemberSchema>;

export const MemberPostSchema = z.object({
  part: z.instanceof(Part).transform((part) => part.value),
  generation: z.number().int(),
  name: z.string(),
  nameKana: z.string(),
  email: z.string().email().or(z.literal('')).transform((email) => (email === '' ? null : email)),
  role: z.instanceof(Role).transform((role) => role.value),
  lectureDay: z.array(z.instanceof(DayOfWeek)).transform((data) => data.map((d) => d.value)),
  isCompetitionMember: z.boolean(),
});
export const MemberArrayPostSchema = z.array(MemberPostSchema);

export type MemberPost = z.input<typeof MemberPostSchema>;
export type MemberArrayPost = z.input<typeof MemberArrayPostSchema>;

export const MemberUpdateSchema = MemberPostSchema.partial();
export type MemberUpdate = z.input<typeof MemberUpdateSchema>;
