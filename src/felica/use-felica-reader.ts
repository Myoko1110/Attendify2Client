import { useRef, useState, useEffect, useCallback } from 'react';

import { FeliCaReader, type CardInfo } from './felica-reader';

export interface UseFeliCaReaderReturn {
  /** 接続中かどうか */
  isConnected: boolean;
  /** 読み取り中かどうか */
  isReading: boolean;
  /** 最後に読み取ったカード情報 */
  card: CardInfo | null;
  /** エラーメッセージ */
  error: string | null;
  /** WebUSBが利用可能か */
  isAvailable: boolean;
  /** デバイスに接続 */
  connect: (autoSelect?: boolean) => Promise<void>;
  /** デバイスから切断 */
  disconnect: () => Promise<void>;
  /** 読み取りを開始 */
  startReading: () => void;
  /** 読み取りを停止 */
  stopReading: () => void;
  /** 1回だけ読み取り */
  readOnce: () => Promise<CardInfo | null>;
  /** エラーをクリア */
  clearError: () => void;
}

/**
 * FeliCaReaderを使用するためのReactフック
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, card, connect, startReading, stopReading } = useFeliCaReader();
 *
 *   const handleConnect = async () => {
 *     await connect();
 *     startReading();
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleConnect} disabled={isConnected}>接続</button>
 *       <button onClick={stopReading} disabled={!isConnected}>停止</button>
 *       {card && <div>カード: {card.type} - {card.id}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeliCaReader(): UseFeliCaReaderReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [card, setCard] = useState<CardInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable] = useState(() => FeliCaReader.isAvailable());

  const readerRef = useRef<FeliCaReader | null>(null);
  const stopFlagRef = useRef(false);

  /**
   * デバイスに接続
   */
  const connect = useCallback(async (autoSelect = true) => {
    try {
      const reader = new FeliCaReader();
      await reader.connect(autoSelect);

      readerRef.current = reader;
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * デバイスから切断
   */
  const disconnect = useCallback(async () => {
    // 読み取りを停止
    stopFlagRef.current = true;
    setIsReading(false);

    // デバイスを切断
    if (readerRef.current) {
      await readerRef.current.disconnect();
      readerRef.current = null;
    }

    setIsConnected(false);
    setCard(null);
  }, []);

  /**
   * 読み取りループ
   */
  const readLoop = useCallback(async () => {
    const reader = readerRef.current;
    if (!reader) return;

    while (!stopFlagRef.current) {
      try {
        const detectedCard = await reader.readCard();
        if (detectedCard && !stopFlagRef.current) {
          setCard(detectedCard);
          setError(null);
        }
        // 少し待機
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        if (!stopFlagRef.current) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage);
          setIsReading(false);
          break;
        }
      }
    }
  }, []);

  /**
   * 読み取りを開始
   */
  const startReading = useCallback(() => {
    if (!readerRef.current || isReading) {
      return;
    }

    stopFlagRef.current = false;
    setIsReading(true);
    setError(null);
    readLoop();
  }, [isReading, readLoop]);

  /**
   * 読み取りを停止
   */
  const stopReading = useCallback(() => {
    stopFlagRef.current = true;
    setIsReading(false);
  }, []);

  /**
   * 1回だけ読み取り
   */
  const readOnce = useCallback(async (): Promise<CardInfo | null> => {
    const reader = readerRef.current;
    if (!reader) {
      throw new Error('デバイスが接続されていません');
    }

    try {
      const detectedCard = await reader.readCard();
      if (detectedCard) {
        setCard(detectedCard);
        setError(null);
      }
      return detectedCard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // クリーンアップ
  useEffect(
    () => () => {
      stopFlagRef.current = true;
      if (readerRef.current) {
        readerRef.current.disconnect().catch(console.error);
      }
    },
    []
  );

  return {
    isConnected,
    isReading,
    card,
    error,
    isAvailable,
    connect,
    disconnect,
    startReading,
    stopReading,
    readOnce,
    clearError,
  };
}
