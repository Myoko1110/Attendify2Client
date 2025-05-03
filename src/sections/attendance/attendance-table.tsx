import type Member from 'src/api/member';
import type Schedule from 'src/api/schedule';
import type { DateOnly } from 'src/utils/date-only';
import type Attendances from 'src/utils/attendances';

import React, { useState, Fragment } from 'react';

import Typography from '@mui/material/Typography';
import { Table, Paper, Button, TableRow, TableBody, TableCell, TableHead, TableContainer } from '@mui/material';

import { Month } from 'src/utils/month';

import Part from 'src/abc/part';

import { AttendancePart } from './attendance-part';
import { StickyTableCell } from './sticky-table-cell';


type Props = {
  schedules: Schedule[];
  attendances: Attendances;
  members: Member[];
  setAttendances: React.Dispatch<React.SetStateAction<Attendances>>;
  groupedMembers: Map<Part, Member[]>;
};

export function AttendanceTable({ schedules, attendances, members, setAttendances, groupedMembers }: Props) {
  const [openParts, setOpenParts] = useState<Set<Part>>(new Set(Part.COMMON));
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set([Month.now().toString()]));

  const editingCell = useEditingCell();

  const groupedDates = schedules.reduce((map, s) => {
    if (!map.has(s.month.toString())) map.set(s.month.toString(), []);
    map.get(s.month.toString())!.push(s.dateOnly);
    return map;
  }, new Map<string, DateOnly[]>());

  const months = Array.from(groupedDates.keys()).map(m => Month.fromString(m));

  const toggleSetValue = <T,>(set: Set<T>, value: T): Set<T> => {
    const newSet = new Set(set);
    if (newSet.has(value)) newSet.delete(value);
    else newSet.add(value);
    return newSet;
  };

  const handleToggleMonth = (month: Month) => setOpenMonths(prev => toggleSetValue(prev, month.toString()));
  const handleTogglePart = (part: Part) => setOpenParts(prev => toggleSetValue(prev, part));

  const renderMonthHeaders = () =>
    months.flatMap(month => {
      const headers = [
        <TableCell key={`btn-${month}`} align="center" sx={{ width: 70, minWidth: 70, maxWidth: 70 }}>
          <Button size="small" onClick={() => handleToggleMonth(month)}>
            {month.displayName()}
          </Button>
        </TableCell>,
      ];

      if (openMonths.has(month.toString())) {
        const dates = groupedDates.get(month.toString()) || [];
        headers.push(
          ...dates.map(date => (
            <TableCell key={date.toString()} sx={{ width: 50, minWidth: 50, maxWidth: 50 }} align="center">
              {date.date}
            </TableCell>
          ))
        );
      }

      return headers;
    });

  return (
    <TableContainer component={Paper} sx={{ width: "fit-content", maxWidth: "100%", overflow: "auto" }}>
      <Table stickyHeader size="small" sx={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            <StickyTableCell sx={{ zIndex: 4, backgroundColor: (theme) => theme.palette.grey[200] }} align="center">
              <Typography variant="h6">氏名</Typography>
            </StickyTableCell>
            {renderMonthHeaders()}
          </TableRow>
        </TableHead>
        <TableBody>
          {Part.COMMON.map(part => (
            <Fragment key={part.value}>
              <TableRow>
                <StickyTableCell sx={{ fontWeight: 'bold', p: 0 }}>
                  <Button onClick={() => handleTogglePart(part)} sx={{ py: .4, fontSize: 18, borderRadius: 0 }} fullWidth>
                    {part.enShort}
                  </Button>
                </StickyTableCell>
                {months.map(month => (
                  <>
                    <TableCell key={month.toString()} align="center" sx={{ maxWidth: 70 }}>
                      {attendances.filterByPart(part).filterByMonth(month).calcRate()}
                    </TableCell>
                    {openMonths.has(month.toString()) && groupedDates.get(month.toString())?.map(date => (
                      <TableCell key={date.toString()} align="center" sx={{ maxWidth: 50 }}>
                        {attendances.filterByPart(part).filterByDate(date)?.calcRate()}
                      </TableCell>
                    ))}
                  </>
                ))}
              </TableRow>
              {openParts.has(part) && (
                <AttendancePart
                  attendances={attendances}
                  members={groupedMembers.get(part) || []}
                  groupedMembers={groupedMembers}
                  months={months}
                  toggleMonth={handleToggleMonth}
                  openMonths={openMonths}
                  groupedDates={groupedDates}
                  setAttendances={setAttendances}
                  editingCell={editingCell}
                />
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

type EditingCell = {
  date: DateOnly;
  member: Member;
};

export function useEditingCell() {
  const [editing, setEditing] = useState<EditingCell | undefined>();

  const isEditing = (date: DateOnly, member: Member) => editing?.date.equals(date) && editing?.member.equals(member);

  const startEditing = (date: DateOnly, member: Member) => {
    setEditing({ date, member });
  };

  const stopEditing = () => {
    setEditing(undefined);
  };

  return {
    isEditing,
    startEditing,
    stopEditing,
    editing,
  };
}