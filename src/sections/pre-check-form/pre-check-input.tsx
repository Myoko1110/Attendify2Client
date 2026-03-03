import type PreCheck from 'src/api/pre-check';
import type { EventInput, EventClickArg, EventContentArg } from '@fullcalendar/core';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useRef, useState, useEffect } from 'react';
import jaLocale from '@fullcalendar/core/locales/ja';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Grid, Stack, Popover } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate, isBetweenDate, defaultTimezone } from 'src/utils/format-time';

import PreAttendance from 'src/api/pre-attendance';

import Group from '../../api/group';
import Schedule from '../../api/schedule';
import { useGrade } from '../../hooks/grade';
import { APIError } from '../../abc/api-error';
import {
  preCheckAttendanceStatuses,
  getPreCheckStatusButtonProps,
} from './pre-check-config';
import {
  toDateKey,
  requiresReason,
  attendanceEventColors,
  getDefaultAttendanceForDate,
} from './pre-check-attendance-utils';

import type Member from '../../api/member';
import type { WeeklyParticipation } from '../../api/member';

export function PreCheckInput({
  preCheck,
  weeklyParticipations,
  member,
  preAttendances = [],
  mode,
  onSubmitted,
}: {
  preCheck: PreCheck;
  weeklyParticipations: WeeklyParticipation[];
  member: Member;
  preAttendances?: PreAttendance[];
  mode: 'create' | 'edit';
  onSubmitted?: (result: PreAttendance[]) => void;
}) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [group, setGroup] = useState<Group[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { attendance: string; reason?: string }>
  >({});

  const [pickerAnchorEl, setPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [pickerDateKey, setPickerDateKey] = useState<string | null>(null);
  const [pickerStatus, setPickerStatus] = useState<string | null>(null);
  const [pickerReason, setPickerReason] = useState('');
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentEventRef = useRef<HTMLElement | null>(null);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  const grade = useGrade();

  const isEditableDate = (date: dayjs.Dayjs) => {
    if (mode !== 'edit') return true;
    const deadline = date.startOf('day').subtract(preCheck.editDeadlineDays, 'day');
    const today = dayjs().startOf('day');
    return today.isSame(deadline, 'day') || today.isBefore(deadline, 'day');
  };

  const isTargetSchedule = (schedule: Schedule) => {
    if (!schedule.isPreAttendanceTarget) return false;

    const statusPeriod = member.statusAt(schedule.date);
    const status = statusPeriod?.status;
    if (status && !status.isAttendanceTarget) {
      return false;
    }

    const groups = member.groups ?? [];
    const hasGroup = (ids: readonly string[]) =>
      ids.some((gid) => groups.some((g) => g.id === gid));

    const targetGenerations = schedule.generations;
    const includeGroups = schedule.groups;
    const excludeGroups = schedule.excludeGroups;

    const generationMatch = targetGenerations === null || targetGenerations.includes(member.generation);
    const groupMatch = includeGroups === null || hasGroup(includeGroups);
    const isExcluded = excludeGroups !== null && hasGroup(excludeGroups);

    return generationMatch && groupMatch && !isExcluded;
  };

  useEffect(() => {
    (async () => {
      const _s = await Schedule.get();
      setSchedules(
        _s.filter((s) =>
          isBetweenDate(s.date, preCheck.startDate.toDayjs(), preCheck.endDate.toDayjs()),
        ),
      );

      const _g = await Group.getAll();
      setGroup(_g);
    })();
  }, [preCheck.endDate, preCheck.startDate]);

  useEffect(() => {
    setEvents(
      schedules.map((schedule) => {
        const dateKey = toDateKey(schedule.date);
        const attendanceEntry = attendanceMap[dateKey];
        const attendance = attendanceEntry?.attendance;
        const attendanceColor = attendance ? attendanceEventColors[attendance] : null;

        return {
          start: schedule.date.format(),
          title: schedule.type.displayName,
          color: attendanceColor?.color ?? '#C2CFDB',
          textColor: attendanceColor?.textColor ?? '#001A32',
          allDay: true,
          extendedProps: {
            type: schedule.type,
            schedule,
          },
        } as EventInput;
      }),
    );
  }, [schedules, attendanceMap]);

  useEffect(() => {
    if (mode !== 'edit' || preAttendances.length === 0) return;

    setAttendanceMap((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next: Record<string, { attendance: string; reason?: string }> = {};
      preAttendances.forEach((attendance) => {
        const dateKey = toDateKey(attendance.date);
        next[dateKey] = {
          attendance: attendance.attendance,
          reason: attendance.reason ?? '',
        };
      });
      return next;
    });
  }, [mode, preAttendances]);

  useEffect(() => {
    if (schedules.length === 0 || weeklyParticipations.length === 0) return;

    setAttendanceMap((prev) => {
      const next = { ...prev };
      schedules.forEach((schedule) => {
        const dateKey = toDateKey(schedule.date);
        if (next[dateKey]) return;
        const defaultAttendance = getDefaultAttendanceForDate(schedule, weeklyParticipations);
        if (defaultAttendance) next[dateKey] = { attendance: defaultAttendance };
      });
      return next;
    });
  }, [schedules, weeklyParticipations]);

  const openPicker = (anchorEl: HTMLElement, dateKey: string) => {
    const currentEntry = attendanceMap[dateKey];
    setPickerAnchorEl(anchorEl);
    setPickerDateKey(dateKey);
    setPickerStatus(currentEntry?.attendance ?? null);
    setPickerReason(currentEntry?.reason ?? '');
    setPickerError(null);
  };

  const closePicker = () => {
    setPickerAnchorEl(null);
    setPickerDateKey(null);
    setPickerStatus(null);
    setPickerReason('');
    setPickerError(null);
  };

  const handleEventClick = (e: EventClickArg) => {
    const eventDateKey = toDateKey(e.event.start);
    const schedule = schedules.find((i) => toDateKey(i.date) === eventDateKey);
    if (!schedule) return;
    if (!isEditableDate(schedule.date)) return;
    if (!isTargetSchedule(schedule)) return;

    currentEventRef.current = e.el;
    setEditSchedule(schedule);
    openPicker(e.el, eventDateKey);
  };

  const handleDateClick = (e: DateClickArg) => {
    const dateKey = toDateKey(e.date);
    const schedule = schedules.find((i) => toDateKey(i.date) === dateKey);
    if (!schedule) return;
    if (!isEditableDate(schedule.date)) return;
    if (!isTargetSchedule(schedule)) return;

    setEditSchedule(schedule);
    openPicker(e.dayEl, dateKey);
  };

  const handleSetAttendance = (status: string) => {
    if (!pickerDateKey) return;

    if (!requiresReason(status)) {
      setAttendanceMap((prev) => ({
        ...prev,
        [pickerDateKey]: { attendance: status, reason: '' },
      }));
      closePicker();
      return;
    }

    setPickerStatus(status);
    setPickerError(null);
  };

  const handleApplyAttendance = () => {
    if (!pickerDateKey || !pickerStatus) return;
    if (requiresReason(pickerStatus) && !pickerReason.trim()) {
      setPickerError('理由を入力してください。');
      return;
    }

    setAttendanceMap((prev) => ({
      ...prev,
      [pickerDateKey]: {
        attendance: pickerStatus,
        reason: requiresReason(pickerStatus) ? pickerReason.trim() : '',
      },
    }));
    closePicker();
  };

  const buildPreAttendancePosts = () =>
    schedules.flatMap((schedule) => {
      if (!isTargetSchedule(schedule)) return [];

      const dateKey = toDateKey(schedule.date);
      const entry = attendanceMap[dateKey];
      if (!entry?.attendance) return [];

      return [
        {
          member,
          attendance: entry.attendance,
          reason: requiresReason(entry.attendance) ? (entry.reason ?? null) : null,
          date: schedule.date,
          preCheckId: preCheck.id,
        },
      ];
    });

  const getIssueForDate = (dateKey: string) => {
    const schedule = schedules.find((s) => toDateKey(s.date) === dateKey);
    if (schedule && !isTargetSchedule(schedule)) return null;

    const entry = attendanceMap[dateKey];
    if (!entry?.attendance) {
      return '未入力の予定があります。すべての予定に出欠を入力してください。';
    }
    if (requiresReason(entry.attendance) && !entry.reason?.trim()) {
      return '理由の入力が必要な予定があります。理由を入力してください。';
    }
    return null;
  };

  const getSubmitIssue = () => {
    for (const schedule of schedules) {
      const dateKey = toDateKey(schedule.date);
      const issue = getIssueForDate(dateKey);
      if (issue) return issue;
    }
    return null;
  };

  const submitIssue = getSubmitIssue();
  const hasSubmitError = submitAttempted && Boolean(submitIssue);

  const handleSubmit = async () => {
    if (submitIssue || isSubmitting) {
      setSubmitAttempted(true);
      return;
    }
    const payload = buildPreAttendancePosts();
    if (payload.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await PreAttendance.add(payload, true);
      onSubmitted?.(result);
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const dateKey = toDateKey(eventInfo.event.start);
    const schedule = schedules.find((s) => toDateKey(s.date) === dateKey);
    const issue = getIssueForDate(dateKey);
    const isEditable = isEditableDate(dayjs(eventInfo.event.start));
    const isTarget = schedule ? isTargetSchedule(schedule) : true;
    const targetDisplay = schedule?.getDisplayTarget(grade ?? [], group);

    return (
      <Box
        sx={(theme) => ({
          px: 1,
          py: 0.5,
          borderRadius: 0.75,
          border: hasSubmitError && issue ? '2px solid #d32f2f' : '1px solid transparent',
          opacity: !isTarget ? 0.9 : 1,
          [theme.breakpoints.down('md')]: {
            px: 0.5,
            py: 0.25,
          },
        })}
      >
        <Box
          sx={(theme) => ({
            [theme.breakpoints.up('md')]: {
              display: 'flex',
              justifyContent: 'space-between',
            },
          })}
        >
          <Typography
            sx={(theme) => ({
              [theme.breakpoints.down('md')]: {
                fontSize: '0.8em',
              },
            })}
            variant="body2"
          >
            {!isTarget ? '対象外' : attendanceMap[dateKey]?.attendance || '未入力'}
          </Typography>
          {mode === 'edit' && !isEditable && (
            <Box
              sx={(theme) => ({
                ml: 4,
                fontSize: '0.8em',
                color: '#9a0007',
                [theme.breakpoints.down('md')]: { fontSize: '0.55em', ml: 0 },
              })}
            >
              編集不可
            </Box>
          )}
        </Box>
        <Box
          sx={(theme) => ({
            fontSize: '0.75em',
            color: '#666',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            [theme.breakpoints.down('md')]: {
              fontSize: '0.55em',
            },
          })}
        >
          {eventInfo.event.title}
          {schedule && targetDisplay ? (<><br />{targetDisplay}</>) : ''}
        </Box>
      </Box>
    );
  };

  const submitButtonLabel = isSubmitting
    ? mode === 'edit'
      ? '更新中...'
      : '送信中...'
    : mode === 'edit'
      ? '更新'
      : '送信';

  return (
    <>
      <style>
        {`
          .non-target-schedule {
            opacity: 0.5;
            pointer-events: auto;
            cursor: not-allowed !important;
          }
          .non-target-schedule .fc-event-main {
            opacity: 1;
          }
        `}
      </style>
      <Box
        sx={{
          mb: 5,
        }}
      >
        <Typography variant="body2">
          {fDate(preCheck.startDate.toDayjs())} ~ {fDate(preCheck.endDate.toDayjs())}
        </Typography>
        <Typography variant="h3">事前出欠</Typography>

        <Typography variant="body2" my={1}>
          {preCheck.description}
        </Typography>
      </Box>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={preCheck.startDate.toString()}
        locales={[jaLocale]}
        locale="ja"
        timeZone={defaultTimezone}
        headerToolbar={{
          left: 'prev,title,next',
          center: '',
          right: 'today',
        }}
        dayCellContent={(arg) => arg.date.getDate()}
        height="auto"
        events={events}
        eventContent={renderEventContent}
        eventClassNames={(arg) => {
          const dateKey = toDateKey(arg.event.start);
          const schedule = schedules.find((s) => toDateKey(s.date) === dateKey);
          if (schedule && !isTargetSchedule(schedule)) {
            return ['non-target-schedule'];
          }
          return [];
        }}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        expandRows
      />

      <Popover
        open={Boolean(pickerAnchorEl) && Boolean(pickerDateKey)}
        anchorEl={pickerAnchorEl}
        onClose={handleApplyAttendance}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        disableRestoreFocus
      >
        <Box sx={{ p: 1.5, width: 260 }}>
          <Stack spacing={1}>
            <Typography variant="h5">
              {editSchedule?.date
                ? `${editSchedule.date.month() + 1}/${editSchedule.date.date()}`
                : ''}
            </Typography>
            <Grid container spacing={1}>
              {preCheckAttendanceStatuses.map((status) => {
                const isSelected = Boolean(pickerStatus) && pickerStatus === status;
                const isDimmed = Boolean(pickerStatus) && !isSelected;
                const statusButtonProps = getPreCheckStatusButtonProps(status, 'contained');
                const baseSx = Array.isArray(statusButtonProps.sx)
                  ? statusButtonProps.sx
                  : statusButtonProps.sx
                    ? [statusButtonProps.sx]
                    : [];
                const mergedSx = isDimmed
                  ? [...baseSx, { opacity: 0.4, filter: 'grayscale(0.4)' }]
                  : baseSx;

                return (
                  <Grid key={status} size={{ xs: 6 }}>
                    <Button
                      fullWidth
                      {...statusButtonProps}
                      onClick={() => handleSetAttendance(status)}
                      sx={mergedSx}
                    >
                      {status}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
            {requiresReason(pickerStatus) && (
              <TextField
                label="理由"
                value={pickerReason}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setPickerReason(nextValue);
                  if (pickerError && nextValue.trim()) {
                    setPickerError(null);
                  }
                }}
                multiline
                minRows={2}
                fullWidth
                error={Boolean(pickerError)}
                helperText={pickerError ?? ' '}
              />
            )}
            <Button
              fullWidth
              variant="contained"
              onClick={handleApplyAttendance}
              disabled={!pickerStatus || (requiresReason(pickerStatus) && !pickerReason.trim())}
            >
              決定
            </Button>
          </Stack>
        </Box>
      </Popover>
      <Box>
        <Typography variant="caption">
          予定をクリックして、出欠を変更します。すべて入力したら、下の送信ボタンを押します。
          <br />
          講習登録のある曜日は、デフォルトで講習が選択されます。講習がない日は変更して下さい。
          <br />
          {preCheck.editDeadlineDays
            ? `回答後は${preCheck.editDeadlineDays}日前までの予定が編集できます。`
            : ''}
        </Typography>
      </Box>

      <Stack alignItems="flex-end">
        {hasSubmitError && submitIssue && (
          <Typography variant="caption" color="error" mt={1}>
            {submitIssue}
          </Typography>
        )}
        <Button
          color="inherit"
          variant="contained"
          onClick={handleSubmit}
          disabled={hasSubmitError || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ mt: 2 }}
        >
          {submitButtonLabel}
        </Button>
      </Stack>
    </>
  );
}
