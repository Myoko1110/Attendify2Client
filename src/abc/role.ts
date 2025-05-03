export default class Role {
  static readonly EXECUTIVE = new Role('exec', "執行部", 1);
  static readonly PART_LEADER = new Role('part', "パートリーダー", 2);
  static readonly ATTENDANCE_OFFICER = new Role('officer', "出欠係");
  static readonly MEMBER = new Role("member", "-");
  static readonly ADVISOR = new Role("advisor", "顧問", 0);
  static readonly UNKNOWN = new Role('unknown', "不明");

  static readonly ALL = [
    Role.EXECUTIVE,
    Role.PART_LEADER,
    Role.ATTENDANCE_OFFICER,
    Role.MEMBER,
    Role.ADVISOR,
    Role.UNKNOWN,
  ];


  static valueOf(value: string): Role {
    if (value === "member" || value === null) return Role.MEMBER;

    const role = Role.ALL.find((r => r?.value === value))
    if (role) return role;

    throw new Error("Invalid role value: " + value);
  }

  static values() {
    return Role.ALL.filter((role) => role !== null).map((role) => role.value);
  }

  constructor(public value: string, public displayName: string, public score: number = 99) {}
}
