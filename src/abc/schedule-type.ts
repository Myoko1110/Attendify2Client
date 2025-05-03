export default class ScheduleType {
  static readonly MORNING = new ScheduleType('morning', "午前", "#C2EADD", '#005035');
  static readonly AFTERNOON = new ScheduleType('afternoon', "午後", "#FFEBC2", '#7A5200');
  static readonly WEEKDAY = new ScheduleType('weekday', "平日", "#C2EEF6", '#005868');
  static readonly ALLDAY = new ScheduleType('allday', "一日", "#FFD7CE", '#7A2917');
  static readonly OTHER = new ScheduleType("other", "その他", "#C2CFDB", "#001A32");

  static readonly ALL = [
    ScheduleType.MORNING,
    ScheduleType.AFTERNOON,
    ScheduleType.WEEKDAY,
    ScheduleType.ALLDAY,
    ScheduleType.OTHER,
  ];

  static valueOf(value: string): ScheduleType {
    const scheduleType = ScheduleType.ALL.find((s) => s.value === value);
    if (scheduleType) return scheduleType;
    throw new Error(`Invalid schedule type: ${value}`);
  }

  constructor(public readonly value: string, public displayName: string, public color: string, public textColor: string) {}
}
