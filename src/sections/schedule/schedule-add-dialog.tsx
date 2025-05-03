import type { Dayjs } from 'dayjs';

import { toast } from 'sonner';
import { useState } from 'react';

import {
  Stack,
  Button,
  Dialog,
  DialogTitle,
  FormControl,
  ToggleButton,
  DialogActions,
  FormHelperText,
  ToggleButtonGroup,
} from '@mui/material';

import Schedule from 'src/api/schedule';
import ScheduleType from 'src/abc/schedule-type';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  date?: Dayjs;
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
}

export function ScheduleAddDialog({open, setOpen, date, setSchedules}: Props) {
  const [scheduleType, setScheduleType] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setError(false);
    setScheduleType(null);
  }

  const handleSubmit = async () => {
    if (!date) return;

    setError(false);
    if (!scheduleType) {
      setError(true);
      return;
    }

    handleClose();

    const type = ScheduleType.valueOf(scheduleType);
    await Schedule.add(date, type)
    toast.success("追加しました")
    setSchedules((prev) => ([...prev, new Schedule(date, type)]));
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ padding: '24px' }}>
        予定を追加: {date && date.month() + 1}月{date?.date()}日
      </DialogTitle>
        <Stack direction="column" gap="24px" px={2}>
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