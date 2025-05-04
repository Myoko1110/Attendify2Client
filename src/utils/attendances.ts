import type Part from 'src/abc/part';
import type Member from 'src/api/member';
import type Attendance from 'src/api/attendance';

import Big from 'big.js';

import type { Month } from './month';
import type { DateOnly } from './date-only';

export default class Attendances extends Array<Attendance> {
  calcRate(actual: boolean = false): number | null {
    const scores = actual ? actualAttendanceScore : attendanceScore;

    if (this.length === 0) return null;
    let total = 0;
    const score = this.reduce((acc, cur) => {
      if (cur.attendance in scores) {
        const s = scores[cur.attendance];
        if (!isNaN(s)) {
          acc += s;
          total += 1;
        }
      } else {
        if (actual) total += 1;
      }
      return acc;
    }, 0);

    if (total === 0) return null;
    return Big(score.toString()).div(Big(total.toString())).round(1).toNumber();  // 四捨五入
  }

  filterByPart(part: Part) {
    return new Attendances(...this.filter(attendance => attendance.member.part === part));
  }

  filterByGenerations(generation: number[]) {
    return new Attendances(...this.filter(attendance => generation.includes(attendance.member.generation)));
  }

  filterByCompetition(competition: boolean | null) {
    if (competition === null) return this;
    return new Attendances(...this.filter(attendance => attendance.member.isCompetitionMember === competition));
  }

  filterByMonth(month: Month) {
    return new Attendances(...this.filter((attendance) => attendance.month.equals(month)))
  }

  filterByDate(date: DateOnly) {
    return new Attendances(...this.filter(attendance => attendance.dateOnly.equals(date)))
  }

  filterByMember(member: Member) {
    return new Attendances(...this.filter(attendance => attendance.member.equals(member)));
  }

  filterByDates(dates: DateOnly[]) {
    return new Attendances(...this.filter(attendance => dates.some(date => attendance.dateOnly.equals(date))));
  }

  getByDate(member: Member, date: DateOnly) {
    return this.find(attendance => attendance.member.equals(member) && attendance.dateOnly.equals(date));
  }

  remove(attendance: Attendance): Attendances {
    const newAttendances = new Attendances(...this);
    newAttendances.splice(this.indexOf(attendance), 1);
    return newAttendances;
  }

  add(attendance: Attendance): Attendances {
    return new Attendances(...this, attendance);
  }
}

const attendanceScore: Record<string, number> = {
  '出席': 100,
  '欠席': 0,
  '講習': NaN,
  '遅刻': 50,
  '早退': 50,
  '無欠': 0,
}

const actualAttendanceScore: Record<string, number> = {
  '出席': 100,
  '欠席': 0,
  '講習': 0,
  '遅刻': 50,
  '早退': 50,
  '無欠': 0,
}