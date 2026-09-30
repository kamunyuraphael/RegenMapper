import React, { useState } from 'react';
import { resetPassword } from '../services/api';
import type { View } from '../App';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';

const MIN_PASSWORD_LENGTH = 8;

interface ResetPasswordProps {
  token: string;
  onNavigate: (view: View) => void;
}

const ResetPassword = ({ token, onNavigate }: ResetPasswordProps) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      await resetPassword(token, password);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Could not reset password.');
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'success' ? (
            <>
              <Alert variant="success">Password updated. You can now sign in.</Alert>
              <Button className="mt-4" onClick={() => onNavigate('join')}>Sign in</Button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={status === 'loading'} className="w-full">
                {status === 'loading' ? <Spinner className="mr-2" /> : null}
                Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
