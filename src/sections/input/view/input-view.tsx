import 'dayjs/locale/ja';

import type { Dayjs } from 'dayjs';
import type { ButtonProps } from '@mui/material/Button';
import type MembershipStatus from 'src/api/member-status';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { Tab, Tabs } from '@mui/material';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
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

import { useMember } from '../../../hooks/member';
import ScheduleType from '../../../abc/schedule-type';

// 出欠状態
const attendanceStatuses = ['出席', '欠席', '遅刻', '早退', '講習', '無欠', '仮退'];

const attendanceStatusColor: Record<string, ButtonProps> = {
  "出席": { color: 'success', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  "欠席": { color: 'error', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  "遅刻": { color: 'orange', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  "早退": { color: 'warning', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  "講習": { color: 'info', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  "無欠": {
    sx: {
      backgroundImage:
        'linear-gradient(-45deg, black 25%, #87741e 25%, #87741e 50%, black 50%, black 75%, #87741e 75%, #87741e)',
      fontSize: '1.5rem',
      py: 1.3,
      height: 64,
      backgroundSize: '60px 60px',
    },
  },
  "仮退": { color: 'secondary', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
};

const defaultColor: ButtonProps = {
  color: 'inherit',
  sx: { fontSize: '1.5rem', py: 1.3, height: 64 },
};

const getStatusButtonProps = (status: string, variant: ButtonProps['variant']): ButtonProps => {
  const base = attendanceStatusColor[status] || defaultColor;
  const { sx, ...rest } = base;
  return {
    ...rest,
    variant,
    sx: {
      ...(sx || {}),
      color: '#fff',
      ...(variant === 'contained' ? { height: 'auto', fontSize: '0.95rem', py: 1.0 } : null),
    },
  };
};

export function InputView() {
  const selfPart = useMember().member?.part;
  const initPart = selfPart !== undefined && selfPart !== Part.ADVISOR ? selfPart : Part.FLUTE;

  const today = dayjs.tz();

  const [date, setDate] = useState<Dayjs | null>(today);
  const dateOnly = useMemo(() => DateOnly.fromDayjs(date!), [date]);
  const week = useMemo(() => DayOfWeek.fromDayjs(date!), [date]);

  const [part, setPart] = useState(initPart);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);

  const [pickerMemberId, setPickerMemberId] = useState<string | null>(null);
  const [freeInputMemberId, setFreeInputMemberId] = useState<string | null>(null);
  const [pickerAnchorEl, setPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [suppressHoverMemberId, setSuppressHoverMemberId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressRef = useRef(false);
  const freeInputRef = useRef<HTMLInputElement | null>(null);

  const [attendanceMap, setAttendanceMap] = useState<Map<string, string>>(new Map());

  const grade = useGrade();

  // 初期化
  const handleInitAttendance = useCallback(
    (s?: Schedule[], m?: Member[]) => {
      const sche = s || schedules;
      if (!sche) return;

      const mem = m || members;
      if (!mem) return;

      const initialMap = new Map<string, string>();
      const sch = sche.find((sc) => sc.dateOnly.equals(dateOnly));
      mem.forEach((member) => {
        const statusPeriod = member.statusAt(date!);
        const status = statusPeriod?.status as MembershipStatus | undefined;
        if (status) {
          // status があり、isAttendanceTarget が true の場合のみ defaultAttendance を設定する
          if (!status.isAttendanceTarget) return;
          initialMap.set(member.id, status.defaultAttendance ?? '');
          return;
        }

        const defaultAttendance = sch?.type.equals(ScheduleType.WEEKDAY)
          ? (member.weeklyParticipations?.find((wp) => wp.weekday === week.num && wp.isActive)
              ?.defaultAttendance ?? '出席')
          : '出席';
        initialMap.set(member.id, defaultAttendance);
      });

      setAttendanceMap(initialMap);
    },
    [schedules, members, dateOnly, date, week.num],
  );

  // 初回のデータフェッチ
  useEffect(() => {
    (async () => {
      try {
        const s = await Schedule.get();
        setSchedules(s);

        const m = await Member.get({
          includeGroups: true,
          includeWeeklyParticipation: true,
          includeStatusPeriods: true,
        });
        setMembers(
          m.sort((a, b) => {
            if (a.generation > b.generation) return 1;
            if (a.generation < b.generation) return -1;
            if (a.nameKana > b.nameKana) return 1;
            if (a.nameKana < b.nameKana) return -1;
            return 0;
          }),
        );

        // フェッチ直後に初期化を明示的に呼ぶ（最新の s,m を渡す）
        handleInitAttendance(s, m);
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
      }
    })();
  }, []);

  // 日付が変わったときは最新の schedules/members を渡して初期化
  useEffect(() => {
    handleInitAttendance(schedules ?? undefined, members ?? undefined);
  }, [date, schedules, members, handleInitAttendance]);

  const targetMembers = (() => {
    if (!members || !schedules) return [];

    const schedule = schedules.find((s) => s.dateOnly.equals(dateOnly));
    if (!schedule)
      return members.filter((m) => {
        // membershipStatusPeriods に基づいてフィルタリング
        const statusPeriod = m.statusAt(date!);
        const status = statusPeriod?.status;
        return !status || status.isAttendanceTarget;
      });

    const targetGenerations = schedule.generations;
    const includeGroups = schedule.groups;
    const excludeGroups = schedule.excludeGroups;

    return members.filter((m) => {
      // membershipStatusPeriods に基づいてフィルタリング
      const statusPeriod = m.statusAt(date!);
      const status = statusPeriod?.status;
      if (status && !status.isAttendanceTarget) {
        return false;
      }

      const groups = m.groups ?? [];
      const hasGroup = (ids: readonly string[]) =>
        ids.some((gid) => groups.some((g) => g.id === gid));

      const generationMatch =
        targetGenerations === null || targetGenerations.includes(m.generation);
      const groupMatch = includeGroups === null || hasGroup(includeGroups);
      const isExcluded = excludeGroups !== null && hasGroup(excludeGroups);

      return generationMatch && groupMatch && !isExcluded;
    });
  })();

  const groupedMembers = targetMembers.reduce((map, member) => {
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
      const index = attendanceStatuses.indexOf(current) || 0;
      const nextStatus = attendanceStatuses[(index + 1) % attendanceStatuses.length];
      newMap.set(memberId, nextStatus);
      console.log(newMap);
      return newMap;
    });
  };

  const handleSubmit = async () => {
    if (!members) return;

    // 表示されているメンバー（targetMembers）
    const visibleMembers = targetMembers.filter((m) => m.part === part);

    // 非表示のメンバー（isAttendanceTargetがfalseのメンバー）
    const hiddenMembers = members.filter((m) => {
      if (m.part !== part) return false;
      const statusPeriod = m.statusAt(date!);
      const status = statusPeriod?.status as MembershipStatus | undefined;
      // isAttendanceTarget が明示的に false であり、かつ defaultAttendance が空文字でないもののみ送信対象にする
      return status?.isAttendanceTarget === false && (status.defaultAttendance ?? '') !== '';
    });

    // 表示されているメンバーの出欠データ
    const visibleAttendanceData = visibleMembers.map((member) => ({
      member,
      attendance: attendanceMap.get(member.id)!,
      date: date!,
    }));

    // 非表示のメンバーの出欠データ（defaultAttendanceを自動送信）
    const hiddenAttendanceData = hiddenMembers.map((member) => ({
      member,
      attendance: attendanceMap.get(member.id) ?? '',
      date: date!,
    }));

    const attendanceData = [...visibleAttendanceData, ...hiddenAttendanceData];

    try {
      await Attendance.add(attendanceData);
      toast.success('送信しました');
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  const blurFreeInput = () => {
    if (freeInputRef.current && document.activeElement === freeInputRef.current) {
      freeInputRef.current.blur();
    }
  };

  const closePicker = () => {
    blurFreeInput();
    setPickerMemberId(null);
    setFreeInputMemberId(null);
    setPickerAnchorEl(null);
  };

  const closePickerFromFreeInput = (memberId?: string) => {
    blurFreeInput();
    setPickerMemberId(null);
    setPickerAnchorEl(null);
    if (memberId) {
      setSuppressHoverMemberId(memberId);
      window.setTimeout(() => {
        setSuppressHoverMemberId((prev) => (prev === memberId ? null : prev));
      }, 120);
    }
  };

  const handlePopoverExited = () => {
    if (freeInputMemberId !== null) {
      setFreeInputMemberId(null);
    }
  };

  const startLongPress = (memberId: string, anchorEl: HTMLElement) => {
    longPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      longPressRef.current = true;
      setPickerMemberId(memberId);
      setFreeInputMemberId(null);
      setPickerAnchorEl(anchorEl);
    }, 300);
  };

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

      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

            {!date ||
              (!schedules.find((s) => s.dateOnly.equals(dateOnly)) && (
                <Alert sx={{ mx: 3, mt: 3 }} severity="warning">
                  {date!.isSame(today, 'date') ? '本日' : date!.format('MM/DD')} は予定がありません
                </Alert>
              ))}

            <Grid container spacing={3} sx={{ p: 3, flexGrow: 1 }}>
              {(groupedMembers.get(part) || new Map()).size === 0 ? (
                <Grid size={{ xs: 12 }}>
                  <Typography color="text.secondary">対象の部員がいません。</Typography>
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
                          <Grid key={member.id} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
                            <Card sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h6" gutterBottom>
                                {member.name}
                              </Typography>

                              <>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  sx={{
                                    fontSize: '1.5rem',
                                    py: 1.3,
                                    height: 64,
                                    ...(suppressHoverMemberId === member.id
                                      ? { pointerEvents: 'none', transition: 'none' }
                                      : null),
                                  }}
                                  onClick={() => {
                                    if (longPressRef.current) {
                                      longPressRef.current = false;
                                      return;
                                    }
                                    closePicker();
                                    toggleAttendance(member.id);
                                  }}
                                  onMouseDown={(e) => startLongPress(member.id, e.currentTarget)}
                                  onTouchStart={(e) => startLongPress(member.id, e.currentTarget)}
                                  onMouseUp={() => clearTimeout(timeoutRef.current!)}
                                  onMouseLeave={() => clearTimeout(timeoutRef.current!)}
                                  onTouchEnd={() => clearTimeout(timeoutRef.current!)}
                                  onTouchCancel={() => clearTimeout(timeoutRef.current!)}
                                  {...(attendanceStatusColor[
                                    attendanceMap.get(member.id) || '出席'
                                  ] || defaultColor)}
                                >
                                  {attendanceMap.get(member.id) || '出席'}
                                </Button>

                                <Popover
                                  open={Boolean(pickerAnchorEl) && pickerMemberId === member.id}
                                  anchorEl={pickerAnchorEl}
                                  onClose={() => {
                                    if (freeInputMemberId === member.id) {
                                      closePickerFromFreeInput(member.id);
                                      return;
                                    }
                                    closePicker();
                                  }}
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                  disableRestoreFocus
                                >
                                  <Box sx={{ p: 1.5, width: 260, position: 'relative' }}>
                                    <Stack spacing={1}>
                                      <Grid container spacing={1}>
                                        {attendanceStatuses.map((status) => (
                                          <Grid key={status} size={{ xs: 6 }}>
                                            <Button
                                              fullWidth
                                              {...getStatusButtonProps(status, 'contained')}
                                              onClick={() => {
                                                setAttendanceMap((prev) => {
                                                  const newMap = new Map(prev);
                                                  newMap.set(member.id, status);
                                                  return newMap;
                                                });
                                                closePicker();
                                              }}
                                            >
                                              {status}
                                            </Button>
                                          </Grid>
                                        ))}
                                      </Grid>
                                      <Stack direction="row" spacing={1}>
                                        <Button
                                          fullWidth
                                          variant="contained"
                                          onClick={() => {
                                            setFreeInputMemberId(member.id);
                                            setPickerMemberId(member.id);
                                          }}
                                        >
                                          自由入力
                                        </Button>
                                        <Button fullWidth variant="outlined" onClick={closePicker}>
                                          閉じる
                                        </Button>
                                      </Stack>
                                    </Stack>

                                    {freeInputMemberId === member.id && (
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          inset: 0,
                                          p: 1.5,
                                          bgcolor: 'background.paper',
                                          zIndex: 1,
                                          borderRadius: 1,
                                          boxShadow: 3,
                                        }}
                                      >
                                        <Stack spacing={1}>
                                          <TextField
                                            autoFocus
                                            inputRef={freeInputRef}
                                            value={attendanceMap.get(member.id) || ''}
                                            onChange={(e) => {
                                              const nextValue = e.target.value;
                                              setAttendanceMap((prev) => {
                                                const newMap = new Map(prev);
                                                newMap.set(member.id, nextValue);
                                                return newMap;
                                              });
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                (e.currentTarget as HTMLInputElement).blur();
                                                closePickerFromFreeInput(member.id);
                                                return;
                                              }
                                              if (e.key === 'Escape') {
                                                setFreeInputMemberId(null);
                                              }
                                            }}
                                            inputProps={{
                                              style: { fontSize: '1.1rem', fontWeight: 600 },
                                            }}
                                          />
                                          <Stack direction="row" spacing={1}>
                                            <Button
                                              fullWidth
                                              variant="contained"
                                              onClick={() => closePickerFromFreeInput(member.id)}
                                            >
                                              決定
                                            </Button>
                                            <Button
                                              fullWidth
                                              variant="outlined"
                                              onClick={() => setFreeInputMemberId(null)}
                                            >
                                              戻る
                                            </Button>
                                          </Stack>
                                        </Stack>
                                      </Box>
                                    )}
                                  </Box>
                                </Popover>
                              </>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  ),
                )
              )}
            </Grid>
            <Stack
              sx={{ p: 2 }}
              justifyContent="space-between"
              flexDirection="row"
              alignItems="end"
            >
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="ja"
                localeText={jaJP.components.MuiLocalizationProvider.defaultProps.localeText}
              >
                <DatePicker
                  label="日付"
                  slotProps={{
                    calendarHeader: { format: 'YYYY年M月' },
                    actionBar: { actions: ['today'] },
                    toolbar: { toolbarFormat: 'M月D日' },
                  }}
                  views={['year', 'month', 'day']}
                  value={date}
                  onChange={setDate}
                />
              </LocalizationProvider>
              <Button variant="contained" color="inherit" onClick={handleSubmit}>
                送信
              </Button>
            </Stack>
          </>
        ) : (
          <Loading />
        )}
      </Card>
    </DashboardContent>
  );
}
