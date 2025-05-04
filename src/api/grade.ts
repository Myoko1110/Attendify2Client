import { z } from 'zod';
import axios from 'axios';

import { APIError } from 'src/abc/api-error';

export default class Grade {
  constructor(public name: string, public displayName: string, public generation: number, public type: string) {}

  static async get(): Promise<Grade[]> {
    try {
      const result = await axios.get("/constant/grade");
      const data = GradeSchema.parse(result.data);

      return Object.entries(data).map(([name, detail]) => new Grade(name, detail.displayName, detail.generation, detail.type));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}

const GradeSchema = z.record(z.string(), z.object({generation: z.number(), displayName: z.string(), type: z.string()}));
