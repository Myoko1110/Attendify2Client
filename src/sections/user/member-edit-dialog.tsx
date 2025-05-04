import type Member from 'src/api/member';

import { toast } from 'sonner';
import { z, ZodError } from 'zod';
import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Dialog,
  Select,
  InputLabel,
  DialogTitle,
  FormControl,
  ToggleButton,
  DialogContent,
  DialogActions,
  FormHelperText,
  FormControlLabel,
  ToggleButtonGroup,
} from '@mui/material';

import { DayOfWeek } from 'src/utils/day-of-week';

import Part from 'src/abc/part';
import Role from 'src/abc/role';
import { APIError } from 'src/abc/api-error';

type Props = {
  member: Member,
  open: boolean;
  setOpen: (open: boolean) => void;
  setMembers: React.Dispatch<React.SetStateAction<Member[] | null>>;
};

const MemberPostSchema = z.object({
  name: z.string().nonempty('必須項目です'),
  nameKana: z.string().nonempty('必須項目です'),
  part: z.string().nonempty('必須項目です').transform(Part.valueOf),
  role: z.enum(['member', 'exec', 'part', 'officer']).transform(Role.valueOf),
  email: z.string().email('メールアドレスの形式が正しくありません').or(z.literal("")),
  generation: z.number().min(1, '必須項目です'),
  lectureDay: z.string().array().transform((days) => days.map(DayOfWeek.valueOf)),
  isCompetitionMember: z.boolean(),
});


const initialErrorMsg = {
  name: '',
  nameKana: '',
  part: '',
  role: '',
  generation: '',
  email: '',
}


export function MemberEditDialog({ member, open, setOpen, setMembers }: Props) {
  const [name, setName] = useState(member.name);
  const [nameKana, setNameKana] = useState(member.nameKana);
  const [part, setPart] = useState(member.part.value);
  const [role, setRole] = useState(member.role?.value || 'member');
  const [generation, setGeneration] = useState(member.generation.toString());
  const [email, setEmail] = useState(member.email || "");
  const [lectureDay, setLectureDay] = useState<string[]>(member.lectureDay.map((w) => w.value));
  const [isCompetitionMember, setIsCompetitionMember] = useState(member.isCompetitionMember);

  const [errorMsg, setErrorMsg] = useState({ ...initialErrorMsg });

  const reset = () => {
    setName(member.name);
    setNameKana(member.nameKana);
    setPart(member.part.value);
    setRole(member.role?.value || 'member');
    setGeneration(member.generation.toString());
    setEmail(member.email || "");
    setLectureDay(member.lectureDay.map((w) => w.value));
    setIsCompetitionMember(member.isCompetitionMember);
    
    resetErrorMsg();
  };

  const resetErrorMsg = () => {
    setErrorMsg({ ...initialErrorMsg });
  }

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
        role,
        email,
        generation: generation ? Number(generation) : 0,
        lectureDay,
        isCompetitionMember,
      });

      handleClose();

      const newMember = await member.update(parsedMember);
      setMembers((prev) => {
        const index = prev!.indexOf(member);
        const updated = [...prev!];
        updated[index] = newMember;
        return updated;
      });
      toast.success("更新しました");

    } catch (e) {
      if (e instanceof ZodError) {
        const _errorMsg = e.errors.reduce(
          (p: typeof errorMsg, issue) => {
            p[issue.path[0] as keyof typeof errorMsg] = issue.message;
            return p;
          }, { ...initialErrorMsg }
        )
        setErrorMsg(_errorMsg);
      } else {
        toast.error(APIError.createToastMessage(e));
      }
    }
  };

  useEffect(() => {
    reset();
  }, [member]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
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

          <Grid size={{ xs: 4 }}>
            <FormControl error={!!errorMsg.part} fullWidth>
              <InputLabel>パート</InputLabel>
              <Select label="パート" value={part} onChange={(e) => setPart(e.target.value)}>
                {Part.COMMON.map((p) => (
                  <MenuItem value={p.value} key={p.value}>{p.enShort}</MenuItem>
                ))}
              </Select>
              <FormHelperText>{errorMsg.part}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormControl error={!!errorMsg.role} fullWidth>
              <InputLabel>役職</InputLabel>
              <Select label="役職" value={role} onChange={(e) => setRole(e.target.value)}>
                <MenuItem value="member">部員</MenuItem>
                <MenuItem value="exec">執行部</MenuItem>
                <MenuItem value="part">パートリーダー</MenuItem>
                <MenuItem value="officer">出欠係</MenuItem>
              </Select>
              <FormHelperText>{errorMsg.role}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 4 }}>
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

          <Grid size={{ xs: 12 }}>
            <TextField
              label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              fullWidth
              error={!!errorMsg.email}
              helperText={errorMsg.email}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <Typography variant="caption">講習</Typography>
              <ToggleButtonGroup
                value={lectureDay}
                onChange={(e, val) => setLectureDay(val)}
                fullWidth
              >
                {DayOfWeek.ALL_LECTURE_DAYS.map((week) => (
                  <ToggleButton value={week.value}>
                    {week.jp}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Checkbox checked={isCompetitionMember} onChange={(e) => setIsCompetitionMember(e.target.checked)} />}
              label="コンクールメンバー"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          キャンセル
        </Button>
        <Button variant="contained" color="inherit" onClick={handleSubmit}>
          登録
        </Button>
      </DialogActions>
    </Dialog>
  );
}
