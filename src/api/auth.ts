import { z } from 'zod';
import axios from 'axios';

import { APIError } from 'src/abc/api-error';

import Member, { MemberSchema } from './member';

// ----------------------------------------------------------------------

export default class Auth {
  static async login(code: string, state: string): Promise<Member> {
    try {
      const result = await axios.post('/login', { code, state });
      return Member.fromSchema(MemberSchema.parse(result.data));
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async logout(): Promise<boolean> {
    try {
      const result = await axios.post('/logout');
      return result.data.result;
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async getAuthorizationURL(): Promise<AuthURL> {
    try {
      const result = await axios.get('/authorization_url');
      return AuthURLSchema.parse(result.data);
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}

const AuthURLSchema = z.object({
  url: z.string(),
  state: z.string(),
});
type AuthURL = z.infer<typeof AuthURLSchema>;
