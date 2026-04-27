import type Member from 'src/api/member';
import type { CardInfo } from 'src/felica';
import type { Dispatch, SetStateAction } from 'react';

import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useGrade } from 'src/hooks/grade';

import Part from 'src/abc/part';
import { APIError } from 'src/abc/api-error';
import { useFeliCaReader } from 'src/felica';

import { Loading } from 'src/components/loading';

import { Iconify } from '../../components/iconify';

// ----------------------------------------------------------------------

type Props = {
  member?: Member | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  members?: Member[] | null;
  setMembers: Dispatch<SetStateAction<Member[] | null>>;
};

export function MemberCardRegisterDialog({ member, open, setOpen, members, setMembers }: Props) {
  const grade = useGrade();
  const isDirectMode = member != null;

  const [selectedPart, setSelectedPart] = useState(member?.part ?? Part.COMMON[0]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(member ?? null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const selectedMemberRef = useRef<Member | null>(member ?? null);
  const openRef = useRef(open);
  const disconnectRef = useRef<(() => Promise<void>) | null>(null);
  const stopReadingRef = useRef<(() => void) | null>(null);
  const clearErrorRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    selectedMemberRef.current = selectedMember;
  }, [selectedMember]);

  const groupedMembers = useMemo(() => {
    const map = new Map<Part, Map<number, Member[]>>();

    (members ?? []).forEach((m) => {
      if (!Part.COMMON.includes(m.part)) return;

      if (!map.has(m.part)) map.set(m.part, new Map<number, Member[]>());
      const generationMap = map.get(m.part)!;
      if (!generationMap.has(m.generation)) generationMap.set(m.generation, []);
      generationMap.get(m.generation)!.push(m);
    });

    map.forEach((generationMap) => {
      generationMap.forEach((items) => {
        items.sort((a, b) => a.nameKana.localeCompare(b.nameKana, 'ja'));
      });
    });

    return map;
  }, [members]);

  const generationEntries = useMemo(
    () => Array.from(groupedMembers.get(selectedPart)?.entries() ?? []).sort((a, b) => a[0] - b[0]),
    [groupedMembers, selectedPart],
  );

  const resetState = useCallback(() => {
    setSelectedPart(member?.part ?? Part.COMMON[0]);
    setSelectedMember(member ?? null);
    selectedMemberRef.current = member ?? null;
    setIsConnecting(false);
    setIsRegistering(false);
    setRegisterError(null);
    clearErrorRef.current?.();
  }, [member]);

  useEffect(() => {
    if (open) {
      resetState();
    } else {
      setSelectedMember(null);
      selectedMemberRef.current = null;
      setIsConnecting(false);
      setIsRegistering(false);
      setRegisterError(null);
    }
  }, [open, resetState]);

  const handleClose = useCallback(async () => {
    stopReadingRef.current?.();
    setIsConnecting(false);
    setIsRegistering(false);
    setRegisterError(null);
    setSelectedMember(null);
    selectedMemberRef.current = null;
    clearErrorRef.current?.();

    try {
      await disconnectRef.current?.();
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    } finally {
      setOpen(false);
    }
  }, [setOpen]);

  const handleRead = useCallback(
    async (card: CardInfo) => {
      const activeMember = selectedMemberRef.current;
      if (!activeMember || !openRef.current) return;

      setIsRegistering(true);
      setRegisterError(null);

      try {
        const updatedMember = await activeMember.update({ felicaIdm: card.id });
        if (!openRef.current) return;

        setMembers(
          (prev) =>
            prev?.map((value) => (value.id === updatedMember.id ? updatedMember : value)) ?? prev,
        );

        toast.success(`${updatedMember.name} のカードを登録しました`);

        if (isDirectMode) {
          await handleClose();
          return;
        }

        stopReadingRef.current?.();
        setSelectedMember(null);
        selectedMemberRef.current = null;
      } catch (e) {
        if (!openRef.current) return;
        const message = APIError.createToastMessage(e);
        setRegisterError(message);
        toast.error(message);
      } finally {
        if (openRef.current) {
          setIsRegistering(false);
        }
      }
    },
    [handleClose, isDirectMode, setMembers],
  );

  const handleCardRemoved = useCallback(() => {
    setRegisterError(null);
  }, []);

  const {
    isConnected,
    isReading,
    error,
    isAvailable,
    connect,
    disconnect,
    startReading,
    stopReading,
    clearError,
  } = useFeliCaReader({ onRead: handleRead, onCardRemoved: handleCardRemoved });

  useEffect(() => {
    disconnectRef.current = disconnect;
    stopReadingRef.current = stopReading;
    clearErrorRef.current = clearError;
  }, [clearError, disconnect, stopReading]);

  const handleConnect = useCallback(async () => {
	setIsConnecting(true);
	setRegisterError(null);

	try {
	  await connect();
	  if (!openRef.current) {
		await disconnect();
		return;
	  }

	  if (member) {
		selectedMemberRef.current = member;
		setSelectedMember(member);
		startReading();
	  }
	} catch (e) {
	  // ユーザーがデバイス選択をキャンセルした場合は無視
	  const errorMessage = e instanceof Error ? e.message : APIError.createToastMessage(e);
	  if (!errorMessage.includes('No device selected')) {
		toast.error(errorMessage);
	  }
	} finally {
	  if (openRef.current) {
		setIsConnecting(false);
	  }
	}
  }, [connect, disconnect, member, startReading]);

  const handleSelectMember = useCallback(
    (target: Member) => {
      if (!isConnected || isRegistering) return;
      selectedMemberRef.current = target;
      setSelectedMember(target);
      setRegisterError(null);
      startReading();
    },
    [isConnected, isRegistering, startReading],
  );

  const handleBackToList = useCallback(() => {
    stopReading();
    setRegisterError(null);
    if (isDirectMode) {
      void handleClose();
      return;
    }

    selectedMemberRef.current = null;
    setSelectedMember(null);
  }, [handleClose, isDirectMode, stopReading]);

  const selectedGrade = selectedMember
    ? grade?.find((g) => g.generation === selectedMember.generation)
    : null;

  const renderConnectScreen = () => (
    <Stack spacing={2} sx={{ py: 3 }}>
      <div
        style={{
          position: 'relative',
          width: 148,
          height: 148,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          margin: '0 auto',
        }}
      >
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 148 148"
        >
          <circle
            cx="74"
            cy="74"
            r="68"
            fill="none"
            stroke="#e8eaf0"
            strokeWidth="2"
            strokeDasharray="8 12"
          />
        </svg>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #1d4ed8, #60a5fa)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.3), 0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="solar:usb-bold-duotone" width={44} height={44} color="white" />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: 10,
            letterSpacing: '-0.01em',
          }}
        >
          FeliCaリーダーの接続
        </div>
        <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.75 }}>
          ボタンを押すとデバイス選択の
          <br />
          ダイアログが表示されます。
          <br />
          リーダーを選択して接続してください。
        </div>
      </div>

      {!isAvailable && (
        <Alert severity="warning">
          このブラウザでは WebUSB が利用できません。Chrome または Edge をご利用ください。
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={() => void handleConnect()}
        disabled={!isAvailable || isConnecting}
        startIcon={<Iconify icon="solar:usb-bold-duotone" />}
        sx={{
          background: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
          py: 1.75,
          fontSize: 14,
          fontWeight: 700,
          boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
          letterSpacing: '0.02em',
          '&:hover': {
            background: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
            boxShadow: '0 8px 26px rgba(37,99,235,0.28)',
          },
          '&:disabled': {
            background: '#cbd5e1',
            boxShadow: 'none',
          },
        }}
      >
        {isConnecting ? '接続中...' : 'リーダーを接続'}
      </Button>
    </Stack>
  );

  const renderMemberList = () => {
    if (members === null) {
      return <Loading />;
    }

    return (
      <Stack spacing={2}>
        <Tabs
          value={selectedPart}
          onChange={(_event, value) => setSelectedPart(value as Part)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {Part.COMMON.map((partItem) => (
            <Tab key={partItem.value} value={partItem} label={partItem.jp} />
          ))}
        </Tabs>

        {generationEntries.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
            {generationEntries.map(([generation, generationMembers]) => {
              const generationLabel =
                grade?.find((g) => g.generation === generation)?.displayName ?? `${generation}期`;

              return (
                <Card key={generation} sx={{ minWidth: 280, flex: '0 0 auto' }} variant="outlined">
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Typography variant="h6">{generationLabel}</Typography>
                        <Chip label={`${generationMembers.length}人`} size="small" />
                      </Stack>

                      <Stack spacing={1}>
                        {generationMembers.map((target) => (
                          <Button
                            key={target.id}
                            variant="outlined"
                            color="inherit"
                            fullWidth
                            disabled={isRegistering}
                            onClick={() => handleSelectMember(target)}
                            sx={{
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 1.25,
                              px: 1.5,
                              textAlign: 'left',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                              }}
                            >
                              <Typography variant="subtitle2">{target.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {target.nameKana}
                              </Typography>
                            </Box>
                            <Chip
                              label={target.felicaIdm ? '登録済み' : '未登録'}
                              color={target.felicaIdm ? 'success' : 'default'}
                              variant={target.felicaIdm ? 'filled' : 'outlined'}
                              size="small"
                            />
                          </Button>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Alert severity="info">このパートに部員がいません。</Alert>
        )}
      </Stack>
    );
  };

  const renderReadingScreen = () => {
    if (!selectedMember) return null;

    const generationLabel = selectedGrade?.displayName ?? `${selectedMember.generation}期`;

    return (
      <Stack spacing={2} sx={{ py: 1 }}>
        <Alert severity="info">
          {isDirectMode
            ? 'カードをかざして、この部員のFeliCa IDm を登録してください。'
            : 'カードをかざしてください。登録が完了すると一覧に戻ります。'}
        </Alert>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{selectedMember.name}</Typography>
                <Chip label={selectedMember.part.jp} size="small" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {generationLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedMember.nameKana}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {selectedMember.felicaIdm ? `現在の登録IDm: ${selectedMember.felicaIdm}` : '未登録'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isReading
                  ? '読み取り中です。FeliCa リーダーにカードをかざしてください。'
                  : '読み取り待機中です。'}
              </Typography>
              {isRegistering && <Typography variant="body2">登録処理を実行中です...</Typography>}
            </Stack>
          </CardContent>
        </Card>

        {registerError && <Alert severity="error">{registerError}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {!isDirectMode && (
          <Button variant="outlined" color="inherit" onClick={handleBackToList}>
            一覧に戻る
          </Button>
        )}
      </Stack>
    );
  };

  return (
    <Dialog open={open} onClose={() => void handleClose()} maxWidth="lg" fullWidth>
      <DialogTitle>{isDirectMode ? 'カード登録' : '部員のカード登録'}</DialogTitle>
      <DialogContent dividers sx={{ minHeight: 420 }}>
        {!isConnected
          ? renderConnectScreen()
          : isDirectMode || selectedMember
            ? renderReadingScreen()
            : renderMemberList()}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={() => void handleClose()}>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
}
