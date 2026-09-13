import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export const signToken = (payload: TokenPayload): string => {
  if (!JWT_SECRET) throw new Error('Missing JWT_SECRET environment variable');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  if (!JWT_SECRET) throw new Error('Missing JWT_SECRET environment variable');
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
