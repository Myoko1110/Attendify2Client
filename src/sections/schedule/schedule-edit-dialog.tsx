import type { Dayjs } from 'dayjs';
import type Group from 'src/api/group';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { jaJP } from '@mui/x-date-pickers/locales';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import {
  Stack,
  Button,
  Dialog,
  Checkbox,
  DialogTitle,
  FormControl,
  ToggleButton,
  DialogActions,
  FormHelperText,
  FormControlLabel,
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
  groups: Group[];
};

export function ScheduleEditDialog({ open, setOpen, schedule, setSchedules, groups }: Props) {
  const grade = useGrade();
  const [scheduleType, setScheduleType] = useState<string | null>(null);

  const [targetGenerations, setTargetGenerations] = useState<number[]>([]);
  const [targetGroups, setTargetGroups] = useState<string[]>([]);
  const [excludeGroups, setExcludeGroups] = useState<string[]>([]);
  const [isPreAttendanceTarget, setIsPreAttendanceTarget] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schedule) return;

    setScheduleType(schedule.type.value);
    setTargetGenerations(schedule.generations ?? []);
    setTargetGroups(schedule.groups ?? []);
    setExcludeGroups(schedule.excludeGroups ?? []);
    setIsPreAttendanceTarget(schedule.isPreAttendanceTarget);
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
  }, [schedule]);


  useEffect(() => {
    setScheduleType(schedule?.type.value || null);
  }, [schedule]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!schedule) return;

    setError(null);
    if (!scheduleType) {
      setError('schedule');
      return;
    }

    if ((startTime && !endTime) || (endTime && !startTime)) {
      setError('notBothTime');
      return;
    }

    if (startTime && endTime && startTime.isAfter(endTime)) {
      setError('invalidTimeSetting');
      return;
    }

    setOpen(false);

    try {
      const type = ScheduleType.valueOf(scheduleType);

      await schedule.update(
        type,
        targetGenerations.length ? targetGenerations : null,
        targetGroups.length ? targetGroups : null,
        excludeGroups.length ? excludeGroups : null,
        isPreAttendanceTarget,
        startTime,
        endTime,
      );

      setSchedules((prev) =>
        prev.map((s) =>
          s.dateOnly.equals(schedule.dateOnly)
            ? new Schedule(
                schedule.date,
                type,
                targetGenerations.length ? targetGenerations : null,
                targetGroups.length ? targetGroups : null,
                excludeGroups.length ? excludeGroups : null,
                isPreAttendanceTarget,
                startTime,
                endTime,
              )
            : s,
        ),
      );

      toast.success('更新しました');
    } catch {
      toast.error('更新に失敗しました');
    }
  };


  const handleRemove = async () => {
    if (!schedule) return;

    await schedule.remove();
    setSchedules((prev) =>
      prev.filter((s) => !s.dateOnly.equals(schedule.dateOnly))
    );
    toast.success('削除しました');
    setOpen(false);
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

          <FormHelperText error>
            {error === 'schedule' && '予定の種類を選択してください'}
          </FormHelperText>
        </FormControl>

        <FormControl error={!!(error && (startTime || endTime))}>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="ja"
            localeText={jaJP.components.MuiLocalizationProvider.defaultProps.localeText}
          >
            <Stack direction="row" gap={1} alignItems="center" sx={{ width: '100%' }}>
              <TimePicker
                label="開始時間"
                value={startTime}
                onChange={(v) => setStartTime(v)}
                views={['hours', 'minutes']}
                ampm={false}
                slotProps={{
                  field: { clearable: true },
                  toolbar: { toolbarFormat: 'M月D日' },
                  actionBar: {
                    actions: ['today', 'accept'],
                    sx: {
                      '.MuiButton-root': {
                        borderColor: 'grey.900',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        color: 'black',
                      },
                      '& .MuiButton-root:last-child': {
                        backgroundColor: 'grey.900',
                        color: 'white',
                      },
                    },
                  },
                }}
              />
              <TimePicker
                label="終了時間"
                value={endTime}
                onChange={(v) => setEndTime(v)}
                views={['hours', 'minutes']}
                ampm={false}
                slotProps={{
                  field: { clearable: true },
                  toolbar: { toolbarFormat: 'M月D日' },
                  actionBar: {
                    actions: ['today', 'accept'],
                    sx: {
                      '.MuiButton-root': {
                        borderColor: 'grey.900',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        color: 'black',
                      },
                      '& .MuiButton-root:last-child': {
                        backgroundColor: 'grey.900',
                        color: 'white',
                      },
                    },
                  },
                }}
              />
            </Stack>
          </LocalizationProvider>
          <FormHelperText error>
            {error === 'notBothTime'
              ? '開始時間と終了時間の両方を入力してください'
              : error === 'invalidTimeSetting'
                ? '終了時間は開始時間より後の時間に設定してください'
                : ''}
          </FormHelperText>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={isPreAttendanceTarget}
              onChange={(e) => setIsPreAttendanceTarget(e.target.checked)}
            />
          }
          label="事前出欠の対象"
        />

        <Divider sx={{ mt: 3 }}>
          <Typography variant="button">限定</Typography>
        </Divider>

        <ToggleButtonGroup
          fullWidth
          value={targetGenerations}
          onChange={(_, val) => setTargetGenerations(val)}
        >
          {grade?.map((g) => (
            <ToggleButton key={g.generation} value={g.generation}>
              {g.displayName}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Stack>
          {groups.map((g) => (
            <Stack key={g.id} direction="row" alignItems="center" gap={2} mt={1}>
              <Typography variant="subtitle2" width={100} textAlign="center">
                {g.displayName}
              </Typography>

              <ToggleButtonGroup
                exclusive
                value={
                  targetGroups.includes(g.id)
                    ? 'include'
                    : excludeGroups.includes(g.id)
                      ? 'exclude'
                      : null
                }
                onChange={(_, val) => {
                  setTargetGroups((prev) =>
                    val === 'include'
                      ? prev.includes(g.id)
                        ? prev
                        : [...prev, g.id]
                      : prev.filter((id) => id !== g.id),
                  );

                  setExcludeGroups((prev) =>
                    val === 'exclude'
                      ? prev.includes(g.id)
                        ? prev
                        : [...prev, g.id]
                      : prev.filter((id) => id !== g.id),
                  );
                }}
              >
                <ToggleButton value="include" fullWidth>
                  のみ
                </ToggleButton>
                <ToggleButton value="exclude" fullWidth>
                  以外
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          ))}
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