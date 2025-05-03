export default class Part {
  static readonly FLUTE = new Part('fl', 'フルート', 'Flute', 'Fl', 0, "cl");
  static readonly CLARINET = new Part('cl', 'クラリネット', 'Clarinet', 'Cl', 1, "wr");
  static readonly DOUBLE_REED = new Part('wr', 'ダブルリード', 'Double Reed', 'Wr', 2, "sax");
  static readonly SAXOPHONE = new Part('sax', 'サクソフォン', 'Saxophone', 'Sax', 3, "trp");
  static readonly TRUMPET = new Part('trp', 'トランペット', 'Trumpet', 'Tp', 4, "hrn");
  static readonly HORN = new Part('hrn', 'ホルン', 'Horn', 'Hr', 5, "trb");
  static readonly TROMBONE = new Part('trb', 'トロンボーン', 'Trombone', 'Tb', 6, "bass");
  static readonly BASS = new Part('bass', 'バス', 'Bass', 'Bass', 7, "perc");
  static readonly PERCUSSION = new Part('perc', 'パーカッション', 'Percussion', 'Perc', 8);

  static readonly UNKNOWN = new Part('unknown', '不明', 'Unknown', '-', 99);

  static readonly ALL = [
    Part.FLUTE,
    Part.CLARINET,
    Part.DOUBLE_REED,
    Part.SAXOPHONE,
    Part.TRUMPET,
    Part.HORN,
    Part.TROMBONE,
    Part.BASS,
    Part.PERCUSSION,
    Part.UNKNOWN,
  ];

  static readonly COMMON = [
    Part.FLUTE,
    Part.CLARINET,
    Part.DOUBLE_REED,
    Part.SAXOPHONE,
    Part.TRUMPET,
    Part.HORN,
    Part.TROMBONE,
    Part.BASS,
    Part.PERCUSSION,
  ];

  static valueOf(value: string): Part {
    const part = Part.ALL.find((p) => p.value === value);
    if (part) return part;
    throw new Error("Invalid part value: " + value);
  }

  static values() {
    return Part.ALL.map((part) => part.value);
  }

  get next(): Part | null {
    return this.nextPart ? Part.valueOf(this.nextPart) : null;
  }

  constructor(
    public value: string,
    public jp: string,
    public en: string,
    public enShort: string,
    public score: number,
    private nextPart: string | undefined = undefined,
  ) {}
}
