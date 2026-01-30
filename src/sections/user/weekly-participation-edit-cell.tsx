import type Member from 'src/api/member';
import type { WeeklyParticipation } from 'src/api/member';

import React, { useRef } from 'react';

import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';

import { getAttendanceStyle } from '../attendance-n/attendance';
import { WeeklyParticipationCellEditor } from './weekly-participation-editor';

const weekdays = ['月', '火', '水', '木', '金', '土', '日'];

export function WeeklyParticipationEditCell({
  wp,
  member,
}: {
  wp: WeeklyParticipation;
  member: Member;
}) {
  const editingCell = useRef<HTMLElement | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [attendance, setAttendance] = React.useState(wp.defaultAttendance); // ←追加
  const [isActive, setIsActive] = React.useState(wp.isActive);

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const style = isActive && attendance
    ? getAttendanceStyle(attendance)
    : 'bg-white text-gray-400 hover:bg-gray-100';

  return (
    <Box ref={editingCell}>
      <Typography textAlign="center" variant="subtitle2">
        {weekdays[wp.weekday]}
      </Typography>
      <button
        className={`${style} w-6 h-3 px-1 my-1 rounded-2xl text-sm font-bold hover:opacity-80 transition-opacity${
          attendance && attendance.length > 2 ? ' text-[10px]' : ''
        }`}
        title={isActive && attendance || '-'}
        onClick={toggleEditing}
      >
        {isActive && attendance?.substring(0, 3) || '-'}
      </button>
      <WeeklyParticipationCellEditor
        attendance={attendance}
        isActive={isActive}
        anchorEl={editingCell.current}
        isEditing={isEditing}
        onSave={async (val) => {
          await member.setWeeklyParticipation({
            weekday: wp.weekday,
            defaultAttendance: val,
            isActive: true,
          });
          setAttendance(val);
          setIsActive(true);
        }}
        onDelete={async () => {
          await member.setWeeklyParticipation({
            weekday: wp.weekday,
            defaultAttendance: wp.defaultAttendance,
            isActive: false,
          });
          setAttendance('');
          setIsActive(false);
        }}
        onClose={async () => setIsEditing(false)}
      />
    </Box>
  );
}
