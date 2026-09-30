import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { sendEmail } from '../utils/email';
import { AuthedRequest } from '../middleware/auth';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_PASSWORD_LENGTH = 8;

function toPublicUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    isVerified: user.isVerified,
  };
}

async function sendVerificationEmail(email: string, token: string) {
  const link = `${CLIENT_ORIGIN}/?mode=verify&token=${token}`;
  await sendEmail(
    email,
    'Verify your ReGen Mapper account',
    `<p>Welcome to ReGen Mapper! Confirm your email to finish setting up your account:</p>
     <p><a href="${link}">${link}</a></p>`
  );
}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'User already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({ email, passwordHash, verificationToken });

    sendVerificationEmail(user.email, verificationToken).catch(err =>
      console.error('Failed to send verification email:', err)
    );

    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ userId: user.id, email: user.email });

    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const user = await User.findOne({ verificationToken: token }).select('+verificationToken');
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};

export const resendVerification = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Already verified' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    res.json({ message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
};

// Always responds with a generic success message regardless of whether the
// email exists, so this endpoint can't be used to enumerate registered users.
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const link = `${CLIENT_ORIGIN}/?mode=reset&token=${resetToken}`;
      sendEmail(
        user.email,
        'Reset your ReGen Mapper password',
        `<p>Click the link below to reset your password. This link expires in 1 hour.</p>
         <p><a href="${link}">${link}</a></p>`
      ).catch(err => console.error('Failed to send reset email:', err));
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    }).select('+resetToken +resetTokenExpiry');

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { displayName, bio } = req.body;

    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    await user.save();

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};
