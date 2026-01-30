import type Member from 'src/api/member';
import type { MembershipStatusPeriod } from 'src/api/member';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import {
  Box,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  FormControlLabel,
} from '@mui/material';
import {
  Timeline,
  TimelineDot,
  TimelineItem,
  TimelineContent,
  TimelineConnector,
  TimelineSeparator,
  TimelineOppositeContent,
  timelineOppositeContentClasses,
} from '@mui/lab';

import { fDate } from 'src/utils/format-time';

import { APIError } from 'src/abc/api-error';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { StatusPeriodAddDialog } from './status-period-add-dialog';
import { StatusPeriodEditDialog } from './status-period-edit-dialog';

export function StatusPeriod({
  statusAt,
  member,
  statusPeriods,
  setStatusPeriods,
}: {
  statusAt: MembershipStatusPeriod | null;
  member: Member;
  statusPeriods: MembershipStatusPeriod[] | undefined;
  setStatusPeriods: React.Dispatch<React.SetStateAction<MembershipStatusPeriod[] | undefined>>;
}) {
  const [open, setOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openPopover, setOpenPopover] = useState<{ trg: HTMLSpanElement, period: MembershipStatusPeriod } | null>(null);

  const [openEdit, setOpenEdit] = useState<MembershipStatusPeriod | null>(null);

  const handleClose = () => {
    setOpen(false);
  };

  const now = dayjs();

  const targetPeriods = useMemo(
    () => statusPeriods!.filter((period) => showPast || !period.endDate.isBefore(now, 'date')),
    [showPast, statusPeriods, now],
  );

  const sortedPeriods = useMemo(
    () => targetPeriods.slice().sort((a, b) => (a.endDate.isBefore(b.endDate) ? -1 : 1)),
    [targetPeriods],
  );

  const handleEdit = () => {
    setOpenPopover(null);
    setOpenEdit(openPopover!.period);
  }

  const handleDelete = async () => {
    setOpenPopover(null);
    const trg = openPopover!.period;

    try {
      const result = await member.removeStatus(trg.id);

      if (result) {
        toast.success('削除しました');
        setStatusPeriods(statusPeriods!.filter((period) => period.id !== trg.id));
      }
    } catch (e) {
      toast.error(APIError.createToastMessage(e))
    }
  }

  return (
    <>
      <Box onClick={() => setOpen(true)} sx={{ cursor: 'pointer', p: 2, display: 'flex', gap: 1 }}>
        <Typography variant="subtitle1">ステータス</Typography>
        {statusAt ? (
          <Label color="warning" sx={{ cursor: 'pointer' }}>
            {statusAt.status.displayName}
          </Label>
        ) : (
          <Label>-</Label>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          ステータス
          <Stack gap={1} flexDirection="row">
            <FormControlLabel
              control={
                <Checkbox value={showPast} onChange={(e) => setShowPast(e.target.checked)} />
              }
              label="過去も表示"
            />
            <Button variant="outlined" color="inherit" onClick={handleClose}>
              閉じる
            </Button>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenAdd(true)}
            >
              追加
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Timeline
            sx={{
              [`& .${timelineOppositeContentClasses.root}`]: {
                flex: 0.2,
              },
            }}
          >
            {sortedPeriods.map((period) => (
              <TimelineItem key={period.id}>
                <TimelineOppositeContent sx={{ flex: '0.5!important' }}>
                  {fDate(period.startDate)} ～ {fDate(period.endDate)}
                  <IconButton sx={{ p: 0.75, ml: 0.5 }} onClick={(e) => setOpenPopover({ trg: e.currentTarget, period })}>
                    <Iconify width={16} icon="eva:more-vertical-fill" />
                  </IconButton>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot
                    color={period.id === statusAt?.id ? 'warning' : 'grey'}
                  />
                  {period !== sortedPeriods.at(-1) && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Label
                    color={period.id === statusAt?.id ? 'warning' : 'default'}
                    sx={{ fontSize: 15 }}
                  >
                    {period.status.displayName}
                  </Label>

                </TimelineContent>
              </TimelineItem>
            ))}
            {sortedPeriods.length === 0 && (
              <Typography variant="body2" align="center" sx={{ mt: 3, mb: 3, width: '100%' }}>
                表示するステータス履歴がありません。
              </Typography>
            )}
          </Timeline>
        </DialogContent>
      </Dialog>
      <Popover
        open={!!openPopover}
        anchorEl={openPopover?.trg}
        onClose={() => setOpenPopover(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          <MenuItem onClick={handleEdit}>
            <Iconify icon="solar:pen-bold" />
            編集
          </MenuItem>

          <MenuItem sx={{ color: 'error.main' }} onClick={handleDelete}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            削除
          </MenuItem>
        </MenuList>
      </Popover>
      <StatusPeriodEditDialog statusPeriods={statusPeriods} setStatusPeriods={setStatusPeriods} open={!!openEdit} setOpen={setOpenEdit} member={member} currentStatusPeriod={openEdit} />
      <StatusPeriodAddDialog
        open={openAdd}
        setOpen={setOpenAdd}
        member={member}
        statusPeriods={statusPeriods}
        setStatusPeriods={setStatusPeriods}
      />
    </>
  );
}
