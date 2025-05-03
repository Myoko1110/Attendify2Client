import type Member from 'src/api/member';
import type { DateOnly } from 'src/utils/date-only';
import type Attendances from 'src/utils/attendances';

import { toast } from 'sonner';
import React, { useRef, useState, useEffect } from 'react';

import { TableCell } from '@mui/material';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';

import Attendance from 'src/api/attendance';
import { APIError } from 'src/abc/api-error';

type Props = {
  member: Member;
  attendance?: Attendance;
  date: DateOnly;
  setAttendances: React.Dispatch<React.SetStateAction<Attendances>>;
  isFocused: boolean | undefined;
  onFocus: () => void;
  onTabNext?: () => void;
  onBlur: () => void;
};

export function AttendanceCell({ attendance, date, member, setAttendances, isFocused, onFocus, onTabNext, onBlur }: Props) {
  const [value, setValue] = useState(attendance?.attendance || '');

  const inputRef = useRef<HTMLInputElement | null>(null);

  const theme = useTheme();
  const autocompleteOptions = ['出席', '欠席', '遅刻', '早退', '講習'];

  const getAttendanceColor = (a: string | undefined) => {
    if (a === '出席') return 'transparent';
    if (a === '欠席') return theme.palette.error.lighter;
    if (a === '遅刻') return theme.palette.warning.lighter;
    if (a === '早退') return theme.palette.warning.lighter;
    if (a === '講習') return theme.palette.info.lighter;
    return 'transparent';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onTabNext?.();
    }
  };

  const handleUpdate = async () => {
    onBlur();
    if ((attendance?.attendance || '') === value) return;
    if (attendance) {
      try {

        // update
        if (value !== '') {
          await attendance.update(value);

        // remove
        } else {
          await attendance.remove();
          setAttendances((prev) => prev.remove(attendance));
        }
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
      }

    // add
    } else {
      try {
        const newAttendance = await Attendance.addOne({
          member,
          attendance: value,
          date: date.toDayjs(),
        });
        setAttendances((prev) => prev.add(newAttendance))
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
      }
    }
  };

  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus();
    }
  }, [isFocused]);

  return (
    <TableCell
      key={date.toString()}
      sx={{ backgroundColor: getAttendanceColor(attendance?.attendance) }}
      align="center"
    >
      <input
        style={{
          height: '100%',
          width: '100%',
          border: 0,
          outline: 0,
          backgroundColor: 'transparent',
          color: '#000000',
          textAlign: 'center',
        }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleUpdate}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        ref={inputRef}
      />
      {isFocused && (
        <MenuList
          sx={{
            width: 70,
            position: 'absolute',
            zIndex: 1,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            boxShadow: theme.shadows[3],
            p: 0.5,
          }}
          dense
        >
          {autocompleteOptions.map((option, index) => (
            <MenuItem key={index} onMouseDown={() => setValue(option)}>
              {option}
            </MenuItem>
          ))}
        </MenuList>
      )}
    </TableCell>
  );
}