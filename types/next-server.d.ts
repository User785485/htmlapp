declare module 'next/server' {
  import { NextApiRequest, NextApiResponse } from 'next';

  export interface NextRequest extends Request {
    nextUrl: URL;
    geo?: {
      city?: string;
      country?: string;
      region?: string;
    };
    ip?: string;
    ua?: {
      isBot: boolean;
      ua: string;
      browser: {
        name?: string;
        version?: string;
      };
      device: {
        model?: string;
        type?: string;
        vendor?: string;
      };
      engine: {
        name?: string;
        version?: string;
      };
      os: {
        name?: string;
        version?: string;
      };
      cpu: {
        architecture?: string;
      };
    };
    cookies: Map<string, string>;
  }

  export class NextResponse extends Response {
    public static json(body: any, init?: ResponseInit): NextResponse;
    public static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    public static rewrite(destination: string | URL, init?: ResponseInit): NextResponse;
    public static next(init?: ResponseInit): NextResponse;
    cookies: ResponseCookies;
  }

  export class ResponseCookies {
    set(name: string, value: string, options?: ResponseCookieOptions): void;
    get(name: string): ResponseCookie | undefined;
    delete(name: string): void;
    getAll(): Array<ResponseCookie>;
    has(name: string): boolean;
  }

  export interface ResponseCookie {
    name: string;
    value: string;
    expires?: Date;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }

  export interface ResponseCookieOptions extends Partial<ResponseCookie> {}
}
