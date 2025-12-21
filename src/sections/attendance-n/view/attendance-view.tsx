import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Switch, FormControlLabel } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { AttendanceTable } from '../attendance';

// ----------------------------------------------------------------------

export function AttendanceView() {
  const [actual, setActual] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

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
          <Tooltip title="講習などの正当な理由での欠席も、0 として出席率を算出します">
            <FormControlLabel
              control={<Switch value={actual} onChange={(e) => setActual(e.target.checked)} />}
              label="実際の出席率"
            />
          </Tooltip>

          <Tooltip title="フィルター">
            <IconButton color="inherit" onClick={() => setFilterOpen(true)}>
              <Iconify icon="ic:round-filter-list" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Card sx={{ flex: 1, display: 'flex', alignItems: 'top', width: '100%' }}>
        <AttendanceTable
          filterOpen={[filterOpen, setFilterOpen]}
        />
      </Card>
    </DashboardContent>
  );
}
