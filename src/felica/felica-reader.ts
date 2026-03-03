/**
 * FeliCa Reader Utility for React
 * WebUSB経由でFeliCaリーダーを操作するユーティリティクラス
 */

export interface CardInfo {
  type: 'FeliCa' | 'MIFARE';
  id: string;
}

interface DeviceFilter {
  vendorId: number;
  productId: number;
  deviceModel: number;
}

interface DeviceEndpoint {
  in: number;
  out: number;
}

/**
 * FeliCaリーダークラス
 */
export class FeliCaReader {
  private deviceFilters: DeviceFilter[] = [
    { vendorId: 0x054c, productId: 0x06c1, deviceModel: 380 },
    { vendorId: 0x054c, productId: 0x06c3, deviceModel: 380 },
    { vendorId: 0x054c, productId: 0x0dc8, deviceModel: 300 },
    { vendorId: 0x054c, productId: 0x0dc9, deviceModel: 300 },
  ];

  private deviceModelList: Record<number, number> = {
    0x06c1: 380,
    0x06c3: 380,
    0x0dc8: 300,
    0x0dc9: 300,
  };

  private device: USBDevice | null = null;
  private deviceModel: number | null = null;
  private deviceEp: DeviceEndpoint = { in: 0, out: 0 };
  private seqNumber = 0;

  /**
   * WebUSBが利用可能かチェック
   */
  static isAvailable(): boolean {
    return 'usb' in navigator;
  }

  /**
   * デバイスに接続
   */
  async connect(autoSelect = true): Promise<void> {
    if (!FeliCaReader.isAvailable()) {
      throw new Error('WebUSBはこのブラウザではサポートされていません');
    }

    try {
      // ペアリング済みデバイスを取得
      let pairedDevices = await navigator.usb.getDevices();
      pairedDevices = pairedDevices.filter((d) =>
        this.deviceFilters.map((p) => p.productId).includes(d.productId)
      );

      // 自動選択または選択画面
      if (autoSelect && pairedDevices.length === 1) {
        this.device = pairedDevices[0];
      } else {
        this.device = await navigator.usb.requestDevice({
          filters: this.deviceFilters,
        });
      }

      this.deviceModel = this.deviceModelList[this.device.productId];
      await this.device.open();

      // インターフェース設定
      await this.device.selectConfiguration(1);
      const iface = this.device.configuration!.interfaces.find(
        (v) => v.alternate.interfaceClass === 255
      );

      if (!iface) {
        throw new Error('適切なインターフェースが見つかりません');
      }

      await this.device.claimInterface(iface.interfaceNumber);

      const inEndpoint = iface.alternate.endpoints.find((e) => e.direction === 'in');
      const outEndpoint = iface.alternate.endpoints.find((e) => e.direction === 'out');

      if (!inEndpoint || !outEndpoint) {
        throw new Error('エンドポイントが見つかりません');
      }

      this.deviceEp = {
        in: inEndpoint.endpointNumber,
        out: outEndpoint.endpointNumber,
      };
    } catch (error) {
      throw new Error(`デバイス接続エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * デバイスから切断
   */
  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.close();
      } catch (error) {
        console.error('デバイス切断エラー:', error);
      } finally {
        this.device = null;
        this.deviceModel = null;
        this.seqNumber = 0;
      }
    }
  }

  /**
   * 接続されているか
   */
  isConnected(): boolean {
    return this.device !== null;
  }

  /**
   * カードを読み取り
   */
  async readCard(): Promise<CardInfo | null> {
    if (!this.device) {
      throw new Error('デバイスが接続されていません');
    }

    if (this.deviceModel === 300) {
      return await this.readCard300();
    } else {
      return await this.readCard380();
    }
  }

  /**
   * RC-S300でカードを読み取り
   */
  private async readCard300(): Promise<CardInfo | null> {
    const len = 50;

    // 初期化シーケンス
    await this.send300([0xff, 0x56, 0x00, 0x00]);
    await this.receive(len);

    await this.send300([0xff, 0x50, 0x00, 0x00, 0x02, 0x82, 0x00, 0x00]);
    await this.receive(len);

    await this.send300([0xff, 0x50, 0x00, 0x00, 0x02, 0x81, 0x00, 0x00]);
    await this.receive(len);

    await this.send300([0xff, 0x50, 0x00, 0x00, 0x02, 0x83, 0x00, 0x00]);
    await this.receive(len);

    await this.send300([0xff, 0x50, 0x00, 0x00, 0x02, 0x84, 0x00, 0x00]);
    await this.receive(len);

    // FeliCa Polling
    await this.send300([0xff, 0x50, 0x00, 0x02, 0x04, 0x8f, 0x02, 0x03, 0x00, 0x00]);
    await this.receive(len);

    await this.send300([
      0xff, 0x50, 0x00, 0x01, 0x00, 0x00, 0x11, 0x5f, 0x46, 0x04, 0xa0, 0x86, 0x01, 0x00, 0x95, 0x82,
      0x00, 0x06, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00, 0x00, 0x00, 0x00,
    ]);
    const pollingResF = await this.receive(len);

    if (pollingResF.length === 46) {
      const idm = pollingResF.slice(26, 34).map((v) => this.dec2HexString(v));
      return { type: 'FeliCa', id: idm.join(' ') };
    }

    // MIFARE Polling
    await this.send300([0xff, 0x50, 0x00, 0x02, 0x04, 0x8f, 0x02, 0x00, 0x03, 0x00]);
    await this.receive(len);

    await this.send300([0xff, 0xca, 0x00, 0x00]);
    const pollingResA = await this.receive(len);

    if (pollingResA.length === 16) {
      const id = pollingResA.slice(10, 14).map((v) => this.dec2HexString(v));
      return { type: 'MIFARE', id: id.join(' ') };
    }

    return null;
  }

  /**
   * RC-S380でカードを読み取り
   */
  private async readCard380(): Promise<CardInfo | null> {
    // 初期化
    await this.send([0x00, 0x00, 0xff, 0x00, 0xff, 0x00]);

    await this.send([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff, 0x00]);
    await this.receive(6);
    await this.receive(13);

    // RF OFF
    await this.send([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]);
    await this.receive(6);
    await this.receive(13);

    await this.send([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]);
    await this.receive(6);
    await this.receive(13);

    // FeliCa設定
    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x01, 0x01, 0x0f, 0x01, 0x18, 0x00,
    ]);
    await this.receive(6);
    await this.receive(13);

    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x28, 0x00, 0xd8, 0xd6, 0x02, 0x00, 0x18, 0x01, 0x01, 0x02, 0x01,
      0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00,
      0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06,
      0x4b, 0x00,
    ]);
    await this.receive(6);
    await this.receive(13);

    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x04, 0x00, 0xfc, 0xd6, 0x02, 0x00, 0x18, 0x10, 0x00,
    ]);
    await this.receive(6);
    await this.receive(13);

    // FeliCa Polling
    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x04, 0x6e, 0x00, 0x06, 0x00, 0xff, 0xff,
      0x01, 0x00, 0xb3, 0x00,
    ]);
    await this.receive(6);
    const idm = (await this.receive(37)).slice(17, 25);

    if (idm.length > 0 && !idm.every((v) => v === 0)) {
      return { type: 'FeliCa', id: idm.map((v) => this.dec2HexString(v)).join(' ') };
    }

    // MIFARE設定
    await this.send([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]);
    await this.receive(6);
    await this.receive(13);

    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x02, 0x03, 0x0f, 0x03, 0x13, 0x00,
    ]);
    await this.receive(6);
    await this.receive(13);

    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x28, 0x00, 0xd8, 0xd6, 0x02, 0x00, 0x18, 0x01, 0x01, 0x02, 0x01,
      0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00,
      0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06,
      0x4b, 0x00,
    ]);
    await this.receive(6);
    await this.receive(13);

    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x0c, 0x00, 0xf4, 0xd6, 0x02, 0x01, 0x00, 0x02, 0x00, 0x05, 0x01,
      0x00, 0x06, 0x07, 0x07, 0x0b, 0x00,
    ]);
    await this.receive(6);
    await this.receive(13);

    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x05, 0x00, 0xfb, 0xd6, 0x04, 0x36, 0x01, 0x26, 0xc9, 0x00,
    ]);
    await this.receive(6);
    await this.receive(20);

    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x02, 0x04, 0x01, 0x07, 0x08, 0x14, 0x00,
    ]);
    await this.receive(6);
    await this.receive(13);

    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x02, 0x01, 0x00, 0x02, 0x00, 0x25, 0x00,
    ]);
    await this.receive(6);
    await this.receive(13);

    // MIFARE ID取得
    await this.send([
      0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x04, 0x36, 0x01, 0x93, 0x20, 0x3c, 0x00,
    ]);
    await this.receive(6);
    const idt = (await this.receive(22)).slice(15, 19);

    if (idt.length > 2 && !idt.every((v) => v === 0)) {
      return { type: 'MIFARE', id: idt.map((v) => this.dec2HexString(v)).join(' ') };
    }

    return null;
  }

  /**
   * データ送信 (RC-S380用)
   */
  private async send(data: number[]): Promise<void> {
    if (!this.device) throw new Error('デバイスが接続されていません');
    const uint8a = new Uint8Array(data);
    await this.device.transferOut(this.deviceEp.out, uint8a);
    await this.sleep(100);
  }

  /**
   * データ送信 (RC-S300用)
   */
  private async send300(data: number[]): Promise<void> {
    if (!this.device) throw new Error('デバイスが接続されていません');
    const argData = new Uint8Array(data);
    const dataLen = argData.length;
    const SLOTNUMBER = 0x00;
    const retVal = new Uint8Array(10 + dataLen);

    retVal[0] = 0x6b;
    retVal[1] = 255 & dataLen;
    retVal[2] = (dataLen >> 8) & 255;
    retVal[3] = (dataLen >> 16) & 255;
    retVal[4] = (dataLen >> 24) & 255;
    retVal[5] = SLOTNUMBER;
    retVal[6] = ++this.seqNumber;

    if (dataLen !== 0) {
      retVal.set(argData, 10);
    }

    await this.device.transferOut(this.deviceEp.out, retVal);
    await this.sleep(50);
  }

  /**
   * データ受信
   */
  private async receive(len: number): Promise<number[]> {
    if (!this.device) throw new Error('デバイスが接続されていません');
    const data = await this.device.transferIn(this.deviceEp.in, len);
    await this.sleep(10);

    const arr: number[] = [];
    for (let i = data.data!.byteOffset; i < data.data!.byteLength; i++) {
      arr.push(data.data!.getUint8(i));
    }
    return arr;
  }

  /**
   * スリープ
   */
  private sleep(msec: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, msec));
  }

  /**
   * 10進数を2桁の16進数文字列に変換
   */
  private dec2HexString(n: number): string {
    return n.toString(16).toUpperCase().padStart(2, '0');
  }
}
