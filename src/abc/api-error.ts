import { ZodError } from 'zod';
import { AxiosError } from 'axios';

export class APIErrorCode {
  public static INVALID_AUTHENTICATION_CREDENTIALS = new APIErrorCode(100, '認証情報が無効です');

  public static PERMISSION_DENIED = new APIErrorCode(101, '権限がありません');

  public static AUTHENTICATION_FAILED = new APIErrorCode(102, '認証に失敗しました');

  public static ALREADY_EXISTS_ATTENDANCE = new APIErrorCode(200, 'すでに出欠情報があります');

  public static ALREADY_EXISTS_MEMBER_EMAIL = new APIErrorCode(201, 'すでに同じメールアドレスが登録されています');

  public static INVALID_RESULT = new APIErrorCode(300, '不正な結果です');

  public static INVALID_REQUEST = new APIErrorCode(301, '不正なリクエストです');

  public static NETWORK_CONNECTION_ERROR = new APIErrorCode(400, 'サーバーに接続できませんでした');

  public static UNKNOWN_ERROR = new APIErrorCode(500, '不明なエラーが発生しました');

  private static ALL = [
    APIErrorCode.INVALID_AUTHENTICATION_CREDENTIALS,
    APIErrorCode.PERMISSION_DENIED,
    APIErrorCode.AUTHENTICATION_FAILED,
    APIErrorCode.ALREADY_EXISTS_ATTENDANCE,
    APIErrorCode.ALREADY_EXISTS_MEMBER_EMAIL,
    APIErrorCode.INVALID_RESULT,
    APIErrorCode.INVALID_REQUEST,
    APIErrorCode.NETWORK_CONNECTION_ERROR,
    APIErrorCode.UNKNOWN_ERROR,
  ]

  static valueOf(code: number): APIErrorCode | null {
    return APIErrorCode.ALL.find((value) => value.code === code) || null;
  }

  constructor(
    public code: number,
    public description: string,
  ) {}
}

// ----------------------------------------------------------------------

export class APIError extends Error {
  public code: APIErrorCode;

  constructor(code: APIErrorCode | number) {
    let _code: APIErrorCode | number | null = code;
    if (typeof code === 'number') {
      _code = APIErrorCode.valueOf(code);
      if (_code === null) {
        throw new Error('Invalid APIErrorCode');
      }
    }
    if (_code instanceof APIErrorCode) {
      super(_code.description);
    } else {
      throw new Error('Invalid APIErrorCode');
    }

    this.code = _code;
  }

  static fromError(e: unknown): APIError {
    if (e instanceof ZodError) {
      return new APIError(APIErrorCode.INVALID_RESULT);
    }

    if (e instanceof AxiosError) {
      if (e.response) return new APIError(e.response.data.error_code);
      if (e.code === 'ERR_NETWORK') return new APIError(APIErrorCode.NETWORK_CONNECTION_ERROR);
      return new APIError(APIErrorCode.INVALID_REQUEST);
    }
    return new APIError(APIErrorCode.UNKNOWN_ERROR);
  }

  get description(): string {
    return this.code.description;
  }

  static createToastMessage(e: unknown): string {
    console.error(e);
    if (e instanceof APIError) {
      return e.description;
    }
    return '不明なエラーが発生しました';
  }
}
