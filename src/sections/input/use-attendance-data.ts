import type { Dayjs } from 'dayjs';
import type Part from 'src/abc/part';
import type MembershipStatus from 'src/api/member-status';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { DateOnly } from 'src/utils/date-only';
import { DayOfWeek } from 'src/utils/day-of-week';

import Member from 'src/api/member';
import Schedule from 'src/api/schedule';
import Attendance from 'src/api/attendance';
import { APIError } from 'src/abc/api-error';
import ScheduleType from 'src/abc/schedule-type';

import { attendanceStatuses } from './attendance-config';

export type AttendanceData = {
  member: Member;
  attendance: string;
  date: Dayjs;
};

export type AttendanceDataState = {
  today: Dayjs;
  date: Dayjs | null;
  setDate: (next: Dayjs | null) => void;
  dateOnly: DateOnly;
  part: Part;
  setPart: (next: Part) => void;
  members: Member[] | null;
  schedules: Schedule[] | null;
  attendanceMap: Map<string, string>;
  setAttendanceMap: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  targetMembers: Member[];
  groupedMembers: Map<Part, Map<number, Member[]>>;
  toggleAttendance: (memberId: string) => void;
  handleSubmit: (overwrite?: boolean) => Promise<void>;
  existsAttendance: boolean;
  setExistsAttendance: React.Dispatch<React.SetStateAction<boolean>>;
};

const sortMembers = (members: Member[]) =>
  members.sort((a, b) => {
    if (a.generation > b.generation) return 1;
    if (a.generation < b.generation) return -1;
    if (a.nameKana > b.nameKana) return 1;
    if (a.nameKana < b.nameKana) return -1;
    return 0;
  });

export function useAttendanceData(initPart: Part): AttendanceDataState {
  const today = dayjs.tz();

  const [date, setDate] = useState<Dayjs | null>(today);
  const dateOnly = useMemo(() => DateOnly.fromDayjs(date!), [date]);
  const week = useMemo(() => DayOfWeek.fromDayjs(date!), [date]);

  const [part, setPart] = useState(initPart);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Map<string, string>>(new Map());

  const [existsAttendance, setExistsAttendance] = useState(false);

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
        setMembers(sortMembers(m));

        handleInitAttendance(s, m);
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
      }
    })();
  }, []);

  useEffect(() => {
    handleInitAttendance(schedules ?? undefined, members ?? undefined);
  }, [date, schedules, members, handleInitAttendance]);

  const targetMembers = useMemo(() => {
    if (!members || !schedules) return [];

    const schedule = schedules.find((s) => s.dateOnly.equals(dateOnly));
    if (!schedule)
      return members.filter((m) => {
        const statusPeriod = m.statusAt(date!);
        const status = statusPeriod?.status;
        return !status || status.isAttendanceTarget;
      });

    const targetGenerations = schedule.generations;
    const includeGroups = schedule.groups;
    const excludeGroups = schedule.excludeGroups;

    return members.filter((m) => {
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
  }, [members, schedules, dateOnly, date]);

  const groupedMembers = useMemo(() => targetMembers.reduce((map, member) => {
      if (!map.has(member.part)) map.set(member.part, new Map<number, Member[]>());
      const generationMap = map.get(member.part)!;
      if (!generationMap.has(member.generation)) generationMap.set(member.generation, []);
      generationMap.get(member.generation)!.push(member);
      return map;
    }, new Map<Part, Map<number, Member[]>>()), [targetMembers]);

  const toggleAttendance = (memberId: string) => {
    setAttendanceMap((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(memberId) || '出席';
      const index = attendanceStatuses.indexOf(current) || 0;
      const nextStatus = attendanceStatuses[(index + 1) % attendanceStatuses.length];
      newMap.set(memberId, nextStatus);
      return newMap;
    });
  };

  const handleSubmit = async (overwrite: boolean = false) => {
    if (!members) return;

    const visibleMembers = targetMembers.filter((m) => m.part === part);

    const hiddenMembers = members.filter((m) => {
      if (m.part !== part) return false;
      const statusPeriod = m.statusAt(date!);
      const status = statusPeriod?.status as MembershipStatus | undefined;
      return status?.isAttendanceTarget === false && (status.defaultAttendance ?? '') !== '';
    });

    const visibleAttendanceData: AttendanceData[] = visibleMembers.map((member) => ({
      member,
      attendance: attendanceMap.get(member.id)!,
      date: date!,
    }));

    const hiddenAttendanceData: AttendanceData[] = hiddenMembers.map((member) => ({
      member,
      attendance: attendanceMap.get(member.id) ?? '',
      date: date!,
    }));

    const attendanceData = [...visibleAttendanceData, ...hiddenAttendanceData];

    try {
      setExistsAttendance(false);
      await Attendance.add(attendanceData, overwrite);
      toast.success('送信しました');
    } catch (e) {
      if (e instanceof APIError && e.code.code === 200) {
        setExistsAttendance(true);
        return;
      }

      toast.error(APIError.createToastMessage(e));
    }
  };

  return {
    today,
    date,
    setDate,
    dateOnly,
    part,
    setPart,
    members,
    schedules,
    attendanceMap,
    setAttendanceMap,
    targetMembers,
    groupedMembers,
    toggleAttendance,
    handleSubmit,
    existsAttendance,
    setExistsAttendance,
  };
}
