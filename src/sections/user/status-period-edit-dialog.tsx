import type { Dayjs } from 'dayjs';
import type Member from 'src/api/member';
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
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  FormHelperText,
} from '@mui/material';

import { APIError } from 'src/abc/api-error';
import { MembershipStatusPeriodPostSchemaFront } from 'src/api/member';

import MembershipStatus from '../../api/member-status';

type Props = {
  open: boolean;
  setOpen: (open: MembershipStatusPeriod | null) => void;
  member: Member;
  statusPeriods: MembershipStatusPeriod[] | undefined;
  setStatusPeriods: React.Dispatch<React.SetStateAction<MembershipStatusPeriod[] | undefined>>;
  currentStatusPeriod: MembershipStatusPeriod | null;
};

const initialErrorMsg = {
  statusId: '',
  startDate: '',
  endDate: '',
};

export function StatusPeriodEditDialog({
  open,
  setOpen,
  member,
  setStatusPeriods,
  statusPeriods,
  currentStatusPeriod,
}: Props) {
  const [membershipStatuses, setMembershipStatuses] = useState<MembershipStatus[] | null>(null);

  const [statusId, setStatusId] = useState<string>(currentStatusPeriod?.statusId || '');
  const [startDate, setStartDate] = useState<Dayjs | null>(currentStatusPeriod?.startDate || null);
  const [endDate, setEndDate] = useState<Dayjs | null>(currentStatusPeriod?.endDate || null);

  const [errorMsg, setErrorMsg] = useState({ ...initialErrorMsg });

  const reset = () => {
    setStatusId(currentStatusPeriod?.statusId || '');
    setStartDate(currentStatusPeriod?.startDate || null);
    setEndDate(currentStatusPeriod?.endDate || null);
    resetErrorMsg();
  };

  const resetErrorMsg = () => {
    setErrorMsg({ ...initialErrorMsg });
  };

  const handleClose = () => {
    setOpen(null);
    reset();
  };

  const handleSubmit = async () => {
    resetErrorMsg();
    try {
      const parsedPeriod = MembershipStatusPeriodPostSchemaFront.parse({
        statusId,
        startDate,
        endDate,
      });

      handleClose();

      const result = await member.updateStatus(currentStatusPeriod!.id, parsedPeriod);

      const updated: MembershipStatusPeriod = {
        ...currentStatusPeriod!,
        statusId,
        status: membershipStatuses!.find((s) => s.id === statusId)!,
        startDate: startDate!,
        endDate: endDate!,
      };

      if (result) {
        setStatusPeriods((prev: MembershipStatusPeriod[] | undefined) => {
          if (!prev) return [updated];
          const idx = prev.findIndex((p) => p.id === currentStatusPeriod!.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          }
          return [...prev, updated];
        });

        toast.success('更新しました');
      }
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

  useEffect(() => {
    reset();
  }, [currentStatusPeriod]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>ステータスを編集</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  actionBar: { actions: ['today', 'accept'] },
                  toolbar: { toolbarFormat: 'M月D日' },
                }}
                views={['year', 'month', 'day']}
                sx={{ width: '100%' }}
                format="YYYY/MM/DD"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="終了日"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: { helperText: errorMsg.startDate },
                  calendarHeader: { format: 'YYYY年M月' },
                  actionBar: { actions: ['today', 'accept'] },
                  toolbar: { toolbarFormat: 'M月D日' },
                }}
                views={['year', 'month', 'day']}
                sx={{ width: '100%' }}
                format="YYYY/MM/DD"
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
