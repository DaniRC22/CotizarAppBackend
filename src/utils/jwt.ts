import crypto from 'crypto';

function base64UrlEncode(input: Buffer): string {
  return input.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const base64 = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(base64, 'base64');
}

export interface JwtClaims {
  iss?: string;
  aud?: string;
  sub?: string; // licenseKey
  licenseKey?: string;
  machineId?: string;
  customerId?: string;
  iat?: number; // seconds
  exp?: number; // seconds
  [k: string]: any;
}

export function signJwtHS256(params: {
  secret: string;
  payload: JwtClaims;
  header?: Record<string, unknown>;
}): string {
  const header = { alg: 'HS256', typ: 'JWT', ...(params.header || {}) };

  const iat = Math.floor(Date.now() / 1000);
  const exp = (params.payload.exp ?? 0) || undefined;

  const fullPayload: JwtClaims = {
    ...params.payload,
    iat,
    ...(exp ? { exp } : {}),
  };

  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header), 'utf8'));
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(fullPayload), 'utf8'));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', params.secret)
    .update(signingInput)
    .digest();

  const encodedSignature = base64UrlEncode(signature);
  return `${signingInput}.${encodedSignature}`;
}

export function verifyJwtHS256(params: {
  secret: string;
  token: string;
  expectedIssuer?: string;
  expectedAudience?: string;
}): JwtClaims {
  const [encodedHeader, encodedPayload, signature] = params.token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Token inválido');
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', params.secret).update(signingInput).digest()
  );

  const a = base64UrlDecode(signature);
  const b = base64UrlDecode(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Firma JWT inválida');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as JwtClaims;

  if (params.expectedIssuer && payload.iss !== params.expectedIssuer) {
    throw new Error('Emisor JWT inválido');
  }
  if (params.expectedAudience && payload.aud !== params.expectedAudience) {
    throw new Error('Audiencia JWT inválida');
  }

  if (typeof payload.exp === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) throw new Error('Token expirado');
  }

  return payload;
}

export function decodeJwtPayload(token: string): JwtClaims {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Token inválido');
  return JSON.parse(base64UrlDecode(parts[1]).toString('utf8')) as JwtClaims;
}

