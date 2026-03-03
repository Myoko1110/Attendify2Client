# FeliCa Reader for React

React アプリケーションでWebUSB経由でFeliCaリーダー（PaSoRi等）を操作し、カードのIDmやMIFARE IDを読み取るためのユーティリティとフックです。

## 対応デバイス

- **RC-S380** (PaSoRi) - `0x054c:0x06C1`, `0x054c:0x06C3`
- **RC-S300** - `0x054c:0x0dc8`, `0x054c:0x0dc9`

## 対応カード

- **FeliCa**（交通系ICカード、電子マネーなど）
- **MIFARE**

## 前提条件

- WebUSBをサポートしているブラウザ（Chrome、Edge等）
- HTTPS接続またはlocalhost環境

## 使い方

### 基本的な使用例

```tsx
import { useFeliCaReader } from '@/felica';

function MyComponent() {
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
    await disconnect();
  };

  if (!isAvailable) {
    return <div>WebUSBは利用できません</div>;
  }

  return (
    <div>
      {!isConnected ? (
        <button onClick={handleConnect}>接続</button>
      ) : (
        <>
          <button onClick={stopReading} disabled={!isReading}>
            停止
          </button>
          <button onClick={handleDisconnect}>切断</button>
        </>
      )}
      
      {card && (
        <div>
          <p>カードタイプ: {card.type}</p>
          <p>カードID: {card.id}</p>
        </div>
      )}
      
      {error && <div>エラー: {error}</div>}
    </div>
  );
}
```

### 1回だけ読み取り

```tsx
function SingleReadComponent() {
  const { connect, readOnce, card, error } = useFeliCaReader();

  const handleRead = async () => {
    try {
      await connect();
      const detectedCard = await readOnce();
      if (detectedCard) {
        console.log('カード検出:', detectedCard);
      }
    } catch (err) {
      console.error('読み取りエラー:', err);
    }
  };

  return (
    <div>
      <button onClick={handleRead}>カードを読み取る</button>
      {card && <div>ID: {card.id}</div>}
      {error && <div>エラー: {error}</div>}
    </div>
  );
}
```

## API リファレンス

### useFeliCaReader()

FeliCaリーダーを操作するためのReactフックです。

#### 戻り値

```typescript
interface UseFeliCaReaderReturn {
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
```

#### CardInfo

```typescript
interface CardInfo {
  /** カードタイプ: "FeliCa" または "MIFARE" */
  type: 'FeliCa' | 'MIFARE';
  /** カードID（16進数、スペース区切り） */
  id: string;
}
```

### FeliCaReader クラス

低レベルAPIが必要な場合は、`FeliCaReader`クラスを直接使用できます。

```typescript
import { FeliCaReader } from '@/felica';

const reader = new FeliCaReader();

// 接続
await reader.connect();

// カード読み取り
const card = await reader.readCard();
if (card) {
  console.log(card.type, card.id);
}

// 切断
await reader.disconnect();
```

## 完全なサンプルコード

`src/components/felica-reader/FeliCaReaderExample.tsx` に完全な使用例があります。

## 注意事項

⚠️ **重要**: チャージ済みやオートチャージが有効なカードでは絶対に実験しないでください。勝手に決済が発生する可能性があります。

- WebUSBはHTTPS接続またはlocalhostでのみ動作します
- カードの読み取りには適切な権限が必要です
- 一部のブラウザではWebUSBがサポートされていません

## トラブルシューティング

### デバイスが検出されない

1. リーダーがUSBで正しく接続されているか確認
2. 他のアプリケーションがリーダーを使用していないか確認
3. ブラウザがWebUSBをサポートしているか確認

### カードが読み取れない

1. カードがリーダーに正しくかざされているか確認
2. カードの種類が対応しているか確認（FeliCaまたはMIFARE）
3. カードが破損していないか確認

## ライセンス

このコードは元の`html.html`のパブリックドメインライセンスに従います。

## 元のコード

このモジュールは `NFC/html.html` のコードをReact用にモジュール化したものです。
