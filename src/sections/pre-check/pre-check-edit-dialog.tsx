import type { Dayjs } from 'dayjs';
import type PreCheck from 'src/api/pre-check';

import { toast } from 'sonner';
import { ZodError } from 'zod';
import { useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { jaJP } from '@mui/x-date-pickers/locales';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { Dialog, FormLabel, TextField, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { defaultTimezone } from 'src/utils/format-time';

import { APIError } from 'src/abc/api-error';
import { preCheckPostSchema } from 'src/api/pre-check';


type Props = {
  preCheck: PreCheck;
  open: boolean;
  setOpen: (open: boolean) => void;
  setPreChecks: React.Dispatch<React.SetStateAction<PreCheck[] | null>>;
};

const initialErrorMsg = {
  startDate: '',
  endDate: '',
  description: '',
  editDeadlineDays: '',
  deadline: '',
};

export function PreCheckEditDialog({ preCheck, open, setOpen, setPreChecks }: Props) {
  const [startDate, setStartDate] = useState<Dayjs | null>(preCheck.startDate.toDayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(preCheck.endDate.toDayjs());
  const [description, setDescription] = useState(preCheck.description);
  const [deadline, setDeadline] = useState<Dayjs | null>(preCheck.deadline);
  const [editDeadlineDays, setEditDeadlineDays] = useState<number>(preCheck.editDeadlineDays);

  const [errorMsg, setErrorMsg] = useState({ ...initialErrorMsg });
  console.log(deadline)

  const reset = useCallback(() => {
    setStartDate(preCheck.startDate.toDayjs());
    setEndDate(preCheck.endDate.toDayjs());
    setDescription(preCheck.description);
    setDeadline(preCheck.deadline);
    setEditDeadlineDays(preCheck.editDeadlineDays);
    resetErrorMsg();
  }, [preCheck]);

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
      const body = preCheckPostSchema.parse({ startDate, endDate, description, deadline, editDeadlineDays });
      handleClose();

      const p = await preCheck.update(body);
      setPreChecks((prev): PreCheck[] =>
        (prev ?? []).map((item) => (item.id === p.id ? p : item)),
      );

      toast.success('更新しました');
    } catch (e) {
      if (e instanceof ZodError) {
        const _errorMsg = e.errors.reduce(
          (p: typeof errorMsg, issue) => {
            p[issue.path[0] as keyof typeof errorMsg] = issue.message;
            return p;
          },
          { ...initialErrorMsg },
        );
        setErrorMsg(_errorMsg);
      } else {
        console.error(e);
        toast.error(APIError.createToastMessage(e));
      }
    }
  };

  useEffect(() => {
    reset();
  }, [preCheck, reset]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>事前出欠フォームを編集</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="ja"
          localeText={jaJP.components.MuiLocalizationProvider.defaultProps.localeText}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormLabel>期間</FormLabel>
            </Grid>
            <Grid size={{ xs: 5.5 }}>
              <DatePicker
                label="開始日"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: { helperText: errorMsg.startDate },
                  calendarHeader: { format: 'YYYY年M月' },
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
                  toolbar: { toolbarFormat: 'M月D日' },
                }}
                views={['year', 'month', 'day']}
                sx={{ width: '100%' }}
                format="YYYY/MM/DD"
              />
            </Grid>
            <Grid
              size={{ xs: 1 }}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ～
            </Grid>
            <Grid size={{ xs: 5.5 }}>
              <DatePicker
                label="終了日"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: { helperText: errorMsg.endDate },
                  calendarHeader: { format: 'YYYY年M月' },
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
                  toolbar: { toolbarFormat: 'M月D日' },
                }}
                views={['year', 'month', 'day']}
                sx={{ width: '100%' }}
                format="YYYY/MM/DD"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DateTimePicker
                label="締切日時"
                value={deadline}
                onChange={(newValue) => setDeadline(newValue)}
                slotProps={{
                  field: { clearable: true },
                  textField: { helperText: errorMsg.deadline },
                  calendarHeader: { format: 'YYYY年M月' },
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
                views={['year', 'month', 'day', 'hours', 'minutes']}
                sx={{ width: '100%' }}
                format="YYYY/MM/DD HH:mm:ss"
                timezone={defaultTimezone}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="編集許可"
                variant="outlined"
                fullWidth
                onChange={(e) => setEditDeadlineDays(Number(e.target.value))}
                value={editDeadlineDays.toString()}
                error={!!errorMsg.editDeadlineDays}
                helperText={errorMsg.editDeadlineDays}
                type="number"
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">日前の予定まで</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="説明"
                variant="outlined"
                fullWidth
                multiline
                rows={2}
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                error={!!errorMsg.description}
                helperText={errorMsg.description}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          キャンセル
        </Button>
        <Button variant="contained" color="inherit" onClick={handleSubmit}>
          更新
        </Button>
      </DialogActions>
    </Dialog>
  );
}
