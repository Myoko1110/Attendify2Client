import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Tab, Tabs } from '@mui/material';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import Attendance from 'src/api/attendance';
import { DashboardContent } from 'src/layouts/dashboard';

import { PermissionsTab } from '../permissions';

// ----------------------------------------------------------------------

export function SettingsView() {
  const handleExcelDownload = async () => {
    toast.promise(
      (async () => {
        const data = await Attendance.downloadExcel();

        // BlobからダウンロードURLを作成
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${dayjs.tz().format('YYYYMMDDHHmmss')}.xlsx`;
        document.body.appendChild(link);
        link.click();

        // クリーンアップ
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })(),
      {
        loading: 'データ変換中...',
        success: 'ダウンロードしました',
        error: 'ダウンロードに失敗しました',
      }
    );
  }

  const [tabIndex, setTabIndex] = useState(0);

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          設定
        </Typography>
      </Box>

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3 }}>
        <Tab label="一般" />
        <Tab label="権限" />
      </Tabs>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <>
            {tabIndex === 0 && (
              <Card>
                <CardHeader title="出欠データをダウンロード" sx={{ mb: 2 }} />
                <Divider />
                <CardContent>
                  <Button variant="outlined" color="inherit" onClick={handleExcelDownload}>
                    Excelファイル
                  </Button>
                </CardContent>
              </Card>
            )}

            {tabIndex === 1 && <PermissionsTab />}
          </>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
