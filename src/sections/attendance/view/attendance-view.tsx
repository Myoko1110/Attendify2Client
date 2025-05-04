import type Part from 'src/abc/part';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Grid from '@mui/material/Grid';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { Stack, Radio, Switch, FormGroup, FormControlLabel } from '@mui/material';

import { useGrade } from 'src/hooks/grade';

import Attendances from 'src/utils/attendances';

import Member from 'src/api/member';
import Schedule from 'src/api/schedule';
import Attendance from 'src/api/attendance';
import { APIError } from 'src/abc/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { Loading } from 'src/components/loading';

import { AttendanceTable } from '../attendance-table';
import { Iconify } from '../../../components/iconify';

// ----------------------------------------------------------------------

export function AttendanceView() {
  const [attendances, setAttendances] = useState<Attendances>(new Attendances());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[] | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);

  const [actual, setActual] = useState(false);

  const grade = useGrade();
  const [filterGrade, setFilterGrade] = useState<number[]>(grade?.map((g) => g.generation) || []);
  const [filterCompetition, setFilterCompetition] = useState<boolean | null>(null);

  const filteredMembers = (members || []).filter((m) =>
    filterGrade.includes(m.generation) &&
    (filterCompetition === null || m.isCompetitionMember === filterCompetition)
  );
  const filteredAttendances = attendances.filterByGenerations(filterGrade).filterByCompetition(filterCompetition);

  const filterGradeType = (type: string) => {
    const grades = (grade || []).filter((g) => g.type === type);
    setFilterGrade(grades.map((g) => g.generation));
  }


  const groupedMembers = filteredMembers
    .reduce((map, member) => {
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
        <Box>
          <FormControlLabel control={<Switch value={actual} onChange={(e) => setActual(e.target.checked)} />} label="実際の出席率" />
          <Button startIcon={<Iconify icon="ic:round-filter-list" />} color="inherit" variant="outlined" onClick={() => setFilterOpen(true)}>フィルター</Button>
        </Box>
      </Box>

      <Card sx={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
        {members !== null ? (
          <AttendanceTable
            attendances={filteredAttendances}
            schedules={schedules}
            members={filteredMembers}
            setAttendances={setAttendances}
            groupedMembers={groupedMembers}
            actual={actual}
          />
        ) : (
          <Loading />
        )}

      </Card>
      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} anchor="right">
        <Box sx={{ px: 2, py: 4 }}>
          <Stack direction="row" gap={1} alignItems="center" mb={1}>
            <Iconify icon="ic:round-filter-list" />
            <Typography variant="h6">フィルター</Typography>
          </Stack>
          <List>
            <ListItem>
              <FormGroup sx={{ width: "100%" }}>
                <Grid container spacing={1}>
                  <Grid size={{xs:6}}>
                    <Button onClick={() => filterGradeType("junior")} fullWidth>中学</Button>
                  </Grid>
                  <Grid size={{xs:6}}>
                    <Button onClick={() => filterGradeType("senior")} fullWidth>高校</Button>
                  </Grid>
                </Grid>
                  {grade?.map((g) => (
                    <FormControlLabel
                      value={g.generation}
                      control={
                      <Checkbox
                        checked={filterGrade.includes(g.generation)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterGrade((prev) => [...prev, g.generation]);
                          } else {
                            setFilterGrade((prev) => prev.filter((gen) => gen !== g.generation));
                          }
                        }}
                      />
                    }
                      label={g.displayName}

                    />
                  ))}
                
              </FormGroup>
            </ListItem>
            <ListItem>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={filterCompetition === true}
                        onClick={() => setFilterCompetition(filterCompetition === true ? null : true)}
                      />
                    }
                    label="コンクールメンバー"
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={filterCompetition === false}
                        onClick={() => setFilterCompetition(filterCompetition === false ? null : false)}
                      />
                    }
                    label="コンクールメンバー以外"
                  />
                </FormGroup>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </DashboardContent>
  );
}
