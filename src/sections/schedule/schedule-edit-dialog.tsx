import type Schedule from 'src/api/schedule';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

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

import ScheduleType from 'src/abc/schedule-type';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  schedule?: Schedule;
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
}

export function ScheduleEditDialog({open, setOpen, schedule, setSchedules}: Props) {
  const [scheduleType, setScheduleType] = useState<string | null>(schedule?.type.value || null);

  const handleClose = () => {
    setOpen(false);
  }

  const handleSubmit = async () => {
    if (!schedule) return;
    setOpen(false);

    await schedule.update(ScheduleType.valueOf(scheduleType!))
    toast.success("更新しました");
  }

  const handleRemove = async() => {
    if (!schedule) return;
    handleClose();

    await schedule!.remove();
    setSchedules(((prev) => prev.filter((i) => i.date !== schedule!.date)));
    toast.success("削除しました");
  }

  useEffect(() => {
    setScheduleType(schedule?.type.value || null);
  }, [schedule]);



  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ padding: '24px' }}>
        予定を編集: {schedule && schedule.date.month() + 1}月{schedule?.date.date()}日
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
          </FormControl>
        </Stack>
      <DialogActions sx={{justifyContent: "space-between"}}>
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
  )
}