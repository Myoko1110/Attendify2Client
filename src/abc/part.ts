export default class Part {
  static readonly FLUTE = new Part('fl', 'フルート', 'Flute', 'Fl', 1, "cl");
  static readonly CLARINET = new Part('cl', 'クラリネット', 'Clarinet', 'Cl', 2, "wr");
  static readonly DOUBLE_REED = new Part('wr', 'ダブルリード', 'Double Reed', 'Wr', 3, "sax");
  static readonly SAXOPHONE = new Part('sax', 'サクソフォン', 'Saxophone', 'Sax', 4, "trp");
  static readonly TRUMPET = new Part('trp', 'トランペット', 'Trumpet', 'Tp', 5, "hrn");
  static readonly HORN = new Part('hrn', 'ホルン', 'Horn', 'Hr', 6, "trb");
  static readonly TROMBONE = new Part('trb', 'トロンボーン', 'Trombone', 'Tb', 7, "bass");
  static readonly BASS = new Part('bass', 'バス', 'Bass', 'Bass', 8, "perc");
  static readonly PERCUSSION = new Part('perc', 'パーカッション', 'Percussion', 'Perc', 9);
  static readonly ADVISOR = new Part('advisor', '顧問', 'Advisor', '顧問', 0);
  static readonly HIDDEN = new Part('hidden', '非表示', 'Hidden', '非表示', 0);

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
    Part.ADVISOR,
    Part.HIDDEN,
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

  static readonly SELECTS = [
    Part.FLUTE,
    Part.CLARINET,
    Part.DOUBLE_REED,
    Part.SAXOPHONE,
    Part.TRUMPET,
    Part.HORN,
    Part.TROMBONE,
    Part.BASS,
    Part.PERCUSSION,
    Part.ADVISOR,
    Part.HIDDEN,
  ]

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

  get partColor(): string {
    return PartColors[this.value as keyof typeof PartColors] || 'bg-gray-600';
  }

  localeCompare(other: Part): number {
    return this.score - other.score;
  }

  equals(other: Part): boolean {
    return this.value === other.value;
  }

  get isCommon(): boolean {
    return Part.COMMON.includes(this);
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

const PartColors = {
  'fl': 'bg-pink-600',
  'cl': 'bg-blue-600',
  'wr': 'bg-purple-600',
  'sax': 'bg-yellow-600',
  'trp': 'bg-red-600',
  'hrn': 'bg-orange-600',
  'trb': 'bg-green-600',
  'bass': 'bg-indigo-600',
  'perc': 'bg-gray-600'
};
