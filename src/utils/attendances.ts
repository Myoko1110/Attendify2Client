import type Attendance from 'src/api/attendance';

import Big from 'big.js';

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
    return Big(score.toString()).div(Big(total.toString())).round(1).toNumber(); // 四捨五入
  }

  add(attendance: Attendance): Attendances {
    return new Attendances(...this, attendance);
  }

}

const attendanceScore: Record<string, number> = {
  出席: 100,
  欠席: 0,
  講習: NaN,
  遅刻: 50,
  早退: 50,
  無欠: 0,
};

const actualAttendanceScore: Record<string, number> = {
  出席: 100,
  欠席: 0,
  講習: 0,
  遅刻: 50,
  早退: 50,
  無欠: 0,
};