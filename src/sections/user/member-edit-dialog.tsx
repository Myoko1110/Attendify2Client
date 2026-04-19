import { toast } from 'sonner';
import { z, ZodError } from 'zod';
import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Box,
  Dialog,
  Select,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  OutlinedInput,
  FormHelperText,
} from '@mui/material';

import { DayOfWeek } from 'src/utils/day-of-week';

import Part from 'src/abc/part';
import Role from 'src/abc/role';
import Member from 'src/api/member';
import { RbacRole } from 'src/api/rbac';
import { APIError } from 'src/abc/api-error';

type Props = {
  member: Member,
  open: boolean;
  setOpen: (open: boolean) => void;
  setGroups: React.Dispatch<React.SetStateAction<Member[] | null>>;
};

const MemberPostSchema = z.object({
  name: z.string().nonempty('必須項目です'),
  nameKana: z.string().nonempty('必須項目です'),
  part: z.string().nonempty('必須項目です').transform(Part.valueOf),
  role: z.string().transform(Role.valueOf),
  studentid: z.string().nullable().transform((str) => (str ? Number(str) : null)),
  email: z.string().email('メールアドレスの形式が正しくありません').or(z.literal('')),
  generation: z.number().min(1, '必須項目です'),
  lectureDay: z.string().array().transform((days) => days.map(DayOfWeek.valueOf)),
  isCompetitionMember: z.boolean(),
});

const initialErrorMsg = {
  name: '',
  nameKana: '',
  part: '',
  role: '',
  studentid: '',
  generation: '',
  email: '',
};

export function MemberEditDialog({ member, open, setOpen, setGroups }: Props) {
  const [name, setName] = useState(member.name);
  const [nameKana, setNameKana] = useState(member.nameKana);
  const [part, setPart] = useState(member.part.value);
  const [studentid, setStudentId] = useState(member.studentid?.toString() || '');
  const [generation, setGeneration] = useState(member.generation.toString());
  const [email, setEmail] = useState(member.email || '');
  const [lectureDay, setLectureDay] = useState<string[]>(member.lectureDay.map((w) => w.value));
  const [isCompetitionMember, setIsCompetitionMember] = useState(member.isCompetitionMember);
  const [allRoles, setAllRoles] = useState<RbacRole[]>([]);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);

  const [errorMsg, setErrorMsg] = useState({ ...initialErrorMsg });

  const tryAutoFillStudentIdFromEmail = (value: string) => {
    // Manual input or existing value takes precedence over assist behavior.
    if (studentid) return;

    const localPart = value.trim().split('@')[0];
    if (localPart.length < 8) return;

    const head8 = localPart.slice(0, 8);
    if (!/^\d{8}$/.test(head8)) return;

    setStudentId(head8);
  };

  const reset = () => {
    setName(member.name);
    setNameKana(member.nameKana);
    setPart(member.part.value);
    setStudentId(member.studentid?.toString() || '');
    setGeneration(member.generation.toString());
    setEmail(member.email || '');
    setLectureDay(member.lectureDay.map((w) => w.value));
    setIsCompetitionMember(member.isCompetitionMember);
    setSelectedRoleKeys([]);
    resetErrorMsg();
  };

  const resetErrorMsg = () => {
    setErrorMsg({ ...initialErrorMsg });
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async () => {
    resetErrorMsg();
    try {
      const parsedMember = MemberPostSchema.parse({
        name,
        nameKana,
        part,
        // legacy role is still required by current member update API; keep existing value
        role: member.role?.value || 'member',
        studentid,
        email,
        generation: generation ? Number(generation) : 0,
        lectureDay,
        isCompetitionMember,
      });

      const updatedProfile = await member.update(parsedMember);
      const selectedRoles = allRoles.filter((roleItem) => selectedRoleKeys.includes(roleItem.key));
      await RbacRole.updateMemberRoles(member.id, selectedRoles);

      const refreshed = (await Member.get({ includeGroups: true, includeWeeklyParticipation: true, includeStatusPeriods: true, includeRoles: true }))
        .find((m) => m.id === member.id);
      const newMember = refreshed ?? updatedProfile;
      newMember.effectiveRoleKeys = selectedRoleKeys;

      setGroups((prev) => {
        const index = prev!.indexOf(member);
        const updated = [...prev!];
        updated[index] = newMember;
        return updated;
      });

      handleClose();
      toast.success('更新しました');
    } catch (e) {
      if (e instanceof ZodError) {
        const nextErrorMsg = e.errors.reduce(
          (p: typeof errorMsg, issue) => {
            p[issue.path[0] as keyof typeof errorMsg] = issue.message;
            return p;
          },
          { ...initialErrorMsg }
        );
        setErrorMsg(nextErrorMsg);
      } else {
        toast.error(APIError.createToastMessage(e));
      }
    }
  };

  useEffect(() => {
    setName(member.name);
    setNameKana(member.nameKana);
    setPart(member.part.value);
    setStudentId(member.studentid?.toString() || '');
    setGeneration(member.generation.toString());
    setEmail(member.email || '');
    setLectureDay(member.lectureDay.map((w) => w.value));
    setIsCompetitionMember(member.isCompetitionMember);
    setSelectedRoleKeys([]);
    setErrorMsg({ ...initialErrorMsg });
  }, [member]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [roles, memberRoles] = await Promise.all([
          RbacRole.getAll(),
          RbacRole.getMemberRoles(member.id),
        ]);
        setAllRoles(roles);
        setSelectedRoleKeys(memberRoles.map((r) => r.key));
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
      }
    })();
  }, [open, member.id]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>部員を編集</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="氏名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              autoFocus
              fullWidth
              error={!!errorMsg.name}
              helperText={errorMsg.name}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="ふりがな"
              value={nameKana}
              onChange={(e) => setNameKana(e.target.value)}
              type="text"
              fullWidth
              error={!!errorMsg.nameKana}
              helperText={errorMsg.nameKana}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormControl error={!!errorMsg.part} fullWidth>
              <InputLabel>パート</InputLabel>
              <Select label="パート" value={part} onChange={(e) => setPart(e.target.value)}>
                {Part.SELECTS.map((p) => (
                  <MenuItem value={p.value} key={p.value}>
                    {p.enShort}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errorMsg.part}</FormHelperText>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              label="学年"
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
              type="number"
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">期</InputAdornment>,
                },
              }}
              fullWidth
              error={!!errorMsg.generation}
              helperText={errorMsg.generation}
            />
          </Grid>

          <Grid size={{ xs: 8 }}>
            <TextField
              label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => tryAutoFillStudentIdFromEmail(e.target.value)}
              type="email"
              fullWidth
              error={!!errorMsg.email}
              helperText={errorMsg.email}
            />
          </Grid>

          <Grid size={{ xs: 4 }}>
            <TextField
              label="学籍番号"
              value={studentid}
              onChange={(e) => setStudentId(e.target.value)}
              type="number"
              fullWidth
              error={!!errorMsg.studentid}
              helperText={errorMsg.studentid}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>ロール</InputLabel>
              <Select
                multiple
                value={selectedRoleKeys}
                onChange={(e) =>
                  setSelectedRoleKeys(
                    typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                  )
                }
                input={<OutlinedInput label="ロール" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(selected as string[]).map((roleKey) => (
                      <Chip
                        key={roleKey}
                        size="small"
                        label={allRoles.find((r) => r.key === roleKey)?.displayName || roleKey}
                      />
                    ))}
                  </Box>
                )}
              >
                {allRoles.map((r) => (
                  <MenuItem value={r.key} key={r.id}>
                    {r.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          キャンセル
        </Button>
        <Button variant="contained" color="inherit" onClick={handleSubmit}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
