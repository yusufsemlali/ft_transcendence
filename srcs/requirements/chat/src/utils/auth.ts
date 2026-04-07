import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { AuthenticatedSocketUser } from '../types/chatUser';

function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('FATAL EXCEPTION: JWT_SECRET environment variable is missing.');
  }

  return jwtSecret;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, cookie) => {
      const separatorIndex = cookie.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = decodeURIComponent(cookie.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
}

function extractAccessToken(socket: Socket): string | null {
  const authHeader = socket.handshake.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }

  const cookies = parseCookies(socket.handshake.headers.cookie);
  return cookies.access_token ?? null;
}

export function authenticateSocket(socket: Socket): AuthenticatedSocketUser {
  const token = extractAccessToken(socket);

  if (!token) {
    throw new Error('Authentication required');
  }

  const jwtSecret = getJwtSecret();
  const decoded = jwt.verify(token, jwtSecret) as {
    id: string;
    sessionId: string;
    username: string;
    role: string;
  };

  return {
    id: decoded.id,
    sessionId: decoded.sessionId,
    username: decoded.username,
    role: decoded.role,
  };
}
