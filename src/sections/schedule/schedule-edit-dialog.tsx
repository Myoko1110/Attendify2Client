import { toast } from 'sonner';
import { useState, useEffect } from 'react';

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
  ToggleButtonGroup,
} from '@mui/material';

import { useGrade } from 'src/hooks/grade';

import Schedule from 'src/api/schedule';
import ScheduleType from 'src/abc/schedule-type';


type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  schedule?: Schedule;
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
};

export function ScheduleEditDialog({ open, setOpen, schedule, setSchedules }: Props) {
  const grade = useGrade();
  const [scheduleType, setScheduleType] = useState<string | null>(schedule?.type.value || null);

  const [targetGrade, setTargetGrade] = useState<string[] | null>(null);

  const [targetCompetition, setTargetCompetition] = useState<string | null>(null);

  useEffect(() => {
    if (schedule?.target) {
      const filteredGrade = schedule.target.filter((s) => s.startsWith('g:'));
      setTargetGrade(filteredGrade);

      const filteredCompetition = schedule.target.find((s) => s.startsWith('c:'));
      if (filteredCompetition) {
        setTargetCompetition(filteredCompetition);
      }
    } else {
      setTargetGrade(null);
      setTargetCompetition(null);
    }
  }, [schedule]);

  useEffect(() => {
    setScheduleType(schedule?.type.value || null);
  }, [schedule]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!schedule) return;
    setOpen(false);

    const trg: string[] = [];
    if (targetGrade) trg.push(...targetGrade);
    if (targetCompetition) trg.push(targetCompetition);

    const type = ScheduleType.valueOf(scheduleType!)

    await schedule.update(type, trg.length === 0 ? null : trg);
    setSchedules((prev: Schedule[]) => (
      [...prev.filter((s) => !s.dateOnly.equals(schedule.dateOnly)), new Schedule(schedule.date, type, trg.length === 0 ? null : trg)]
    ));
    toast.success('更新しました');
  };

  const handleRemove = async () => {
    if (!schedule) return;
    handleClose();

    await schedule!.remove();
    setSchedules((prev) => prev.filter((i) => i.date !== schedule!.date));
    toast.success('削除しました');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ padding: '24px', mb: 1 }}>
        予定を編集: {schedule && schedule.date.month() + 1}月{schedule?.date.date()}日
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
            <ToggleButton key={g.generation} value={`g:${g.generation}`}>
              {g.displayName}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          mt={1}
        >
          <Typography variant="subtitle2">コンクールメンバー</Typography>
          <ToggleButtonGroup
            sx={{ flex: 1 }}
            onChange={(_, val) => setTargetCompetition(val)}
            value={targetCompetition}
            exclusive
          >
            <ToggleButton value="c:Y" fullWidth>
              のみ
            </ToggleButton>
            <ToggleButton value="c:N" fullWidth>
              以外
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button variant="contained" color="error" onClick={handleRemove}>
          削除
        </Button>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            キャンセル
          </Button>
          <Button variant="contained" color="inherit" onClick={handleSubmit}>
            保存
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}