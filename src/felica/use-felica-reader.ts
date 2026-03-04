import { useRef, useState, useEffect, useCallback } from 'react';

import { FeliCaReader, type CardInfo } from './felica-reader';

export interface UseFeliCaReaderOptions {
  /** カードが読み取られたときのコールバック */
  onRead?: (card: CardInfo) => void | Promise<void>;
  /** カードが離れたときのコールバック */
  onCardRemoved?: () => void | Promise<void>;
}

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
 *   const { isConnected, card, connect, startReading, stopReading } = useFeliCaReader({
 *     onRead: async (card) => {
 *       console.log('カードが読み取られました:', card);
 *       // 非同期処理も可能
 *       await fetch('/api/attendance', { method: 'POST', body: JSON.stringify(card) });
 *     },
 *     onCardRemoved: async () => {
 *       console.log('カードが離れました');
 *     }
 *   });
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
export function useFeliCaReader(options?: UseFeliCaReaderOptions): UseFeliCaReaderReturn {
  const { onRead, onCardRemoved } = options || {};

  const [isConnected, setIsConnected] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [card, setCard] = useState<CardInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable] = useState(() => FeliCaReader.isAvailable());

  const readerRef = useRef<FeliCaReader | null>(null);
  const stopFlagRef = useRef(false);
  const onReadRef = useRef(onRead);
  const onCardRemovedRef = useRef(onCardRemoved);
  const previousCardIdRef = useRef<string | null>(null);

  // onReadの最新の参照を保持
  useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  // onCardRemovedの最新の参照を保持
  useEffect(() => {
    onCardRemovedRef.current = onCardRemoved;
  }, [onCardRemoved]);

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
    previousCardIdRef.current = null;
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
        if (!stopFlagRef.current) {
          // カードが検出された場合
          if (detectedCard) {
            const currentCardId = detectedCard.id;

            // 新しいカードが検出された場合（前回と異なるカード、または初回）
            if (previousCardIdRef.current !== currentCardId) {
              setCard(detectedCard);
              setError(null);
              previousCardIdRef.current = currentCardId;

              // onReadコールバックを実行
              if (onReadRef.current) {
                await onReadRef.current(detectedCard);
              }
            }
          } else {
            // カードが検出されなかった場合
            // 前回カードがあった場合は、カードが離れたと判断
            if (previousCardIdRef.current !== null) {
              previousCardIdRef.current = null;
              setCard(null);

              // onCardRemovedコールバックを実行
              if (onCardRemovedRef.current) {
                await onCardRemovedRef.current();
              }
            }
          }
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
    previousCardIdRef.current = null;
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
        // onReadコールバックを実行
        if (onReadRef.current) {
          await onReadRef.current(detectedCard);
        }
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
