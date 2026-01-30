import type { WeeklyParticipation } from 'src/api/member';

import React from 'react';

import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import { Box, TableCell } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import { red, blue, grey, orange, yellow } from '@mui/material/colors';


const weekdays = ['月', '火', '水', '木', '金', '土', '日'];

// 状態に応じた色
const getColor = (wp: WeeklyParticipation) => {
  if (!wp.isActive) return grey[300];
  if (wp.defaultAttendance === '欠席') return red[500];
  if (wp.defaultAttendance === '遅刻') return orange[500];
  if (wp.defaultAttendance === '早退') return yellow[500];
  if (wp.defaultAttendance === '講習') return blue[500];
  if (wp.defaultAttendance) return grey[700];

  return grey[300];
};

interface Props {
  weeklyParticipation: WeeklyParticipation[];
  onClick?: () => void;
}

export default function WeeklyParticipationCell({
  weeklyParticipation,
  onClick,
}: Props) {
    return (
    <Table sx={{ width: 'fit-content' }} onClick={onClick}>
      <TableBody>
        <TableRow>
          <TableCell>
            <Box sx={{ display: 'flex', gap: 0.5, cursor: 'pointer' }}>
              {weekdays.map((day, i) => {
                const wp = weeklyParticipation.find((w) => w.weekday === i);
                if (!wp) return <Box key={i} sx={{ width: 16, height: 16 }} />;
                return (
                  <Box
                    key={i}
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: getColor(wp),
                    }}
                    title={`${day}: ${wp.defaultAttendance} ${wp.isActive ? '' : '(非アクティブ)'}`}
                  />
                );
              })}
            </Box>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
