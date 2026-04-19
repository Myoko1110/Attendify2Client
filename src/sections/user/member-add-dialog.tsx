import { toast } from 'sonner';
import { useState } from 'react';
import { z, ZodError } from 'zod';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Dialog,
  Select,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions, FormHelperText,
} from '@mui/material';

import { DayOfWeek } from 'src/utils/day-of-week';

import Part from 'src/abc/part';
import Role from 'src/abc/role';
import Member from 'src/api/member';
import { APIError } from 'src/abc/api-error';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  setMembers: React.Dispatch<React.SetStateAction<Member[] | null>>;
};

const MemberPostSchema = z.object({
  name: z.string().nonempty('必須項目です'),
  nameKana: z.string().nonempty('必須項目です'),
  part: z.string().nonempty('必須項目です').transform(Part.valueOf),
  role: z.string().transform(Role.valueOf),
  studentid: z.string().nullable().transform((str) => str ? Number(str) : null),
  email: z.string().email('メールアドレスの形式が正しくありません').or(z.literal('')),
  generation: z.number().min(1, '必須項目です'),
  lectureDay: z
    .string()
    .array()
    .transform((days) => days.map(DayOfWeek.valueOf)),
  isCompetitionMember: z.boolean(),
  felicaIdm: z.string().nullable(),
});


const initialErrorMsg = {
  name: '',
  nameKana: '',
  part: '',
  role: '',
  studentid: '',
  generation: '',
  email: '',
}


export function MemberAddDialog({ open, setOpen, setMembers }: Props) {
  const [name, setName] = useState('');
  const [nameKana, setNameKana] = useState('');
  const [part, setPart] = useState('');
  const [role, setRole] = useState('member');
  const [studentid, setStudentId] = useState('');
  const [generation, setGeneration] = useState('');
  const [email, setEmail] = useState('');
  const [lectureDay, setLectureDay] = useState<string[]>([]);
  const [isCompetitionMember, setIsCompetitionMember] = useState(false);

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
    setName('');
    setNameKana('');
    setPart('');
    setRole('member');
    setStudentId('');
    setGeneration('');
    setEmail('');
    setLectureDay([]);
    setIsCompetitionMember(false);
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
        felicaIdm: null,
        studentid,
      });

      handleClose();

      const m = await Member.addOne(parsedMember);
      setMembers((prev): Member[] => [...prev!, m]);

      toast.success("登録しました");

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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>部員を登録</DialogTitle>
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
