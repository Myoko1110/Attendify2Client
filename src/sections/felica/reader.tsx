import type { CardInfo } from 'src/felica';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';

import Member from 'src/api/member';
import { useFeliCaReader } from 'src/felica';

import { Iconify } from 'src/components/iconify';

/**
 * FeliCaカード読み取りコンポーネント
 */
export function FeliCaReader() {
  const [unknownMemberError, setUnknownMemberError] = useState(false);
  const [gettingMember, setGettingMember] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRead = async (card: CardInfo) => {
    // タイマーをリセット
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setGettingMember(true);
    const member = await Member.getByFelicaIdm({ felicaIdm: card.id });
    setGettingMember(false);
    setCurrentMember(member);
    if (!member) {
      setUnknownMemberError(true);
    }
  };

  const handleCardRemoved = async () => {
    setUnknownMemberError(false);
    setCurrentMember(null);
  };

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
  } = useFeliCaReader({ onRead: handleRead, onCardRemoved: handleCardRemoved });

  // 5分間カードが読み取られなかったら自動停止
  useEffect(() => {
    if (isReading) {
      timeoutRef.current = setTimeout(() => {
        stopReading();
      }, 1000 * 60 * 5);
    }

    // クリーンアップ
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isReading, stopReading]);

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
            color="inherit"
            size="large"
            onClick={handleConnect}
            disabled={!isAvailable}
            startIcon={<Iconify icon="solar:usb-bold" />}
          >
            FeliCaリーダーに接続
          </Button>
        ) : (
          <>
            {isReading ? (
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={stopReading}
                startIcon={<Iconify icon="solar:pause-bold" />}
              >
                読み取りを一時停止
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={startReading}
                startIcon={<Iconify icon="solar:play-bold" />}
              >
                読み取りを再開
              </Button>
            )}
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

      {isConnected && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack spacing={2} alignItems="center" py={3}>
                {isReading ? (
                  <>
                    <Typography variant="h3">待機中...</Typography>
                    <Typography variant="body1" color="text.secondary">
                      リーダーに交通系ICをかざしてください
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h3">休止中...</Typography>
                    <Typography variant="body1" color="text.secondary">
                      読み取りをするには再開ボタンを押して下さい
                    </Typography>
                  </>
                )}
              </Stack>

              {isReading && card && (
                <Alert
                  severity="success"
                  icon={<Iconify icon="solar:check-circle-bold" width={24} />}
                  sx={{ '& .MuiAlert-message': { width: '100%' } }}
                >
                  <AlertTitle>カード検出</AlertTitle>
                  {gettingMember && '取得中...'}
                  {currentMember && `${currentMember.name}さんのカードを検出しました！`}
                </Alert>
              )}

              {unknownMemberError && (
                <Alert severity="error">
                  <AlertTitle>登録されていないカードです</AlertTitle>
                  {error}
                </Alert>
              )}

              {error && !unknownMemberError && (
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
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
