import 'dayjs/locale/ja';

import type Member from 'src/api/member';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { jaJP } from '@mui/x-date-pickers/locales';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Tab, Tabs, Dialog, DialogTitle, DialogActions } from '@mui/material';

import { useGrade } from 'src/hooks/grade';
import { useMember } from 'src/hooks/member';

import Part from 'src/abc/part';
import { DashboardContent } from 'src/layouts/dashboard';

import { Loading } from 'src/components/loading';

import { useAttendanceData } from '../use-attendance-data';
import { MemberAttendanceCard } from '../components/member-attendance-card';


export function InputView() {
  const selfPart = useMember().member?.part;
  const initPart = selfPart !== undefined && selfPart !== Part.ADVISOR ? selfPart : Part.FLUTE;

  const {
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
    groupedMembers,
    toggleAttendance,
    handleSubmit,
    existsAttendance,
    setExistsAttendance
  } = useAttendanceData(initPart);

  const [pickerMemberId, setPickerMemberId] = useState<string | null>(null);
  const [freeInputMemberId, setFreeInputMemberId] = useState<string | null>(null);
  const [pickerAnchorEl, setPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [suppressHoverMemberId, setSuppressHoverMemberId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressRef = useRef(false);
  const freeInputRef = useRef<HTMLInputElement | null>(null);

  const grade = useGrade();

  const clearLongPressTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

  const startLongPress = (memberId: string, anchorEl: HTMLElement) => {
    longPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      longPressRef.current = true;
      setPickerMemberId(memberId);
      setFreeInputMemberId(null);
      setPickerAnchorEl(anchorEl);
    }, 300);
  };

  const toggleAttendanceWithPicker = (memberId: string) => {
    if (longPressRef.current) {
      longPressRef.current = false;
      return;
    }
    closePicker();
    toggleAttendance(memberId);
  };

  const updateAttendanceStatus = (memberId: string, status: string) => {
    setAttendanceMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(memberId, status);
      return newMap;
    });
    closePicker();
  };

  const updateFreeInputValue = (memberId: string, value: string) => {
    setAttendanceMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(memberId, value);
      return newMap;
    });
  };

  const openFreeInput = (memberId: string) => {
    setFreeInputMemberId(memberId);
    setPickerMemberId(memberId);
  };

  const handleDialogClose = () => setExistsAttendance(false);

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
                  {date!.isSame(today, 'date') ? '本日' : date!.format('MM/DD')}は予定がありません。
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
                        {genMembers.map((member) => {
                          const attendance = attendanceMap.get(member.id) || '出席';

                          return (
                            <Grid key={member.id} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
                              <MemberAttendanceCard
                                member={member}
                                attendance={attendance}
                                suppressHover={suppressHoverMemberId === member.id}
                                isPickerOpen={
                                  Boolean(pickerAnchorEl) && pickerMemberId === member.id
                                }
                                isFreeInputOpen={freeInputMemberId === member.id}
                                anchorEl={pickerAnchorEl}
                                freeInputValue={attendanceMap.get(member.id) || ''}
                                freeInputRef={freeInputRef}
                                onToggleAttendance={() => toggleAttendanceWithPicker(member.id)}
                                onStartLongPress={(anchorEl) => startLongPress(member.id, anchorEl)}
                                onClearLongPress={clearLongPressTimeout}
                                onSetStatus={(status) => updateAttendanceStatus(member.id, status)}
                                onOpenFreeInput={() => openFreeInput(member.id)}
                                onClosePicker={closePicker}
                                onClosePickerFromFreeInput={() =>
                                  closePickerFromFreeInput(member.id)
                                }
                                onFreeInputChange={(value) =>
                                  updateFreeInputValue(member.id, value)
                                }
                                onFreeInputSubmit={() => closePickerFromFreeInput(member.id)}
                                onFreeInputCancel={() => setFreeInputMemberId(null)}
                              />
                            </Grid>
                          );
                        })}
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
                    actionBar: {
                      actions: ['today', 'accept'],
                      sx: {
                        '.MuiButton-root': {
                          borderColor: 'grey.900',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          color: 'black',
                        },
                        '& .MuiButton-root:last-child': {
                          backgroundColor: 'grey.900',
                          color: 'white',
                        },
                      },
                    },
                    toolbar: { toolbarFormat: 'M月D日' },
                  }}
                  views={['year', 'month', 'day']}
                  value={date}
                  onChange={setDate}
                  format="YYYY/MM/DD"
                />
              </LocalizationProvider>
              <Button variant="contained" color="inherit" onClick={() => handleSubmit()}>
                送信
              </Button>
            </Stack>
          </>
        ) : (
          <Loading />
        )}
      </Card>
      <Dialog open={existsAttendance} onClose={handleDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>出欠は送信済みです</DialogTitle>
        <Typography variant="body2" color="textSecondary" px="24px">
          既に本日の出欠が送信されています。上書きで送信しますか?
        </Typography>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={handleDialogClose}>
            キャンセル
          </Button>
          <Button variant="contained" color="inherit" onClick={() => handleSubmit(true)}>
            送信
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
