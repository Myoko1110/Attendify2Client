import type { Dayjs } from 'dayjs';

import { useState } from 'react';

import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { useGrade } from '../../hooks/grade';
import { fDateTime } from '../../utils/format-time';
import { PreAttendanceAnswerDialog } from './pre-attendance-answer-dialog';

import type Member from '../../api/member';
import type Schedule from '../../api/schedule';
import type PreCheck from '../../api/pre-check';
import type PreAttendance from '../../api/pre-attendance';

// ----------------------------------------------------------------------

type UserTableRowProps = {
  row: Member;
  createdAt: Dayjs | null;
  updatedAt: Dayjs | null;
  preCheck: PreCheck;
  schedulesInRange: Schedule[];
  isTargetSchedule: (schedule: Schedule, member: Member) => boolean;
  preAttendances: PreAttendance[];
};

export function PreCheckDetailTableRow({ row, createdAt, updatedAt, preCheck, schedulesInRange, isTargetSchedule, preAttendances }: UserTableRowProps) {
  const grade = useGrade();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox">
        <TableCell>{row.part.enShort}</TableCell>
        <TableCell>{row.getGrade(grade!)?.displayName}</TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>{createdAt ? fDateTime(createdAt) : '-'}</TableCell>
        <TableCell>{updatedAt ? fDateTime(updatedAt) : '-'}</TableCell>
        <TableCell>
          <Button variant="contained" color="inherit" onClick={() => setDialogOpen(true)}>
            回答の詳細
          </Button>
        </TableCell>
      </TableRow>

      <PreAttendanceAnswerDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        member={row}
        schedulesInRange={schedulesInRange}
        isTargetSchedule={isTargetSchedule}
        preAttendances={preAttendances}
      />
    </>
  );
}
