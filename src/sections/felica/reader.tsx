import type Member from 'src/api/member';
import type { CardInfo } from 'src/felica';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useRef, useState, useEffect } from 'react';

import Schedule from 'src/api/schedule';
import { APIError } from 'src/abc/api-error';
import { useFeliCaReader } from 'src/felica';
import AttendanceLog from 'src/api/attendance-log';

import { Iconify } from 'src/components/iconify';

import UnsupportedScreen from './unsupported-screen';
import InvalidScheduleScreen from './invalid-schedule-screen';

/**
 * FeliCaカード読み取りコンポーネント
 */
export function FeliCaReader() {
  const isDevMode = import.meta.env.VITE_MODE === 'dev';
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [prevMember, setPrevMember] = useState<Member | null>(null);
  const [currentAttendance, setCurrentAttendance] = useState<string | null>(null);
  const [prevAttendance, setPrevAttendance] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearMemberRef = useRef<NodeJS.Timeout | null>(null);
  const [time, setTime] = useState(new Date());
  const [isDevBypassActive, setIsDevBypassActive] = useState(false);
  const [devMockIdm, setDevMockIdm] = useState('01 23 45 67 89 AB CD EF');

  const beepAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = async (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      await audio.play();
    } catch (e) {
      console.warn('音声再生に失敗しました', e);
    }
  };

  const playSuccessSound = () => void playSound(beepAudioRef);
  const playErrorSound = () => void playSound(errorAudioRef);

  // --- phase / screen state ---
  type Phase = 'idle' | 'scanning' | 'success' | 'unknown' | 'paused' | 'felica-not-found';
  const [phase, setPhase] = useState<Phase>('idle');
  const [pausedAt, setPausedAt] = useState<Date | null>(null);
  const [screen, setScreen] = useState<
    'connecting' | 'main' | 'unsupported' | 'manual' | 'disableSchedule'
  >('connecting');
  const [scheduleError, setScheduleError] = useState<{ title: string; message: string } | null>(
    null,
  );

  // Manual input state
  const [manualInput, setManualInput] = useState('');
  const [manualState, setManualState] = useState<'input' | 'loading' | 'success' | 'unknown'>(
    'input',
  );
  const [manualMember, setManualMember] = useState<Member | null>(null);
  const [manualAttendance, setManualAttendance] = useState<string | null>(null);
  const [manualErrorMessage, setManualErrorMessage] = useState<string>('管理者にお問い合わせください');
  const [felicaErrorMessage, setFelicaErrorMessage] = useState<string>('管理者にお問い合わせください');
  const lastReadRef = useRef<{ id: string; at: number } | null>(null);
  const duplicateReadWindowMs = 10_000;

  const handleRead = async (card: CardInfo) => {
    if (screen === 'disableSchedule') {
      toast.error('当日の予定に開始/終了時刻が設定されていないため、読み取りは無効です。');
      console.error('Felica read prevented: schedule has no startTime/endTime', { time: new Date() });
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (clearMemberRef.current) clearTimeout(clearMemberRef.current);

    if (card.id.length !== 23) return;

    setFelicaErrorMessage('管理者にお問い合わせください');

    const now = Date.now();
    const lastRead = lastReadRef.current;
    const isDuplicateWithinWindow =
      !!lastRead && lastRead.id === card.id && now - lastRead.at <= duplicateReadWindowMs;
    if (isDuplicateWithinWindow) {
      console.info('Ignored duplicate FeliCa read within 10 seconds');
      return;
    }
    lastReadRef.current = { id: card.id, at: now };

    setPhase('scanning');

    try {
      const attendanceLog = await AttendanceLog.createByFelicaIdm(card.id);
      setPrevMember(attendanceLog.member);
      setPrevAttendance(attendanceLog.attendance ?? null);
      setCurrentMember(attendanceLog.member);
      setCurrentAttendance(attendanceLog.attendance ?? null);
      setFelicaErrorMessage('管理者にお問い合わせください');
      playSuccessSound();
      setPhase('success');
      timeoutRef.current = setTimeout(() => {
        setPhase('idle');
        clearMemberRef.current = setTimeout(() => {
          setCurrentMember(null);
          setPrevMember(null);
          setCurrentAttendance(null);
          setPrevAttendance(null);
        }, 400);
      }, 2000);
    } catch (e) {
      console.error(e);
      setCurrentMember(null);
      setCurrentAttendance(null);
      setFelicaErrorMessage(e instanceof APIError ? e.description : '不明なエラーが発生しました');
      playErrorSound();
      setPhase('felica-not-found');
      timeoutRef.current = setTimeout(() => {
        setPhase('idle');
        clearMemberRef.current = setTimeout(() => {
          setCurrentMember(null);
          setCurrentAttendance(null);
        }, 400);
      }, 2000);
    }
  };

  const handleCardRemoved = async () => {
    setCurrentMember(null);
    setCurrentAttendance(null);
  };

  const {
    isConnected,
    isReading,
    isAvailable,
    connect,
    disconnect,
    startReading,
    stopReading,
  } = useFeliCaReader({ onRead: handleRead, onCardRemoved: handleCardRemoved });
  const hasReaderSession = isConnected || isDevBypassActive;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // 先読みして初回再生時の遅延を減らす
    const beep = new Audio('/assets/sounds/beep.mp3');
    beep.preload = 'auto';
    beep.load();
    beepAudioRef.current = beep;

    const error = new Audio('/assets/sounds/error.mp3');
    error.preload = 'auto';
    error.load();
    errorAudioRef.current = error;

    return () => {
      beepAudioRef.current = null;
      errorAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isReading) {
      timeoutRef.current = setTimeout(
        () => {
          setPhase('paused');
          stopReading();
        },
        1000 * 60 * 5,
      );
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isReading, stopReading]);

  useEffect(() => {
    if (screen === 'disableSchedule') return;
    if (!isAvailable && !isDevMode) setScreen('unsupported');
    else if (hasReaderSession) setScreen((prev) => (prev === 'manual' ? 'manual' : 'main'));
    else setScreen('connecting');
  }, [screen, isAvailable, hasReaderSession, isDevMode]);

  const handleConnect = async () => {
    if (screen === 'disableSchedule') {
      toast.error('当日の予定に開始/終了時刻が設定されていないため、読み取りは無効です。');
      return;
    }

    try {
      await connect();
      startReading();
      setScreen('main');
    } catch (err) {
      console.error('接続エラー:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (isConnected) {
        await disconnect();
      }
      setIsDevBypassActive(false);
      setScreen('connecting');
      setPhase('idle');
    } catch (err) {
      console.error('切断エラー:', err);
    }
  };

  const normalizeIdm = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^0-9A-F\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const handleDevBypassStart = () => {
    if (!isDevMode) return;
    if (screen === 'disableSchedule') {
      toast.error('当日の予定に開始/終了時刻が設定されていないため、読み取りは無効です。');
      return;
    }

    setPausedAt(null);
    setPhase('idle');
    setIsDevBypassActive(true);
    setScreen('main');
  };

  const handleDevMockRead = () => {
    if (!isDevMode || !isDevBypassActive) return;

    const normalizedIdm = normalizeIdm(devMockIdm);
    if (normalizedIdm.length !== 23) {
      toast.error('IDmは「XX XX XX XX XX XX XX XX」形式で入力してください。');
      return;
    }

    void handleRead({ type: 'FeliCa', id: normalizedIdm });
  };

  const togglePause = () => {
    if (phase === 'paused') {
      setPausedAt(null);
      setPhase('idle');
      try {
        if (isConnected) startReading();
      } catch (e) {
        console.error('startReading failed:', e);
      }
    } else if (phase === 'idle') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPausedAt(new Date());
      setPhase('paused');
      try {
        stopReading();
      } catch (e) {
        console.error('stopReading failed:', e);
      }
    }
  };

  // Manual input handlers
  const handleManualOpen = () => {
    if (screen === 'disableSchedule') {
      toast.error('当日の予定に開始/終了時刻が設定されていないため、読み取りは無効です。');
      return;
    }

    setManualInput('');
    setManualState('input');
    setManualMember(null);
    setManualAttendance(null);
    setManualErrorMessage('管理者にお問い合わせください');
    setScreen('manual');
  };

  const handleManualClose = () => {
    setScreen('main');
    setManualInput('');
    setManualState('input');
    setManualMember(null);
    setManualAttendance(null);
    setManualErrorMessage('管理者にお問い合わせください');
  };

  const handleManualKey = (key: string) => {
    if (!(manualState === 'input' || manualState === "unknown")) return;
    if (manualState === 'unknown') setManualState('input');
      if (key === 'del') {
        setManualInput((prev) => prev.slice(0, -1));
      } else if (manualInput.length < 8) {
        setManualInput((prev) => prev + key);
      }
  };

  const handleManualSubmit = async () => {
    if (screen === 'disableSchedule') {
      toast.error('当日の予定に開始/終了時刻が設定されていないため、読み取りは無効です。');
      return;
    }

    if (manualInput.length === 0 || (manualState !== 'input' && manualState !== 'unknown')) return;
    setManualState('loading');
    try {
      const attendanceLog = await AttendanceLog.createByStudentId(manualInput);
      setManualMember(attendanceLog.member);
      setManualAttendance(attendanceLog.attendance ?? null);
      setManualState('success');
      playSuccessSound();
      setTimeout(() => {
        handleManualClose();
      }, 1500);
    } catch (e) {
      console.error('manual submit failed', e);
      playErrorSound();
      setManualErrorMessage(e instanceof APIError ? e.description : '不明なエラーが発生しました');
      setManualState('unknown');
      setManualInput('');
      setTimeout(() => {
        setManualState('input');
      }, 2000);
    }
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  const formatTimeShort = (d: Date) =>
    d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  const glow =
    phase === 'success'
      ? 'rgba(16,185,129,0.35)'
      : phase === 'unknown' || phase === 'felica-not-found'
        ? 'rgba(239,68,68,0.3)'
        : phase === 'paused'
          ? 'rgba(245,158,11,0.35)'
          : 'rgba(37,99,235,0.35)';

  const overlayBg =
    phase === 'success'
      ? 'linear-gradient(145deg, #059669, #34d399)'
      : phase === 'unknown' || phase === 'felica-not-found'
        ? 'linear-gradient(145deg, #dc2626, #f87171)'
        : phase === 'paused'
          ? 'linear-gradient(145deg, #d97706, #fbbf24)'
          : 'linear-gradient(145deg, #059669, #34d399)';
  const showOverlay = phase === 'success' || phase === 'unknown' || phase === 'paused';

  const displayMember = currentMember ?? prevMember;
  const displayAttendance = currentAttendance ?? prevAttendance;
  const isLateOrLeaveEarly = displayAttendance ? /[遅早]/.test(displayAttendance) : false;
  const attendanceCardStyle = isLateOrLeaveEarly
    ? {
        background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
        border: '1px solid #fde68a',
        badgeBackground: '#f59e0b',
        badgeShadow: '0 4px 14px rgba(245,158,11,0.35)',
      }
    : {
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1px solid #bbf7d0',
        badgeBackground: '#10b981',
        badgeShadow: '0 4px 14px rgba(16,185,129,0.3)',
      };
  const isManualLateOrLeaveEarly = manualAttendance ? /[遅早]/.test(manualAttendance) : false;
  const manualSuccessStyle = isManualLateOrLeaveEarly
    ? {
        border: '#fde68a',
        textColor: '#b45309',
        badgeBackground: '#f59e0b',
        iconBackground: '#fef3c7',
        iconColor: '#d97706',
      }
    : {
        border: '#bbf7d0',
        textColor: '#10b981',
        badgeBackground: '#10b981',
        iconBackground: '#d1fae5',
        iconColor: '#10b981',
      };

  // fetch today's schedule and validate start/end time
  useEffect(() => {
    (async () => {
      try {
        const schedules = await Schedule.get();
        const today = dayjs();
        const todays = schedules.filter((s) => s.date.isSame(today, 'day'));
        if (todays.length === 0) {
          setScheduleError({
            title: '今日の予定がありません',
            message: '管理者は今日の予定を登録してください。',
          });
          setIsDevBypassActive(false);
          setScreen('disableSchedule');
          return;
        }
        const invalid = todays.some((s) => !s.startTime || !s.endTime);
        if (invalid) {
          setScheduleError({
            title: '予定の設定に不備があります',
            message: '予定に開始時刻/終了時刻が設定されていません。管理者は予定の設定を確認してください。',
          });
          setIsDevBypassActive(false);
          setScreen('disableSchedule');
          console.error('Schedule validation failed for today', { todays });
        } else {
          setScheduleError(null);
          if (!isAvailable && !isDevMode) setScreen('unsupported');
          else if (hasReaderSession) setScreen((prev) => (prev === 'manual' ? 'manual' : 'main'));
          else setScreen('connecting');
        }
      } catch (e) {
        console.error('Failed to fetch schedules:', e);
      }
    })();
  }, [isAvailable, hasReaderSession, isDevMode]);

  return (
    <div>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes breathe    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.95)} }
        @keyframes popIn      { 0%{opacity:0;transform:scale(0.75)} 65%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn     { from{opacity:0;transform:scale(0.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes idlePing   { 0%{transform:scale(1);opacity:0.45} 100%{transform:scale(2.0);opacity:0} }
        @keyframes arcSpin    { 0%{transform:rotate(-90deg);stroke-dasharray:180 385} 50%{stroke-dasharray:300 385} 100%{transform:rotate(270deg);stroke-dasharray:180 385} }
        @keyframes scanLine   { 0%{top:20%;opacity:0} 10%{opacity:1} 50%{top:78%;opacity:1} 90%{opacity:1} 100%{top:20%;opacity:0} }
        @keyframes iconPulse  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(0.91);opacity:0.75} }
        @keyframes successPop { 0%{opacity:0;transform:scale(0.8)} 65%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
        @keyframes pauseDash  { 0%{stroke-dashoffset:0} 100%{stroke-dashoffset:-566} }
        @keyframes bPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.18)} 50%{box-shadow:0 0 0 14px rgba(37,99,235,0)} }
        .connect-btn { transition: transform 0.18s ease, box-shadow 0.18s ease !important; }
        .connect-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 26px rgba(37,99,235,0.28) !important; }
        .connect-btn:active { transform: translateY(0) !important; }
        .keypad-btn:hover  { filter: brightness(0.95); }
      `}</style>

      {/* show schedule error at top of component if present */}
      {screen === 'disableSchedule' && (
        <InvalidScheduleScreen title={scheduleError?.title} message={scheduleError?.message} />
      )}

      {/* ── Unsupported ── */}
      {screen === 'unsupported' && <UnsupportedScreen />}

      {/* ── Connecting ── */}
      {screen === 'connecting' && (
        <div
          style={{
            width: 420,
            height: 680,
            background: '#ffffff',
            borderRadius: 28,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'cardIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 36,
              left: 36,
              right: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#2563eb',
                boxShadow: '0 0 0 3px rgba(37,99,235,0.18)',
              }}
            />
            <span
              style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.12em' }}
            >
              出欠記録
            </span>
          </div>
          <div
            style={{
              position: 'relative',
              width: 148,
              height: 148,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
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
          <div style={{ textAlign: 'center', marginBottom: 12, padding: '0 36px' }}>
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

          <div style={{ position: 'absolute', bottom: 36, left: 36, right: 36 }}>
            <button
              onClick={handleConnect}
              className="connect-btn"
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
                letterSpacing: '0.02em',
              }}
            >
              <Iconify icon="solar:usb-bold-duotone" width={16} height={16} color="white" />
              リーダーを接続
            </button>
            {isDevMode && (
              <button
                onClick={handleDevBypassStart}
                className="connect-btn"
                style={{
                  width: '100%',
                  marginTop: 10,
                  padding: '12px 0',
                  borderRadius: 14,
                  border: '1.5px solid #bfdbfe',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  letterSpacing: '0.02em',
                }}
              >
                <Iconify icon="solar:usb-bold-duotone" width={16} height={16} color="#1d4ed8" />
                開発モードで開始（リーダー不要）
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main ── */}
      {screen === 'main' && (
        <div
          style={{
            width: 420,
            height: 680,
            background: phase === 'paused' ? '#fffdf7' : '#ffffff',
            borderRadius: 28,
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.10)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.5s',
            animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {phase === 'paused' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(245,158,11,0.04) 20px, rgba(245,158,11,0.04) 40px)',
              }}
            />
          )}

          {/* Header */}
          <div
            style={{
              position: 'absolute',
              top: 36,
              left: 36,
              right: 36,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background:
                    phase === 'success'
                      ? '#10b981'
                      : phase === 'unknown'
                        ? '#ef4444'
                        : phase === 'paused'
                          ? '#f59e0b'
                          : '#2563eb',
                  boxShadow: '0 0 0 3px ' + glow,
                  transition: 'background 0.7s, box-shadow 0.7s',
                  animation: phase === 'paused' ? 'breathe 2s ease-in-out infinite' : 'none',
                }}
              />
              <span
                style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.12em' }}
              >
                出欠記録
              </span>
              {isDevBypassActive && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#1d4ed8',
                    background: '#dbeafe',
                    borderRadius: 99,
                    padding: '3px 8px',
                    letterSpacing: '0.06em',
                  }}
                >
                  DEV
                </span>
              )}
            </div>
            {(phase === 'idle' || phase === 'paused') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={togglePause}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 14px',
                    borderRadius: 99,
                    border: '1.5px solid ' + (phase === 'paused' ? '#f59e0b' : '#e5e7eb'),
                    background: phase === 'paused' ? '#fef3c7' : '#f9fafb',
                    color: phase === 'paused' ? '#b45309' : '#6b7280',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Iconify
                    icon={phase === 'paused' ? 'solar:play-bold' : 'solar:pause-bold'}
                    width={12}
                    height={12}
                  />
                  {phase === 'paused' ? '再開' : '一時停止'}
                </button>

                {/* 切断ボタンを一時停止の横に移動 */}
                <button
                  onClick={handleDisconnect}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 99,
                    border: '1.5px solid #e5e7eb',
                    background: '#f9fafb',
                    color: '#6b7280',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Iconify icon="mingcute:close-line" width={14} height={14} color="#9ca3af" />
                  切断
                </button>
              </div>
            )}
          </div>

          {/* Clock */}
          <div style={{ position: 'absolute', top: 88, left: 0, right: 0, textAlign: 'center' }}>
            <div
              style={{
                fontSize: 68,
                fontWeight: 300,
                fontFamily: "'DM Mono'",
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: phase === 'paused' ? '#b45309' : '#0f172a',
                transition: 'color 0.4s',
              }}
            >
              {time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>{formatDate(time)}</div>
          </div>

          {/* Scanner circle */}
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #1d4ed8, #60a5fa)',
              boxShadow: '0 8px 32px ' + glow + ', 0 2px 8px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              top: 230,
              left: '50%',
              transform: 'translateX(-50%)',
              transition: 'box-shadow 0.7s ease',
              animation: phase === 'idle' ? 'bPulse 2.2s ease-in-out infinite' : 'none',
              cursor: 'pointer',
            }}
            onClick={togglePause}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: overlayBg,
                opacity: showOverlay ? 1 : 0,
                transition: 'opacity 0.7s ease',
                pointerEvents: 'none',
              }}
            />
            {phase === 'idle' &&
              [0, 0.8, 1.6].map((delay, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    border: '2px solid rgba(37,99,235,0.4)',
                    animation: `idlePing 2.4s ease-out ${delay}s infinite`,
                    pointerEvents: 'none',
                  }}
                />
              ))}
            {phase === 'scanning' && (
              <svg
                style={{
                  position: 'absolute',
                  inset: -8,
                  width: 'calc(100% + 16px)',
                  height: 'calc(100% + 16px)',
                  overflow: 'visible',
                }}
                viewBox="0 0 216 216"
              >
                <circle
                  cx="108"
                  cy="108"
                  r="104"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="3"
                />
                <circle
                  cx="108"
                  cy="108"
                  r="104"
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="180 480"
                  style={{
                    animation: 'arcSpin 1.1s cubic-bezier(0.4,0,0.2,1) infinite',
                    transformOrigin: '108px 108px',
                  }}
                />
                <circle r="5" fill="white" opacity="0.9">
                  <animateMotion
                    dur="1.1s"
                    repeatCount="indefinite"
                    path="M 108 4 A 104 104 0 1 1 107.99 4"
                  />
                </circle>
              </svg>
            )}
            {phase === 'scanning' && (
              <div
                style={{
                  position: 'absolute',
                  left: '15%',
                  right: '15%',
                  height: '1.5px',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.5) 70%, transparent)',
                  animation: 'scanLine 1.3s ease-in-out infinite',
                  top: '50%',
                }}
              />
            )}
            {phase === 'paused' && (
              <svg
                style={{
                  position: 'absolute',
                  inset: -8,
                  width: 'calc(100% + 16px)',
                  height: 'calc(100% + 16px)',
                  overflow: 'visible',
                }}
                viewBox="0 0 216 216"
              >
                <circle
                  cx="108"
                  cy="108"
                  r="104"
                  fill="none"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="14 20"
                  style={{
                    animation: 'pauseDash 6s linear infinite',
                    transformOrigin: '108px 108px',
                  }}
                />
              </svg>
            )}
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity:
                  phase === 'idle' || phase === 'scanning' || phase === 'felica-not-found' ? 1 : 0,
                transition: 'opacity 0.7s ease',
              }}
            >
              <Iconify
                icon="solar:card-bold-duotone"
                width={phase === 'scanning' ? 52 : 56}
                height={phase === 'scanning' ? 52 : 56}
                color="#fff"
                style={{
                  animation: phase === 'scanning' ? 'iconPulse 1.3s ease-in-out infinite' : 'none',
                }}
              />
              {phase === 'idle' && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.75)',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                  }}
                >
                  かざしてください
                </div>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                opacity: phase === 'success' ? 1 : 0,
                transition: 'opacity 0.7s ease',
                animation:
                  phase === 'success' ? 'successPop 0.45s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
              }}
            >
              <Iconify icon="solar:check-circle-bold-duotone" width={56} height={56} color="#fff" />
            </div>
            <div
              style={{
                position: 'absolute',
                opacity: phase === 'unknown' ? 1 : 0,
                transition: 'opacity 0.7s ease',
                animation:
                  phase === 'unknown' ? 'successPop 0.45s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
              }}
            >
              <Iconify icon="solar:close-circle-bold-duotone" width={56} height={56} color="#fff" />
            </div>
            <div
              style={{
                position: 'absolute',
                opacity: phase === 'paused' ? 1 : 0,
                transition: 'opacity 0.7s ease',
                animation: phase === 'paused' ? 'breathe 2s ease-in-out infinite' : 'none',
              }}
            >
              <Iconify icon="solar:pause-circle-bold-duotone" width={56} height={56} color="#fff" />
            </div>
          </div>

          {/* Status area */}
          <div style={{ position: 'absolute', top: 450, left: 36, right: 36 }}>
            <div
              style={{
                position: 'absolute',
                width: '100%',
                textAlign: 'center',
                opacity: phase === 'idle' ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: phase === 'idle' ? 'auto' : 'none',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
                ICカードをかざしてください
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                width: '100%',
                textAlign: 'center',
                opacity: phase === 'scanning' ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: '#2563eb' }}>
                読み込んでいます...
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                opacity: phase === 'success' ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: '#059669', textAlign: 'center' }}>
                記録しました
              </div>
              {displayMember && (
                <div
                  style={{
                    width: '100%',
                    borderRadius: 16,
                    padding: '12px 16px',
                    background: attendanceCardStyle.background,
                    border: attendanceCardStyle.border,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: attendanceCardStyle.badgeBackground,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 16,
                      fontWeight: 700,
                      boxShadow: attendanceCardStyle.badgeShadow,
                    }}
                  >
                    {displayAttendance}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                      {displayMember.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                      {displayMember.part.enShort}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: '#9ca3b8', fontFamily: "'DM Mono'" }}>
                      {formatTimeShort(new Date())}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                width: '100%',
                opacity: phase === 'unknown' ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: 16,
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                  カードを認識できません
                </div>
                <div style={{ fontSize: 12, color: '#f87171', marginTop: 3 }}>
                  管理者にお問い合わせください
                </div>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                width: '100%',
                opacity: phase === 'felica-not-found' ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: 16,
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                  {felicaErrorMessage}
                </div>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                width: '100%',
                textAlign: 'center',
                opacity: phase === 'paused' ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: '#b45309' }}>
                読み取りを一時停止中
              </div>
              <div style={{ fontSize: 12, color: '#d97706', marginTop: 5 }}>
                {pausedAt ? formatTimeShort(pausedAt) + ' より停止中' : ''}
              </div>
            </div>
            <div style={{ height: 120 }} />
          </div>

          {/* Bottom buttons */}
          <div
            style={{
              position: 'absolute',
              bottom: 52,
              left: 36,
              right: 36,
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {phase === 'idle' && (
              <button
                onClick={handleManualOpen}
                style={{
                  padding: '10px 18px',
                  minHeight: 44,
                  borderRadius: 14,
                  border: '1.5px solid #bfdbfe',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                <Iconify icon="solar:pen-bold" width={16} height={16} color="#2563eb" />
                カードがない
              </button>
            )}
          </div>

          {isDevMode && isDevBypassActive && (
            <div
              style={{
                position: 'absolute',
                bottom: 96,
                left: 36,
                right: 36,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <input
                value={devMockIdm}
                onChange={(event) => {
                  const next = event.target.value.toUpperCase();
                  setDevMockIdm(next.slice(0, 23));
                }}
                placeholder="01 23 45 67 89 AB CD EF"
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid #bfdbfe',
                  background: '#f8fbff',
                  color: '#1e3a8a',
                  fontSize: 11,
                  padding: '0 10px',
                  fontFamily: "'DM Mono'",
                  letterSpacing: '0.06em',
                }}
              />
              <button
                onClick={handleDevMockRead}
                disabled={phase !== 'idle'}
                style={{
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 10,
                  border: 'none',
                  background: phase === 'idle' ? '#2563eb' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: phase === 'idle' ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                IDmでかざす
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Manual input screen ── */}
      {screen === 'manual' && (
        <div
          style={{
            width: 420,
            height: 680,
            background: '#ffffff',
            borderRadius: 28,
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.10)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'cardIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '36px 36px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#2563eb',
                    boxShadow: '0 0 0 3px rgba(37,99,235,0.18)',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9ca3af',
                    letterSpacing: '0.12em',
                  }}
                >
                  出欠記録
                </span>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                }}
              >
                学籍番号で記録
              </div>
            </div>
            <button
              onClick={handleManualClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: '#f1f5f9',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <Iconify icon="mingcute:close-line" width={18} height={18} color="#64748b" />
            </button>
          </div>

          {/* Input display */}
          <div style={{ padding: '20px 36px 0', flexShrink: 0 }}>
            <div
              style={{
                background: '#f8fafc',
                border:
                  '1.5px solid ' +
                  (manualState === 'unknown'
                    ? '#fecaca'
                    : manualState === 'success'
                      ? manualSuccessStyle.border
                      : '#e2e8f0'),
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'border-color 0.3s',
                minHeight: 72,
              }}
            >
              <div style={{ flex: 1 }}>
                {manualState === 'success' && manualMember ? (
                  <div style={{ animation: 'fadeUp 0.3s ease' }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: manualSuccessStyle.textColor,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      記録しました
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                      {manualMember.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                      {manualMember.part.enShort}
                      {manualAttendance && (
                        <span
                          style={{
                            marginLeft: 8,
                            background: manualSuccessStyle.badgeBackground,
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: 99,
                          }}
                        >
                          {manualAttendance}
                        </span>
                      )}
                    </div>
                  </div>
                ) : manualState === 'unknown' ? (
                  <div style={{ animation: 'fadeUp 0.3s ease' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                      {manualErrorMessage}
                    </div>
                  </div>
                ) : manualState === 'loading' ? (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>検索中...</div>
                ) : (
                  <div
                    style={{
                      fontSize: 28,
                      fontFamily: "'DM Mono'",
                      fontWeight: 400,
                      color: manualInput ? '#0f172a' : '#c4c9d4',
                      letterSpacing: '0.15em',
                      lineHeight: 1,
                    }}
                  >
                    {manualInput}
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0, marginLeft: 12 }}>
                {manualState === 'success' && (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: manualSuccessStyle.iconBackground,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify
                      icon="solar:check-circle-bold-duotone"
                      width={24}
                      height={24}
                      color={manualSuccessStyle.iconColor}
                    />
                  </div>
                )}
                {manualState === 'unknown' && (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify
                      icon="solar:close-circle-bold-duotone"
                      width={24}
                      height={24}
                      color="#ef4444"
                    />
                  </div>
                )}
                {manualState === 'loading' && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: '2.5px solid #e2e8f0',
                      borderTopColor: '#2563eb',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Keypad */}
          <div style={{ padding: '16px 36px 0', flex: 1 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                height: '100%',
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, idx) => (
                <button
                  key={idx}
                  className="keypad-btn"
                  onClick={() => key !== '' && handleManualKey(key)}
                  disabled={!(manualState === 'input' || manualState === 'unknown') || key === ''}
                  style={{
                    height: 60,
                    borderRadius: 14,
                    border: 'none',
                    background: key === 'del' ? '#fff0f0' : key === '' ? 'transparent' : '#f8fafc',
                    color: key === 'del' ? '#ef4444' : '#0f172a',
                    fontSize: 22,
                    fontFamily: key === 'del' ? 'inherit' : "'DM Mono'",
                    fontWeight: 300,
                    cursor: key === '' ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.1s',
                    boxShadow: key !== '' && key !== 'del' ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                  }}
                >
                  {key === 'del' ? (
                    <Iconify
                      icon="solar:backspace-bold-duotone"
                      width={22}
                      height={22}
                      color="#ef4444"
                    />
                  ) : (
                    key
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div style={{ padding: '16px 36px 36px', flexShrink: 0 }}>
            <button
              onClick={handleManualSubmit}
              disabled={
                manualInput.length === 0 || (manualState !== 'input' && manualState !== 'unknown')
              }
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 14,
                border: 'none',
                background:
                  manualInput.length === 0 || manualState !== 'input'
                    ? '#e2e8f0'
                    : 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
                color: manualInput.length === 0 || manualState !== 'input' ? '#94a3b8' : '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor:
                  manualInput.length === 0 || manualState !== 'input' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
                boxShadow:
                  manualInput.length > 0 && manualState === 'input'
                    ? '0 4px 20px rgba(37,99,235,0.3)'
                    : 'none',
              }}
            >
              {manualState === 'loading'
                ? '検索中...'
                : manualState === 'success'
                  ? '記録しました ✓'
                  : '記録する'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
 }

