import type Member from 'src/api/member';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  defaultColor,
  attendanceStatuses,
  getStatusButtonProps,
  attendanceStatusColor,
} from '../attendance-config';

type MemberAttendanceCardProps = {
  member: Member;
  attendance: string;
  suppressHover: boolean;
  isPickerOpen: boolean;
  isFreeInputOpen: boolean;
  anchorEl: HTMLElement | null;
  freeInputValue: string;
  freeInputRef: React.RefObject<HTMLInputElement | null>;
  onToggleAttendance: () => void;
  onStartLongPress: (anchorEl: HTMLElement) => void;
  onClearLongPress: () => void;
  onSetStatus: (status: string) => void;
  onOpenFreeInput: () => void;
  onClosePicker: () => void;
  onClosePickerFromFreeInput: () => void;
  onFreeInputChange: (value: string) => void;
  onFreeInputSubmit: () => void;
  onFreeInputCancel: () => void;
};

export function MemberAttendanceCard({
  member,
  attendance,
  suppressHover,
  isPickerOpen,
  isFreeInputOpen,
  anchorEl,
  freeInputValue,
  freeInputRef,
  onToggleAttendance,
  onStartLongPress,
  onClearLongPress,
  onSetStatus,
  onOpenFreeInput,
  onClosePicker,
  onClosePickerFromFreeInput,
  onFreeInputChange,
  onFreeInputSubmit,
  onFreeInputCancel,
}: MemberAttendanceCardProps) {
  return (
    <Card sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {member.name}
      </Typography>

      <Button
        {...(attendanceStatusColor[attendance] || defaultColor)}
        variant="contained"
        fullWidth
        sx={{
          fontSize: '1.5rem',
          py: 1.3,
          height: 64,
          ...(suppressHover ? { pointerEvents: 'none', transition: 'none' } : null),
          ...attendanceStatusColor[attendance].sx,
        }}
        onClick={onToggleAttendance}
        onMouseDown={(e) => onStartLongPress(e.currentTarget)}
        onTouchStart={(e) => onStartLongPress(e.currentTarget)}
        onMouseUp={onClearLongPress}
        onMouseLeave={onClearLongPress}
        onTouchEnd={onClearLongPress}
        onTouchCancel={onClearLongPress}
      >
        {attendance}
      </Button>

      <Popover
        open={isPickerOpen}
        anchorEl={anchorEl}
        onClose={() => {
          if (isFreeInputOpen) {
            onClosePickerFromFreeInput();
            return;
          }
          onClosePicker();
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
                    onClick={() => onSetStatus(status)}
                  >
                    {status}
                  </Button>
                </Grid>
              ))}
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onOpenFreeInput}
                  sx={{ height: 'auto', fontSize: '0.95rem', py: 1.0 }}
                >
                  自由入力
                </Button>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button fullWidth variant="outlined" onClick={onClosePicker}>
                  閉じる
                </Button>
              </Grid>
            </Grid>
          </Stack>

          {isFreeInputOpen && (
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
                  value={freeInputValue}
                  onChange={(e) => onFreeInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      e.stopPropagation();
                      (e.currentTarget as HTMLInputElement).blur();
                      onFreeInputSubmit();
                      return;
                    }
                    if (e.key === 'Escape') {
                      onFreeInputCancel();
                    }
                  }}
                  inputProps={{
                    style: { fontSize: '1.1rem', fontWeight: 600 },
                  }}
                />
                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="contained" onClick={onFreeInputSubmit}>
                    決定
                  </Button>
                  <Button fullWidth variant="outlined" onClick={onFreeInputCancel}>
                    戻る
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>
      </Popover>
    </Card>
  );
}
