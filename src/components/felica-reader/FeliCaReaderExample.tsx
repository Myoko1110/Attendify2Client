っぱimport React from 'react';
import { useFeliCaReader } from '../../felica';

/**
 * FeliCaカード読み取りコンポーネントの使用例
 */
export function FeliCaReaderExample() {
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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>FeliCa Reader</h1>

      <div style={{ marginBottom: '20px' }}>
        <p>
          USB接続のFeliCaリーダー経由でFeliCaのIDmまたはMIFARE IDを読み取ります。
        </p>
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          注意：チャージ済みだったり、オートチャージが有効なカードでは絶対に実験しないでください。
          勝手に決済が発生してお金が無くなっても責任はとれません。
        </p>
      </div>

      {!isAvailable && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>WebUSB未対応</h3>
          <p style={{ margin: 0, color: '#856404' }}>
            お使いのブラウザはWebUSBをサポートしていません。Chrome、Edge等の対応ブラウザをご利用ください。
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={!isAvailable}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: isAvailable ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isAvailable ? 'pointer' : 'not-allowed',
            }}
          >
            FeliCaリーダーに接続
          </button>
        ) : (
          <>
            <button
              onClick={stopReading}
              disabled={!isReading}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: isReading ? '#ffc107' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isReading ? 'pointer' : 'not-allowed',
              }}
            >
              読み取りを停止
            </button>
            <button
              onClick={handleDisconnect}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              切断
            </button>
          </>
        )}
      </div>

      {isReading && !card && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '4px',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '30px',
              height: '30px',
              border: '3px solid #007bff',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ marginTop: '10px' }}>FeliCaリーダーにカードをかざしてください</p>
        </div>
      )}

      {card && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>カード検出</h3>
          <p style={{ margin: '5px 0' }}>
            <strong>カードタイプ:</strong> {card.type}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>カードID:</strong> {card.id}
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>エラー</h3>
              <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
            </div>
            <button
              onClick={clearError}
              style={{
                padding: '5px 10px',
                fontSize: '14px',
                backgroundColor: 'transparent',
                color: '#721c24',
                border: '1px solid #721c24',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
