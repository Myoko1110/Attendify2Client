import type { Dayjs } from 'dayjs';
import type { APIError } from 'src/abc/api-error';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';

import { useGrade } from 'src/hooks/grade';

import { Month } from 'src/utils/month';
import Attendances from 'src/utils/attendances';

import Part from 'src/abc/part';
import Member from 'src/api/member';
import Schedule from 'src/api/schedule';
import Attendance from 'src/api/attendance';
import { AttendanceRate } from 'src/api/attendance-rate';

import { Iconify } from 'src/components/iconify';
import { Loading } from 'src/components/loading';

import { AttendanceFilter } from './filter';


interface AttendanceStatus {
  label: string;
  style: string;
  value: number;
  counted: boolean;
}

const attendanceStatuses: Record<string, AttendanceStatus> = {
  '出席': { label: '出席', style: 'bg-green-200 text-green-900', value: 1, counted: true },
  '欠席': { label: '欠席', style: 'bg-red-200 text-red-900', value: 0, counted: true },
  '遅刻': { label: '遅刻', style: 'bg-orange-200 text-orange-900', value: 0.5, counted: true },
  '早退': { label: '早退', style: 'bg-amber-200 text-amber-900', value: 0.5, counted: true },
  '講習': { label: '講習', style: 'bg-blue-200 text-blue-900', value: 1, counted: false },
  '無欠': { label: '無欠', style: 'bg-[repeating-linear-gradient(45deg,#9b9162,#9b9162_8px,#646464_8px,#646464_16px)] text-white', value: 0, counted: true },
};

export const getAttendanceStyle = (label: string): string => {
  if (attendanceStatuses[label]) {
    return attendanceStatuses[label].style;
  }
  return 'bg-gray-200 text-gray-900';
};

export const AttendanceCellEditor = ({
  attendance,
  onSave,
  onDelete,
  onClose,
  anchorEl,
  isEditing
}: {
  attendance: Attendance | undefined;
  onSave: (value: string, update: boolean) => void;
  onDelete: () => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  isEditing: boolean;
}) => {
  const [value, setValue] = useState('');

  const [original, setOriginal] = useState('');
  const [update, setUpdate] = useState(false);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim(), update);
      onClose();
    }
  };

  const handleClose = () => {
    if (value !== original) {
      handleSave();
    } else {
      onClose();
    }
  }

  const handlePresetClick = (preset: string) => {
    setValue(preset);
    onSave(preset, update);
    onClose();
  };

  useEffect(() => {
    setValue(attendance?.attendance || '');
    setOriginal(attendance?.attendance || '');
    setUpdate(!!attendance);
  }, [attendance])

  return (
    <Popover
      open={isEditing}
      onClose={handleClose}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      sx={{
        "& .MuiPopover-paper": {
          mt: 1,
        },
      }}
    >
      <div className="flex flex-col gap-2 p-1 relative w-24">
        <div className="flex gap-0.5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
            className="w-17 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 flex-1"
            placeholder="出欠を入力"
          />
          <IconButton
            onClick={() => {
              onDelete();
              onClose();
            }}
            color="error"
          >
            <Iconify icon="solar:trash-bin-minimalistic-2-bold" />
          </IconButton>
        </div>
        <div className="grid grid-cols-2 gap-1 max-h-[150px] overflow-y-auto">
          {Object.entries(attendanceStatuses).map(([key, status]) => (
            <button
              key={key}
              onClick={() => handlePresetClick(status.label)}
              className={`${status.style} px-2 py-1 rounded text-xs font-bold hover:opacity-80 text-center cursor-pointer`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </Popover>
  );
};

export interface AttendanceFilterState {
  grades: number[];              // 学年（generation）
  competition: boolean | null;   // null = 全体
}

export const AttendanceTable = ({
  filterOpen
  }: {
  filterOpen: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}) => {
  const grade = useGrade();

  // status
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [isBaseDataFetching, setIsBaseDataFetching] = useState(true);
  const [isCurrentMonthAttendanceFetching, setIsCurrentMonthAttendanceFetching] = useState(false);
  const [isRendering, setIsRendering] = useState(true);
  const [editingCell, setEditingCell] = useState<{
    member: Member;
    date: Dayjs;
    attendance?: Attendance;
    anchorEl: HTMLElement;
  } | null>(null);

  const [filter, setFilter] = useState<AttendanceFilterState>({
    grades: grade?.map(g => g.generation) || [],
    competition: null,
  });
  const [isFiltering, setIsFiltering] = useState(false);

  // data
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [attendanceRates, setAttendanceRates] = useState<AttendanceRate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);

  // current month
  const currentMonth = useMemo(() => Month.now(), []);
  const currentMonthRef = useRef<HTMLTableCellElement | null>(null);

  /** スケジュールから月を抽出 */
  const months: Month[] = useMemo(() => {
    const uniqueMonths: Month[] = [];
    schedule.forEach((s) => {
      if (!uniqueMonths.some((m) => m.equals(s.month))) {
        uniqueMonths.push(s.month);
      }
    });
    return uniqueMonths.sort((a, b) => a > b ? 1 : -1);
  }, [schedule]);

  const filteredMembers = useMemo(() => members.filter(m => {
      // 学年フィルター
      if (!filter.grades.includes(m.generation)) return false;

      // コンクールフィルター
      if (filter.competition !== null) {
        if (m.isCompetitionMember !== filter.competition) return false;
      }

      return true;
    }), [members, filter]);

  const handleFilterChange = useCallback(
    async (next: AttendanceFilterState) => {
      setIsFiltering(true);

      // 描画ブロックを先に出す
      await new Promise(resolve => setTimeout(resolve, 0));

      setFilter(next);

      // フィルター後の再計算を待たせたい場合
      await new Promise(resolve => setTimeout(resolve, 0));

      setIsFiltering(false);
    },
    []
  );


  // 出席データのマップ（高速検索用）
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendanceData.forEach(a => {
      const key = `${a.memberId}-${a.date.format('YYYY-MM-DD')}`;
      map.set(key, a);
    });
    return map;
  }, [attendanceData]);

  // スケジュールのマップ（高速検索用）
  const scheduleMap = useMemo(() => {
    const map = new Map<string, number[]>();
    schedule.forEach(s => {
      const monthKey = s.month.toString();
      if (!map.has(monthKey)) {
        map.set(monthKey, []);
      }
      map.get(monthKey)!.push(s.date.date());
    });
    map.forEach(days => days.sort((a, b) => a - b));
    return map;
  }, [schedule]);

  // 出席率のマップ（高速検索用）
  const attendanceRateMap = useMemo(() => {
    const map = new Map<string, number | null>();
    attendanceRates.forEach(r => {
      const key = `${r.targetType}-${r.targetId || 'null'}-${r.actual}-${r.month.toString()}`;
      map.set(key, r.rate);
    });
    return map;
  }, [attendanceRates]);

  // 計算済み出席率のキャッシュ
  const [calculatedRateCache, setCalculatedRateCache] = useState<Map<string, number | null>>(new Map());

  // データの取得
  useEffect(() => {
    (async () => {
      await Promise.all([
        fetchMember(),
        fetchSchedule(),
        fetchAttendanceRate(),
      ]).catch((e: APIError) => {
        toast.error(`データの読み込みに失敗しました: ${e.description}`);
      }).finally(() => {
        setIsBaseDataFetching(false);
      });
    })();

    const initialExpanded: Record<string, boolean> = {};
    Part.COMMON.forEach(part => {
      initialExpanded[part.value] = true;
    });
    setExpandedParts(initialExpanded);
  }, []);

  // 出席データが変更されたらキャッシュをクリア
  useEffect(() => {
    setCalculatedRateCache(new Map());
  }, [attendanceData]);

  // fetch系
  const fetchMember = async () => {
    const _members = await Member.get();
    setMembers(_members);
  }

  const fetchSchedule = async () => {
    const _schedules = await Schedule.get();
    setSchedule(_schedules);
  }

  const fetchAttendanceRate = async () => {
    const _attendanceRates = await AttendanceRate.get();
    setAttendanceRates(_attendanceRates);
    setIsBaseDataFetching(true);
  };

  const fetchMonthlyAttendance = useCallback(async (month: Month) => {
    const monthKey = month.toString();
    if (loadedMonths.has(monthKey)) return;

    const newAttendanceData = await Attendance.get({ month });
    setAttendanceData(prev => new Attendances(...prev, ...newAttendanceData));
    setLoadedMonths(prev => new Set([...prev, monthKey]));
  }, [loadedMonths]);

  useEffect(() => {
    (async () => {
      if (!isBaseDataFetching && !loadedMonths.has(currentMonth.toString())) {
        await fetchMonthlyAttendance(currentMonth)
        setExpandedMonths({ [currentMonth.toString()]: true });
        setIsCurrentMonthAttendanceFetching(false);
      }
    })();
  }, [isBaseDataFetching, currentMonth, loadedMonths, fetchMonthlyAttendance]);

  /** その月のスケジュールを取得 */
  const getScheduledDaysInMonth = useCallback((month: Month): number[] => scheduleMap.get(month.toString()) || [], [scheduleMap]);

  /** 部員・日にちから出欠を取得 */
  const getAttendance = useCallback((member: Member, date: Dayjs): Attendance | undefined => {
    const key = `${member.id}-${date.format('YYYY-MM-DD')}`;
    return attendanceMap.get(key);
  }, [attendanceMap]);

  /** その月の出席率を計算 */
  const calcMonthRate = useCallback((targetType: string, targetId: string | null, month: Month): number | null => {
    const scheduledDays = getScheduledDaysInMonth(month);
    if (scheduledDays.length === 0) return null;

    let targetMembers: Member[] = [];
    if (targetType === 'all') {
      targetMembers = members;
    } else if (targetType === 'part') {
      targetMembers = members.filter(m => m.part.value === targetId);
    } else if (targetType === 'member') {
      targetMembers = members.filter(m => m.id === targetId);
    }

    if (targetMembers.length === 0) return null;

    const statusArray: Attendance[] = [];
    targetMembers.forEach(member => {
      scheduledDays.forEach(day => {
        const date = dayjs(new Date(month.year, month.month, day));
        const attendance = getAttendance(member, date);
        if (attendance && attendanceStatuses[attendance.attendance]?.counted) {
          statusArray.push(attendance);
        }
      });
    });

    if (statusArray.length === 0) return null;
    return new Attendances(...statusArray).calcRate();
  }, [members, getScheduledDaysInMonth, getAttendance]);

  /** タイプ・ID・月から出席率を取得 */
  const getAttendanceRate = useCallback((targetType: string, targetId: string | null, month: Month): number | null => {
    const monthKey = month.toString();
    const cacheKey = `${targetType}-${targetId || 'null'}-${monthKey}`;

    // 月が読み込まれている場合
    if (loadedMonths.has(monthKey)) {
      // キャッシュをチェック
      if (calculatedRateCache.has(cacheKey)) {
        return calculatedRateCache.get(cacheKey)!;
      }

      // 計算して保存
      const rate = calcMonthRate(targetType, targetId, month);
      setCalculatedRateCache(prev => new Map(prev).set(cacheKey, rate));
      return rate;
    }

    // 月が未読み込みの場合は事前計算データを使用
    const rateKey = `${targetType}-${targetId || 'null'}-false-${monthKey}`;
    return attendanceRateMap.get(rateKey) ?? null;
  }, [loadedMonths, calculatedRateCache, calcMonthRate, attendanceRateMap]);

  /** 日ごとの出席率を計算 */
  const calcDayRate = useCallback((targetType: string, targetId: string | null, date: Dayjs): number | null => {
    let targetMembers: Member[] = [];

    if (targetType === 'all') {
      targetMembers = members;
    } else if (targetType === 'part') {
      targetMembers = members.filter(m => m.part.value === targetId);
    }

    if (targetMembers.length === 0) return null;

    const attendances = targetMembers
      .map(m => getAttendance(m, date))
      .filter((a): a is Attendance => a !== undefined && attendanceStatuses[a.attendance]?.counted);

    return new Attendances(...attendances).calcRate()
  }, [members, getAttendance]);

  /** パートを開閉 */
  const togglePart = useCallback((partValue: string) => {
    setExpandedParts(prev => ({ ...prev, [partValue]: !prev[partValue] }));
  }, []);

  /** 月を開閉 */
  const toggleMonth = useCallback((month: Month) => {
    const monthKey = month.toString();
    const willExpand = !expandedMonths[monthKey];

    setExpandedMonths(prev => ({ ...prev, [monthKey]: willExpand }));

    if (willExpand && !loadedMonths.has(monthKey)) {
      fetchMonthlyAttendance(month);
    }
  }, [expandedMonths, loadedMonths]);

  /** 出欠を作成 */
  const handleCreateAttendance = useCallback(async (member: Member, date: Dayjs, value: string) => {
    const result = await Attendance.addOne({
      member,
      attendance: value,
      date,
    });
    setAttendanceData((prev) => [...prev, result]);
  }, [attendanceData]);

  /** 出欠を更新 */
  const handleUpdateAttendance = useCallback(async (member: Member, date: Dayjs, value: string) => {
    const key = `${member.id}-${date.format('YYYY-MM-DD')}`;
    const current = attendanceMap.get(key);

    await current?.update(value);
  }, [attendanceMap]);

  /** 出欠を削除 */
  const handleDeleteAttendance = useCallback(async (member: Member, date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');

    setAttendanceData(prev =>
      prev.filter(
        a => !(a.memberId === member.id && a.date.format('YYYY-MM-DD') === dateStr)
      )
    );

    const current = attendanceMap.get(`${member.id}-${dateStr}`);
    await current?.remove();
  }, [attendanceMap]);

  /** パートごとにグループ分けした部員データ */
  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers].filter(member => member.part !== Part.ADVISOR).sort((a, b) => {
      const partCompare = a.part.localeCompare(b.part);
      if (partCompare !== 0) {
        return partCompare;
      }
      if (a.generation !== b.generation) {
        return a.generation - b.generation;
      }
      return a.nameKana.localeCompare(b.nameKana, 'ja');
    });

    const grouped: Record<string, Member[]> = {};
    sorted.forEach(member => {
      const partValue = member.part.value;
      if (!grouped[partValue]) {
        grouped[partValue] = [];
      }
      grouped[partValue].push(member);
    });

    return grouped;
  }, [filteredMembers]);
  useEffect(() => {
    if (!isBaseDataFetching && !isCurrentMonthAttendanceFetching) {
      const id = requestAnimationFrame(() => {
        setIsRendering(false);
      });

      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [isBaseDataFetching, isCurrentMonthAttendanceFetching]);

  return (
    <div className="w-full relative">
      {(isBaseDataFetching || isCurrentMonthAttendanceFetching || isRendering) && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loading />
        </Box>
      )}
      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-fit border-collapse text-[11px] md:text-xs table-fixed font-semibold">
            <thead>
            <tr>
              <th className="border border-gray-300 px-1.5 py-[1px] md:px-3 md:py-0.5 sticky left-0 bg-blue-500 z-20 text-white text-xs w-[120px] md:w-[175px]"><h1 className="text-xl">全体</h1></th>
              {months.map((month) => {
                const key = month.toString();
                const isExpanded = expandedMonths[key];
                const rate = getAttendanceRate('all', null, month);

                if (!isExpanded) {
                  return (
                    <th key={key} className="border border-gray-300 bg-indigo-100 hover:bg-indigo-200 w-[52px] md:w-[60px] h-8">
                      <button onClick={() => toggleMonth(month)} className="text-blue-700 px-1 py-1 flex flex-col items-center w-full h-full cursor-pointer">
                        <h1 className="font-bold text-lg">{month.month + 1}<span className="text-xs">月</span></h1>
                        <div className={`mt-0.5 text-right ${(rate || 0) < 80 ? 'text-red-600' : 'text-blue-600'}`}>{rate && `${rate}%`}</div>
                      </button>
                    </th>
                  );
                }

                const scheduledDays = getScheduledDaysInMonth(month);
                return (
                  <React.Fragment key={key}>
                    <th className="border border-gray-300 bg-indigo-100 hover:bg-indigo-200 w-[52px] md:w-[60px] h-8">
                      <button onClick={() => toggleMonth(month)} className="text-blue-700 px-1 py-1 flex flex-col items-center w-full h-full cursor-pointer">
                        <h1 className="font-bold text-lg">{month.month + 1}<span className="text-xs">月</span></h1>
                        <div className={`mt-0.5 text-right ${(rate || 1000) < 80 ? 'text-red-600' : 'text-blue-600'}`}>{rate && `${rate}%`}</div>
                      </button>
                    </th>
                    {scheduledDays.map(day => {
                      const date = dayjs(new Date(month.year, month.month, day));
                      const dayRate = calcDayRate('all', null, date);
                      return (
                        <th key={`${key}-${day}`} className="border border-gray-300 px-0.5 py-1 align-top w-[40px] bg-gray-50" ref={month.equals(currentMonth) ? currentMonthRef : null}>
                          <div className="font-bold text-base">{day}</div>
                          <div className={`${(dayRate || 1000) < 80 ? 'text-red-600' : 'text-gray-600'} text-right`}>{dayRate && `${dayRate}%`}</div>
                        </th>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tr>
            </thead>
            <tbody>
            {Object.entries(sortedMembers).map(([partValue, membersList]) => {
              const part = Part.valueOf(partValue);
              return (
                <React.Fragment key={partValue}>
                  <tr>
                    <td className="border border-gray-300 sticky left-0 bg-indigo-50 text-blue-700 z-10 h-6">
                      <button onClick={() => togglePart(partValue)} className="flex items-center gap-1 font-bold cursor-pointer px-2 py-1 w-full h-full">
                        {expandedParts[partValue] ? <Iconify icon="eva:arrow-ios-downward-fill" /> : <Iconify icon="eva:arrow-ios-forward-fill" />}
                        <h1 className="text-xl">{part.enShort}</h1>
                      </button>
                    </td>
                    {months.map((month) => {
                      const key = month.toString();
                      const isExpanded = expandedMonths[key];
                      const rate = getAttendanceRate('part', partValue, month);

                      if (!isExpanded) {
                        return (
                          <td key={key} className={`border border-gray-300 px-0.5 py-0.5 text-right bg-indigo-50 ${(rate || 1000) < 80 ? 'text-red-600' : ''}`}>
                            {rate && `${rate}%`}
                          </td>
                        );
                      }

                      const scheduledDays = getScheduledDaysInMonth(month);
                      return (
                        <React.Fragment key={key}>
                          <td className={`border border-gray-300 px-0.5 py-0.5 text-right bg-indigo-50 ${(rate || 1000) < 80 ? 'text-red-600' : ''}`}>{rate && `${rate}%`}</td>
                          {scheduledDays.map(day => {
                            const date = dayjs(new Date(month.year, month.month, day));
                            const dayRate = calcDayRate('part', partValue, date);
                            return (
                              <td key={`${key}-${day}`} className={`border border-gray-300 px-0.5 py-0.5 text-right bg-indigo-50 ${(dayRate || 1000) < 80 ? 'text-red-600' : 'text-gray-600'}`}>
                                {dayRate && `${dayRate}%`}
                              </td>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tr>

                  {expandedParts[partValue] && membersList.map((member) => (
                    <tr key={member.id} className="h-4">
                      <td className="border border-gray-300 px-2 py-0.5 sticky left-0 z-10 min-w-[180px] text-[12px] md:text-sm bg-white">
                        {member.name}
                      </td>
                      {months.map((month) => {
                        const key = month.toString();
                        const isExpanded = expandedMonths[key];
                        const rate = getAttendanceRate('member', member.id, month);

                        if (!isExpanded) {
                          return (
                            <td key={key} className={`border border-gray-300 px-0.5 py-0.5 text-right ${(rate || 1000) < 80 ? ' text-red-600' : ''}`}>
                              {!!rate && `${rate}%`}
                            </td>
                          );
                        }

                        const scheduledDays = getScheduledDaysInMonth(month);
                        return (
                          <React.Fragment key={key}>
                            <td className={`border border-gray-300 px-0.5 py-0.5 text-right${(rate || 1000) < 80 ? ' text-red-600' : ''}`}>
                              {!!rate && `${rate}%`}
                            </td>
                            {scheduledDays.map(day => {
                              const date = dayjs(new Date(month.year, month.month, day));
                              const attendance = getAttendance(member, date);
                              const style = attendance ? getAttendanceStyle(attendance.attendance) : "bg-white text-gray-400 hover:bg-gray-100";
                              const value = attendance?.attendance || "-";

                              return (
                                <td key={`${key}-${day}`} className="border border-gray-300 text-center p-0 h-4">
                                  <button
                                    onClick={(e) => setEditingCell({
                                      member,
                                      date,
                                      attendance,
                                      anchorEl: e.currentTarget,
                                    })}
                                    className={`${style} w-full h-full p-0 font-bold hover:opacity-80 transition-opacity${value.length > 2 ? " text-[10px]" : ""}${editingCell && editingCell.date.isSame(date) && editingCell.member.id === member.id ? ' border-2' : ''}`}
                                    title={attendance?.attendance || '未登録'}
                                  >
                                    {value?.substring(0, 3) || '-'}
                                  </button>
                                </td>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              )})}
            </tbody>
          </table>
          <AttendanceCellEditor
            attendance={editingCell?.attendance}
            anchorEl={editingCell?.anchorEl ?? null}
            isEditing={Boolean(editingCell)}
            onSave={async (value, update) => {
              if (!editingCell) return;
              if (update) await handleUpdateAttendance(editingCell.member, editingCell.date, value);
              else await handleCreateAttendance(editingCell.member, editingCell.date, value);
            }}
            onDelete={async () => {
              setEditingCell(null);
              if (!editingCell) return;
              await handleDeleteAttendance(editingCell.member, editingCell.date);
            }}
            onClose={async () => setEditingCell(null)}
          />
          <AttendanceFilter
            filterOpen={filterOpen}
            value={filter}
            onChange={handleFilterChange}
            loading={isFiltering}
          />
        </div>

        <div className="bg-gray-100 px-3 py-2 border-t text-xs text-gray-600">
          <p><strong>操作:</strong> パート/月をクリックで展開 | セルをクリックして出欠を変更 | <span className="text-red-600 font-semibold">赤字</span>は出席率80%未満</p>
        </div>
      </div>
    </div>
  );
};