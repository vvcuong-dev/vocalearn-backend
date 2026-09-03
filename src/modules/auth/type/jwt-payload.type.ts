export interface JwtPayload {
  sub: number;
  email: string;
  jti?: string;
  exp?: number;
  iat?: number;
}

export interface GeneratedToken {
  token: string;
  jti: string;
}
