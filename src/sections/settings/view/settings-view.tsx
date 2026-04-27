import dayjs from 'dayjs';
import axios from 'axios';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { Tab, Tabs } from '@mui/material';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useMember } from 'src/hooks/member';

import Scheduler from 'src/api/scheduler';
import Attendance from 'src/api/attendance';
import { DashboardContent } from 'src/layouts/dashboard';

import { PermissionsTab } from '../permissions';

// ----------------------------------------------------------------------

type SchedulerStatus = 'running' | 'stopped' | 'unknown';

export function SettingsView() {
  const self = useMember().member;
  const hasNotSchedulerPermission = !!self && !self.hasPermission('attendance-log:write');

  const [schedulerAction, setSchedulerAction] = useState<'start' | 'stop' | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>('unknown');

  const fetchSchedulerStatus = async () => {
    try {
      const result = await axios.get('/scheduler/status');
      const data = result.data as
        | { running?: boolean; status?: string; result?: boolean }
        | boolean
        | string
        | null
        | undefined;

      if (typeof data === 'boolean') {
        setSchedulerStatus(data ? 'running' : 'stopped');
        return;
      }

      if (typeof data === 'string') {
        const normalized = data.toLowerCase();
        if (normalized === 'running' || normalized === 'started') {
          setSchedulerStatus('running');
          return;
        }
        if (normalized === 'stopped' || normalized === 'stopping') {
          setSchedulerStatus('stopped');
          return;
        }
      }

      if (data && typeof data === 'object') {
        if (typeof data.running === 'boolean') {
          setSchedulerStatus(data.running ? 'running' : 'stopped');
          return;
        }
        if (typeof data.result === 'boolean') {
          setSchedulerStatus(data.result ? 'running' : 'stopped');
          return;
        }
        if (typeof data.status === 'string') {
          const normalized = data.status.toLowerCase();
          if (normalized === 'running' || normalized === 'started') {
            setSchedulerStatus('running');
            return;
          }
          if (normalized === 'stopped' || normalized === 'stopping') {
            setSchedulerStatus('stopped');
            return;
          }
        }
      }

      setSchedulerStatus('unknown');
    } catch {
      setSchedulerStatus('unknown');
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
  }, []);

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
  };

  const handleStartScheduler = async () => {
    try {
      setSchedulerAction('start');
      toast.promise(Scheduler.start(), {
        loading: 'スケジューラを開始中...',
        success: 'スケジューラを開始しました',
        error: 'スケジューラの開始に失敗しました',
      });
      setSchedulerStatus('running');
    } finally {
      setSchedulerAction(null);
    }
  };

  const handleStopScheduler = async () => {
    try {
      setSchedulerAction('stop');
      toast.promise(Scheduler.stop(), {
        loading: 'スケジューラを停止中...',
        success: 'スケジューラを停止しました',
        error: 'スケジューラの停止に失敗しました',
      });
      setSchedulerStatus('stopped');
    } finally {
      setSchedulerAction(null);
    }
  };

  const schedulerStatusText =
    schedulerStatus === 'running' ? '稼働中' : schedulerStatus === 'stopped' ? '停止中' : '不明';

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
              <Stack spacing={3}>
                <Card>
                  <CardHeader title="出欠データをダウンロード" sx={{ mb: 2 }} />
                  <Divider />
                  <CardContent>
                    <Button variant="outlined" color="inherit" onClick={handleExcelDownload}>
                      Excelファイル
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader
                    title={
                      <Stack flexDirection="row" gap={2}>
                        <Typography variant="h6">自動出席挿入スケジューラ</Typography>
                        <Chip
                          variant="outlined"
                          label={schedulerStatusText}
                          color={schedulerStatus === 'running' ? 'success' : 'error'}
                        />
                      </Stack>
                    }
                    sx={{ mb: 2 }}
                  />
                  <Divider />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      交通系ICを使用して出欠を取る際に使用する、空欄の部員に対して自動で欠席を入力するスケジューラを開始・停止します。
                      <br />
                      その日の予定がない /
                      その日の予定に開始または終了時間が設定されていない場合は、スケジューラは自動で停止します。
                      <br />
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }} />

                    {hasNotSchedulerPermission && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        権限がないためスケジューラを操作できません。
                      </Alert>
                    )}

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="inherit"
                        onClick={handleStartScheduler}
                        disabled={hasNotSchedulerPermission || schedulerAction !== null}
                      >
                        開始
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleStopScheduler}
                        disabled={hasNotSchedulerPermission || schedulerAction !== null}
                      >
                        停止
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            )}

            {tabIndex === 1 && <PermissionsTab />}
          </>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
