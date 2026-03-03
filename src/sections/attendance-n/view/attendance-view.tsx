import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import { Switch, ToggleButton, useMediaQuery, ToggleButtonGroup } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { AttendanceTable } from '../attendance';

// ----------------------------------------------------------------------

export function AttendanceView() {
  const [actual, setActual] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<'actual' | 'pre'>('actual');
  const [selectionActions, setSelectionActions] = useState<{
    hasSelection: boolean;
    selectedCount: number;
    deleteSelected: () => void;
  } | null>(null);

  const theme = useTheme();
  const mediaQuery = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key !== 'm' && key !== 'f') return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) return;
      }
      if (key === 'm') {
        setAttendanceMode((prev) => (prev === 'actual' ? 'pre' : 'actual'));
      } else {
        setFilterOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Card
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'stretch',
          width: '100%',
          [theme.breakpoints.down('md')]: { flexDirection: 'column-reverse' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AttendanceTable
            filterOpen={[filterOpen, setFilterOpen]}
            displayMode={attendanceMode}
            onSelectionChange={setSelectionActions}
          />
        </Box>

        <Box
          sx={{
            width: 56,
            borderLeft: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            py: 1,
            [theme.breakpoints.down('md')]: {
              flexDirection: 'row',
              px: 1
            },
          }}
        >
          <Tooltip title="モード切替（M）">
            <ToggleButtonGroup
              size="large"
              exclusive
              orientation={mediaQuery ? 'horizontal' : 'vertical'}
              value={attendanceMode}
              onChange={(_event, value) => {
                if (value) setAttendanceMode(value);
              }}
              sx={{
                '& .MuiToggleButton-root': {
                  minWidth: 36,
                  px: 0.6,
                  py: 0.3,
                  fontSize: '0.8rem',
                  [theme.breakpoints.down('md')]: {
                    minWidth: 48,
                  },
                },
              }}
            >
              <ToggleButton value="actual">確定</ToggleButton>
              <ToggleButton value="pre">事前</ToggleButton>
            </ToggleButtonGroup>
          </Tooltip>
          <Tooltip title="講習などの正当な理由での欠席も、0 として出席率を算出します">
            <Switch
              size="small"
              checked={actual}
              onChange={(e) => setActual(e.target.checked)}
              disabled
            />
          </Tooltip>
          <Tooltip title="フィルター（F）">
            <IconButton size="small" color="inherit" onClick={() => setFilterOpen(true)}>
              <Iconify icon="ic:round-filter-list" />
            </IconButton>
          </Tooltip>
          <Tooltip title="削除（delete）">
            <span>
              <IconButton
                size="small"
                color="inherit"
                disabled={!selectionActions?.hasSelection}
                onClick={() => selectionActions?.deleteSelected()}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Card>
    </DashboardContent>
  );
}