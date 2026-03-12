import { z } from 'zod';
import axios from 'axios';

import { APIError } from 'src/abc/api-error';

import type Grade from './grade';



export class RbacPermission {
  constructor(
    public id: string,
    public key: string,
    public description: string,
  ) {}

  static async getImplies(): Promise<RbacPermissionImply[]> {
    try {
      const result = await axios.get(`/rbac/permissions/implies`);
      return RbacPermissionImplySchema.array().parse(result.data);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getAll(): Promise<RbacPermissionResult[]> {
    try {
      const result = await axios.get(`/rbac/permissions`);
      return RbacPermissionSchema.array().parse(result.data);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getRoles(permissionId: string) {
    try {
      const result = await axios.get(`/rbac/permissions/${permissionId}/roles`);
      return RbacRole.fromSchemaArray(RbacRoleSchema.array().parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async updateRoles(permissionId: string, roleIds: string[]) {
    try {
      const result = await axios.put(`/rbac/permissions/${permissionId}/roles`, { role_keys: roleIds });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}

export const RbacPermissionSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  description: z.string(),
});
export type RbacPermissionResult = z.infer<typeof RbacPermissionSchema>;

/** Schema for a single permission object (id, key, description) */
export const RbacPermissionItemSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  description: z.string(),
});
export type RbacPermissionItem = z.infer<typeof RbacPermissionItemSchema>;

/** Schema for an implies edge returned by GET /api/rbac/permissions/implies */
export const RbacPermissionImplySchema = z.object({
  parentKey: z.string(),
  childKey: z.string(),
});
export type RbacPermissionImply = z.infer<typeof RbacPermissionImplySchema>;


export class RbacRole {
  constructor(
    public id: string,
    public key: string,
    public displayName: string,
    public description: string,
  ) {}

  static fromSchema(data: RbacRoleResult) {
    return new RbacRole(data.id, data.key, data.displayName, data.description);
  }

  static fromSchemaArray(data: RbacRoleResult[]) {
    return data.map((item) => RbacRole.fromSchema(item));
  }

  static async getAll(): Promise<RbacRole[]> {
    try {
      const result = await axios.get(`/rbac/roles`);
      return RbacRole.fromSchemaArray(RbacRoleSchema.array().parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getMemberRoles(memberId: string): Promise<RbacRole[]> {
    try {
      const result = await axios.get(`/rbac/members/${memberId}/roles`);
      return RbacRole.fromSchemaArray(RbacRoleSchema.array().parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async updateMemberRoles(memberId: string, roles: RbacRole[]): Promise<boolean> {
    try {
      const result = await axios.put(`/rbac/members/${memberId}/roles`, {
        role_keys: roles.map((role) => role.id),
      });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getPermissions(roleKey: string) {
    try {
      const result = await axios.get(`/rbac/roles/${encodeURIComponent(roleKey)}/permissions`);
      return RbacPermissionItemSchema.array().parse(result.data);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  /**
   * メンバーが持つ全 permission key を取得する。
   * effectiveRoleKeys の各ロールに紐づく permission を並列取得して union を返す。
   */
  static async getMemberPermissionKeys(effectiveRoleKeys: string[]): Promise<string[]> {
    if (!effectiveRoleKeys || effectiveRoleKeys.length === 0) return [];
    try {
      const results = await Promise.all(
        effectiveRoleKeys.map((roleKey) => RbacRole.getPermissions(roleKey).catch(() => []))
      );
      const set = new Set<string>();
      results.flat().forEach((p) => set.add(p.key));
      return Array.from(set);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async updatePermissions(roleKey: string, permissionKeys: string[]) {
    try {
      const result = await axios.put(`/rbac/roles/${encodeURIComponent(roleKey)}/permissions`, { permission_keys: permissionKeys });
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async createRole(data: { key: string; displayName: string; description?: string }) {
    try {
      const result = await axios.post(`/rbac/roles`, data, {
        headers: {'content-type': 'application/json'}
      });
      return RbacRole.fromSchema(RbacRoleSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async updateRole(roleId: string, data: { displayName?: string; description?: string }) {
    try {
      // backend expects role_key in path for update; we accept roleKey or id here — use roleId as role_key if given
      const result = await axios.patch(`/rbac/roles/${encodeURIComponent(roleId)}`, data);
      return RbacRole.fromSchema(RbacRoleSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async deleteRole(roleId: string) {
    try {
      const result = await axios.delete(`/rbac/roles/${encodeURIComponent(roleId)}`);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}

export const RbacRoleSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  displayName: z.string(),
  description: z.string(),
});
export type RbacRoleResult = z.infer<typeof RbacRoleSchema>;


export class RbacGenerationRole {
  constructor(
    public generation: number,
    public roleKeys: string[],
  ) {}

  static async get(grades?: Grade[]): Promise<string[]> {
    try {
      if (!grades || grades.length === 0) {
        // return union of all generations
        const result = await axios.get(`/rbac/generations/roles`);
        const data: { generation: number; roleKeys: string[] }[] = result.data;
        const set = new Set<string>();
        data.forEach((d) => d.roleKeys?.forEach((k) => set.add(k)));
        return Array.from(set);
      }

      if (grades.length === 1) {
        const result = await axios.get(`/rbac/generations/${grades[0].generation}/roles`);
        const data: { generation: number; roleKeys: string[] } = result.data;
        return data.roleKeys ?? [];
      }

      // multiple generations: call with query params and merge
      const params = new URLSearchParams();
      grades.forEach((grade) => params.append('generations', grade.generation.toString()));
      const result = await axios.get(`/rbac/generations/roles?${params}`);
      const arr: { generation: number; roleKeys: string[] }[] = result.data;
      const set = new Set<string>();
      arr.forEach((d) => d.roleKeys?.forEach((k) => set.add(k)));
      return Array.from(set);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  async update(grades: Grade[] | undefined, roleKeys: string[]) {
    try {
      if (!grades || grades.length === 0) {
        // PUT multiple generations roles at once: send array payload per OpenAPI
        const payload = [{ generation: 0, role_keys: roleKeys }];
        const result = await axios.put(`/rbac/generations/roles`, payload);
        return result.data.result;
      }

      if (grades.length === 1) {
        const generation = grades[0].generation;
        const result = await axios.put(`/rbac/generations/${generation}/roles`, { role_keys: roleKeys });
        return result.data.result;
      }

      // multiple generations: construct array payload
      const payload = grades.map((g) => ({ generation: g.generation, role_keys: roleKeys }));
      const result = await axios.put(`/rbac/generations/roles`, payload);
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}