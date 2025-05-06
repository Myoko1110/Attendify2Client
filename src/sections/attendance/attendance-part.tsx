import type Part from 'src/abc/part';
import type Member from 'src/api/member';
import type { Month } from 'src/utils/month';
import type { DateOnly } from 'src/utils/date-only';
import type Attendances from 'src/utils/attendances';

import React, { Fragment } from 'react';

import { TableRow, TableCell } from '@mui/material';

import { AttendanceCell } from './attendance-cell';
import { StickyTableCell } from './sticky-table-cell';

type Props = {
  attendances: Attendances;
  members: Member[];
  groupedMembers: Map<Part, Member[]>;
  months: Month[];
  toggleMonth: (month: Month) => void;
  openMonths: Set<string>;
  groupedDates: Map<string, DateOnly[]>;
  setAttendances: React.Dispatch<React.SetStateAction<Attendances>>;
  editingCell: EditingCellProps;
  scheduleDates: DateOnly[];
  actual: boolean;
  tableRef: React.RefObject<HTMLDivElement | null>;
};

type EditingCellProps = {
  isEditing: (date: DateOnly, member: Member) => boolean | undefined;
  startEditing: (date: DateOnly, member: Member) => void;
  stopEditing: () => void;
  editing:
    | {
        date: DateOnly;
        member: Member;
      }
    | undefined;
};

export function AttendancePart({
  attendances,
  members,
  groupedMembers,
  months,
  toggleMonth,
  openMonths,
  groupedDates,
  setAttendances,
  editingCell,
  scheduleDates,
  actual,
  tableRef
}: Props) {
  const renderAttendanceCell = (month: Month, member: Member, index: number) => {
    if (openMonths.has(month.toString())) {
      const dates = groupedDates.get(month.toString()) || [];

      return dates.map((date) => (
        <AttendanceCell
          key={date.toString()}
          attendance={attendances.getByDate(member, date)}
          member={member}
          date={date}
          setAttendances={setAttendances}
          isFocused={editingCell.isEditing(date, member)}
          onFocus={() => editingCell.startEditing(date, member)}
          onBlur={() => editingCell.stopEditing()}
          onTabNext={() => {
            const nextMember = members[index + 1];
            if (nextMember) editingCell.startEditing(date, nextMember);
            else editingCell.stopEditing();
          }}
          tableRef={tableRef}
        />
      ));
    }
    return null;
  };

  const sortedMembers = members.sort((a, b) => {
    if (a.generation > b.generation) return 1;
    if (a.generation < b.generation) return -1;
    if (a.nameKana > b.nameKana) return 1;
    if (a.nameKana < b.nameKana) return -1;
    return 0;
  });

  return sortedMembers.map((member, index) => (
    <TableRow key={member.id}>
      <StickyTableCell sx={{ px: 1.5 }}>{member.name}</StickyTableCell>
      {months.map((month) => (
        <Fragment key={month.toString()}>
          <TableCell key={month.toString()} align="center" sx={{ maxWidth: 50 }}>
            {attendances.filterByMember(member).filterByDates(scheduleDates).filterByMonth(month).calcRate(actual)}
          </TableCell>
          {openMonths.has(month.toString()) && renderAttendanceCell(month, member, index)}
        </Fragment>
      ))}
    </TableRow>
  ));
}
