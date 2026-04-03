import type { Dayjs } from 'dayjs';

import { z } from 'zod';
import dayjs from 'dayjs';
import axios from 'axios';

import { DayOfWeek } from 'src/utils/day-of-week';

import Part from 'src/abc/part';
import Role from 'src/abc/role';
import { APIError } from 'src/abc/api-error';

import Group, { GroupSchema } from './group';
import { getStatusAt } from '../utils/get-status-at';
import MembershipStatus, { MembershipStatusSchema } from './member-status';
import { parseDate, fDateBackend, parseDateTime } from '../utils/format-time';

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
    public felicaIdm?: string | null,
    public groups?: Group[],
    public weeklyParticipations?: WeeklyParticipation[],
    public membershipStatusPeriods?: MembershipStatusPeriod[],
    /** サーバーが解決した有効ロールキー一覧（include_roles=true 時に取得） */
    public effectiveRoleKeys?: string[],
    public memberRoleKeys?: string[],
    /** クライアントが解決した有効 permission key 一覧 */
    public effectivePermissionKeys?: string[],
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
      data.felicaIdm,
      data.groups ? Group.fromSchemaArray(data.groups) : undefined,
      data.weeklyParticipations ? data.weeklyParticipations : undefined,
      data.membershipStatusPeriods ? data.membershipStatusPeriods : undefined,
      data.effectiveRoleKeys ? data.effectiveRoleKeys : undefined,
      data.memberRoleKeys ? data.memberRoleKeys : undefined,
      data.effectivePermissionKeys ? data.effectivePermissionKeys : undefined,
    );
  }

  static async get({
    part,
    generation,
    includeGroups = false,
    includeWeeklyParticipation = false,
    includeStatusPeriods = false,
    includeRoles = false,
  }: {
    part?: Part;
    generation?: number;
    includeGroups?: boolean;
    includeWeeklyParticipation?: boolean;
    includeStatusPeriods?: boolean;
    includeRoles?: boolean;
  } = {}): Promise<Member[]> {
    const params = new URLSearchParams();
    if (part) params.append('part', part.value);
    if (generation) params.append('generation', generation.toString());
    if (includeGroups) params.append('include_groups', 'true');
    if (includeWeeklyParticipation) params.append('include_weekly_participation', 'true');
    if (includeStatusPeriods) params.append('include_status_periods', 'true');
    if (includeRoles) params.append('include_roles', 'true');

    try {
      const result = await axios.get(`/members`, { params });
      return MemberArraySchema.parse(result.data).map((data) => Member.fromSchema(data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getSelf({
    includeGroups = false,
    includeWeeklyParticipation = false,
    includeStatusPeriods = false,
    includeRoles = true,
  }: {
    includeGroups?: boolean;
    includeWeeklyParticipation?: boolean;
    includeStatusPeriods?: boolean;
    includeRoles?: boolean;
  } = {}): Promise<Member> {
    const params = new URLSearchParams();
    if (includeGroups) params.append('include_groups', 'true');
    if (includeWeeklyParticipation) params.append('include_weekly_participation', 'true');
    if (includeStatusPeriods) params.append('include_status_periods', 'true');
    if (includeRoles) params.append('include_roles', 'true');

    try {
      const result = await axios.get(`/member/self?${params}`);
      return Member.fromSchema(MemberSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getByFelicaIdm({
    felicaIdm,
    includeGroups = false,
    includeWeeklyParticipation = false,
    includeStatusPeriods = false,
  }: {
    felicaIdm: string;
    includeGroups?: boolean;
    includeWeeklyParticipation?: boolean;
    includeStatusPeriods?: boolean;
  }): Promise<Member | null> {
    const params = new URLSearchParams();
    if (includeGroups) params.append('include_groups', 'true');
    if (includeWeeklyParticipation) params.append('include_weekly_participation', 'true');
    if (includeStatusPeriods) params.append('include_status_periods', 'true');

    try {
      const result = await axios.get(`/member/idm/${encodeURI(felicaIdm)}?${params}`);
      return result.data ? Member.fromSchema(MemberSchema.parse(result.data)) : null;
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
      const felicaIdm = update.felicaIdm || this.felicaIdm;

      return new Member(
        this.id,
        part,
        generation,
        name,
        nameKana,
        email,
        role,
        lectureDay,
        isCompetitionMember,
        felicaIdm,
        this.groups,
        this.weeklyParticipations,
      );
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

  statusAt(date?: Dayjs | Date): MembershipStatusPeriod | null {
    return getStatusAt(this.membershipStatusPeriods, date);
  }

  /**
   * ダッシュボードへのアクセス権限をチェック。
   * effectivePermissionKeys に 'dashboard:access' が含まれる場合はアクセス可能。
   * effectivePermissionKeys が未解決の場合は旧来の役職・学年判定にフォールバックする。
   */
  canAccessDashboard(): boolean {
    // permission key による判定（auth-loader で解決済みの場合）
    if (this.effectivePermissionKeys != null) {
      return this.effectivePermissionKeys.includes('dashboard:access');
    }
    throw Error('EffectivePermissionKeys is not resolved');
  }

  hasPermission(permission: string): boolean {
    return this.effectivePermissionKeys?.includes(permission) ?? false;
  }

  async getWeeklyParticipation(): Promise<WeeklyParticipation[]> {
    try {
      const result = await axios.get(`/member/${this.id}/weekly_participation`);
      return WeeklyParticipationSchema.array().parse(result.data);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async setWeeklyParticipation(participation: WeeklyParticipationPost): Promise<boolean> {
    const body = WeeklyParticipationPostSchema.parse(participation);

    this.weeklyParticipations = this.weeklyParticipations!.map((wp) => {
      if (wp.weekday === participation.weekday) {
        wp.defaultAttendance = participation.defaultAttendance;
        wp.isActive = participation.isActive;
      }
      return wp;
    });

    try {
      const result = await axios.post(`/member/${this.id}/weekly_participation`, body);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async getStatuses(): Promise<MembershipStatusPeriod[]> {
    try {
      const result = await axios.get(`/member/${this.id}/statuses`);
      return MembershipStatusPeriodSchema.array().parse(result.data);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async createStatus(data: MembershipStatusPeriodPostFront): Promise<MembershipStatusPeriod> {
    const body = MembershipStatusPeriodPostSchema.parse(data);
    try {
      const result = await axios.post(`/member/${this.id}/status`, body, {
        headers: { 'content-type': 'application/json' },
      });
      return MembershipStatusPeriodSchema.parse(result.data);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async removeStatus(statusPeriodId: string): Promise<boolean> {
    try {
      const result = await axios.delete(`/member/statuses/${statusPeriodId}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async updateStatus(
    statusPeriodId: string,
    data: MembershipStatusPeriodPostFront,
  ): Promise<boolean> {
    try {
      const body = MembershipStatusPeriodPostSchema.parse({
        statusId: data.statusId,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      const result = await axios.patch(`/member/statuses/${statusPeriodId}`, body, {
        headers: { 'content-type': 'application/json' },
      });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async getGroups(): Promise<Group[]> {
    try {
      const result = await axios.get(`/member/${this.id}/groups`);
      return Group.fromSchemaArray(GroupSchema.array().parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async setCompetition(members: Member[], isCompetition: boolean): Promise<boolean> {
    const ids = members.map((m) => m.id);
    try {
      const result = await axios.patch(`/member/competition/${isCompetition}`, ids);

      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async setRetired(members: Member[], isRetired: boolean): Promise<boolean> {
    const ids = members.map((m) => m.id);
    try {
      const result = await axios.patch(`/member/retired/${isRetired}`, ids);

      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async bulkAddMembershipStatusPeriod(
    members: Member[],
    data: MembershipStatusPeriodPostFront,
  ) {
    const body = MembershipStatusPeriodPostSchema.parse(data);
    try {
      const result = await axios.post(
        '/member/statuses',
        {
          memberIds: members.map((m) => m.id),
          statusPeriod: body,
        },
        { headers: { 'content-type': 'application/json' } },
      );
      return MembershipStatusPeriodSchema.array().parse(result.data);
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
      this.felicaIdm,
      this.groups ? [...this.groups] : undefined,
      this.weeklyParticipations ? [...this.weeklyParticipations] : undefined,
      this.membershipStatusPeriods ? [...this.membershipStatusPeriods] : undefined,
    );
  }
}

export const WeeklyParticipationPostSchema = z.object({
  weekday: z.number().int().min(0).max(6), // 0=Mon, 1=Tue, ..., 6=Sun
  defaultAttendance: z.string().nullable(),
  isActive: z.boolean(),
});
export type WeeklyParticipationPost = z.infer<typeof WeeklyParticipationPostSchema>;

export const WeeklyParticipationSchema = WeeklyParticipationPostSchema.extend({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
});
export type WeeklyParticipation = z.infer<typeof WeeklyParticipationSchema>;

export const MemberPostSchema = z.object({
  part: z.instanceof(Part).transform((part) => part.value),
  generation: z.number().int(),
  name: z.string(),
  nameKana: z.string(),
  email: z
    .string()
    .email()
    .or(z.literal(''))
    .transform((email) => (email === '' ? null : email)),
  role: z.instanceof(Role).transform((role) => role.value),
  lectureDay: z.array(z.instanceof(DayOfWeek)).transform((data) => data.map((d) => d.value)),
  isCompetitionMember: z.boolean(),
  felicaIdm: z.string().nullable(),
  studentid: z.number().int().nullable(),
});
export const MemberArrayPostSchema = z.array(MemberPostSchema);

export type MemberPost = z.input<typeof MemberPostSchema>;
export type MemberArrayPost = z.input<typeof MemberArrayPostSchema>;

export const MemberUpdateSchema = MemberPostSchema.partial();
export type MemberUpdate = z.input<typeof MemberUpdateSchema>;

export const MembershipStatusPeriodPostSchema = z.object({
  statusId: z.string().uuid(),
  startDate: z
    .custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid())
    .transform((date) => fDateBackend(date)),
  endDate: z
    .custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid())
    .transform((date) => fDateBackend(date)),
});
export type MembershipStatusPeriodPost = z.infer<typeof MembershipStatusPeriodPostSchema>;

export const MembershipStatusPeriodSchema = z.object({
  id: z.string().uuid(),
  statusId: z.string().uuid(),
  startDate: z.string().transform((date) => parseDate(date)),
  endDate: z.string().transform((date) => parseDate(date)),
  createdAt: z
    .string()
    .transform((date) => parseDateTime(date)),
  memberId: z.string().uuid(),
  status: MembershipStatusSchema.transform(MembershipStatus.fromSchema),
});
export type MembershipStatusPeriod = z.infer<typeof MembershipStatusPeriodSchema>;

export const MembershipStatusPeriodPostSchemaFront = z.object({
  statusId: z.string().uuid().nonempty('必須項目です'),
  startDate: z.custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid(), '必須項目です'),
  endDate: z.custom<Dayjs>((val) => dayjs.isDayjs(val) && val.isValid(), '必須項目です'),
});
export type MembershipStatusPeriodPostFront = z.infer<typeof MembershipStatusPeriodPostSchemaFront>;

export const MemberSchema = z.object({
  id: z.string().uuid(),
  part: z.string().transform(Part.valueOf),
  generation: z.number().int(),
  name: z.string(),
  nameKana: z.string(),
  email: z.string().email().nullable(),
  role: z.string().transform(Role.valueOf),
  studentid: z.number().int().nullable(),
  lectureDay: z
    .array(z.string())
    .transform((data) => data.map(DayOfWeek.valueOf).sort((a, b) => (a.num > b.num ? 1 : -1))),
  isCompetitionMember: z.boolean(),
  felicaIdm: z.string().nullable(),
  groups: GroupSchema.array().nullish(),
  weeklyParticipations: WeeklyParticipationSchema.array().nullish(),
  membershipStatusPeriods: MembershipStatusPeriodSchema.array().nullish(),
  effectiveRoleKeys: z.array(z.string()).nullish(),
  memberRoleKeys: z.array(z.string()).nullish(),
  effectivePermissionKeys: z.array(z.string()).nullish(),
});
export const MemberArraySchema = z.array(MemberSchema);
type MemberResult = z.infer<typeof MemberSchema>;
