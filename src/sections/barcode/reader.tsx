import type Member from 'src/api/member';

import dayjs from 'dayjs';
import { useRef, useState, useEffect } from 'react';

import Schedule from 'src/api/schedule';
import { APIError } from 'src/abc/api-error';
import AttendanceLog from 'src/api/attendance-log';

import InvalidScheduleScreen from 'src/sections/felica/invalid-schedule-screen';

type Phase = 'idle' | 'scanning' | 'success' | 'error' | 'disableSchedule';

const duplicateReadWindowMs = 10_000;

export function BarcodeReader() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [prevMember, setPrevMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<string | null>(null);
  const [prevAttendance, setPrevAttendance] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('管理者にお問い合わせください');
  const [scheduleError, setScheduleError] = useState<{ title: string; message: string } | null>(
    null,
  );

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearMemberRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReadRef = useRef<{ value: string; at: number } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
          setPhase('disableSchedule');
          return;
        }
        const invalid = todays.some((s) => !s.startTime || !s.endTime);
        if (invalid) {
          setScheduleError({
            title: '予定の設定に不備があります',
            message:
              '予定に開始時刻/終了時刻が設定されていません。管理者は予定の設定を確認してください。',
          });
          setPhase('disableSchedule');
          return;
        }
        setScheduleError(null);
      } catch (e) {
        console.error('Failed to fetch schedules:', e);
      }
    })();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isHelpOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsHelpOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isHelpOpen]);

  const parseStudentId = (raw: string) => {
    const trimmed = raw.trim();
    const prefixed = trimmed.match(/^student(?:_?id)?\s*[:=]\s*(.+)$/i);
    return (prefixed?.[1] ?? trimmed).trim();
  };

  const handleDetected = async (rawValue: string) => {
    const studentId = parseStudentId(rawValue);
    if (!studentId) return;

    const now = Date.now();
    const lastRead = lastReadRef.current;
    const isDuplicate =
      !!lastRead && lastRead.value === studentId && now - lastRead.at <= duplicateReadWindowMs;
    if (isDuplicate) return;
    lastReadRef.current = { value: studentId, at: now };

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (clearMemberRef.current) clearTimeout(clearMemberRef.current);

    setPhase('scanning');
    setInputValue('');
    setErrorMessage('管理者にお問い合わせください');

    try {
      const log = await AttendanceLog.createByStudentId(studentId);
      setPrevMember(log.member);
      setPrevAttendance(log.attendance ?? null);
      setMember(log.member);
      setAttendance(log.attendance ?? null);
      setPhase('success');

      timeoutRef.current = setTimeout(() => {
        setPhase('idle');
        clearMemberRef.current = setTimeout(() => {
          setMember(null);
          setPrevMember(null);
          setAttendance(null);
          setPrevAttendance(null);
        }, 400);
      }, 2000);
    } catch (e) {
      setMember(null);
      setAttendance(null);
      setErrorMessage(e instanceof APIError ? e.description : '不明なエラーが発生しました');
      setPhase('error');

      timeoutRef.current = setTimeout(() => {
        setPhase('idle');
      }, 2000);
    }
  };

  const handleSubmit = () => {
    if (phase === 'disableSchedule' || phase === 'scanning') return;
    const raw = inputValue.trim();
    if (!raw) return;
    void handleDetected(raw);
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

  // Visual config per phase
  const glow =
    phase === 'success'
      ? 'rgba(16,185,129,0.35)'
      : phase === 'error'
        ? 'rgba(239,68,68,0.3)'
        : 'rgba(37,99,235,0.35)';

  const displayMember = member ?? prevMember;
  const displayAttendance = attendance ?? prevAttendance;

  if (phase === 'disableSchedule') {
    return <InvalidScheduleScreen title={scheduleError?.title} message={scheduleError?.message} />;
  }

  return (
    <div style={{ width: 420 }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes cardIn     { from{opacity:0;transform:scale(0.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes successPop { 0%{opacity:0;transform:scale(0.8)} 65%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanPulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div
        style={{
          height: 680,
          background: '#ffffff',
          borderRadius: 28,
          boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.10)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header dot */}
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
              background:
                phase === 'success' ? '#10b981' : phase === 'error' ? '#ef4444' : '#2563eb',
              boxShadow: '0 0 0 3px ' + glow,
              transition: 'background 0.7s, box-shadow 0.7s',
            }}
          />
          <span
            style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.12em' }}
          >
            バーコード
          </span>
        </div>

        {/* Clock — larger, centered */}
        <div style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 300,
              fontFamily: "'DM Mono'",
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: phase === 'success' ? '#059669' : phase === 'error' ? '#dc2626' : '#0f172a',
              transition: 'color 0.5s ease',
            }}
          >
            {time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>{formatDate(time)}</div>
        </div>

        {/* Status area — crossfading layers */}
        <div style={{ position: 'absolute', top: 310, left: 36, right: 36 }}>
          {/* idle */}
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
              バーコードをスキャンしてください
            </div>
          </div>

          {/* scanning */}
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
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#2563eb',
                animation: 'scanPulse 1.2s ease-in-out infinite',
              }}
            >
              打刻しています...
            </div>
          </div>

          {/* success */}
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
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  border: '1px solid #bbf7d0',
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
                    background: '#10b981',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  }}
                >
                  {displayMember.name ? displayMember.name.charAt(0) : 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                    {displayMember.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                    {displayMember.id ?? ''} · {displayMember.part?.jp ?? ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      background: '#10b981',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: 99,
                      marginBottom: 3,
                      display: 'inline-block',
                    }}
                  >
                    {displayAttendance}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: "'DM Mono'" }}>
                    {formatTimeShort(new Date())}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* error */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              opacity: phase === 'error' ? 1 : 0,
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
              <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{errorMessage}</div>
            </div>
          </div>

          <div style={{ height: 120 }} />
        </div>

        {/* Input field */}
        <div style={{ position: 'absolute', bottom: 52, left: 36, right: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              aria-label="設定ヘルプ"
              title="設定ヘルプ"
              style={{
                width: 28,
                height: 28,
                padding: 0,
                borderRadius: '50%',
                border: '1px solid #dbeafe',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ?
            </button>
          </div>
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 14,
              border:
                '1.5px solid ' +
                (phase === 'success' ? '#bbf7d0' : phase === 'error' ? '#fecaca' : '#e2e8f0'),
              padding: '4px 6px 4px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'border-color 0.3s',
            }}
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
                if (e.key === 'Escape') setInputValue('');
              }}
              placeholder="学籍番号"
              autoComplete="off"
              style={{
                flex: 1,
                height: 44,
                border: 'none',
                background: 'transparent',
                color: '#0f172a',
                fontSize: 18,
                fontFamily: "'DM Mono'",
                letterSpacing: '0.08em',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={phase === 'scanning' || inputValue.trim().length === 0}
              style={{
                height: 36,
                minWidth: 74,
                padding: '0 12px',
                borderRadius: 10,
                border: 'none',
                background:
                  phase === 'scanning' || inputValue.trim().length === 0 ? '#cbd5e1' : '#2563eb',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                cursor:
                  phase === 'scanning' || inputValue.trim().length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              送信
            </button>
          </div>
        </div>

        {isHelpOpen && (
          <div
            role="presentation"
            onClick={() => setIsHelpOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15,23,42,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              padding: 20,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="バーコードリーダー設定ヘルプ"
              onClick={(event) => event.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 340,
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                padding: '16px 16px 14px',
                boxShadow: '0 12px 36px rgba(15,23,42,0.22)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>設定ヘルプ</div>
              <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: '#334155' }}>
                バーコードリーダーは、即時送信モードにしてください。
                ターミネーター（末尾に自動付加される文字）にEnterを追加してください。
                （もしくは、バーコードの末尾にEnterを追加してください。）
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  style={{
                    height: 34,
                    minWidth: 80,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
