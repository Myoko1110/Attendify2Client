import type { RbacRoleResult, RbacPermissionResult } from 'src/api/rbac';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import { useGrade } from 'src/hooks/grade';

import { RbacRole, RbacPermission, RbacGenerationRole } from 'src/api/rbac';

export function usePermissions() {
  const [roles, setRoles] = useState<RbacRoleResult[] | null>(null);
  const [permissions, setPermissions] = useState<RbacPermissionResult[] | null>(null);
  const [permissionImplies, setPermissionImplies] = useState<{ parentKey: string; childKey: string; }[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const grades = useGrade();

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [roleList, permissionList, implies] = await Promise.all([RbacRole.getAll(), RbacPermission.getAll(), RbacPermission.getImplies()]);
      setRoles(roleList as unknown as RbacRoleResult[]);
      setPermissions(permissionList as unknown as RbacPermissionResult[]);
      setPermissionImplies(implies as unknown as { parentKey: string; childKey: string; }[]);
    } catch (err) {
      setError(err as Error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectRole = useCallback(async (roleId: string | null) => {
    setSelectedRoleId(roleId);
    if (!roleId) return;
    // fetch role permissions if not cached
    if (!rolePermissions[roleId]) {
      try {
        // find role key from cached roles
        let roleKey: string | undefined;
        roleKey = roles?.find((r) => r.id === roleId)?.key;
        if (!roleKey) {
          // try to refresh roles and retry
          try {
            const refreshed = await RbacRole.getAll();
            setRoles(refreshed as unknown as RbacRoleResult[]);
            roleKey = refreshed.find((r) => r.id === roleId)?.key;
          } catch (err) {
            console.error(err);
          }
        }
        // fallback: treat roleId as roleKey if still not found
        const keyToUse = roleKey ?? roleId;
        const perms = await RbacRole.getPermissions(keyToUse);
        setRolePermissions((prev) => ({ ...prev, [roleId]: perms.map((p) => p.key) }));
      } catch (err) {
        setError(err as Error);
        toast.error('ロールの権限取得に失敗しました');
      }
    }
  }, [rolePermissions, roles]);

  const togglePermissionForRole = useCallback((roleId: string, permissionKey: string) => {
    setRolePermissions((prev) => {
      const prevSet = new Set(prev[roleId] || []);
      if (prevSet.has(permissionKey)) prevSet.delete(permissionKey);
      else prevSet.add(permissionKey);
      return { ...prev, [roleId]: Array.from(prevSet) };
    });
  }, []);

  const saveRolePermissions = useCallback(async (roleId: string) => {
    setIsSaving(true);
    try {
      const keys = rolePermissions[roleId] || [];
      // resolve roleKey from roles cache
      let roleKey: string | undefined = roles?.find((r) => r.id === roleId)?.key;
      if (!roleKey) {
        try {
          const refreshed = await RbacRole.getAll();
          setRoles(refreshed as unknown as RbacRoleResult[]);
          roleKey = refreshed.find((r) => r.id === roleId)?.key;
        } catch (err) {
          console.error(err);
        }
      }
      const keyToUse = roleKey ?? roleId;
      await RbacRole.updatePermissions(keyToUse, keys);
      // refresh roles list
      const updated = await RbacRole.getAll();
      setRoles(updated as unknown as RbacRoleResult[]);
      toast.success('権限を保存しました');
    } catch (err) {
      setError(err as Error);
      toast.error('権限の保存に失敗しました');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [rolePermissions, roles]);

  const createRole = useCallback(async (data: { key: string; displayName: string; description?: string }) => {
    try {
      const created = await RbacRole.createRole(data);
      setRoles((prev) => (prev ? [created as unknown as RbacRoleResult, ...prev] : [created as unknown as RbacRoleResult]));
      toast.success('ロールを作成しました');
      return created;
    } catch (err) {
      setError(err as Error);
      toast.error('ロールの作成に失敗しました');
      throw err;
    }
  }, []);

  const updateRole = useCallback(async (roleId: string, data: { displayName?: string; description?: string }) => {
    try {
      // resolve roleKey from cache
      let roleKey: string | undefined = roles?.find((r) => r.id === roleId)?.key;
      if (!roleKey) {
        try {
          const refreshed = await RbacRole.getAll();
          setRoles(refreshed as unknown as RbacRoleResult[]);
          roleKey = refreshed.find((r) => r.id === roleId)?.key;
        } catch (err) {
          console.error(err);
        }
      }
      const keyToUse = roleKey ?? roleId;
      const updated = await RbacRole.updateRole(keyToUse, data);
      setRoles((prev) => prev ? prev.map((r) => (r.id === roleId ? updated as unknown as RbacRoleResult : r)) : [updated as unknown as RbacRoleResult]);
      toast.success('ロールを更新しました');
      return updated;
    } catch (err) {
      setError(err as Error);
      toast.error('ロールの更新に失敗しました');
      throw err;
    }
  }, [roles]);

  const deleteRole = useCallback(async (roleId: string) => {
    try {
      // resolve roleKey from cache
      let roleKey: string | undefined = roles?.find((r) => r.id === roleId)?.key;
      if (!roleKey) {
        try {
          const refreshed = await RbacRole.getAll();
          setRoles(refreshed as unknown as RbacRoleResult[]);
          roleKey = refreshed.find((r) => r.id === roleId)?.key;
        } catch (err) {
          console.error(err);
        }
      }
      const keyToUse = roleKey ?? roleId;
      await RbacRole.deleteRole(keyToUse);
      setRoles((prev) => prev ? prev.filter((r) => r.id !== roleId) : null);
      // remove cached permissions
      setRolePermissions((prev) => {
        const next = { ...prev };
        delete next[roleId];
        return next;
      });
      if (selectedRoleId === roleId) setSelectedRoleId(null);
      toast.success('ロールを削除しました');
    } catch (err) {
      setError(err as Error);
      toast.error('ロールの削除に失敗しました');
      throw err;
    }
  }, [selectedRoleId, roles]);

  const getGenerationRoleKeys = useCallback(async (gradesParam?: typeof grades) => {
    try {
      const g = gradesParam ?? grades ?? undefined;
      return await RbacGenerationRole.get(g || undefined);
    } catch (err) {
      setError(err as Error);
      toast.error('世代ロールの取得に失敗しました');
      throw err;
    }
  }, [grades]);

  const updateGenerationRoleKeys = useCallback(async (gradesParam: typeof grades | undefined, roleKeys: string[]) => {
    const gen = new RbacGenerationRole(0, []);
    try {
      const safeGrades = gradesParam == null ? undefined : (gradesParam as any);
      const res = await gen.update(safeGrades, roleKeys);
      toast.success('世代ロールを更新しました');
      return res;
    } catch (err) {
      setError(err as Error);
      toast.error('世代ロールの更新に失敗しました');
      throw err;
    }
  }, []);

  return {
    roles,
    permissions,
    isLoading,
    error,
    refetch: fetchAll,

    // role selection and permission editing
    selectedRoleId,
    selectRole,
    rolePermissions,
    togglePermissionForRole,
    saveRolePermissions,
    isSaving,

    // role CRUD
    createRole,
    updateRole,
    deleteRole,

    // generation role management
    getGenerationRoleKeys,
    updateGenerationRoleKeys,
    // permission implies edges
    permissionImplies,
  } as const;
}