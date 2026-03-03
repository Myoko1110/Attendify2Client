import 'dayjs/locale/ja';

import type Member from 'src/api/member';
import type Schedule from 'src/api/schedule';
import type PreCheck from 'src/api/pre-check';
import type PreAttendance from 'src/api/pre-attendance';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';

// 出欠状況の色設定
const getAttendanceColor = (attendance: string): string => {
  switch (attendance) {
    case '出席':
      return 'success';
    case '欠席':
      return 'error';
    case '遅刻':
      return 'warning';
    case '早退':
      return 'warning';
    case '講習':
      return 'info';
    default:
      return 'default';
  }
};

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  member: Member;
  preCheck: PreCheck;
  schedules: Schedule[];
  preAttendances: PreAttendance[];
};

export function PreAttendanceAnswerDialog({ open, setOpen, member, preCheck, schedules, preAttendances }: Props) {
  const handleClose = () => {
    setOpen(false);
  };

  // PreCheckの期間内のスケジュールを取得
  const schedulesInRange = schedules.filter((schedule) => {
    const scheduleDate = schedule.dateOnly.toDayjs();
    const startDate = preCheck.startDate.toDayjs();
    const endDate = preCheck.endDate.toDayjs();
    return (
      (scheduleDate.isAfter(startDate) || scheduleDate.isSame(startDate, 'day')) &&
      (scheduleDate.isBefore(endDate) || scheduleDate.isSame(endDate, 'day'))
    );
  });

  // メンバーのPreAttendanceをマップ化
  const preAttendanceMap = new Map(
    preAttendances
      .filter((pa) => pa.memberId === member.id)
      .map((pa) => [pa.dateOnly.toString(), pa])
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.neutral',
        }}
      >
        回答: {member.name}
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          閉じる
        </Button>
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.paper', p: 3 }}
      >
        {schedulesInRange.length === 0 ? (
          <Typography color="text.secondary" textAlign="center">
              表示する回答がありません
          </Typography>
        ) : (
          <Stack spacing={2}>
            {schedulesInRange.map((schedule) => {
              const dateKey = schedule.dateOnly.toString();
              const preAttendance = preAttendanceMap.get(dateKey);

              return (
                <Card key={dateKey} variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 2, sm: 3 }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                      {/* 日付 */}
                      <Box sx={{ minWidth: { xs: 100, sm: 120 } }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, fontSize: '0.7rem' }}
                        >
                          日付
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {schedule.date.locale('ja').format('MM/DD (ddd)')}
                        </Typography>
                      </Box>

                      {/* 回答 */}
                      <Box sx={{ minWidth: { xs: 80, sm: 100 } }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, fontSize: '0.7rem' }}
                        >
                          回答
                        </Typography>
                        <Box>
                          {preAttendance ? (
                            <Chip
                              label={preAttendance.attendance}
                              color={getAttendanceColor(preAttendance.attendance) as any}
                              sx={{
                                fontWeight: 'bold',
                                minWidth: 70,
                                fontSize: '0.95rem',
                                height: 36,
                                borderRadius: 1,
                              }}
                            />
                          ) : (
                            <Chip
                              label="未回答"
                              color="error"
                              variant="outlined"
                              sx={{
                                fontWeight: 'bold',
                                minWidth: 70,
                                fontSize: '0.95rem',
                                height: 36,
                                borderRadius: 1,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* 理由 */}
                    {preAttendance?.reason && (
                      <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, fontSize: '0.7rem' }}
                        >
                          理由
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            wordBreak: 'break-word',
                            bgcolor: { xs: 'action.hover', sm: 'transparent' },
                            p: { xs: 1, sm: 0 },
                            borderRadius: 1,
                          }}
                        >
                          {preAttendance.reason}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
