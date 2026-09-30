import { useEffect, useRef, useState } from 'react';
import { verifyEmail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { View } from '../App';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';

interface EmailVerificationProps {
  token: string;
  onNavigate: (view: View) => void;
}

const EmailVerification = ({ token, onNavigate }: EmailVerificationProps) => {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  // The token is single-use, and React StrictMode runs effects twice in
  // development — without this guard the second call would fail and show an
  // error even though verification actually succeeded.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    verifyEmail(token)
      .then(({ user: verified }) => {
        if (user && user.id === verified.id) updateUser(verified);
        setStatus('success');
      })
      .catch(err => {
        setMessage(err.message || 'Verification failed.');
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-bark/70">
              <Spinner /> Verifying your email...
            </div>
          )}
          {status === 'success' && (
            <>
              <Alert variant="success">Your email is verified. Thanks for confirming!</Alert>
              <Button className="mt-4" onClick={() => onNavigate(user ? 'profile' : 'join')}>
                {user ? 'Go to profile' : 'Sign in'}
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <Alert variant="error">{message}</Alert>
              <p className="mt-3 text-sm text-bark/70">
                Sign in and use “Resend verification email” on your profile to get a fresh link.
              </p>
              <Button className="mt-4" onClick={() => onNavigate(user ? 'profile' : 'join')}>
                {user ? 'Go to profile' : 'Sign in'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;
