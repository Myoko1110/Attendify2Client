import type Part from 'src/abc/part';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import Attendances from 'src/utils/attendances';

import Member from 'src/api/member';
import Schedule from 'src/api/schedule';
import Attendance from 'src/api/attendance';
import { APIError } from 'src/abc/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { Loading } from 'src/components/loading';

import { AttendanceTable } from '../attendance-table';

// ----------------------------------------------------------------------

export function AttendanceView() {
  const [attendances, setAttendances] = useState<Attendances>(new Attendances());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[] | null>(null);

  const groupedMembers = (members || []).reduce((map, member) => {
    if (!map.has(member.part)) map.set(member.part, []);
    map.get(member.part)!.push(member);
    return map;
  }, new Map<Part, Member[]>());

  useEffect(() => {
    (async () => {
      try {
        const scheduleData = await Schedule.get();
        scheduleData.sort((a, b) => a.date.unix() - b.date.unix());

        setSchedules(scheduleData);

        const attendanceData = await Attendance.get();
        setAttendances(attendanceData);

        const memberData = await Member.get();
        setMembers(memberData);
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
      }

    })();
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          出欠
        </Typography>
      </Box>

      <Card sx={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
        {members !== null ? (
          <AttendanceTable
            attendances={attendances}
            schedules={schedules}
            members={members}
            setAttendances={setAttendances}
            groupedMembers={groupedMembers}
          />
        ) : (
          <Loading />
        )}

      </Card>
    </DashboardContent>
  );
}
