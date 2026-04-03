import { Iconify } from '../../components/iconify';

export default function UnsupportedScreen() {
  return (
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
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'cardIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        padding: '0 40px',
      }}
    >
      {/* Header */}
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
            background: '#ef4444',
            boxShadow: '0 0 0 3px rgba(239,68,68,0.18)',
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.12em' }}>
          出欠記録
        </span>
      </div>

      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#fff5f5',
          border: '2px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <Iconify icon="solar:danger-triangle-linear" width={36} color="#ef4444" />
      </div>

      {/* Message */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: 10,
            letterSpacing: '-0.01em',
          }}
        >
          ブラウザ非対応
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.8,
            background: '#f8f9fc',
            borderRadius: 12,
            padding: '14px 18px',
            border: '1px solid #e8eaf0',
          }}
        >
          お使いのブラウザは <strong style={{ color: '#374151' }}>WebUSB</strong>{' '}
          をサポートしていません。
          ChromeやEdge 等の対応ブラウザをご利用ください。
        </div>
      </div>
    </div>
  );
}
