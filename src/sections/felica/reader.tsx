import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { useFeliCaReader } from '../../felica';

/**
 * FeliCaカード読み取りコンポーネント
 */
export function FeliCaReader() {
  const {
    isConnected,
    isReading,
    card,
    error,
    isAvailable,
    connect,
    disconnect,
    startReading,
    stopReading,
    clearError,
  } = useFeliCaReader();

  const handleConnect = async () => {
    try {
      await connect();
      startReading();
    } catch (err) {
      console.error('接続エラー:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('切断エラー:', err);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          交通系ICを読み込み、出欠を記録します
        </Typography>
      </Box>

      {!isAvailable && (
        <Alert severity="warning" onClose={undefined}>
          <AlertTitle>WebUSB未対応</AlertTitle>
          お使いのブラウザはWebUSBをサポートしていません。Chrome、Edge等の対応ブラウザをご利用ください。
        </Alert>
      )}

      <Stack direction="row" spacing={2}>
        {!isConnected ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleConnect}
            disabled={!isAvailable}
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            FeliCaリーダーに接続
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color="warning"
              size="large"
              onClick={stopReading}
              disabled={!isReading}
              startIcon={<Iconify icon="mingcute:close-line" />}
            >
              読み取りを停止
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleDisconnect}
              startIcon={<Iconify icon="mingcute:close-line" />}
            >
              切断
            </Button>
          </>
        )}
      </Stack>

      {isReading && !card && (
        <Card>
          <CardContent>
            <Stack spacing={2} alignItems="center" py={3}>
              <CircularProgress size={48} />
              <Typography variant="body1" color="text.secondary">
                待機中 - FeliCaリーダーにカードをかざしてください
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {card && (
        <Alert
          severity="success"
          icon={<Iconify icon="solar:check-circle-bold" width={24} />}
          sx={{ '& .MuiAlert-message': { width: '100%' } }}
        >
          <AlertTitle>カード検出</AlertTitle>
          <Stack spacing={1} mt={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                カードタイプ
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {card.type}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                カードID
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                {card.id}
              </Typography>
            </Box>
          </Stack>
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={clearError}
            >
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          }
        >
          <AlertTitle>エラー</AlertTitle>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
