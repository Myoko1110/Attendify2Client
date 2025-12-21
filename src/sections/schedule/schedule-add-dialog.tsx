import type { Dayjs } from 'dayjs';

import { toast } from 'sonner';
import { useState } from 'react';

import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import {
  Stack,
  Button,
  Dialog,
  DialogTitle,
  FormControl,
  ToggleButton,
  DialogActions,
  FormHelperText, ToggleButtonGroup,
} from '@mui/material';

import Schedule from 'src/api/schedule';
import ScheduleType from 'src/abc/schedule-type';

import { useGrade } from '../../hooks/grade';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  date?: Dayjs;
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
}

export function ScheduleAddDialog({open, setOpen, date, setSchedules}: Props) {
  const grade = useGrade();

  const [scheduleType, setScheduleType] = useState<string | null>(null);
  const [targetGrade, setTargetGrade] = useState<string[]>([]);
  const [targetCompetition, setTargetCompetition] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setError(false);
    setScheduleType(null);
    setTargetGrade([]);
    setTargetCompetition(null);
  }

  const handleSubmit = async () => {
    if (!date) return;

    setError(false);
    if (!scheduleType) {
      setError(true);
      return;
    }

    handleClose();

    const trg: string[] = [];
    if (targetGrade) trg.push(...targetGrade);
    if (targetCompetition) trg.push(targetCompetition);

    const type = ScheduleType.valueOf(scheduleType);
    await Schedule.add(date, type, trg.length === 0 ? null : trg);
    toast.success("追加しました")
    setSchedules((prev) => ([...prev, new Schedule(date, type, trg.length === 0 ? null : trg)]));
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ padding: '24px', mb: 1 }}>
        予定を追加: {date && date.month() + 1}月{date?.date()}日
      </DialogTitle>
        <Stack direction="column" gap={1} px={2}>
          <FormControl>
            <ToggleButtonGroup
              value={scheduleType}
              onChange={(e, v) => setScheduleType(v)}
              exclusive
              fullWidth
              >
              <ToggleButton
                value="weekday"
                sx={(theme) => ({
                  bgcolor: theme.palette.info.lighter,
                    '&:hover': { bgcolor: theme.palette.info.lighter },
                  '&.Mui-selected': {
                    bgcolor: theme.palette.info.main,
                      '&:hover': { bgcolor: theme.palette.info.main },
                  },
                })}
              >
                平日
              </ToggleButton>
              <ToggleButton
                value="morning"
                sx={(theme) => ({
                  bgcolor: theme.palette.success.lighter,
                  '&:hover': { bgcolor: theme.palette.success.lighter },
                  '&.Mui-selected': {
                    bgcolor: theme.palette.success.main,
                    '&:hover': { bgcolor: theme.palette.success.main },
                  },
                })}
              >
                午前
              </ToggleButton>
              <ToggleButton
                value="afternoon"
                sx={(theme) => ({
                  bgcolor: theme.palette.warning.lighter,
                  '&:hover': { bgcolor: theme.palette.warning.lighter },
                  '&.Mui-selected': {
                    bgcolor: theme.palette.warning.main,
                    '&:hover': { bgcolor: theme.palette.warning.main },
                  },
                })}
              >
                午後
              </ToggleButton>
              <ToggleButton
                value="allday"
                sx={(theme) => ({
                  bgcolor: theme.palette.error.lighter,
                  '&:hover': { bgcolor: theme.palette.error.lighter },
                  '&.Mui-selected': {
                    bgcolor: theme.palette.error.main,
                    color: 'white',
                    '&:hover': { bgcolor: theme.palette.error.main },
                  },
                })}
              >
                一日
              </ToggleButton>
              <ToggleButton
                value="other"
                sx={(theme) => ({
                  bgcolor: theme.palette.grey[200],
                  '&:hover': { bgcolor: theme.palette.grey[300] },
                  '&.Mui-selected': {
                    bgcolor: theme.palette.grey[800],
                    color: 'white',
                    '&:hover': { bgcolor: theme.palette.grey[800] },
                  },
                })}
              >
                その他
              </ToggleButton>
            </ToggleButtonGroup>
            <FormHelperText error>{error && "必須項目です"}</FormHelperText>
          </FormControl>


          <Divider sx={{ mt: 3 }}>
            <Typography variant="button">限定</Typography>
          </Divider>

            <ToggleButtonGroup
              fullWidth
              onChange={(_, val) => setTargetGrade(val)}
              value={targetGrade}
            >
              {grade?.map((g) => (
                <ToggleButton
                  key={g.generation}
                  value={`g:${g.generation}`}
                >
                  {g.displayName}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
              <Typography variant="subtitle2">コンクールメンバー</Typography>
              <ToggleButtonGroup
                sx={{ flex: 1 }}
                onChange={(_, val) => setTargetCompetition(val)}
                value={targetCompetition}
                exclusive
              >
                <ToggleButton value="c:Y" fullWidth>のみ</ToggleButton>
                <ToggleButton value="c:N" fullWidth>以外</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
        </Stack>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          キャンセル
        </Button>
        <Button variant="contained" color="inherit" onClick={handleSubmit}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  )
}