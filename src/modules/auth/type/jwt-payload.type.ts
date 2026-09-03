export enum AuthRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: AuthRole;
  jti?: string;
  exp?: number;
  iat?: number;
}

export interface GeneratedToken {
  token: string;
  jti: string;
}
