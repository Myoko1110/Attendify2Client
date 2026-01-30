import type { Dayjs } from 'dayjs';
import type { MembershipStatusPeriod } from 'src/api/member';

import { toast } from 'sonner';
import { ZodError } from 'zod';
import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { jaJP } from '@mui/x-date-pickers/locales';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Dialog,
  Select,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  FormHelperText,
} from '@mui/material';

import { APIError } from 'src/abc/api-error';
import MembershipStatus from 'src/api/member-status';
import Member, { MembershipStatusPeriodPostSchemaFront } from 'src/api/member';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  members: Member[];
  // onSuccess receives an array of successful additions: { memberId, period }
  onSuccess: (results: MembershipStatusPeriod[]) => void;
};

const initialErrorMsg = {
  statusId: '',
  startDate: '',
  endDate: '',
};

export function BulkStatusPeriodAddDialog({ open, setOpen, members, onSuccess }: Props) {
  const [membershipStatuses, setMembershipStatuses] = useState<MembershipStatus[] | null>(null);

  const [statusId, setStatusId] = useState<string>('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [errorMsg, setErrorMsg] = useState({ ...initialErrorMsg });

  const reset = () => {
    setStatusId('');
    setStartDate(null);
    setEndDate(null);
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
      const parsedData = MembershipStatusPeriodPostSchemaFront.parse({
        statusId,
        startDate,
        endDate,
      });

      handleClose();
      const periods = await Member.bulkAddMembershipStatusPeriod(members, parsedData);

      toast.success(`${members.length}人の部員にステータスを追加しました`);
      onSuccess(periods);
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
        toast.error(APIError.createToastMessage(e));
      }
    }
  };

  useEffect(() => {
    (async () => {
      const statuses = await MembershipStatus.getAll();
      setMembershipStatuses(statuses);
    })();
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>ステータス期間一括追加</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          選択された{members.length}人の部員に同じステータス期間を追加します。
        </Typography>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="ja"
          localeText={jaJP.components.MuiLocalizationProvider.defaultProps.localeText}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  label="ステータス"
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  error={!!errorMsg.statusId}
                >
                  {membershipStatuses?.map((p) => (
                    <MenuItem value={p.id} key={p.id}>
                      {p.displayName}
                    </MenuItem>
                  ))}
                  <FormHelperText>{errorMsg.statusId}</FormHelperText>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="開始日"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: { helperText: errorMsg.startDate },
                  calendarHeader: { format: 'YYYY年M月' },
                  actionBar: { actions: ['today'] },
                  toolbar: { toolbarFormat: 'M月D日' },
                }}
                views={['year', 'month', 'day']}
                sx={{ width: '100%' }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="終了日"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: { helperText: errorMsg.endDate },
                  calendarHeader: { format: 'YYYY年M月' },
                  actionBar: { actions: ['today'] },
                  toolbar: { toolbarFormat: 'M月D日' },
                }}
                views={['year', 'month', 'day']}
                sx={{ width: '100%' }}
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
          登録
        </Button>
      </DialogActions>
    </Dialog>
  );
}