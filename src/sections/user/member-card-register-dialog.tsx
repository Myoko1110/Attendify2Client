import type Member from 'src/api/member';

import { toast } from 'sonner';
import React, { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { useFeliCaReader } from 'src/felica';
import { APIError } from 'src/abc/api-error';

type Props = {
  member: Member;
  open: boolean;
  setOpen: (open: boolean) => void;
  setMembers: React.Dispatch<React.SetStateAction<Member[] | null>>;
};

export function MemberCardRegisterDialog({ member, open, setOpen, setMembers }: Props) {
  // 登録中フラグ（重複登録防止）
  const registeringRef = useRef(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // すでにIDmが登録されているかどうか
  const isAlreadyRegistered = !!member.felicaIdm;

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
  } = useFeliCaReader({
    onRead: async (c) => {
      // カードを検出したら自動で登録を実行（表示はせずに即登録）
      const idm = c.id;
      if (registeringRef.current) return;
      registeringRef.current = true;
      setIsRegistering(true);
      try {
        // 停止してから登録
        try {
          stopReading();
        } catch {
          // ignore
        }

        const updated = await member.update({ felicaIdm: idm });
        setMembers((prev) => {
          if (!prev) return prev;
          const index = prev.indexOf(member);
          if (index === -1) return prev;
          const updatedArr = [...prev];
          updatedArr[index] = updated;
          return updatedArr;
        });

        toast.success('カードを登録しました');
        setOpen(false);

        try {
          await disconnect();
        } catch {
          // ignore
        }
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
        // 再度読み取りできるように停止フラグを戻す
        registeringRef.current = false;
        setIsRegistering(false);
      }
    },
    onCardRemoved: async () => {
      // カードが離れたら検出IDはそのままにしておく（ユーザーが登録ボタンを押せるように）
    },
  });

  useEffect(() => {
    if (!open) {
      registeringRef.current = false;
      setIsRegistering(false);
      // ダイアログを閉じるときに読み取りを停止・切断しておく
      try {
        stopReading();
      } catch {
        // ignore
      }
      try {
        disconnect();
      } catch {
        // ignore
      }
    }
  }, [open, stopReading, disconnect]);

  // card の変化は特に UI 表示しないが、デバッグ目的でログは残す
  useEffect(() => {
    if (card) {
      // noop
    }
  }, [card]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleConnect = async () => {
    try {
      await connect();
      startReading();
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  const handleToggleReading = () => {
    if (isReading) stopReading();
    else startReading();
  };

  const handleRemoveRegistration = async () => {
    if (!isAlreadyRegistered) return;
    const ok = window.confirm('この部員のカード登録を削除しますか？');
    if (!ok) return;
    if (registeringRef.current) return;
    registeringRef.current = true;
    setIsRegistering(true);
    try {
      const updated = await member.update({ felicaIdm: null });
      setMembers((prev) => {
        if (!prev) return prev;
        const index = prev.indexOf(member);
        if (index === -1) return prev;
        const updatedArr = [...prev];
        updatedArr[index] = updated;
        return updatedArr;
      });

      toast.success('カード登録を削除しました');
      setOpen(false);
      try {
        await disconnect();
      } catch {
        // ignore
      }
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    } finally {
      registeringRef.current = false;
      setIsRegistering(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>カード登録</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography>部員: {member.name}</Typography>

          <Box>
            <Typography variant="body2" color="text.secondary">
              リーダーを接続してカードをかざすと自動で登録されます。
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              接続状態: {isConnected ? '接続中' : '未接続'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              読み取り: {isReading ? '読み取り中' : '停止'}
            </Typography>
            {isReading && <CircularProgress size={12} />}
            {isRegistering && (
              <Typography variant="caption" color="text.primary">
                登録中...
              </Typography>
            )}
          </Box>

          {isAlreadyRegistered && (
            <Box>
              <Typography variant="body2" color="success.main">
                カード登録済み
              </Typography>
            </Box>
          )}

          {error && (
            <Box>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {!isConnected ? (
          <Button onClick={handleConnect} disabled={!isAvailable} variant="contained">
            {isAlreadyRegistered ? '接続して再登録' : '接続して読み取り開始'}
          </Button>
        ) : (
          <>
            <Button onClick={handleToggleReading} variant="outlined">
              {isReading ? '停止' : '再開'}
            </Button>
            <Button onClick={handleDisconnect} variant="outlined" color="inherit">
              切断
            </Button>
          </>
        )}

        {isAlreadyRegistered && (
          <Button onClick={handleRemoveRegistration} variant="outlined" color="error">
            登録解除
          </Button>
        )}

        <Box sx={{ flex: '1 0 auto' }} />

        <Button onClick={handleClose} variant="outlined" color="inherit">
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
}
