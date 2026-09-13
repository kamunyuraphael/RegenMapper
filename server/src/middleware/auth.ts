import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

// Attaches req.user if a valid token is present; blocks the request if not.
export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.split(' ')[1];

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Attaches req.user if a valid token is present, but never blocks the request.
// Used on routes like PlantingLog creation where login is optional.
export const attachUserIfPresent = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.split(' ')[1]);
    } catch {
      // ignore invalid token on an optional-auth route
    }
  }

  next();
};
