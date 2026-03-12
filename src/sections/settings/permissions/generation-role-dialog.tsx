import type Grade from 'src/api/grade';

import { useState, useEffect } from 'react';

import {
  List,
  Button,
  Dialog,
  Checkbox,
  ListItem,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  DialogActions,
  DialogContent,
  ListItemButton,
  CircularProgress,
} from '@mui/material';

import { RbacRole, RbacGenerationRole } from 'src/api/rbac';

export function GenerationRoleDialog({
  open,
  onClose,
  grade,
  onSave,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  grade: Grade;
  /** @deprecated unused — dialog fetches keys directly */
  initialRoleKeys?: string[];
  onSave: (roleKeys: string[]) => Promise<void> | void;
  roles?: { id: string; key: string; displayName: string }[] | null;
}) {
  const [allRoles, setAllRoles] = useState<{ id: string; key: string; displayName: string }[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(function loadGenerationRoles() {
    if (!open) return undefined;

    let cancelled = false;
    setIsLoading(true);
    setSelectedKeys([]);

    const load = async () => {
      try {
        const roleList =
          roles && roles.length > 0
            ? roles
            : (await RbacRole.getAll()).map((r) => ({
                id: r.id,
                key: r.key,
                displayName: r.displayName,
              }));
        if (cancelled) return undefined;
        setAllRoles(roleList);

        const genRoleKeys = await RbacGenerationRole.get([grade]);
        if (cancelled) return undefined;

        const genKeySet = new Set(genRoleKeys.map((k) => String(k).trim().toLowerCase()));
        const matched = roleList
          .filter((r) => genKeySet.has(String(r.key).trim().toLowerCase()))
          .map((r) => r.key);
        setSelectedKeys(matched);
        return undefined;
      } catch (e) {
        console.error('GenerationRoleDialog failed to load', e);
        return undefined;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [open, grade, roles]);

  function toggle(roleKey: string) {
    setSelectedKeys(function updater(prev) {
      if (prev.includes(roleKey)) {
        return prev.filter((k) => k !== roleKey);
      }
      return [...prev, roleKey];
    });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(selectedKeys);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>学年ロールの編集 — {grade.displayName}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <List>
            {allRoles.map((r) => (
              <ListItem key={r.id} disablePadding>
                <ListItemButton onClick={() => toggle(r.key)}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedKeys.includes(r.key)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={r.displayName} secondary={r.key} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving} color="inherit" variant="outlined">
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          variant="contained"
          color="inherit"
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}