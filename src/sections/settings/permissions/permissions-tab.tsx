import React, { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ListItemButton from '@mui/material/ListItemButton';

import { useGrade } from 'src/hooks/grade';

import { Iconify } from 'src/components/iconify';

import { useMember } from '../../../hooks/member';
import { usePermissions } from './use-permissions';
import { GenerationRoleDialog } from './generation-role-dialog';

function getDomain(id: string) {
  return id.split(':')[0];
}

function SmallTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}
    >
      {String(children)}
    </Typography>
  );
}

// resolveImplied builds closure using adjacency map built from edges
function resolveImplied(selected: Set<string>, adjacency: Map<string, string[]>) {
  const result = new Set(selected);
  const stack = Array.from(selected);
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const children = adjacency.get(cur) || [];
    for (const c of children) {
      if (!result.has(c)) {
        result.add(c);
        stack.push(c);
      }
    }
  }
  return result;
}

export function PermissionsTab() {
  const self = useMember();
  const hasNotPermission = !!self.member && !self.member.hasPermission('rbac:manage');

  const {
    roles,
    permissions,
    isLoading,
    error,
    selectedRoleId,
    selectRole,
    rolePermissions,
    togglePermissionForRole,
    saveRolePermissions,
    isSaving,
    createRole,
    deleteRole,
    updateGenerationRoleKeys,
    permissionImplies,
  } = usePermissions();
  const grades = useGrade();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoleKey, setNewRoleKey] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<{
    id: string;
    displayName: string;
    key: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogGrade, setDialogGrade] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    if (!permissions)
      return {} as Record<string, { id: string; key: string; description: string }[]>;
    const g: Record<string, any[]> = {};
    for (const p of permissions) {
      const d = getDomain(p.key);
      if (!g[d]) g[d] = [];
      g[d].push({ id: p.id, key: p.key, description: p.description });
    }
    return g;
  }, [permissions]);

  const adjacency = useMemo(() => {
    const m = new Map<string, string[]>();
    if (!permissionImplies) return m;
    for (const edge of permissionImplies) {
      const p = (edge as any).parentKey;
      const c = (edge as any).childKey;
      if (!p || !c) continue;
      if (!m.has(p)) m.set(p, []);
      m.get(p)!.push(c);
    }
    return m;
  }, [permissionImplies]);

  const resolvedSet = useMemo(() => {
    if (!selectedRoleId) return new Set<string>();
    const direct = new Set(rolePermissions[selectedRoleId] || []);
    return resolveImplied(direct, adjacency);
  }, [rolePermissions, selectedRoleId, adjacency]);

  // compute implied-by mapping: for each permission key, which direct keys imply it
  const impliedBy = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!selectedRoleId) return map;
    const direct = new Set(rolePermissions[selectedRoleId] || []);
    // for each direct permission, DFS using adjacency
    for (const start of direct) {
      const stack = [start];
      const seen = new Set<string>([start]);
      while (stack.length > 0) {
        const cur = stack.pop()!;
        const children = adjacency.get(cur) || [];
        for (const child of children) {
          if (!seen.has(child)) {
            seen.add(child);
            stack.push(child);
            if (!direct.has(child)) {
              if (!map.has(child)) map.set(child, new Set());
              map.get(child)!.add(start);
            }
          }
        }
      }
    }
    return map;
  }, [rolePermissions, selectedRoleId, adjacency]);

  // filter grouped by search
  const filteredGrouped = useMemo(() => {
    if (!search) return grouped;
    const q = search.trim().toLowerCase();
    const next: Record<string, any[]> = {};
    for (const [domain, perms] of Object.entries(grouped)) {
      const filtered = perms.filter((p) => (p.key + ' ' + p.description).toLowerCase().includes(q));
      if (filtered.length > 0) next[domain] = filtered;
    }
    return next;
  }, [grouped, search]);

  if (hasNotPermission) {
    return <Typography>権限がありません</Typography>;
  }

  return (
    <>
      <Grid container spacing={3}>
        {/* Left column: roles (top) and generation roles (bottom) stacked vertically */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card>
              <CardHeader title={<SmallTitle>ロール</SmallTitle>} sx={{ px: 2, py: 1 }} />
              <Divider />
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="inherit"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => {
                      setNewRoleKey('');
                      setNewRoleDisplayName('');
                      setCreateDialogOpen(true);
                    }}
                    fullWidth
                  >
                    ロールを追加
                  </Button>
                </Box>
                {roles ? (
                  <List dense>
                    {roles.map((r) => (
                      <ListItem key={r.id} disablePadding>
                        <ListItemButton
                          selected={selectedRoleId === r.id}
                          onClick={() => selectRole(r.id)}
                          sx={{ borderRadius: 1, mt: 0.5 }}
                        >
                          <ListItemText primary={r.displayName} secondary={r.key} />
                          <IconButton
                            edge="end"
                            onClick={() => {
                              setDeletingRole({ id: r.id, displayName: r.displayName, key: r.key });
                              setDeleteDialogOpen(true);
                            }}
                            disabled={r.key === 'default' || r.key === 'admin'}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>ロールを読み込み中...</Typography>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={<SmallTitle>学年ロール</SmallTitle>} sx={{ px: 2, py: 1 }} />
              <Divider />
              <CardContent>
                {grades ? (
                  <Box>
                    {grades.map((g) => (
                      <Box
                        key={g.generation}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1,
                        }}
                      >
                        <Typography>{g.displayName}</Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setDialogGrade(g);
                            setDialogOpen(true);
                          }}
                          color="inherit"
                        >
                          編集
                        </Button>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography>学年データを読み込み中...</Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Center column: make permissions editor larger */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Card>
            <CardHeader title={<SmallTitle>権限</SmallTitle>} sx={{ px: 2, py: 1 }} />
            <Divider />
            <CardContent>
              {isLoading && <Typography>ロード中...</Typography>}
              {error && <Typography color="error">{String(error)}</Typography>}

              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="検索（キー/説明）"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 2,
                }}
              >
                {Object.entries(filteredGrouped).map(([domain, perms]) => (
                  <Card key={domain} variant="outlined" sx={{ p: 0 }}>
                    <CardHeader title={<SmallTitle>{domain}</SmallTitle>} sx={{ px: 2, py: 1 }} />
                    <Divider />
                    <CardContent>
                      {perms.map((perm) => {
                        const isSelected = selectedRoleId
                          ? (rolePermissions[selectedRoleId] || []).includes(perm.key)
                          : false;
                        const isImplied = !isSelected && resolvedSet.has(perm.key);
                        const origins = impliedBy.get(perm.key);
                        const originKeys = origins ? Array.from(origins) : [];
                        const checked = isSelected || isImplied;
                        const disabled = !selectedRoleId || isImplied;
                        return (
                          <Box
                            key={perm.key}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={disabled}
                              onChange={() =>
                                selectedRoleId && togglePermissionForRole(selectedRoleId, perm.key)
                              }
                            />
                            <Box
                              sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{perm.description}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Box sx={{ display: 'flex', mt: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="inherit"
                  disabled={!selectedRoleId || isSaving}
                  onClick={() => selectedRoleId && saveRolePermissions(selectedRoleId)}
                >
                  保存
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {dialogGrade && (
        <GenerationRoleDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          grade={dialogGrade}
          onSave={async (newKeys) => {
            await updateGenerationRoleKeys([dialogGrade], newKeys);
            setDialogOpen(false);
          }}
        />
      )}

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>ロールを追加</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="キー (key)"
            fullWidth
            value={newRoleKey}
            onChange={(e) => setNewRoleKey(e.target.value)}
            placeholder="例: admin"
            autoFocus
          />
          <TextField
            label="表示名"
            fullWidth
            value={newRoleDisplayName}
            onChange={(e) => setNewRoleDisplayName(e.target.value)}
            placeholder="例: 管理者"
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={() => setCreateDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="inherit"
            disabled={!newRoleKey.trim() || !newRoleDisplayName.trim()}
            onClick={async () => {
              await createRole({ key: newRoleKey.trim(), displayName: newRoleDisplayName.trim() });
              setCreateDialogOpen(false);
            }}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>
      {/* ロール削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>ロールを削除</DialogTitle>
        <Typography variant="body2" color="textSecondary" px="24px">
          このロールを本当に削除しますか？
        </Typography>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (deletingRole) {
                await deleteRole(deletingRole.id);
              }
              setDeleteDialogOpen(false);
            }}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
