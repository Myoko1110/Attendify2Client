import 'dayjs/locale/ja';

import type { Dayjs } from 'dayjs';
import type { ButtonProps } from '@mui/material/Button';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { Tab, Tabs, Select } from '@mui/material';
import { jaJP } from '@mui/x-date-pickers/locales';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { useGrade } from 'src/hooks/grade';

import { DateOnly } from 'src/utils/date-only';
import { DayOfWeek } from 'src/utils/day-of-week';

import Part from 'src/abc/part';
import Member from 'src/api/member';
import Schedule from 'src/api/schedule';
import Attendance from 'src/api/attendance';
import { APIError } from 'src/abc/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { Loading } from 'src/components/loading';

// 出欠状態
const attendanceStatuses = ['出席', '欠席', '遅刻', '早退', '講習', '無欠'] as const;
type AttendanceStatus = (typeof attendanceStatuses)[number];



export function InputView() {
  const today = dayjs();

  const [date, setDate] = useState<Dayjs | null>(today);
  const dateOnly = DateOnly.fromDayjs(date!);
  const week = DayOfWeek.fromDayjs(date!);

  const [part, setPart] = useState(Part.FLUTE);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceStatus>>(new Map());
  
  const grade = useGrade();

  const attendanceStatusColor: Record<AttendanceStatus, ButtonProps> = {
    "出席": { color: 'success', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
    "欠席": { color: 'error', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
    "遅刻": { color: 'warning', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
    "早退": { color: 'warning', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
    "講習": { color: 'info', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
    "無欠": { sx: {
      backgroundImage: "linear-gradient(-45deg, black 25%, #87741e 25%, #87741e 50%, black 50%, black 75%, #87741e 75%, #87741e)",
        fontSize: '1.5rem', py: 1.3, height: 64, backgroundSize: "60px 60px",
    } },
  }

  useEffect(() => {
    (async () => {
      try {
        const m = await Member.get();
        setMembers(m.sort((a, b) => {
          if (a.generation > b.generation) return 1;
          if (a.generation < b.generation) return -1;
          if (a.nameKana > b.nameKana) return 1;
          if (a.nameKana < b.nameKana) return -1;
          return 0;
        }));

        const initialMap = new Map<string, AttendanceStatus>();
        m.forEach((member) => {
          initialMap.set(member.id, member.lectureDay.find((l) => l.equals(week)) ? '講習' : '出席');
        });
        setAttendanceMap(initialMap);

        const s = await Schedule.get();
        setSchedules(s);
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
      }
    })();
  }, [week]);

  const groupedMembers = (members || []).reduce((map, member) => {
    if (!map.has(member.part)) map.set(member.part, new Map<number, Member[]>());
    const generationMap = map.get(member.part)!;
    if (!generationMap.has(member.generation)) generationMap.set(member.generation, []);
    generationMap.get(member.generation)!.push(member);
    return map;
  }, new Map<Part, Map<number, Member[]>>());

  const toggleAttendance = (memberId: string) => {
    setAttendanceMap((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(memberId) || '出席';
      const index = attendanceStatuses.indexOf(current);
      const nextStatus = attendanceStatuses[(index + 1) % attendanceStatuses.length];
      newMap.set(memberId, nextStatus);
      return newMap;
    });
  };

  const handleSubmit = async () => {
    if (!members) return;

    const attendanceData = members.filter((m) => m.part === part).map((member) => ({
      member,
      attendance: attendanceMap.get(member.id)!,
      date: date!,
    }));

    try {
      await Attendance.add(attendanceData);
      toast.success("送信しました");
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  }

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          入力
        </Typography>
      </Box>

      <Card sx={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        {members !== null && schedules != null ? (
          <>
            <Tabs
              value={part}
              onChange={(_e, p) => setPart(p)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {Part.COMMON.map((p) => (
                <Tab key={p.value} value={p} label={p.enShort} />
              ))}
            </Tabs>

            {!date || !schedules.find((s => s.dateOnly.equals(dateOnly))) && (
              <Alert sx={{ mx: 3, mt: 3 }} severity="warning">{date!.isSame(today, "date") ? "本日": date!.format("MM/DD")} は予定がありません</Alert>
            )}

            <Grid container spacing={3} sx={{ p: 3, flexGrow: 1 }}>
              {(groupedMembers.get(part) || new Map()).size === 0 ? (
                <Grid size={{ xs: 12 }}>
                  <Typography color="text.secondary">このパートには部員がいません。</Typography>
                </Grid>
              ) : (
                Array.from(groupedMembers.get(part) || new Map()).map(
                  ([generation, genMembers]: [number, Member[]]) => (
                    <Grid key={generation} size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        {grade?.find((g) => g.generation === generation)?.displayName}
                      </Typography>

                      <Grid container spacing={2}>
                        {genMembers.map((member) => (
                          <Grid key={member.id} size={{xs: 6, sm:6, md:4, lg:3}}>
                            <Card sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h6" gutterBottom>
                                {member.name}
                              </Typography>

                              {editingMemberId === member.id ? (
                                <Select
                                  fullWidth
                                  value={attendanceMap.get(member.id) || '出席'}
                                  onChange={(e) => {
                                    setAttendanceMap((prev) => {
                                      const newMap = new Map(prev);
                                      newMap.set(member.id, e.target.value as AttendanceStatus);
                                      return newMap;
                                    });
                                    setEditingMemberId(null);
                                  }}
                                  onBlur={() => setEditingMemberId(null)}
                                  autoFocus
                                  open={editingMemberId === member.id}
                                  onClose={() => setEditingMemberId(null)}
                                  sx={{ height: 64, fontSize: '1.5rem', fontWeight: 700 }}
                                >
                                  {attendanceStatuses.map((status) => (
                                    <MenuItem key={status} value={status}>
                                      {status}
                                    </MenuItem>
                                  ))}
                                </Select>
                              ) : (
                                <Button
                                  variant="contained"
                                  fullWidth
                                  sx={{ fontSize: '1.5rem', py: 1.3, height: 64 }}
                                  onClick={() => toggleAttendance(member.id)}
                                  onMouseDown={() => {
                                    timeoutRef.current = setTimeout(() => {
                                      setEditingMemberId(member.id);
                                    }, 300);
                                  }}
                                  onTouchStart={() => {
                                    timeoutRef.current = setTimeout(() => {
                                      setEditingMemberId(member.id);
                                    }, 300);
                                  }}
                                  onMouseUp={() => clearTimeout(timeoutRef.current!)}
                                  onMouseLeave={() => clearTimeout(timeoutRef.current!)}
                                  onTouchEnd={() => clearTimeout(timeoutRef.current!)}
                                  {...attendanceStatusColor[attendanceMap.get(member.id)!] || '出席'}
                                >
                                  {attendanceMap.get(member.id) || '出席'}
                                </Button>

                              )}
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  )
                )
              )}
            </Grid>
            <Stack sx={{p:2}} justifyContent="space-between" flexDirection="row" alignItems="end">
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="ja"
                localeText={jaJP.components.MuiLocalizationProvider.defaultProps.localeText}
              >
                <DatePicker
                  label="日付"
                  slotProps={{ calendarHeader: { format: 'YYYY年MM月' }, actionBar: { actions: ["today"] }}}
                  views={["year", "month", "day"]}
                  value={date}
                  onChange={setDate}
                />
              </LocalizationProvider>
              <Button variant="contained" color="inherit" onClick={handleSubmit}>送信</Button>
            </Stack>
          </>
        ) : (
          <Loading />
        )}
        
      </Card>
    </DashboardContent>
  );
}
