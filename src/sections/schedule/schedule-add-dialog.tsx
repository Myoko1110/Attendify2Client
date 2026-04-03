import 'dayjs/locale/ja';

import type { Dayjs } from 'dayjs';
import type Group from 'src/api/group';

import { toast } from 'sonner';
import { useState } from 'react';

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
import { APIError } from 'src/abc/api-error';
import ScheduleType from 'src/abc/schedule-type';


type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  date?: Dayjs;
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  groups: Group[];
};

export function ScheduleAddDialog({ open, setOpen, date, setSchedules, groups }: Props) {
  const grade = useGrade();

  const [scheduleType, setScheduleType] = useState<string | null>(null);
  const [targetGenerations, setTargetGenerations] = useState<number[]>([]);
  const [targetGroups, setTargetGroups] = useState<string[]>([]);
  const [excludeGroups, setExcludeGroups] = useState<string[]>([]);
  const [isPreAttendanceTarget, setIsPreAttendanceTarget] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setScheduleType(null);
    setTargetGenerations([]);
    setTargetGroups([]);
    setExcludeGroups([]);
    setIsPreAttendanceTarget(false);
    setStartTime(null);
    setEndTime(null);
  };

  const handleSubmit = async () => {
    if (!date) return;

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

    const type = ScheduleType.valueOf(scheduleType);

    try {
      await Schedule.add(
        date,
        type,
        targetGenerations.length ? targetGenerations : null,
        targetGroups.length ? targetGroups : null,
        excludeGroups.length ? excludeGroups : null,
        isPreAttendanceTarget,
        startTime,
        endTime,
      );
      toast.success('追加しました');
      setSchedules((prev) => [
        ...prev,
        new Schedule(
          date,
          type,
          targetGenerations.length ? targetGenerations : null,
          targetGroups.length ? targetGroups : null,
          excludeGroups.length ? excludeGroups : null,
          isPreAttendanceTarget,
          startTime,
          endTime,
        ),
      ]);
      handleClose();
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
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
                views={["hours", "minutes"]}
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
                views={["hours", "minutes"]}
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
            <Stack direction="row" alignItems="center" gap={2} key={g.id}>
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
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          キャンセル
        </Button>
        <Button variant="contained" color="inherit" onClick={handleSubmit}>
          追加
        </Button>
      </DialogActions>
    </Dialog>
  );
}
